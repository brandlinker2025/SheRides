import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RideMapPreview } from "@/components/go/RideMapPreview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ride map",
  robots: { index: false, follow: false },
};

export default function RideMapPreviewPage() {
  if (process.env["MAP_PREVIEW"] !== "1") notFound();
  return <RideMapPreview />;
}
