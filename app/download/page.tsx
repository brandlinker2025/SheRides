import type { Metadata } from "next";
import { InstallSheRides } from "@/components/pwa/InstallSheRides";
import "@/components/public-app/public-app.css";

export const metadata: Metadata = {
  title: "Install SheRides — যেকোনো ফোনে",
  description: "SheRides যেকোনো ফোনে install করুন: Samsung, Xiaomi, Vivo, Oppo, Realme, iPhone। Play Store লাগবে না।",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SheRides", statusBarStyle: "default" },
  alternates: { canonical: "/install" },
  openGraph: {
    title: "SheRides ফোনে install করুন",
    description: "নারীদের জন্য নারীদের রাইড — যেকোনো ফোনে এক ট্যাপে install।",
    url: "https://sherides.online/install",
    images: [{ url: "/brand/violet-mint/share.jpg", width: 1200, height: 630, alt: "SheRides" }],
  },
};

export default function DownloadPage() {
  return <InstallSheRides />;
}
