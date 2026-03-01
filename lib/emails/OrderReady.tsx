import type { Order } from "@/types";

interface OrderReadyProps {
  order: Order;
}

export function orderReadyHtml({ order }: OrderReadyProps): string {
  const isDelivery = order.delivery_method === "delivery";
  const actionText = isDelivery
    ? "Your order is out for delivery"
    : "Your order is ready for pickup";
  const actionDetail = isDelivery
    ? `Your lettuce is on its way to ${order.address_line1}, ${order.city}, ${order.postcode}.`
    : "Please collect your order from our store. Bring this email as your receipt.";
  const emoji = isDelivery ? "🚚" : "🏪";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a1a;border-radius:12px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#2d5a27 0%,#1a1a1a 100%);padding:40px 32px;text-align:center;">
<p style="color:#c9a84c;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;">${emoji} ${actionText}</p>
<h1 style="color:#f5f0e8;font-size:28px;font-weight:700;margin:0 0 8px 0;font-family:Georgia,serif;">Danskys Pesach Lettuce</h1>
<p style="color:#f5f0e8;opacity:.7;margin:0;font-size:15px;">Great news, ${order.first_name}!</p>
</td></tr>
<tr><td style="padding:32px;">
<table width="100%" style="background:#2c2c2c;border-radius:8px;padding:20px;margin-bottom:24px;">
<tr>
<td><p style="color:#c9a84c;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px 0;">Order Reference</p>
<p style="color:#f5f0e8;font-size:18px;font-family:monospace;font-weight:bold;margin:0;">#${order.id.slice(0, 8).toUpperCase()}</p></td>
<td align="right"><p style="color:#c9a84c;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px 0;">Total Charged</p>
<p style="color:#f5f0e8;font-size:18px;font-weight:bold;margin:0;">£${order.total.toFixed(2)}</p></td>
</tr>
</table>
<p style="color:#f5f0e8;font-size:15px;line-height:1.6;margin:0 0 20px 0;">${actionDetail}</p>
<table width="100%" style="background:#2d5a27;border-radius:8px;padding:16px;">
<tr><td>
<p style="color:#f5f0e8;font-size:14px;font-weight:bold;margin:0 0 4px 0;">💳 Payment Processed</p>
<p style="color:#f5f0e8;opacity:.8;font-size:13px;margin:0;line-height:1.5;">£${order.total.toFixed(2)} has been charged to your card ending in the details provided at checkout.</p>
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
