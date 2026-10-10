import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pay-later ledger",
  description: "Track buy now, pay later purchases and monthly payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Nav />
        <main className="shell page">{children}</main>
      </body>
    </html>
  );
}
