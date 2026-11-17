import { Suspense } from "react";
import { PublicApp } from "@/components/public-app/PublicApp";

export default function EntryPage() {
  return <Suspense fallback={null}><PublicApp /></Suspense>;
}
