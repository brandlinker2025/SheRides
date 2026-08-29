import Link from "next/link";
import { img } from "@/lib/images";
import { Icon } from "@/components/ui/Icon";

export default function SplashPage() {
  return (
    <div className="bg-surface text-on-surface antialiased overflow-x-hidden selection:bg-accent-magenta selection:text-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim opacity-20 blur-[120px] rounded-full" />
      </div>
      <main className="min-h-screen flex flex-col md:flex-row relative z-10 w-full max-w-[1440px] mx-auto">
        <section className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center px-container-margin-mobile md:px-container-margin-desktop py-section-gap min-h-screen md:min-h-0 bg-surface md:bg-transparent">
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
              Join Community
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
        <section className="w-full md:w-[55%] lg:w-[60%] h-[320px] md:h-screen relative hidden md:block">
          <div
            className="absolute top-0 right-0 w-full h-full bg-cover bg-center md:rounded-l-[40px] shadow-[-20px_0_60px_rgba(26,28,30,0.08)] overflow-hidden"
            style={{ backgroundImage: `url('${img.splash}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
          </div>
        </section>
      </main>
    </div>
  );
}
