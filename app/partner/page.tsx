import type { Metadata } from "next";
import { PartnerLanding } from "@/components/partner/PartnerLanding";

export const metadata: Metadata = {
  title: "SheRides Partner — নারী কার ড্রাইভার ও বাইক রাইডার",
  description:
    "নারীদের নিরাপদ যাতায়াতে অবদান রাখুন এবং নিজের গাড়ি বা বাইক দিয়ে বাড়তি আয় করুন। SheRides নির্বাচিত Partner-দের নিয়ে pre-booked নারী-কেন্দ্রিক পরিবহন নেটওয়ার্ক তৈরি করছে।",
  alternates: { canonical: "/partner" },
  openGraph: {
    title: "SheRides Partner Network",
    description: "Earn additional income while helping women travel safely — apply to become a selected SheRides Partner.",
    url: "/partner",
    type: "website",
  },
};

export default function PartnerPage() {
  return <PartnerLanding />;
}
