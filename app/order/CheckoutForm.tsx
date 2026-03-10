"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/components/CartContext";
import { FormInput, FormTextarea } from "@/components/FormInput";
import { AlertCircle, Lock, Loader2, CreditCard } from "lucide-react";

// Extend window for Blink's hosted fields jQuery plugin
declare global {
  interface Window {
    jQuery: ((selector: unknown) => BlinkHostedForm) & {
      fn: Record<string, unknown>;
    };
  }
}
interface BlinkHostedForm {
  hostedForm: (action: "instance" | Record<string, unknown>) => BlinkFormInstance;
}
interface BlinkFormInstance {
  getPaymentDetails: () => Promise<{ success: boolean; paymentToken: string }>;
  addPaymentToken: (token: string) => void;
}

interface CheckoutFormProps {
  onSuccess: (orderId: string, reference: string) => void;
}

interface FormErrors {
  [key: string]: string;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { items, deliveryMethod, subtotal, shippingCost, total, clearCart } =
    useCart();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postcode: "",
    neighbour_name: "",
    neighbour_address: "",
    notes: "",
    marketing_optin: false,
    terms_accepted: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);


  // Blink hosted fields state
  const formRef = useRef<HTMLFormElement>(null);
  const hostedFormInitialised = useRef(false);
  const [blinkReady, setBlinkReady] = useState(false);
  const [blinkLoading, setBlinkLoading] = useState(true);
  const [blinkError, setBlinkError] = useState<string | null>(null);
  const [blinkData, setBlinkData] = useState<{
    accessToken: string;
    paymentIntent: string;
    merchantId: number;
    transactionUnique: string;
  } | null>(null);

  const isDelivery = deliveryMethod === "delivery";
  const totalPence = Math.round(total * 100);

  // Load Blink hosted fields JS + get access token + intent
  useEffect(() => {
    if (items.length === 0) return;

    let isMounted = true;

    async function initBlink() {
      await new Promise((r) => setTimeout(r, 80));
      if (!isMounted) return;

      hostedFormInitialised.current = false;
      setBlinkData(null);
      setBlinkReady(false);
      setBlinkLoading(true);
      setBlinkError(null);

      try {
        const res = await fetch("/api/blink/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountPence: Math.round(total * 100) }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to initialise payment");
        }

        const { accessToken, paymentIntent, merchantId, transactionUnique } = await res.json();
        if (!isMounted) return;

        setBlinkData({ accessToken, paymentIntent, merchantId, transactionUnique });

        if (!window.jQuery) {
          await loadScript("https://code.jquery.com/jquery-3.7.1.min.js");
        }

        await loadScript(
          "https://gateway2.blinkpayment.co.uk/sdk/web/v1/js/hostedfields.min.js"
        );

        if (!isMounted) return;
        setBlinkReady(true);
      } catch (err) {
        if (!isMounted) return;
        const msg =
          err instanceof Error ? err.message : "Payment setup failed";
        setBlinkError(msg);
      } finally {
        if (isMounted) setBlinkLoading(false);
      }
    }

    initBlink();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPence]);

  useEffect(() => {
    if (!blinkReady || !blinkData || blinkLoading) return;

    const timer = setTimeout(() => {
      if (hostedFormInitialised.current) return;
      try {
        if (window.jQuery && formRef.current) {
          window.jQuery(formRef.current).hostedForm({
            autoSetup: true,
            autoSubmit: false,
          });
          hostedFormInitialised.current = true;
        }
      } catch (e) {
        console.warn("Blink hostedForm init:", e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [blinkReady, blinkData, blinkLoading]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.first_name.trim()) newErrors.first_name = "Required";
    if (!form.last_name.trim()) newErrors.last_name = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Valid email required";
    if (!form.phone.trim()) newErrors.phone = "Required";

    if (!form.address_line1.trim())
      newErrors.address_line1 = "Door number / name required";
    if (!form.address_line2.trim())
      newErrors.address_line2 = "Street required";
    if (!form.postcode.trim()) {
      newErrors.postcode = "Postcode required";
    } else if (isDelivery && !/^NE8/i.test(form.postcode.trim())) {
      newErrors.postcode =
        "Home delivery is only available within the Bensham delivery zone (NE8).";
    }

    if (!form.terms_accepted)
      newErrors.terms_accepted = "You must accept the terms & conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!blinkData) {
      setSubmitError("Payment is not ready yet. Please wait a moment.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let paymentToken: string | null = null;

      if (window.jQuery && formRef.current) {
        const hostedFormInstance = (window.jQuery as unknown as ((el: HTMLFormElement) => BlinkHostedForm))(formRef.current)
          .hostedForm("instance") as BlinkFormInstance | null;

        if (hostedFormInstance) {
          const details = await hostedFormInstance.getPaymentDetails();
          if (!details?.success || !details?.paymentToken) {
            setSubmitError(
              "Could not tokenise card details. Please check your card and try again."
            );
            setSubmitting(false);
            return;
          }
          paymentToken = details.paymentToken;
        }
      }

      if (!paymentToken) {
        setSubmitError(
          "Payment tokenisation failed. Please refresh the page and try again."
        );
        setSubmitting(false);
        return;
      }

      const payload = {
        ...form,
        delivery_method: deliveryMethod,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        blink_access_token: blinkData.accessToken,
        blink_intent_id: blinkData.paymentIntent,
        blink_transaction_unique: blinkData.transactionUnique,
        blink_payment_token: paymentToken,
        device_timezone: new Date().getTimezoneOffset().toString(),
        device_capabilities: "javascript",
        device_accept_language: navigator.language,
        device_screen_resolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = Array.isArray(data.errors)
          ? data.errors.join(". ")
          : data.error ?? "Something went wrong. Please try again.";
        setSubmitError(errorMsg);
        return;
      }

      if (data.requiresRedirect && data.redirectHtml) {
        localStorage.setItem(
          "blink_3ds_pending",
          JSON.stringify({
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone,
            address_line1: form.address_line1,
            address_line2: form.address_line2,
            city: form.city,
            postcode: form.postcode,
            neighbour_name: form.neighbour_name,
            neighbour_address: form.neighbour_address,
            notes: form.notes,
            marketing_optin: form.marketing_optin,
            delivery_method: deliveryMethod,
            items: items.map((i) => ({
              productId: i.product.id,
              quantity: i.quantity,
            })),
          })
        );
        document.open();
        document.write(data.redirectHtml);
        document.close();
        return;
      }

      clearCart();
      onSuccess(data.orderId, data.reference);
    } catch (err) {
      console.error("[checkout] submit error:", err);
      setSubmitError(
        err instanceof Error
          ? `Error: ${err.message}`
          : "Network error. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} id="blink-checkout" onSubmit={handleSubmit} noValidate>
      {blinkData && (
        <>
          <input type="hidden" name="merchantID" value={blinkData.merchantId.toString()} />
          <input type="hidden" name="payment_intent" value={blinkData.paymentIntent} />
          <input type="hidden" name="transaction_unique" value={blinkData.transactionUnique} />
          <input type="hidden" name="resource" value="creditcards" />
        </>
      )}

      <h2
        className="text-xl font-semibold text-[#1c3320] mb-6"
        style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
      >
        Your Details
      </h2>

      {/* Personal Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <FormInput
          label="First Name"
          required
          value={form.first_name}
          onChange={(e) => set("first_name", e.target.value)}
          error={errors.first_name}
          autoComplete="given-name"
        />
        <FormInput
          label="Last Name"
          required
          value={form.last_name}
          onChange={(e) => set("last_name", e.target.value)}
          error={errors.last_name}
          autoComplete="family-name"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <FormInput
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <FormInput
          label="Mobile Number"
          type="tel"
          required
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={errors.phone}
          autoComplete="tel"
          helper="Used for order updates"
        />
      </div>

      {/* Address */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-[#2d6e3e] uppercase tracking-wider mb-4">
          {isDelivery ? "Delivery Address" : "Your Address"}
        </h3>
        <div className="space-y-4">
          <FormInput
            label="Door Number / Name"
            required
            value={form.address_line1}
            onChange={(e) => set("address_line1", e.target.value)}
            error={errors.address_line1}
            autoComplete="address-line1"
          />
          <FormInput
            label="Street"
            required
            value={form.address_line2}
            onChange={(e) => set("address_line2", e.target.value)}
            error={errors.address_line2}
            autoComplete="address-line2"
          />
          <FormInput
            label="Postcode"
            required
            value={form.postcode}
            onChange={(e) => set("postcode", e.target.value.toUpperCase())}
            error={errors.postcode}
            autoComplete="postal-code"
            helper={isDelivery ? "Bensham delivery zone only" : undefined}
          />
        </div>

        {isDelivery && (
          <div className="mt-6 p-4 bg-[#f2faf3] border border-[#c5e0cc] rounded-xl">
            <p className="text-sm text-[#1c3320]/70 leading-relaxed mb-4">
              If no one is available at the time of delivery, please specify
              whether the goods may be left with a neighbour:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Neighbour's Name"
                value={form.neighbour_name}
                onChange={(e) => set("neighbour_name", e.target.value)}
                placeholder="Optional"
              />
              <FormInput
                label="Neighbour's Door Number"
                value={form.neighbour_address}
                onChange={(e) => set("neighbour_address", e.target.value)}
                placeholder="e.g. No. 14"
              />
            </div>
          </div>
        )}
      </div>

      {/* Order Notes */}
      <div className="mb-6">
        <FormTextarea
          label="Order Notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any special instructions or requests"
          rows={3}
        />
      </div>

      {/* Payment — Blink Hosted Fields */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={14} className="text-[#2d6e3e]" />
          <h3 className="text-sm font-medium text-[#2d6e3e] uppercase tracking-wider">
            Payment Details
          </h3>
        </div>

        <div className="bg-[#f2faf3] border border-[#c5e0cc] rounded-xl p-4 mb-4">
          <p className="text-[#1c3320]/60 text-xs leading-relaxed">
            💳 Your card will be{" "}
            <strong className="text-[#1c3320]/80">pre-authorised</strong> for £
            {total.toFixed(2)} — not charged until your order is ready. Card
            details are processed securely by Blink Payment and never stored on
            our servers.
          </p>
        </div>

        {/* Blink hosted fields container */}
        <div
          className="bg-white border border-[#c5e0cc] rounded-xl overflow-hidden"
          style={{ minHeight: "160px" }}
        >
          {blinkLoading && (
            <div className="flex items-center justify-center gap-3 py-12 text-[#1c3320]/40 text-sm">
              <Loader2 size={18} className="animate-spin text-[#2d6e3e]" />
              Setting up secure payment…
            </div>
          )}

          {blinkError && (
            <div className="flex items-start gap-3 p-4 text-red-500 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Payment setup failed</p>
                <p className="text-xs opacity-75 mt-0.5">{blinkError}</p>
              </div>
            </div>
          )}

          {!blinkLoading && !blinkError && blinkData && (
            <div key={blinkData.paymentIntent} className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-[#1c3320]/50 mb-1">Card Number</label>
                <input
                  type="hostedfield:cardNumber"
                  placeholder="1234 1234 1234 1234"
                  className="w-full bg-[#f2faf3] border border-[#c5e0cc] rounded-lg px-3 py-2.5 text-sm text-[#1c3320] placeholder-[#4a6b52]/40 focus:outline-none focus:border-[#2d6e3e]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#1c3320]/50 mb-1">Expiry Date</label>
                  <input
                    type="hostedfield:cardExpiryDate"
                    placeholder="MM / YY"
                    className="w-full bg-[#f2faf3] border border-[#c5e0cc] rounded-lg px-3 py-2.5 text-sm text-[#1c3320] placeholder-[#4a6b52]/40 focus:outline-none focus:border-[#2d6e3e]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#1c3320]/50 mb-1">CVV</label>
                  <input
                    type="hostedfield:cardCVV"
                    placeholder="CVV"
                    className="w-full bg-[#f2faf3] border border-[#c5e0cc] rounded-lg px-3 py-2.5 text-sm text-[#1c3320] placeholder-[#4a6b52]/40 focus:outline-none focus:border-[#2d6e3e]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {blinkReady && (
          <div className="flex items-center gap-2 mt-2">
            <CreditCard size={13} className="text-[#2d6e3e]" />
            <p className="text-[#1c3320]/40 text-xs">
              Secured by Blink Payment · Visa · Mastercard · Amex
            </p>
          </div>
        )}
      </div>

      {/* Marketing */}
      <div className="mb-4">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.marketing_optin}
            onChange={(e) => set("marketing_optin", e.target.checked)}
            className="mt-0.5 accent-[#2d6e3e]"
          />
          <span className="text-sm text-[#1c3320]/75 leading-relaxed">
            I&apos;d like to receive future Dansky&apos;s updates
          </span>
        </label>
      </div>

      {/* T&C */}
      <div className={`mb-6 p-3 rounded-xl border transition-colors ${form.terms_accepted ? "border-[#2d6e3e] bg-[#e8f5eb]" : "border-red-300 bg-red-50"}`}>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.terms_accepted}
            onChange={(e) => set("terms_accepted", e.target.checked)}
            className="mt-0.5 accent-[#2d6e3e] w-4 h-4 flex-shrink-0"
          />
          <span className="text-sm text-[#1c3320] font-medium leading-relaxed">
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2d6e3e] underline hover:text-[#245730]"
            >
              Terms &amp; Conditions
            </a>{" "}
            and understand my card will be pre-authorised until my order is
            ready. <span className="text-red-500 font-bold">* Required</span>
          </span>
        </label>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">{submitError}</p>
        </div>
      )}

      {/* Order summary */}
      <div className="bg-[#f2faf3] rounded-xl border border-[#c5e0cc] p-4 mb-6">
        <div className="flex justify-between text-sm text-[#1c3320]/75 mb-1">
          <span>
            {items.reduce((s, i) => s + i.quantity, 0)} item
            {items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""} —
            subtotal
          </span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#1c3320]/75 mb-2">
          <span>{isDelivery ? "Home delivery" : "Collection fee"}</span>
          <span>£{shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-[#c5e0cc] pt-2">
          <span className="font-semibold text-[#1c3320]">
            Total to pre-authorise
          </span>
          <span className="font-bold text-lg text-[#2d6e3e]">
            £{total.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || blinkLoading || !!blinkError || !form.terms_accepted}
        className="w-full flex items-center justify-center gap-3 py-4 bg-[#2d6e3e] hover:bg-[#245730] disabled:bg-[#2d6e3e]/50 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition-all duration-200 active:scale-[0.99]"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing…
          </>
        ) : blinkLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Setting up payment…
          </>
        ) : (
          <>
            <Lock size={16} />
            Place Pre-Order — £{total.toFixed(2)}
          </>
        )}
      </button>
      <p className="text-center text-[#1c3320]/55 text-xs mt-3">
        Pre-authorisation only — you will not be charged until your order is
        ready
      </p>
    </form>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}
