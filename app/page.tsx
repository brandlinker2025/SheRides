import Link from "next/link";

export default function EntryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 text-6xl">🛵</div>
        <h1 className="mb-2 text-5xl font-black text-purple-400">SheRides</h1>
        <p className="mb-8 text-sm uppercase tracking-widest text-amber-300">
          RIDE · CONNECT · EMPOWER
        </p>

        <p className="mb-10 text-lg text-white/80">Safe rides in Dhaka</p>

        <div className="flex flex-col gap-4">
          <Link
            href="/go?role=passenger"
            className="flex h-14 items-center justify-center rounded-full bg-purple-400 text-lg font-bold text-black"
          >
            Take a ride / রাইড নিন
          </Link>

          <Link
            href="/go/apply?role=rider"
            className="flex h-14 items-center justify-center rounded-full border-2 border-purple-400 text-lg font-bold"
          >
            Become a Rider / রাইডার হন
          </Link>
        </div>

        <p className="mt-10 text-sm text-white/50">
          Already have an account? <Link href="/login" className="text-purple-300 underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
