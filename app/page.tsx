import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function SplashPage() {
  return (
    <div className="bg-surface text-on-surface antialiased overflow-x-hidden selection:bg-accent-magenta selection:text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim opacity-20 blur-[120px] rounded-full" />
      </div>
      <main className="min-h-screen flex flex-col md:flex-row relative z-10 w-full max-w-[1440px] mx-auto">
        <section className="order-1 md:order-2 w-full md:w-[55%] lg:w-[60%] h-64 sm:h-80 md:h-screen relative">
          <div className="absolute inset-0 rounded-b-[32px] md:rounded-b-none md:rounded-l-[40px] shadow-[-20px_0_60px_rgba(26,28,30,0.08)] overflow-hidden">
            <Image
              src="/hero-community.png"
              alt="SheRides community of women riders gathered together at sunset"
              fill
              priority
              sizes="(min-width: 1024px) 60vw, (min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent md:bg-gradient-to-r md:from-black/10 md:via-transparent md:to-transparent" />
          </div>
        </section>
        <section className="order-2 md:order-1 w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center px-container-margin-mobile md:px-container-margin-desktop py-section-gap md:min-h-screen bg-surface md:bg-transparent animate-fade-in-up">
          <div className="mb-section-gap">
            <span className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-accent-magenta tracking-tight">
              SheRides
            </span>
          </div>
          <div className="mb-section-gap max-w-lg">
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-component-gap">
              Ride. Connect. Belong.
            </h1>
            <p className="font-body-lg text-body-lg text-secondary">
              Bangladesh Women Riders Community
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-component-gap mb-section-gap">
            <Link
              href="/signup"
              className="flex items-center justify-center bg-accent-magenta text-on-primary font-label-lg text-label-lg h-[56px] px-8 rounded-full shadow-magenta hover:shadow-[0px_15px_30px_rgba(233,30,99,0.3)] hover:-translate-y-[2px] transition-all duration-300"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center border-2 border-outline text-on-surface font-label-lg text-label-lg h-[56px] px-8 rounded-full hover:bg-surface-container-low hover:border-deep-charcoal transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
          <div className="flex items-center gap-base mt-auto md:mt-0 pt-component-gap border-t border-surface-border md:border-none">
            <Icon name="verified_user" filled className="text-accent-magenta" />
            <span className="font-body-sm text-body-sm text-tertiary">
              Built for verified female riders.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
