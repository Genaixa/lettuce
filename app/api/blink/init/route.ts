import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, createIntent } from "@/lib/blink";

/**
 * Called by the frontend checkout form to initialise Blink hosted fields.
 * Returns an access_token + intent_id which the hosted fields JS needs.
 * POST body: { amountPence: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { amountPence } = await request.json();

    if (!amountPence || amountPence <= 0) {
      return NextResponse.json(
        { error: "amountPence must be a positive integer" },
        { status: 400 }
      );
    }

    // Build the return_url from the actual request origin so 3DS redirects
    // back to this server even before the real domain is live.
    const host = request.headers.get("host") ?? "localhost:3003";
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    const returnUrl = `${proto}://${host}/order`;

    const accessToken = await getAccessToken();
    const { paymentIntent, merchantId, transactionUnique } = await createIntent(accessToken, amountPence, "PREAUTH", returnUrl);

    return NextResponse.json({ accessToken, paymentIntent, merchantId, transactionUnique });
  } catch (error) {
    console.error("Blink init error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialise payment",
      },
      { status: 502 }
    );
  }
}
