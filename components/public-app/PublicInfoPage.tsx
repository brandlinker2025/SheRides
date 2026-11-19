import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/** Seeded SheRides account address in supabase/seed.sql. No other contact email is published in the app. */
export const SHERIDES_CONTACT_EMAIL = "admin@sherides.com";

const PAGES = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/contact", label: "Contact" },
] as const;

export const infoLinkClass =
  "font-semibold text-[#FFB804] underline decoration-[#FFB804]/70 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB804]";

export function PublicInfoPage({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="panda-app-bg min-h-dvh px-4 py-8 text-on-surface sm:px-6 sm:py-12">
      <article className="sherides-card mx-auto w-full max-w-3xl break-words p-5 sm:p-8">
        <Link
          href="/"
          aria-label="SheRides home"
          className="inline-block max-w-full rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB804]"
        >
          <Logo variant="lockup" height={88} priority />
        </Link>
        <p className="mt-6 font-label-caps text-label-caps text-primary">{kicker}</p>
        <h1 className="mt-2 font-headline-xl text-[1.75rem] leading-tight text-on-surface sm:text-headline-xl">{title}</h1>
        <div className="mt-5 flex flex-col gap-5 font-body-md text-secondary">{children}</div>
        <p className="mt-8 font-body-sm text-secondary">Last updated November 19, 2026.</p>
        <nav aria-label="Site information" className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          <Link className={infoLinkClass} href="/">
            Home
          </Link>
          {PAGES.map((page) => (
            <Link key={page.href} className={infoLinkClass} href={page.href}>
              {page.label}
            </Link>
          ))}
        </nav>
      </article>
    </main>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-headline-md text-xl text-on-surface sm:text-headline-md">{title}</h2>
      {children}
    </section>
  );
}

export function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
