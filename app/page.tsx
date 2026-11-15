import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function EntryPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#1B1324] px-6 py-16 text-[#F0EBF6]">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#FF6772]/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[#460377]/55 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-[#FFB804]/15 blur-3xl" aria-hidden="true" />
      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        <h1 className="w-full">
          <Logo variant="lockup" height={460} priority className="mx-auto max-w-full" />
        </h1>
        <div className="mt-10 flex w-full flex-col gap-3">
          <Link href="/go" className="btn btn-primary h-14 w-full text-lg">
            Take a ride / রাইড নিন
          </Link>
          <Link href="/partner" className="btn btn-secondary h-14 w-full text-lg">
            Become a partner / পার্টনার হন
          </Link>
        </div>
        <p className="mt-10 text-sm text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#FF6772] underline decoration-[#FF6772]/40 underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
