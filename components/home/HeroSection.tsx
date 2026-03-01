"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDown, Leaf } from "lucide-react";

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = heroRef.current?.querySelectorAll("[data-animate]");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Soft decorative blobs */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #a8d4b0 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)",
          transform: "translate(-30%, 30%)",
        }}
      />

      {/* Floating leaf decorations */}
      <div className="absolute top-24 left-12 text-[#2d6e3e]/8 text-8xl select-none pointer-events-none">
        🥬
      </div>
      <div className="absolute bottom-32 right-16 text-[#2d6e3e]/8 text-6xl select-none pointer-events-none">
        🥬
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <div
          data-animate
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#e8f5eb] border border-[#c5e0cc] rounded-full mb-8 opacity-0 transition-opacity duration-700"
          style={{ transitionDelay: "100ms" }}
        >
          <Leaf size={14} className="text-[#2d6e3e]" />
          <span className="text-[#2d6e3e] text-sm font-medium tracking-wide">
            Pesach Pre-Orders Open
          </span>
        </div>

        {/* Main heading */}
        <h1
          data-animate
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#1c3320] leading-tight mb-4 opacity-0 transition-opacity duration-700"
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            transitionDelay: "200ms",
          }}
        >
          Fresh Lettuce
        </h1>

        {/* Tagline */}
        <p
          data-animate
          className="text-[#c9a84c] text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase mb-8 opacity-0 transition-opacity duration-700"
          style={{ transitionDelay: "280ms" }}
        >
          Washed &bull; Checked &bull; Ready for Seder Night
        </p>

        {/* Description */}
        <div
          data-animate
          className="max-w-2xl mx-auto mb-10 text-center space-y-3 opacity-0 transition-opacity duration-700"
          style={{ transitionDelay: "350ms" }}
        >
          <p className="text-[#1c3320] text-lg sm:text-xl font-semibold leading-snug">
            This Seder night, skip the hassle and focus on what truly matters.
          </p>
          <p className="text-[#1c3320]/60 text-base sm:text-lg leading-relaxed">
            Our romaine lettuce leaves come fully washed,
            <br />
            thoroughly checked, supervised, and ready to eat —
            <br />
            so you don&apos;t have to spend hours inspecting lettuce leaf by leaf.
          </p>
          <p className="text-[#1c3320] text-lg sm:text-xl font-semibold italic leading-snug">
            Simply open, serve, and enjoy a stress-free Seder.
          </p>
        </div>

        {/* CTAs */}
        <div
          data-animate
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 opacity-0 transition-opacity duration-700"
          style={{ transitionDelay: "500ms" }}
        >
          <Link
            href="/order"
            className="px-8 py-4 bg-[#2d6e3e] hover:bg-[#245730] text-white font-semibold rounded-xl text-base transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-[#2d6e3e]/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            Pre-Order Now
          </Link>
          <Link
            href="/faq"
            className="px-8 py-4 bg-transparent hover:bg-[#f2faf3] text-[#1c3320] border border-[#c5e0cc] hover:border-[#2d6e3e]/40 font-medium rounded-xl text-base transition-all duration-200"
          >
            Learn More
          </Link>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#2d6e3e]/30 animate-bounce">
        <ArrowDown size={20} />
      </div>

      <style jsx>{`
        .animate-fade-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        [data-animate] {
          transform: translateY(16px);
        }
      `}</style>
    </section>
  );
}
