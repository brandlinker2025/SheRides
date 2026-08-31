import type { Metadata } from "next";
import { PandaStandaloneFrame } from "@/components/brand/PandaStandaloneFrame";
import { DownloadInstall } from "@/components/pwa/DownloadInstall";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Install SheRides",
  description: "Install SheRides on a PC, laptop, Android phone, or iPhone. Add to Home Screen — no app store needed.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SheRides",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  alternates: { canonical: "/download" },
};

export default function DownloadPage() {
  return (
    <PandaStandaloneFrame>
      <DownloadInstall target="sherides" />
    </PandaStandaloneFrame>
  );
}
