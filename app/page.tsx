import Link from "next/link";

export default function EntryPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#131318] px-6 text-[#e4e1e9]">
      <div className="w-full max-w-md text-center">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb95f]">SheRides</div>
        <h1 className="mb-3 text-4xl font-bold leading-tight">
          Safe rides<br />
          <span className="text-[#ddb7ff]">for women, by women</span>
        </h1>
        <p className="mb-10 text-sm text-white/70">
          বাংলাদেশে মহিলাদের জন্য নিরাপদ রাইড শেয়ারিং
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/go?role=passenger"
            className="flex h-16 items-center justify-center gap-3 rounded-full bg-gradient-to-br from-[#ddb7ff] to-[#a855f7] text-lg font-bold text-[#1a1a24] shadow-lg"
          >
            <span className="text-2xl">🚶‍♀️</span>
            Take a ride / রাইড নিন
          </Link>

          <Link
            href="/go/apply?role=rider"
            className="flex h-16 items-center justify-center gap-3 rounded-full border-2 border-[#ddb7ff]/40 bg-[#1f1f24] text-lg font-bold text-[#e4e1e9]"
          >
            <span className="text-2xl">🛵</span>
            Become a Rider / রাইডার হন
          </Link>
        </div>

        <p className="mt-8 text-xs text-white/40">
          Already have an account?{" "}
          <Link href="/login" className="text-[#ddb7ff] underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
