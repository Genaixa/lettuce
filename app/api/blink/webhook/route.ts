import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Blink payment notification webhook.
 * Blink POSTs here when a transaction status changes (e.g. captured, voided).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      await supabase
        .from("orders")
        .update({ status: newStatus, payment_status: status?.toLowerCase() })
        .eq("blink_transaction_id", transaction_id);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
