import Link from "next/link";

export default function EntryPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md text-center">
        {/* Brand logo */}
        <div className="mb-10 flex justify-center">
          <img src="/sherides-logo.svg" alt="SheRides" className="h-28 w-auto" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white/90">
          Safe rides in Dhaka
        </h1>
        <p className="mb-10 text-sm text-white/50">
          নিরাপদ মহিলা ক্যাপ্টেনের সাথে রাইড করুন
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/go?role=passenger"
            className="flex h-16 items-center justify-center gap-3 rounded-full bg-gradient-to-br from-[#ddb7ff] to-[#a855f7] text-lg font-bold text-[#1a1a24] shadow-lg active:scale-95 transition"
          >
            <span className="text-2xl">🚶‍♀️</span>
            Take a ride / রাইড নিন
          </Link>

          <Link
            href="/go/apply?role=rider"
            className="flex h-16 items-center justify-center gap-3 rounded-full border-2 border-[#ddb7ff]/40 bg-[#111] text-lg font-bold text-white active:scale-95 transition"
          >
            <span className="text-2xl">🛵</span>
            Become a Rider / রাইডার হন
          </Link>
        </div>

        <p className="mt-10 text-xs text-white/40">
          Already have an account?{" "}
          <Link href="/login" className="text-[#ddb7ff] underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
