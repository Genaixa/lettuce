import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processCard, voidPayment } from "@/lib/blink";
import { Resend } from "resend";
import { orderConfirmationHtml } from "@/lib/emails/OrderConfirmation";
import type { DeliveryMethod } from "@/types";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "orders@danskys.co.uk";

function validatePostcode(postcode: string): boolean {
  return /^NE8/i.test(postcode.trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      address_line1,
      address_line2,
      city,
      postcode,
      delivery_method,
      neighbour_name,
      neighbour_address,
      notes,
      marketing_optin,
      // Blink hosted fields (no raw card data)
      blink_access_token,
      blink_intent_id,
      blink_payment_token,
      blink_transaction_unique,
      // Device info for 3DS
      device_timezone,
      device_capabilities,
      device_accept_language,
      device_screen_resolution,
      items,
    } = body;

    // ── Validation ──────────────────────────────────────────────────
    const errors: string[] = [];

    if (!first_name?.trim()) errors.push("First name is required");
    if (!last_name?.trim()) errors.push("Last name is required");
    if (!email?.trim() || !/\S+@\S+\.\S+/.test(email))
      errors.push("Valid email is required");
    if (!phone?.trim()) errors.push("Phone number is required");
    if (!delivery_method || !["delivery", "pickup"].includes(delivery_method))
      errors.push("Delivery method is required");

    if (!address_line1?.trim()) errors.push("Door number / name is required");
    if (!address_line2?.trim()) errors.push("Street is required");
    if (!postcode?.trim()) {
      errors.push("Postcode is required");
    } else if (delivery_method === "delivery" && !validatePostcode(postcode)) {
      errors.push(
        "Home delivery is only available within the Bensham delivery zone (NE8)."
      );
    }

    if (!blink_payment_token)
      errors.push("Payment token is missing — please re-enter your card details");
    if (!blink_intent_id)
      errors.push("Payment intent is missing — please refresh and try again");

    if (!items || !Array.isArray(items) || items.length === 0)
      errors.push("Your cart is empty");

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // ── Fetch current product prices ────────────────────────────────
    const supabase = getSupabaseAdmin();
    const productIds: string[] = items.map(
      (i: { productId: string }) => i.productId
    );

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, name, price, active, stock_quantity")
      .in("id", productIds);

    if (productError || !products?.length) {
      return NextResponse.json(
        { errors: ["Failed to fetch products"] },
        { status: 500 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.active) {
        return NextResponse.json(
          { errors: [`Product ${item.productId} is not available`] },
          { status: 400 }
        );
      }
      if (product.stock_quantity != null && product.stock_quantity < item.quantity) {
        const msg = product.stock_quantity <= 0
          ? `${product.name} is sold out`
          : `Only ${product.stock_quantity} of ${product.name} remaining`;
        return NextResponse.json({ errors: [msg] }, { status: 400 });
      }
    }

    const subtotal = items.reduce(
      (sum: number, item: { productId: string; quantity: number }) => {
        const product = productMap.get(item.productId);
        return sum + (product?.price ?? 0) * item.quantity;
      },
      0
    );

    const shippingCost =
      (delivery_method as DeliveryMethod) === "delivery" ? 5.0 : 2.5;
    const total = subtotal + shippingCost;
    const orderRef = `DANSKYS-${Date.now()}`;

    // ── Blink: process card with hosted-fields token ─────────────────
    const remoteAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const preauthResult = await processCard({
      accessToken: blink_access_token,
      intentId: blink_intent_id,
      paymentToken: blink_payment_token,
      transactionUnique: blink_transaction_unique,
      customerEmail: email.trim().toLowerCase(),
      customerName: `${first_name.trim()} ${last_name.trim()}`,
      customerAddress: address_line1?.trim(),
      customerPostcode: postcode?.trim().toUpperCase(),
      deviceTimezone: device_timezone,
      deviceCapabilities: device_capabilities,
      deviceAcceptLanguage: device_accept_language,
      deviceScreenResolution: device_screen_resolution,
      remoteAddress,
    });

    if (!preauthResult.success) {
      if (preauthResult.requiresRedirect) {
        return NextResponse.json(
          {
            requiresRedirect: true,
            redirectHtml: preauthResult.redirectHtml,
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        {
          errors: [
            preauthResult.errorMessage ??
              "Payment authorisation failed. Please check your card details.",
          ],
        },
        { status: 402 }
      );
    }

    // ── Insert order ────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        delivery_method,
        status: "payment_authorized",
        payment_status: "preauthorized",
        blink_transaction_id: preauthResult.transactionId,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address_line1: address_line1?.trim() ?? null,
        address_line2: address_line2?.trim() ?? null,
        city: city?.trim() ?? null,
        postcode: postcode?.trim().toUpperCase() ?? null,
        neighbour_name: neighbour_name?.trim() ?? null,
        neighbour_address: neighbour_address?.trim() ?? null,
        notes: notes?.trim() ?? null,
        marketing_optin: Boolean(marketing_optin),
        subtotal,
        shipping_cost: shippingCost,
        total,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      if (preauthResult.transactionId) {
        await voidPayment(preauthResult.transactionId).catch((e) =>
          console.error("Failed to void preauth after order insert failure:", e)
        );
      }
      return NextResponse.json(
        { errors: ["Failed to create order. Please contact us."] },
        { status: 500 }
      );
    }

    // ── Insert order items ──────────────────────────────────────────
    const orderItems = items.map(
      (item: { productId: string; quantity: number }) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_time: productMap.get(item.productId)?.price ?? 0,
      })
    );

    await supabase.from("order_items").insert(orderItems);

    // ── Decrement stock ─────────────────────────────────────────────
    for (const item of items as { productId: string; quantity: number }[]) {
      const product = productMap.get(item.productId);
      if (product?.stock_quantity != null) {
        await supabase.rpc("decrement_stock", {
          p_product_id: item.productId,
          p_qty: item.quantity,
        });
      }
    }

    // ── Send confirmation email ─────────────────────────────────────
    const orderWithItems = {
      ...order,
      order_items: orderItems.map(
        (oi: { product_id: string; quantity: number; price_at_time: number }) => ({
          ...oi,
          product: { name: productMap.get(oi.product_id)?.name ?? "Product" },
        })
      ),
    };

    try {
      const htmlContent = orderConfirmationHtml({ order: orderWithItems });
      const emailResult = await getResend().emails.send({
        from: FROM_EMAIL,
        to: order.email,
        subject: `Order Confirmed — Danskys Pesach Lettuce #${order.id.slice(0, 8).toUpperCase()}`,
        html: htmlContent,
      });
      console.log("[orders] Customer email result:", JSON.stringify(emailResult));
    } catch (emailError) {
      console.error("[orders] Failed to send confirmation email:", emailError);
    }

    // ── Admin notification ──────────────────────────────────────────
    const ref = order.id.slice(0, 8).toUpperCase();
    const itemLines = orderWithItems.order_items
      .map((oi: { product: { name: string }; quantity: number; price_at_time: number }) =>
        `<tr><td style="padding:4px 8px">${oi.product.name}</td><td style="padding:4px 8px;text-align:center">${oi.quantity}</td><td style="padding:4px 8px;text-align:right">£${(oi.price_at_time * oi.quantity).toFixed(2)}</td></tr>`
      )
      .join("");
    const deliveryLabel = order.delivery_method === "delivery" ? "Home Delivery" : "Pickup";
    const addressLine = `${order.address_line1 ?? ""}${order.address_line2 ? ", " + order.address_line2 : ""}${order.postcode ? ", " + order.postcode : ""}`;
    try {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: "danskyspesachlettuce@outlook.com",
        subject: `New Order #${ref} — ${order.first_name} ${order.last_name} (${deliveryLabel})`,
        html: `<div style="font-family:sans-serif;max-width:600px">
<h2 style="color:#1c3320">New Order Received — #${ref}</h2>
<table style="border-collapse:collapse;width:100%">
<tr><td style="padding:4px 8px;font-weight:bold">Customer</td><td style="padding:4px 8px">${order.first_name} ${order.last_name}</td></tr>
<tr><td style="padding:4px 8px;font-weight:bold">Email</td><td style="padding:4px 8px">${order.email}</td></tr>
<tr><td style="padding:4px 8px;font-weight:bold">Phone</td><td style="padding:4px 8px">${order.phone}</td></tr>
<tr><td style="padding:4px 8px;font-weight:bold">Delivery</td><td style="padding:4px 8px">${deliveryLabel}</td></tr>
<tr><td style="padding:4px 8px;font-weight:bold">Address</td><td style="padding:4px 8px">${addressLine}</td></tr>
${order.notes ? `<tr><td style="padding:4px 8px;font-weight:bold">Notes</td><td style="padding:4px 8px">${order.notes}</td></tr>` : ""}
</table>
<h3 style="color:#1c3320;margin-top:20px">Items</h3>
<table style="border-collapse:collapse;width:100%;border-top:1px solid #c5e0cc">
<tr style="background:#f2faf3"><th style="padding:4px 8px;text-align:left">Product</th><th style="padding:4px 8px">Qty</th><th style="padding:4px 8px;text-align:right">Price</th></tr>
${itemLines}
<tr style="border-top:1px solid #c5e0cc"><td colspan="2" style="padding:4px 8px;text-align:right">Subtotal</td><td style="padding:4px 8px;text-align:right">£${order.subtotal.toFixed(2)}</td></tr>
<tr><td colspan="2" style="padding:4px 8px;text-align:right">Shipping</td><td style="padding:4px 8px;text-align:right">£${order.shipping_cost.toFixed(2)}</td></tr>
<tr style="font-weight:bold"><td colspan="2" style="padding:4px 8px;text-align:right">Total</td><td style="padding:4px 8px;text-align:right">£${order.total.toFixed(2)}</td></tr>
</table>
</div>`,
      });
    } catch (adminEmailError) {
      console.error("Failed to send admin notification email:", adminEmailError);
    }

    return NextResponse.json(
      {
        orderId: order.id,
        reference: order.id.slice(0, 8).toUpperCase(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { errors: ["An unexpected error occurred. Please try again."] },
      { status: 500 }
    );
  }
}
