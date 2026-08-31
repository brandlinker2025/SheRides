import type { Metadata } from "next";
import { PandaStandaloneFrame } from "@/components/brand/PandaStandaloneFrame";
import { DownloadInstall } from "@/components/pwa/DownloadInstall";

type Search = Promise<{ app?: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { app } = await searchParams;
  const admin = app === "admin";
  return {
    title: admin ? "Install SheRides Admin" : "Install SheRides",
    description: "Install SheRides on a PC, laptop, Android phone, or iPhone. Add to Home Screen — no app store needed.",
    manifest: admin ? "/admin.webmanifest" : "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: admin ? "SheRides Admin" : "SheRides",
      statusBarStyle: "black-translucent",
    },
    icons: {
      apple: "/icons/apple-touch-icon.png",
    },
    alternates: { canonical: "/download" },
  };
}

export default async function DownloadPage({ searchParams }: { searchParams: Search }) {
  const { app } = await searchParams;
  const target = app === "admin" ? "admin" : "sherides";
  return (
    <PandaStandaloneFrame>
      <DownloadInstall target={target} />
    </PandaStandaloneFrame>
  );
}
