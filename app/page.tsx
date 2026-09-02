import { redirect } from "next/navigation";

export default function SplashPage() {
  redirect("/login?next=%2Fhome");
}
