import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { capturePayment } from "@/lib/blink";
import { Resend } from "resend";
import { orderReadyHtml } from "@/lib/emails/OrderReady";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "orders@danskys.co.uk";

export async function POST(request: NextRequest) {
  const adminEmail = await verifyAdmin(request);
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "captured") {
      return NextResponse.json(
        { error: "Payment already captured" },
        { status: 409 }
      );
    }

    if (order.payment_status !== "preauthorized") {
      return NextResponse.json(
        { error: `Cannot capture payment with status: ${order.payment_status}` },
        { status: 400 }
      );
    }

    if (!order.blink_transaction_id) {
      return NextResponse.json(
        { error: "No transaction ID on order" },
        { status: 400 }
      );
    }

    // Capture via Blink
    const captureResult = await capturePayment(order.blink_transaction_id);

    if (!captureResult.success) {
      return NextResponse.json(
        {
          error: captureResult.errorMessage ?? "Payment capture failed",
        },
        { status: 502 }
      );
    }

    // Update order status
    const newStatus =
      order.delivery_method === "delivery"
        ? "out_for_delivery"
        : "ready_for_pickup";

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "captured",
        status: newStatus,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order after capture:", updateError);
    }

    // Send notification email
    try {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: order.email,
        subject:
          order.delivery_method === "delivery"
            ? `Your order is on its way! — Danskys Pesach Lettuce`
            : `Your order is ready for pickup — Danskys Pesach Lettuce`,
        html: orderReadyHtml({ order: { ...order, status: newStatus } }),
      });
    } catch (emailError) {
      console.error("Failed to send order ready email:", emailError);
    }

    return NextResponse.json({ success: true, newStatus });
  } catch (error) {
    console.error("Capture error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
