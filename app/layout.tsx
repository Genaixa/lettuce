import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Danskys Pesach Lettuce | Premium Kosher Lettuce Pre-Orders",
  description:
    "Pre-order your Pesach lettuce from Danskys. Premium kosher-checked romaine and iceberg lettuce, available for home delivery (NE postcodes) or in-store pickup.",
  openGraph: {
    title: "Danskys Pesach Lettuce",
    description: "Premium kosher lettuce pre-orders for Pesach.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
