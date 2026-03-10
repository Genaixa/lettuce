import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1c3320] border-t border-[#2d6e3e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Image
                src="/Logo3.jpg"
                alt="Danskys Pesach Lettuce"
                width={160}
                height={80}
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-[#f5f0e8]/60 text-sm leading-relaxed">
              Premium kosher-checked lettuce for Pesach. Pre-order now for
              guaranteed supply.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/order", label: "Pre-Order" },
                { href: "/faq", label: "FAQ" },
                { href: "/my-account", label: "My Account" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#f5f0e8]/60 hover:text-[#c9a84c] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <ul className="space-y-2">
              {[
                { href: "/terms", label: "Terms & Conditions" },
                { href: "/terms#privacy", label: "Privacy Policy" },
                { href: "/terms#refunds", label: "Refund Policy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#f5f0e8]/60 hover:text-[#c9a84c] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-[#f5f0e8]/60">
                <Phone size={15} className="text-[#c9a84c] mt-0.5 shrink-0" />
                <a href="tel:01912600947" className="hover:text-[#c9a84c] transition-colors">
                  0191 260 0947
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#f5f0e8]/60">
                <MapPin size={15} className="text-[#c9a84c] mt-0.5 shrink-0" />
                <span>Gateshead</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#2d6e3e]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[#f5f0e8]/40 text-xs">
            &copy; {currentYear} Danskys Pesach Lettuce. All rights reserved.
          </p>
          <p className="text-[#f5f0e8]/40 text-xs">
            Designed by{" "}
            <a
              href="https://genaixa.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#c9a84c] transition-colors"
            >
              Genaixa Ltd
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
