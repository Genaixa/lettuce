"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Truck, CreditCard, Store, Clock, MapPin, Check } from "lucide-react";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function BentoCard({ children, className = "", delay = 0 }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("opacity-100", "translate-y-0");
              entry.target.classList.remove("opacity-0", "translate-y-4");
            }, delay);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-4 transition-all duration-600 ease-out rounded-xl border border-[#c5e0cc] bg-white overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export default function BentoGrid() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[#2d6e3e] text-sm font-medium tracking-widest uppercase mb-3">
          Pre-Order Options
        </p>
        <h2
          className="text-3xl sm:text-4xl font-bold text-[#1c3320]"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Avoid the Rush &amp; Queues
        </h2>
        <p className="text-[#1c3320]/70 text-base mt-3 max-w-xl mx-auto">
          Pre-order in advance with one of our two convenient options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Delivery Card */}
        <BentoCard delay={0} className="lg:col-span-2 p-6 sm:p-8 hover:border-[#2d6e3e]/50 hover:shadow-sm transition-all">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-[#e8f5eb] rounded-xl border border-[#c5e0cc]">
              <Truck size={24} className="text-[#2d6e3e]" />
            </div>
            <div>
              <h3
                className="text-[#1c3320] text-xl font-semibold mb-1"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                Home Delivery — £5
              </h3>
              <p className="text-[#1c3320]/50 text-sm">Bensham delivery zone</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#f2faf3] rounded-lg p-4 border border-[#c5e0cc]">
              <MapPin size={16} className="text-[#2d6e3e] mb-2" />
              <p className="text-[#1c3320] text-sm font-medium mb-1">
                Coverage Area
              </p>
              <p className="text-[#1c3320]/50 text-xs leading-relaxed">
                Bensham only. Pre-order in advance and have your lettuce
                delivered directly to your door.
              </p>
            </div>
            <div className="bg-[#f2faf3] rounded-lg p-4 border border-[#c5e0cc]">
              <Clock size={16} className="text-[#2d6e3e] mb-2" />
              <p className="text-[#1c3320] text-sm font-medium mb-1">
                Delivery Timing
              </p>
              <p className="text-[#1c3320]/50 text-xs leading-relaxed">
                Danskys will deliver your goods as soon as they arrive,
                to maintain optimum freshness.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 p-3 bg-[#c9a84c]/8 rounded-lg border border-[#c9a84c]/20">
            <Check size={14} className="text-[#c9a84c] shrink-0" />
            <p className="text-[#1c3320]/60 text-xs">
              If no one is available, specify a neighbour to leave your order with at checkout
            </p>
          </div>
        </BentoCard>

        {/* Pickup Card */}
        <BentoCard delay={100} className="p-6 hover:border-[#2d6e3e]/50 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#e8f5eb] rounded-xl border border-[#c5e0cc]">
              <Store size={20} className="text-[#2d6e3e]" />
            </div>
            <h3
              className="text-[#1c3320] text-lg font-semibold"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              In-Store Pickup — £2.50
            </h3>
          </div>
          <p className="text-[#1c3320]/60 text-sm leading-relaxed mb-4">
            Pre-order in advance, then simply collect your order during your
            allocated collection window.
          </p>
          <div className="space-y-2">
            {[
              "Text notification the day before",
              "3-hour collection window",
              "Orders held for allocated time only",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check size={13} className="text-[#2d6e3e] shrink-0" />
                <span className="text-[#1c3320]/60 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Payment Card */}
        <BentoCard delay={200} className="p-6 hover:border-[#2d6e3e]/50 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#c9a84c]/10 rounded-xl border border-[#c9a84c]/20">
              <CreditCard size={20} className="text-[#c9a84c]" />
            </div>
            <h3
              className="text-[#1c3320] text-lg font-semibold"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              Payment Information
            </h3>
          </div>
          <p className="text-[#1c3320]/60 text-sm leading-relaxed mb-4">
            Card details are required to secure your order. Your card will
            only be{" "}
            <strong className="text-[#1c3320]/80">charged once your order is ready</strong>{" "}
            for delivery or collection — never upfront.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Visa", "Mastercard", "Amex"].map((card) => (
              <span
                key={card}
                className="px-2 py-1 bg-[#f2faf3] border border-[#c5e0cc] rounded text-[#1c3320]/50 text-xs"
              >
                {card}
              </span>
            ))}
          </div>
        </BentoCard>

        {/* In-Stock Card */}
        <BentoCard delay={300} className="lg:col-span-2 p-6 sm:p-8 hover:border-[#2d6e3e]/50 hover:shadow-sm transition-all">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">🥬</div>
            <div>
              <h3
                className="text-[#1c3320] text-xl font-semibold mb-1"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                Also Available In-Store
              </h3>
              <p className="text-[#1c3320]/50 text-sm">
                Walk-in stock — after pre-orders are fulfilled
              </p>
            </div>
          </div>
          <p className="text-[#1c3320]/60 text-sm leading-relaxed mb-4">
            We aim to have stock available in store; however, this will be
            after all pre-orders have been fulfilled. Our full range of
            regular fresh lettuces and salad mixes will also be available in
            store as usual — pre-ordering is <strong className="text-[#1c3320]/80">not</strong> available
            on those items.
          </p>
          <Link
            href="/order"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2d6e3e] hover:bg-[#245730] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Pre-Order to Guarantee Stock
          </Link>
        </BentoCard>
      </div>
    </section>
  );
}
