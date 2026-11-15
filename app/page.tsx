import Link from "next/link";

export default function EntryPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#131318] px-6 text-[#e4e1e9]">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="text-5xl font-bold tracking-tight text-[#A855F7] sm:text-6xl">SheRides</h1>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#FFB95F]">
          RIDE · CONNECT · EMPOWER
        </p>
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
          <Link href="/login" className="font-semibold text-[#A855F7] underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
