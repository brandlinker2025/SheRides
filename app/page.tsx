import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { authBackdropClass, authCardClass, authPrimaryClass } from "@/components/auth/AuthScene";

export default function EntryPage() {
  return (
    <main className={`grid min-h-dvh place-items-center px-5 py-12 ${authBackdropClass}`}>
      <div className={`max-w-lg text-center ${authCardClass}`}>
        <h1>
          <Logo variant="lockup" height={250} priority className="mx-auto max-w-full" />
        </h1>
        <div className="mt-8 grid gap-4">
          <Link href="/go" className={`gap-2 ${authPrimaryClass}`}>
            <Icon name="two_wheeler" size={20} />
            <span>Take a Ride <span className="block text-xs" lang="bn">রাইড নিন</span></span>
          </Link>
          <Link href="/partner" className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#c9a7ff]/50 bg-[#372450] px-4 py-2 font-semibold text-[#f3e7ff] hover:bg-[#493169]">
            <Icon name="helmet" size={20} />
            <span>Become a SheRides Partner <span className="block text-xs" lang="bn">পার্টনার হন</span></span>
          </Link>
        </div>
        <p className="mt-7 text-sm text-[#d4c5e9]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#e2c9ff] underline underline-offset-4">Sign In</Link>
        </p>
      </div>
    </main>
  );
}
