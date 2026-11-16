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
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[#1B1324]">
        {t.skip}
      </a>
      <header className="sticky top-0 z-40 border-b border-[var(--sr-line)] bg-white/88 shadow-[var(--sr-shadow)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[96px] max-w-6xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/partner" aria-label="SheRides" className="shrink-0">
            <Logo variant="lockup" height={84} priority />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Partner">
            <a className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--sr-muted)] hover:bg-[#4FD8FF]/15 hover:text-[var(--sr-heading)]" href="#content">
              {t.nav.home}
            </a>
            <button type="button" className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--sr-muted)] hover:bg-[#4FD8FF]/15 hover:text-[var(--sr-heading)]" onClick={() => openForm(null)}>
              {t.nav.apply}
            </button>
            {ENABLE_CAR && (
            <button type="button" className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--sr-muted)] hover:bg-[#4FD8FF]/15 hover:text-[var(--sr-heading)]" onClick={() => openForm("car")}>
              {t.nav.car}
            </button>
            )}
            <button type="button" className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--sr-muted)] hover:bg-[#4FD8FF]/15 hover:text-[var(--sr-heading)]" onClick={() => openForm("bike_scooter")}>
              {t.nav.bike}
            </button>
            {ENABLE_CAR && (
            <a className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--sr-muted)] hover:bg-[#4FD8FF]/15 hover:text-[var(--sr-heading)]" href="#types">
              {t.nav.office}
            </a>
            )}
            <a className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--sr-muted)] hover:bg-[#4FD8FF]/15 hover:text-[var(--sr-heading)]" href="#how">
              {t.nav.guide}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-[var(--sr-chip)] p-1" role="group" aria-label="Language">
              {(["bn", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={lang === code}
                  onClick={() => setLang(code)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${lang === code ? "bg-[#FF6772] text-[#460377]" : "text-[var(--sr-muted)]"}`}
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
              className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--sr-ink)] lg:hidden"
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
          <nav id="partner-menu" className="flex flex-col gap-1 border-t border-[var(--sr-line)] px-4 py-3 lg:hidden" aria-label="Partner">
            <button type="button" className="rounded-full px-3 py-3 text-left text-sm font-semibold text-[var(--sr-heading)]" onClick={() => openForm(null)}>
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
          <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#4FD8FF]/40 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[#5CFFD8]/40 blur-3xl" aria-hidden="true" />
          <div className={`mx-auto flex flex-col items-center gap-10 px-4 py-14 md:py-20 ${ENABLE_CAR ? "max-w-6xl lg:grid lg:grid-cols-2 lg:items-center" : "max-w-3xl text-center"}`}>
            <div className={ENABLE_CAR ? "" : "flex flex-col items-center"}>
              {!ENABLE_CAR && <Logo variant="lockup" height={240} priority className="mb-8" />}
              <p className="inline-flex items-center gap-2 rounded-full border border-[#FF6772]/40 bg-white/70 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sr-rose-ink)]">
                <Icon name="diversity_3" size={16} />
                {t.hero.badge}
              </p>
              <h1 className="mt-6 text-[32px] font-extrabold leading-[40px] tracking-[-0.02em] text-[var(--sr-heading)] md:text-[40px] md:leading-[48px] md:tracking-[-0.03em]">
                {t.hero.titleA}
                <span className="mt-2 block text-[var(--sr-ink)]">{t.hero.titleB}</span>
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
              <p className="mt-8 max-w-xl text-base leading-6 text-[var(--sr-muted)]">{t.hero.intro}</p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {t.hero.bullets.map((item) => (
                  <li key={item} className={`flex items-center gap-2 text-sm font-semibold text-[var(--sr-ink)] ${ENABLE_CAR ? "" : "justify-center sm:justify-start"}`}>
                    <Icon name="check_circle" size={18} className="shrink-0 text-[var(--sr-rose-ink)]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className={`mt-8 flex flex-col gap-3 ${ENABLE_CAR ? "sm:flex-row" : "w-full max-w-md sm:flex-row sm:justify-center"}`}>
                <button type="button" onClick={() => openForm(null)} className="partner-cta inline-flex h-14 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold">
                  {t.hero.partner}
                  <Icon name="arrow_forward" size={18} />
                </button>
                <Link href="/login?next=%2Fgo" className="inline-flex h-14 items-center justify-center rounded-full border border-[var(--sr-line)] bg-white/70 px-7 text-base font-semibold text-[var(--sr-ink)]">
                  {t.hero.book}
                </Link>
              </div>
              <p className={`mt-8 max-w-xl border-l-2 border-[#FFB804] pl-4 text-left text-sm leading-6 text-[var(--sr-muted)]`}>{t.hero.note}</p>
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
            <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--sr-heading)]">{t.paths.title}</h2>
            <p className="mt-3 text-[var(--sr-muted)]">{t.paths.sub}</p>
          </div>
          <div className={`mt-10 grid gap-5 ${ENABLE_CAR ? "md:grid-cols-2" : "mx-auto max-w-xl"}`}>
            {ENABLE_CAR && <PathCard icon="directions_car" title={t.paths.carTitle} body={t.paths.carBody} cta={t.paths.carCta} onClick={() => openForm("car")} />}
            <PathCard icon="two_wheeler" title={t.paths.bikeTitle} body={t.paths.bikeBody} cta={t.paths.bikeCta} onClick={() => openForm("bike_scooter")} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 md:py-20" id="types">
          <h2 className="text-center text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--sr-heading)]">{t.types.title}</h2>
          <div className={`mt-10 grid gap-4 ${ENABLE_CAR ? "md:grid-cols-3" : "mx-auto max-w-xl"}`}>
            <TypeCard icon="two_wheeler" title={t.types.bikeTitle} body={t.types.bikeBody} cta={t.types.start} onClick={() => openForm("bike_scooter")} />
            {ENABLE_CAR && <TypeCard icon="directions_car" title={t.types.carTitle} body={t.types.carBody} cta={t.types.start} onClick={() => openForm("car")} />}
            {ENABLE_CAR && <TypeCard icon="diversity_3" title={t.types.officeTitle} body={t.types.officeBody} cta={t.types.start} onClick={() => openForm("car")} />}
          </div>
          <button
            type="button"
            onClick={() => openForm("none")}
            className="mt-4 flex w-full flex-col gap-2 rounded-[1.25rem] border border-dashed border-[#460377]/20 bg-white/80 px-6 py-5 text-left sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              <span className="block font-semibold text-[var(--sr-ink)]">{t.types.noneTitle}</span>
              <span className="mt-1 block text-sm text-[var(--sr-muted)]">{t.types.noneBody}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--sr-heading)]">
              {t.types.noneCta}
              <Icon name="arrow_forward" size={16} />
            </span>
          </button>
        </section>

        <section className="bg-[#EAF7FF]/80" id="earnings">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--sr-heading)]">{t.earnings.title}</h2>
              <p className="mt-4 leading-6 text-[var(--sr-muted)]">{t.earnings.body}</p>
            </div>
            <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
              <article className="rounded-[1.5rem] border border-[var(--sr-line)] bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sr-faint)]">{t.earnings.part}</p>
                <p className="partner-amount mt-3 text-[32px] font-extrabold leading-10 text-[var(--sr-heading)]">{t.earnings.partAmount}</p>
                <p className="mt-1 text-sm text-[var(--sr-faint)]">{t.earnings.per}</p>
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FF6772]/20 px-3 py-1.5 text-sm font-semibold text-[#460377]">
                  <Icon name="schedule" size={16} />
                  {t.earnings.partHours}
                </p>
              </article>
              <article className="relative overflow-hidden rounded-[1.5rem] bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-8 ring-1 ring-[#4FD8FF]/50">
                <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#4FD8FF]/35 blur-3xl" aria-hidden="true" />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sr-muted)]">{t.earnings.full}</p>
                <p className="partner-amount mt-3 text-[32px] font-extrabold leading-10 text-[var(--sr-heading)]">{t.earnings.fullAmount}</p>
                <p className="mt-1 text-sm text-[var(--sr-muted)]">{t.earnings.per}</p>
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FF6772] px-3 py-1.5 text-sm font-semibold text-[#460377]">
                  <Icon name="schedule" size={16} />
                  {t.earnings.fullHours}
                </p>
              </article>
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-[var(--sr-faint)]">{t.earnings.disclaimer}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:py-20 lg:grid-cols-2" id="purpose">
          <div>
            <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--sr-heading)]">{t.purpose.title}</h2>
            <p className="mt-5 leading-7 text-[var(--sr-muted)]">{t.purpose.body}</p>
          </div>
          <div className="flex flex-col gap-4">
            {t.purpose.cards.map((card) => (
              <article key={card.title} className="flex gap-4 rounded-[1.25rem] border border-[var(--sr-line)] bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7E1CA8]/10 text-[var(--sr-heading)]">
                  <Icon name={card.icon} />
                </span>
                <span>
                  <h3 className="font-bold text-[var(--sr-heading)]">{card.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--sr-muted)]">{card.body}</p>
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[var(--sr-inset)]" id="how">
          <div className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 md:py-20">
            <h2 className="text-center text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--sr-heading)]">{t.how.title}</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {t.how.items.map((item) => (
                <article key={item.title} className="rounded-[1.25rem] border border-[var(--sr-line)] bg-white/70 p-6 backdrop-blur">
                  <Icon name={item.icon} className="text-[var(--sr-heading)]" />
                  <h3 className="mt-4 font-bold text-[var(--sr-heading)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--sr-muted)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <div className="rounded-[1.5rem] border border-[#ffb95f]/25 bg-[#ffb95f]/5 p-8 md:p-12">
            <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--sr-heading)]">{t.fit.title}</h2>
            <p className="mt-5 leading-7 text-[var(--sr-muted)]">{t.fit.body}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {t.fit.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm font-semibold text-[var(--sr-ink)]">
                  <Icon name="check_circle" size={18} className="mt-0.5 shrink-0 text-[var(--sr-gold-ink)]" />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t border-[#ffb95f]/20 pt-6 text-sm leading-6 text-[var(--sr-muted)]">{t.fit.note}</p>
          </div>
        </section>

        <section className="bg-[#EAF7FF]/80" id="process">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <h2 className="text-center text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--sr-heading)]">{t.process.title}</h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.process.steps.map((step, index) => (
                <li key={step} className="rounded-[1.25rem] border border-[var(--sr-line)] bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-5">
                  <span className="text-sm font-extrabold text-[var(--sr-heading)]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[var(--sr-heading)]">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] px-6 py-12 text-center ring-1 ring-[#4FD8FF]/40 md:px-16 md:py-16">
            <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#4FD8FF]/35 blur-3xl" aria-hidden="true" />
            <h2 className="relative text-balance text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--sr-heading)] md:text-[32px] md:leading-10">
              {t.finalCta.title}
            </h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-[var(--sr-muted)]">{t.finalCta.body}</p>
            <button type="button" onClick={() => openForm(null)} className="partner-cta relative mt-8 inline-flex h-14 items-center gap-2 rounded-full px-8 text-base font-semibold">
              {t.finalCta.cta}
              <Icon name="arrow_forward" size={18} />
            </button>
            <p className="relative mt-6 text-xs text-[var(--sr-muted)]">{t.finalCta.note}</p>
          </div>
        </section>
      </main>

      <footer className="mt-4 bg-[var(--sr-inset)] text-[var(--sr-ink)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 md:flex-row">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left">
            <Logo variant="mark" height={56} />
            <p className="text-sm text-[var(--sr-muted)]">{t.footer.line}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--sr-muted)]">
            <a className="hover:text-[var(--sr-heading)]" href="#how">
              {t.footer.guide}
            </a>
            <button type="button" className="hover:text-[var(--sr-heading)]" onClick={() => openForm(null)}>
              {t.footer.apply}
            </button>
            <Link className="hover:text-[var(--sr-heading)]" href="/admin-login">
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
      className={`group relative min-h-64 overflow-hidden rounded-[1.5rem] border border-[var(--sr-line)] bg-[var(--sr-card-solid)] text-left shadow-[var(--sr-shadow)] ${offset ? "sm:mt-8" : ""}`}
    >
      <span className="absolute inset-0 bg-gradient-to-br from-[#4FD8FF]/40 via-[#5CFFD8]/35 to-white" aria-hidden="true" />
      <span className="absolute inset-0 flex items-center justify-center text-[#460377]/20" aria-hidden="true">
        <Icon name={icon} size={88} />
      </span>
      <span className="absolute left-5 top-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-[var(--sr-heading)]">
        <Icon name={icon} size={30} />
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-white/90 px-3 py-3 text-center text-xs font-semibold text-[var(--sr-ink)] backdrop-blur">
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
    <button type="button" onClick={onClick} className="rounded-[1.5rem] border border-[var(--sr-line)] bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-7 text-left transition hover:-translate-y-0.5 hover:border-[#460377]/30">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7E1CA8]/10 text-[var(--sr-heading)]">
        <Icon name={icon} />
      </span>
      <span className="mt-5 block text-xl font-bold text-[var(--sr-heading)]">{title}</span>
      <span className="mt-2.5 block text-sm leading-6 text-[var(--sr-muted)]">{body}</span>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--sr-heading)]">
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
    <button type="button" onClick={onClick} className="rounded-[1.5rem] border border-[var(--sr-line)] bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-7 text-left transition hover:-translate-y-0.5 hover:border-[#460377]/30">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7E1CA8]/10 text-[var(--sr-heading)]">
        <Icon name={icon} size={28} />
      </span>
      <span className="mt-6 block text-xl font-bold leading-snug text-[var(--sr-heading)]">{title}</span>
      <span className="mt-3 block text-sm leading-6 text-[var(--sr-muted)]">{body}</span>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--sr-heading)]">
        {cta}
        <Icon name="arrow_forward" size={16} />
      </span>
    </button>
  );
}
