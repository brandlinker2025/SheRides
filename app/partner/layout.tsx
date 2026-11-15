import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./partner.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-partner",
  display: "swap",
});

const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-partner-bn",
  display: "swap",
});

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return <div className={`partner-root ${jakarta.variable} ${hind.variable}`}>{children}</div>;
}
