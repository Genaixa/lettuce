import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { voidPayment } from "@/lib/blink";

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

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "Order is already cancelled" },
        { status: 409 }
      );
    }

    if (order.payment_status === "captured") {
      return NextResponse.json(
        {
          error:
            "Payment has already been captured. Please process a refund manually.",
        },
        { status: 400 }
      );
    }

    // Void Blink preauth if one exists
    if (
      order.blink_transaction_id &&
      order.payment_status === "preauthorized"
    ) {
      const voidResult = await voidPayment(order.blink_transaction_id);
      if (!voidResult.success) {
        console.error(
          "Failed to void Blink preauth:",
          voidResult.errorMessage
        );
        // Continue — update order status regardless
      }
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payment_status:
          order.payment_status === "preauthorized" ? "voided" : order.payment_status,
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
