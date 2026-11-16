"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import type { VehicleType } from "@/lib/partner-application";
import { ENABLE_CAR } from "@/lib/features";
import { shownPartnerCopy, type PartnerLang } from "./copy";
import { PartnerFormDialog } from "./PartnerFormDialog";

export function PartnerLanding() {
  const [lang, setLang] = useState<PartnerLang>("bn");
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleType | null>(null);
  const t = shownPartnerCopy(lang);

  function openForm(next: VehicleType | null) {
    setVehicle(next);
    setFormOpen(true);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (window.location.hash === "#apply") {
      setVehicle(null);
      setFormOpen(true);
    }
  }, []);

  return (
    <div lang={lang}>
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[#131318]">
        {t.skip}
      </a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1B1324]/90 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[96px] max-w-6xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/partner" aria-label="SheRides" className="shrink-0">
            <Logo variant="lockup" height={84} priority />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Partner">
            <a className="rounded-full px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white" href="#content">
              {t.nav.home}
            </a>
            <button type="button" className="rounded-full px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white" onClick={() => openForm(null)}>
              {t.nav.apply}
            </button>
            {ENABLE_CAR && (
            <button type="button" className="rounded-full px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white" onClick={() => openForm("car")}>
              {t.nav.car}
            </button>
            )}
            <button type="button" className="rounded-full px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white" onClick={() => openForm("bike_scooter")}>
              {t.nav.bike}
            </button>
            {ENABLE_CAR && (
            <a className="rounded-full px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white" href="#types">
              {t.nav.office}
            </a>
            )}
            <a className="rounded-full px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white" href="#how">
              {t.nav.guide}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-white/10 p-1" role="group" aria-label="Language">
              {(["bn", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={lang === code}
                  onClick={() => setLang(code)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${lang === code ? "bg-[#f4b8d4] text-[#3a1830]" : "text-white/70"}`}
                >
                  {code === "bn" ? "বাংলা" : "EN"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => openForm(null)} className="partner-cta hidden h-10 rounded-full px-4 text-sm font-semibold md:inline-flex md:items-center">
              {t.nav.apply}
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="partner-menu"
              aria-label={menuOpen ? t.closeMenu : t.menu}
              onClick={() => setMenuOpen((value) => !value)}
            >
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="partner-menu" className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 lg:hidden" aria-label="Partner">
            <button type="button" className="rounded-full px-3 py-3 text-left text-sm font-semibold text-[#f4b8d4]" onClick={() => openForm(null)}>
              {t.nav.apply}
            </button>
            <a className="rounded-full px-3 py-3 text-sm font-semibold" href="#content" onClick={() => setMenuOpen(false)}>
              {t.nav.home}
            </a>
            {ENABLE_CAR && (
            <button type="button" className="rounded-full px-3 py-3 text-left text-sm font-semibold" onClick={() => openForm("car")}>
              {t.nav.car}
            </button>
            )}
            <button type="button" className="rounded-full px-3 py-3 text-left text-sm font-semibold" onClick={() => openForm("bike_scooter")}>
              {t.nav.bike}
            </button>
            {ENABLE_CAR && (
            <a className="rounded-full px-3 py-3 text-sm font-semibold" href="#types" onClick={() => setMenuOpen(false)}>
              {t.nav.office}
            </a>
            )}
            <a className="rounded-full px-3 py-3 text-sm font-semibold" href="#how" onClick={() => setMenuOpen(false)}>
              {t.nav.guide}
            </a>
          </nav>
        )}
      </header>

      <main id="content">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#f4b8d4]/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[#b76dff]/20 blur-3xl" aria-hidden="true" />
          <div className={`mx-auto flex flex-col items-center gap-10 px-4 py-14 md:py-20 ${ENABLE_CAR ? "max-w-6xl lg:grid lg:grid-cols-2 lg:items-center" : "max-w-3xl text-center"}`}>
            <div className={ENABLE_CAR ? "" : "flex flex-col items-center"}>
              {!ENABLE_CAR && <Logo variant="lockup" height={240} priority className="mb-8" />}
              <p className="inline-flex items-center gap-2 rounded-full border border-[#FF6772]/40 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF6772]">
                <Icon name="diversity_3" size={16} />
                {t.hero.badge}
              </p>
              <h1 className="mt-6 text-[32px] font-extrabold leading-[40px] tracking-[-0.02em] text-white md:text-[40px] md:leading-[48px] md:tracking-[-0.03em]">
                {t.hero.titleA}
                <span className="mt-2 block text-[#F0EBF6]">{t.hero.titleB}</span>
              </h1>
              <div className={`mt-8 grid gap-3 ${ENABLE_CAR ? "sm:grid-cols-2 lg:hidden" : "w-full max-w-sm"}`}>
                {ENABLE_CAR && <HeroCard icon="directions_car" label={t.hero.car} alt={t.hero.carAlt} onClick={() => openForm("car")} />}
                <HeroCard icon="two_wheeler" label={t.hero.bike} alt={t.hero.bikeAlt} onClick={() => openForm("bike_scooter")} />
              </div>
              <div className={`mt-8 flex flex-col gap-3 ${ENABLE_CAR ? "sm:flex-row" : "w-full max-w-md sm:flex-row sm:justify-center"}`}>
                {ENABLE_CAR && (
                <button type="button" onClick={() => openForm("car")} className="partner-cta inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold">
                  <Icon name="directions_car" size={20} />
                  {t.hero.car}
                </button>
                )}
                <button type="button" onClick={() => openForm("bike_scooter")} className="partner-cta inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold">
                  <Icon name="two_wheeler" size={20} />
                  {t.hero.bike}
                </button>
              </div>
              <p className="mt-8 max-w-xl text-base leading-6 text-white/75">{t.hero.intro}</p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {t.hero.bullets.map((item) => (
                  <li key={item} className={`flex items-center gap-2 text-sm font-semibold text-white/85 ${ENABLE_CAR ? "" : "justify-center sm:justify-start"}`}>
                    <Icon name="check_circle" size={18} className="shrink-0 text-[#FF6772]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className={`mt-8 flex flex-col gap-3 ${ENABLE_CAR ? "sm:flex-row" : "w-full max-w-md sm:flex-row sm:justify-center"}`}>
                <button type="button" onClick={() => openForm(null)} className="partner-cta inline-flex h-14 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold">
                  {t.hero.partner}
                  <Icon name="arrow_forward" size={18} />
                </button>
                <Link href="/login?next=%2Fgo" className="inline-flex h-14 items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 text-base font-semibold text-white">
                  {t.hero.book}
                </Link>
              </div>
              <p className={`mt-8 max-w-xl border-l-2 border-[#FFB804] pl-4 text-left text-sm leading-6 text-white/70`}>{t.hero.note}</p>
            </div>
            {ENABLE_CAR && (
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
              <HeroCard icon="directions_car" label={t.hero.car} alt={t.hero.carAlt} onClick={() => openForm("car")} />
              <HeroCard icon="two_wheeler" label={t.hero.bike} alt={t.hero.bikeAlt} offset onClick={() => openForm("bike_scooter")} />
            </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20" id="paths">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-white">{t.paths.title}</h2>
            <p className="mt-3 text-white/65">{t.paths.sub}</p>
          </div>
          <div className={`mt-10 grid gap-5 ${ENABLE_CAR ? "md:grid-cols-2" : "mx-auto max-w-xl"}`}>
            {ENABLE_CAR && <PathCard icon="directions_car" title={t.paths.carTitle} body={t.paths.carBody} cta={t.paths.carCta} onClick={() => openForm("car")} />}
            <PathCard icon="two_wheeler" title={t.paths.bikeTitle} body={t.paths.bikeBody} cta={t.paths.bikeCta} onClick={() => openForm("bike_scooter")} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 md:py-20" id="types">
          <h2 className="text-center text-[28px] font-bold leading-9 tracking-[-0.02em] text-white">{t.types.title}</h2>
          <div className={`mt-10 grid gap-4 ${ENABLE_CAR ? "md:grid-cols-3" : "mx-auto max-w-xl"}`}>
            <TypeCard icon="two_wheeler" title={t.types.bikeTitle} body={t.types.bikeBody} cta={t.types.start} onClick={() => openForm("bike_scooter")} />
            {ENABLE_CAR && <TypeCard icon="directions_car" title={t.types.carTitle} body={t.types.carBody} cta={t.types.start} onClick={() => openForm("car")} />}
            {ENABLE_CAR && <TypeCard icon="diversity_3" title={t.types.officeTitle} body={t.types.officeBody} cta={t.types.start} onClick={() => openForm("car")} />}
          </div>
          <button
            type="button"
            onClick={() => openForm("none")}
            className="mt-4 flex w-full flex-col gap-2 rounded-[1.25rem] border border-dashed border-[#f4b8d4]/40 bg-[#f4b8d4]/5 px-6 py-5 text-left sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              <span className="block font-semibold text-white">{t.types.noneTitle}</span>
              <span className="mt-1 block text-sm text-white/65">{t.types.noneBody}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#f4b8d4]">
              {t.types.noneCta}
              <Icon name="arrow_forward" size={16} />
            </span>
          </button>
        </section>

        <section className="bg-[#1b1b20]" id="earnings">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-white">{t.earnings.title}</h2>
              <p className="mt-4 leading-6 text-white/65">{t.earnings.body}</p>
            </div>
            <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
              <article className="rounded-[1.5rem] border border-white/10 bg-[#1f1f24] p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{t.earnings.part}</p>
                <p className="partner-amount mt-3 text-[32px] font-extrabold leading-10 text-white">{t.earnings.partAmount}</p>
                <p className="mt-1 text-sm text-white/55">{t.earnings.per}</p>
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f4b8d4]/15 px-3 py-1.5 text-sm font-semibold text-[#f4b8d4]">
                  <Icon name="schedule" size={16} />
                  {t.earnings.partHours}
                </p>
              </article>
              <article className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#4a2a62] via-[#2d2158] to-[#1a1a24] p-8 ring-1 ring-[#f4b8d4]/35">
                <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#f4b8d4]/25 blur-3xl" aria-hidden="true" />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">{t.earnings.full}</p>
                <p className="partner-amount mt-3 text-[32px] font-extrabold leading-10 text-white">{t.earnings.fullAmount}</p>
                <p className="mt-1 text-sm text-white/70">{t.earnings.per}</p>
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#b76dff] px-3 py-1.5 text-sm font-semibold text-[#2c0051]">
                  <Icon name="schedule" size={16} />
                  {t.earnings.fullHours}
                </p>
              </article>
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-white/50">{t.earnings.disclaimer}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:py-20 lg:grid-cols-2" id="purpose">
          <div>
            <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-white">{t.purpose.title}</h2>
            <p className="mt-5 leading-7 text-white/70">{t.purpose.body}</p>
          </div>
          <div className="flex flex-col gap-4">
            {t.purpose.cards.map((card) => (
              <article key={card.title} className="flex gap-4 rounded-[1.25rem] border border-white/10 bg-[#1f1f24] p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4b8d4]/15 text-[#f4b8d4]">
                  <Icon name={card.icon} />
                </span>
                <span>
                  <h3 className="font-bold text-white">{card.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-white/65">{card.body}</p>
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#0e0e13]" id="how">
          <div className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 md:py-20">
            <h2 className="text-center text-[28px] font-bold leading-9 tracking-[-0.02em] text-white">{t.how.title}</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {t.how.items.map((item) => (
                <article key={item.title} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <Icon name={item.icon} className="text-[#ddb7ff]" />
                  <h3 className="mt-4 font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <div className="rounded-[1.5rem] border border-[#ffb95f]/25 bg-[#ffb95f]/5 p-8 md:p-12">
            <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-white">{t.fit.title}</h2>
            <p className="mt-5 leading-7 text-white/70">{t.fit.body}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {t.fit.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm font-semibold text-white">
                  <Icon name="check_circle" size={18} className="mt-0.5 shrink-0 text-[#ffb95f]" />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t border-[#ffb95f]/20 pt-6 text-sm leading-6 text-white/65">{t.fit.note}</p>
          </div>
        </section>

        <section className="bg-[#1b1b20]" id="process">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <h2 className="text-center text-[28px] font-bold leading-9 tracking-[-0.02em] text-white">{t.process.title}</h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.process.steps.map((step, index) => (
                <li key={step} className="rounded-[1.25rem] border border-white/10 bg-[#1f1f24] p-5">
                  <span className="text-sm font-extrabold text-[#f4b8d4]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#4a2a62] via-[#31215c] to-[#1a1a24] px-6 py-12 text-center ring-1 ring-[#f4b8d4]/30 md:px-16 md:py-16">
            <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#f4b8d4]/20 blur-3xl" aria-hidden="true" />
            <h2 className="relative text-balance text-[28px] font-bold leading-9 tracking-[-0.02em] text-white md:text-[32px] md:leading-10">
              {t.finalCta.title}
            </h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-white/75">{t.finalCta.body}</p>
            <button type="button" onClick={() => openForm(null)} className="partner-cta relative mt-8 inline-flex h-14 items-center gap-2 rounded-full px-8 text-base font-semibold">
              {t.finalCta.cta}
              <Icon name="arrow_forward" size={18} />
            </button>
            <p className="relative mt-6 text-xs text-white/60">{t.finalCta.note}</p>
          </div>
        </section>
      </main>

      <footer className="mt-4 bg-[#0e0e13] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 md:flex-row">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left">
            <Logo variant="mark" height={56} />
            <p className="text-sm text-white/70">{t.footer.line}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
            <a className="hover:text-white" href="#how">
              {t.footer.guide}
            </a>
            <button type="button" className="hover:text-white" onClick={() => openForm(null)}>
              {t.footer.apply}
            </button>
            <Link className="hover:text-white" href="/admin-login">
              {t.footer.admin}
            </Link>
          </div>
        </div>
      </footer>

      <PartnerFormDialog open={formOpen} vehicle={vehicle} copy={t.form} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function HeroCard({
  icon,
  label,
  alt,
  offset = false,
  onClick,
}: {
  icon: string;
  label: string;
  alt: string;
  offset?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={alt}
      className={`group relative min-h-64 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#1f1f24] text-left shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)] ${offset ? "sm:mt-8" : ""}`}
    >
      <span className="absolute inset-0 bg-gradient-to-br from-[#f4b8d4]/30 via-[#b76dff]/15 to-[#131318]" aria-hidden="true" />
      <span className="absolute inset-0 flex items-center justify-center text-[#f4b8d4]/25" aria-hidden="true">
        <Icon name={icon} size={88} />
      </span>
      <span className="absolute left-5 top-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#131318]/80 text-[#f4b8d4]">
        <Icon name={icon} size={30} />
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-[#0e0e13]/80 px-3 py-3 text-center text-xs font-semibold text-white backdrop-blur">
        {label}
      </span>
    </button>
  );
}

function PathCard({
  icon,
  title,
  body,
  cta,
  onClick,
}: {
  icon: string;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-[1.5rem] border border-white/10 bg-[#1f1f24] p-7 text-left transition hover:-translate-y-0.5 hover:border-[#f4b8d4]/40">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b76dff]/15 text-[#ddb7ff]">
        <Icon name={icon} />
      </span>
      <span className="mt-5 block text-xl font-bold text-white">{title}</span>
      <span className="mt-2.5 block text-sm leading-6 text-white/65">{body}</span>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f4b8d4]">
        {cta}
        <Icon name="arrow_forward" size={16} />
      </span>
    </button>
  );
}

function TypeCard({
  icon,
  title,
  body,
  cta,
  onClick,
}: {
  icon: string;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-[1.5rem] border border-white/10 bg-[#1f1f24] p-7 text-left transition hover:-translate-y-0.5 hover:border-[#b76dff]/50">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ddb7ff]/10 text-[#ddb7ff]">
        <Icon name={icon} size={28} />
      </span>
      <span className="mt-6 block text-xl font-bold leading-snug text-white">{title}</span>
      <span className="mt-3 block text-sm leading-6 text-white/65">{body}</span>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ddb7ff]">
        {cta}
        <Icon name="arrow_forward" size={16} />
      </span>
    </button>
  );
}
