import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { voidPayment } from "@/lib/blink";

export async function DELETE(request: NextRequest) {
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
      .select("blink_transaction_id, payment_status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Void any active preauth before deleting
    if (order.blink_transaction_id && order.payment_status === "preauthorized") {
      const voidResult = await voidPayment(order.blink_transaction_id);
      if (!voidResult.success) {
        console.error("Failed to void Blink preauth before delete:", voidResult.errorMessage);
        // Continue — delete regardless
      }
    }

    // order_items will cascade delete
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
