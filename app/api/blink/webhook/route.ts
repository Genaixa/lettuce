import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Blink payment notification webhook.
 * Blink POSTs here when a transaction status changes (e.g. captured, voided).
 *
 * Signature verification: set BLINK_WEBHOOK_SECRET in env vars.
 * Blink signs the raw request body with HMAC-SHA256 and sends the hex digest
 * in the X-Blink-Signature header.
 */
export async function POST(request: NextRequest) {
  // ── Read raw body for signature verification ─────────────────────
  const rawBody = await request.text();

  const webhookSecret = process.env.BLINK_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = request.headers.get("X-Blink-Signature") ?? "";
    const expected = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    let valid = false;
    try {
      const sigBuf = Buffer.from(signature, "hex");
      const expBuf = Buffer.from(expected, "hex");
      valid = sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
    } catch {
      valid = false;
    }

    if (!valid) {
      console.warn("[webhook] Invalid signature — request rejected");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[webhook] BLINK_WEBHOOK_SECRET not set — skipping signature check");
  }

  try {
    const body = JSON.parse(rawBody);
    const { transaction_id, status } = body ?? {};

    if (!transaction_id) {
      return NextResponse.json({ received: true });
    }

    // Map Blink statuses to our internal statuses
    const statusMap: Record<string, string> = {
      captured: "payment_captured",
      voided: "cancelled",
      declined: "payment_failed",
      refunded: "refunded",
    };

    const newStatus = statusMap[status?.toLowerCase()];
    if (newStatus) {
      const supabase = getSupabaseAdmin();

      // Only update if the order exists and the transition makes sense
      // (prevents random POSTs from flipping arbitrary orders)
      const { data: order } = await supabase
        .from("orders")
        .select("id, status")
        .eq("blink_transaction_id", transaction_id)
        .single();

      if (!order) {
        console.warn("[webhook] No order found for transaction_id:", transaction_id);
        return NextResponse.json({ received: true });
      }

      await supabase
        .from("orders")
        .update({ status: newStatus, payment_status: status?.toLowerCase() })
        .eq("blink_transaction_id", transaction_id);

      console.log("[webhook] Updated order", order.id, "to status:", newStatus);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ received: true });
  }
}
