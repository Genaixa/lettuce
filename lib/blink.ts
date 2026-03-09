/**
 * Blink Payment API integration
 * Base URL: https://secure.blinkpayment.co.uk
 * Docs: https://docs.blinkpayment.co.uk
 *
 * Flow:
 *  1. POST /api/pay/v1/tokens           → access_token (30 min expiry)
 *  2. POST /api/pay/v1/intents          → intent id (with amount + PREAUTH type)
 *  3. Frontend: hosted fields JS tokenises card → paymentToken
 *  4. POST /api/pay/v1/creditcards      → transaction_id (preauth held)
 *  5. POST /api/pay/v1/transactions/:id/captures → capture when ready
 *  6. POST /api/pay/v1/transactions/:id/cancels  → void if cancelled
 */

const BASE_URL =
  process.env.BLINK_API_URL ?? "https://secure.blinkpayment.co.uk";
const API_KEY = process.env.BLINK_API_KEY ?? "";
const SECRET_KEY = process.env.BLINK_SECRET_KEY ?? "";

// ─────────────────────────────────────────────
// 1. Access Token
// ─────────────────────────────────────────────

export async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/pay/v1/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: API_KEY,
      secret_key: SECRET_KEY,
      send_blink_receipt: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Blink token error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const token = data?.data?.access_token ?? data?.access_token;
  if (!token) throw new Error("Blink: no access_token in response");
  return token;
}

// ─────────────────────────────────────────────
// 2. Payment Intent
// ─────────────────────────────────────────────

export interface IntentResult {
  paymentIntent: string;   // pi_... token — used as payment_intent in creditcards API
  merchantId: number;
  transactionUnique: string;
}

export async function createIntent(
  accessToken: string,
  amountPence: number,
  transactionType: "SALE" | "PREAUTH" = "PREAUTH",
  overrideReturnUrl?: string
): Promise<IntentResult> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://danskys.uk";

  const res = await fetch(`${BASE_URL}/api/pay/v1/intents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      payment_type: "credit-card",
      transaction_type: transactionType,
      amount: amountPence / 100,
      currency: "GBP",
      return_url: overrideReturnUrl ?? `${siteUrl}/order`,
      notification_url: `${siteUrl}/api/blink/webhook`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Blink intent error ${res.status}: ${body}`);
  }

  const data = await res.json();

  const paymentIntent = data?.payment_intent;
  const merchantId = data?.merchant_id;
  const transactionUnique = data?.transaction_unique;

  if (!paymentIntent) throw new Error("Blink: no payment_intent in response");
  if (!merchantId) throw new Error("Blink: no merchant_id in response");

  return { paymentIntent: String(paymentIntent), merchantId: Number(merchantId), transactionUnique: String(transactionUnique ?? "") };
}

// ─────────────────────────────────────────────
// 3. Process Card (server-side, after hosted fields return paymentToken)
// ─────────────────────────────────────────────

export interface CardPaymentParams {
  accessToken: string;
  intentId: string;
  paymentToken: string;
  transactionUnique: string;  // must match the value returned by createIntent
  customerEmail: string;
  customerName: string;
  customerAddress?: string;
  customerPostcode?: string;
  // Browser fingerprint for 3DS (collected client-side)
  deviceTimezone?: string;
  deviceCapabilities?: string;
  deviceAcceptLanguage?: string;
  deviceScreenResolution?: string;
  remoteAddress?: string;
}

export interface PreauthResult {
  success: boolean;
  transactionId?: string;
  requiresRedirect?: boolean;
  redirectHtml?: string;       // 3DS acsform HTML
  errorMessage?: string;
}

export async function processCard(
  params: CardPaymentParams
): Promise<PreauthResult> {
  try {
    const body: Record<string, unknown> = {
      payment_intent: params.intentId,
      paymentToken: params.paymentToken,
      type: 1,                           // 1 = ECOM, 2 = MOTO
      transaction_unique: params.transactionUnique,
      customer_email: params.customerEmail,
      customer_name: params.customerName,
      customer_address: params.customerAddress ?? "",
      customer_postcode: params.customerPostcode ?? "",
    };

    // 3DS device data (required for ECOM type 1)
    if (params.deviceTimezone) {
      body.device_timezone = params.deviceTimezone;
      body.device_capabilities = params.deviceCapabilities ?? "JavaScript";
      body.device_accept_language = params.deviceAcceptLanguage ?? "en-GB";
      body.device_screen_resolution =
        params.deviceScreenResolution ?? "1920x1080x24";
      body.remote_address = params.remoteAddress ?? "";
    }

    console.log("[Blink creditcards] sending:", JSON.stringify({ ...body, paymentToken: body.paymentToken ? "[SET]" : "[MISSING]" }));

    const res = await fetch(`${BASE_URL}/api/pay/v1/creditcards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.accessToken}`,
        "Accept-Charset": "",
        "Accept-Encoding": "gzip, deflate, br",
        Accept: "*/*",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log("[Blink creditcards] status:", res.status, "body:", JSON.stringify(data));

    if (!res.ok) {
      // Blink sometimes returns { url: "...?note=SomeError" } instead of { error: "..." }
      let rawError: string = data?.error ?? data?.message ?? data?.errors?.[0] ?? "";
      if (!rawError && data?.url) {
        try {
          const note = new URL(data.url).searchParams.get("note");
          if (note) rawError = decodeURIComponent(note.replace(/\+/g, " "));
        } catch { /* ignore */ }
      }
      const errorMessage = rawError.toLowerCase().includes("invalid payment intent")
        ? "Payment session expired. Please refresh the page and try again."
        : rawError || `Payment failed (${res.status})`;
      return { success: false, errorMessage };
    }

    // 3DS redirect required
    if (data?.acsform) {
      return {
        success: false,
        requiresRedirect: true,
        redirectHtml: data.acsform,
        errorMessage: "3DS authentication required",
      };
    }

    const transactionId =
      data?.data?.transaction_id ??
      data?.data?.id ??
      data?.transaction_id;

    return { success: true, transactionId };
  } catch (error) {
    return {
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Unknown payment error",
    };
  }
}

// ─────────────────────────────────────────────
// 4. Capture Preauth
// ─────────────────────────────────────────────

export interface CaptureResult {
  success: boolean;
  errorMessage?: string;
}

export async function capturePayment(
  transactionId: string
): Promise<CaptureResult> {
  try {
    const accessToken = await getAccessToken();

    const res = await fetch(
      `${BASE_URL}/api/pay/v1/transactions/${transactionId}/captures`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        errorMessage: data?.message ?? `Capture failed (${res.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Capture network error",
    };
  }
}

// ─────────────────────────────────────────────
// 5. Void / Cancel Preauth
// ─────────────────────────────────────────────

export interface VoidResult {
  success: boolean;
  errorMessage?: string;
}

export async function voidPayment(transactionId: string): Promise<VoidResult> {
  try {
    const accessToken = await getAccessToken();

    const res = await fetch(
      `${BASE_URL}/api/pay/v1/transactions/${transactionId}/cancels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        errorMessage: data?.message ?? `Void failed (${res.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Void network error",
    };
  }
}
