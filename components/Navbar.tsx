"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import Image from "next/image";
import { useCart } from "./CartContext";
import clsx from "clsx";

export default function Navbar() {
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/order", label: "Pre-Order" },
    { href: "/faq", label: "FAQ" },
    { href: "/terms", label: "Terms" },
  ];

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#c5e0cc]"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/Logo3.jpg"
              alt="Danskys Pesach Lettuce"
              width={140}
              height={48}
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#1c3320]/80 hover:text-[#2d6e3e] text-base font-semibold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart + mobile toggle */}
          <div className="flex items-center gap-3">

            <Link
              href="/order#cart"
              className="relative p-2 text-[#1c3320]/70 hover:text-[#2d6e3e] transition-colors"
              aria-label="View cart"
            >
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#2d6e3e] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            <Link
              href="/order"
              className="hidden sm:inline-flex items-center px-4 py-2 bg-[#2d6e3e] hover:bg-[#245730] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Pre-Order
            </Link>

            <button
              className="md:hidden p-2 text-[#1c3320]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#c5e0cc] bg-white py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-[#1c3320]/80 hover:text-[#2d6e3e] text-base font-semibold transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/order"
                className="mx-4 mt-2 flex items-center justify-center px-4 py-2 bg-[#2d6e3e] hover:bg-[#245730] text-white text-sm font-semibold rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Pre-Order Now
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
