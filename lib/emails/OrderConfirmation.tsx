import * as React from "react";
import type { Order } from "@/types";

interface OrderConfirmationProps {
  order: Order & {
    order_items: Array<{
      quantity: number;
      price_at_time: number;
      product: { name: string };
    }>;
  };
}

export function OrderConfirmationEmail({ order }: OrderConfirmationProps) {
  const isDelivery = order.delivery_method === "delivery";

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Order Confirmation — Danskys Pesach Lettuce</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f5f0e8",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: "#f5f0e8", padding: "40px 20px" }}
        >
          <tr>
            <td align="center">
              <table
                width="600"
                cellPadding={0}
                cellSpacing={0}
                style={{
                  maxWidth: "600px",
                  width: "100%",
                  backgroundColor: "#1a1a1a",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    style={{
                      background:
                        "linear-gradient(135deg, #2d5a27 0%, #1a1a1a 100%)",
                      padding: "40px 32px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        color: "#c9a84c",
                        fontSize: "13px",
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        margin: "0 0 8px 0",
                      }}
                    >
                      🥬 Order Confirmed
                    </p>
                    <h1
                      style={{
                        color: "#f5f0e8",
                        fontSize: "28px",
                        fontWeight: "700",
                        margin: "0 0 8px 0",
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      Danskys Pesach Lettuce
                    </h1>
                    <p style={{ color: "#f5f0e8", opacity: 0.7, margin: 0, fontSize: "15px" }}>
                      Thank you for your pre-order, {order.first_name}!
                    </p>
                  </td>
                </tr>

                {/* Order reference */}
                <tr>
                  <td style={{ padding: "24px 32px 0" }}>
                    <table
                      width="100%"
                      style={{
                        backgroundColor: "#2c2c2c",
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <tr>
                        <td>
                          <p
                            style={{
                              color: "#c9a84c",
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "2px",
                              margin: "0 0 4px 0",
                            }}
                          >
                            Order Reference
                          </p>
                          <p
                            style={{
                              color: "#f5f0e8",
                              fontSize: "18px",
                              fontFamily: "monospace",
                              fontWeight: "bold",
                              margin: 0,
                            }}
                          >
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                        </td>
                        <td align="right">
                          <p
                            style={{
                              color: "#c9a84c",
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "2px",
                              margin: "0 0 4px 0",
                            }}
                          >
                            Method
                          </p>
                          <p
                            style={{
                              color: "#f5f0e8",
                              fontSize: "14px",
                              fontWeight: "bold",
                              margin: 0,
                            }}
                          >
                            {isDelivery ? "🚚 Home Delivery" : "🏪 Store Pickup"}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Items */}
                <tr>
                  <td style={{ padding: "24px 32px 0" }}>
                    <p
                      style={{
                        color: "#c9a84c",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        margin: "0 0 12px 0",
                      }}
                    >
                      Your Order
                    </p>
                    {order.order_items.map((item, i) => (
                      <table key={i} width="100%" style={{ marginBottom: "8px" }}>
                        <tr>
                          <td>
                            <p
                              style={{
                                color: "#f5f0e8",
                                fontSize: "14px",
                                margin: 0,
                              }}
                            >
                              {item.product?.name ?? "Product"}
                            </p>
                          </td>
                          <td align="right">
                            <p
                              style={{
                                color: "#f5f0e8",
                                fontSize: "14px",
                                margin: 0,
                              }}
                            >
                              {item.quantity} × £{item.price_at_time.toFixed(2)}
                            </p>
                          </td>
                        </tr>
                      </table>
                    ))}
                    <table
                      width="100%"
                      style={{
                        borderTop: "1px solid #333",
                        marginTop: "12px",
                        paddingTop: "12px",
                      }}
                    >
                      <tr>
                        <td>
                          <p style={{ color: "#f5f0e8", opacity: 0.6, fontSize: "13px", margin: "4px 0" }}>
                            Subtotal
                          </p>
                        </td>
                        <td align="right">
                          <p style={{ color: "#f5f0e8", opacity: 0.6, fontSize: "13px", margin: "4px 0" }}>
                            £{order.subtotal.toFixed(2)}
                          </p>
                        </td>
                      </tr>
                      {isDelivery && (
                        <tr>
                          <td>
                            <p style={{ color: "#f5f0e8", opacity: 0.6, fontSize: "13px", margin: "4px 0" }}>
                              Delivery
                            </p>
                          </td>
                          <td align="right">
                            <p style={{ color: "#f5f0e8", opacity: 0.6, fontSize: "13px", margin: "4px 0" }}>
                              £{order.shipping_cost.toFixed(2)}
                            </p>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td>
                          <p
                            style={{
                              color: "#f5f0e8",
                              fontSize: "16px",
                              fontWeight: "bold",
                              margin: "8px 0 0",
                            }}
                          >
                            Total
                          </p>
                        </td>
                        <td align="right">
                          <p
                            style={{
                              color: "#c9a84c",
                              fontSize: "18px",
                              fontWeight: "bold",
                              margin: "8px 0 0",
                            }}
                          >
                            £{order.total.toFixed(2)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Payment note */}
                <tr>
                  <td style={{ padding: "24px 32px 0" }}>
                    <table
                      width="100%"
                      style={{
                        backgroundColor: "#2d5a27",
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <tr>
                        <td>
                          <p
                            style={{
                              color: "#f5f0e8",
                              fontSize: "14px",
                              margin: "0 0 4px 0",
                              fontWeight: "bold",
                            }}
                          >
                            💳 Payment Pre-Authorised
                          </p>
                          <p
                            style={{
                              color: "#f5f0e8",
                              opacity: 0.8,
                              fontSize: "13px",
                              margin: 0,
                              lineHeight: "1.5",
                            }}
                          >
                            Your card has been pre-authorised for £
                            {order.total.toFixed(2)}. Payment will only be
                            captured when your order is ready.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Delivery / Pickup info */}
                <tr>
                  <td style={{ padding: "24px 32px" }}>
                    <p
                      style={{
                        color: "#c9a84c",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        margin: "0 0 12px 0",
                      }}
                    >
                      {isDelivery ? "Delivery Details" : "Pickup Information"}
                    </p>
                    {isDelivery ? (
                      <p style={{ color: "#f5f0e8", opacity: 0.8, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                        {order.address_line1}
                        {order.address_line2 && `, ${order.address_line2}`},{" "}
                        {order.city}, {order.postcode}
                      </p>
                    ) : (
                      <p style={{ color: "#f5f0e8", opacity: 0.8, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                        Your order will be available for pickup at our store. We
                        will contact you when it is ready.
                      </p>
                    )}
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      backgroundColor: "#111",
                      padding: "24px 32px",
                      textAlign: "center",
                      borderTop: "1px solid #333",
                    }}
                  >
                    <p style={{ color: "#f5f0e8", opacity: 0.4, fontSize: "12px", margin: "0 0 4px 0" }}>
                      Questions? Email us at{" "}
                      <a
                        href="mailto:orders@danskys.co.uk"
                        style={{ color: "#c9a84c" }}
                      >
                        orders@danskys.co.uk
                      </a>
                    </p>
                    <p style={{ color: "#f5f0e8", opacity: 0.3, fontSize: "11px", margin: 0 }}>
                      © Danskys Pesach Lettuce · Newcastle upon Tyne
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

export function orderConfirmationHtml(
  props: OrderConfirmationProps
): string {
  // Simple JSX-to-string render for use with Resend
  // In production, use @react-email/render for proper rendering
  const { order } = props;
  const isDelivery = order.delivery_method === "delivery";
  const itemRows = order.order_items
    .map(
      (item) =>
        `<tr><td style="color:#f5f0e8;font-size:14px;padding:4px 0;">${item.product?.name ?? "Product"}</td><td align="right" style="color:#f5f0e8;font-size:14px;padding:4px 0;">${item.quantity} × £${item.price_at_time.toFixed(2)}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a1a;border-radius:12px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#2d5a27 0%,#1a1a1a 100%);padding:40px 32px;text-align:center;">
<p style="color:#c9a84c;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">🥬 Order Confirmed</p>
<h1 style="color:#f5f0e8;font-size:28px;font-weight:700;margin:0 0 8px 0;font-family:Georgia,serif;">Danskys Pesach Lettuce</h1>
<p style="color:#f5f0e8;opacity:.7;margin:0;font-size:15px;">Thank you for your pre-order, ${order.first_name}!</p>
</td></tr>
<tr><td style="padding:24px 32px 0;">
<p style="color:#c9a84c;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0;">Your Order</p>
<table width="100%">${itemRows}</table>
<table width="100%" style="border-top:1px solid #333;margin-top:12px;padding-top:12px;">
<tr><td style="color:#f5f0e8;opacity:.6;font-size:13px;">Subtotal</td><td align="right" style="color:#f5f0e8;opacity:.6;font-size:13px;">£${order.subtotal.toFixed(2)}</td></tr>
${isDelivery ? `<tr><td style="color:#f5f0e8;opacity:.6;font-size:13px;">Delivery</td><td align="right" style="color:#f5f0e8;opacity:.6;font-size:13px;">£${order.shipping_cost.toFixed(2)}</td></tr>` : ""}
<tr><td style="color:#f5f0e8;font-size:16px;font-weight:bold;padding-top:8px;">Total</td><td align="right" style="color:#c9a84c;font-size:18px;font-weight:bold;padding-top:8px;">£${order.total.toFixed(2)}</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 32px 0;">
<table width="100%" style="background:#2d5a27;border-radius:8px;padding:16px;">
<tr><td>
<p style="color:#f5f0e8;font-size:14px;margin:0 0 4px 0;font-weight:bold;">💳 Payment Pre-Authorised</p>
<p style="color:#f5f0e8;opacity:.8;font-size:13px;margin:0;line-height:1.5;">Your card has been pre-authorised for £${order.total.toFixed(2)}. Payment will only be captured when your order is ready.</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 32px;text-align:center;background:#111;border-top:1px solid #333;">
<p style="color:#f5f0e8;opacity:.4;font-size:12px;margin:0 0 4px 0;">Questions? Email <a href="mailto:orders@danskys.co.uk" style="color:#c9a84c;">orders@danskys.co.uk</a></p>
<p style="color:#f5f0e8;opacity:.3;font-size:11px;margin:0;">© Danskys Pesach Lettuce</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
