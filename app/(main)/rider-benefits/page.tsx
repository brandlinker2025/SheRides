import { Icon } from "@/components/ui/Icon";

const benefits = [
  {
    title: "Ride Log & Achievements",
    icon: "route",
    summary: "Track your riding journey, completed rides and distance milestones.",
    benefit: "See your progress, stay motivated and earn milestone badges such as 100 km, 500 km and First Highway Ride.",
  },
  {
    title: "Bike Health & Renewal Reminder",
    icon: "build_circle",
    summary: "Keep service, oil change, tyre and important document renewals in one place.",
    benefit: "Helps riders maintain their bike confidently and avoid missing important service or renewal dates.",
  },
  {
    title: "Anonymous Safety Alert",
    icon: "report",
    summary: "Report harassment, unsafe roads or risky areas without showing your identity.",
    benefit: "Lets riders warn the community safely and helps others avoid dangerous locations.",
  },
  {
    title: "Verified Riding Instructors",
    icon: "school",
    summary: "Find female-friendly riding instructors with verification and community ratings.",
    benefit: "New riders can choose a trustworthy trainer instead of depending on unknown sources.",
  },
  {
    title: "Peer Support Space",
    icon: "favorite",
    summary: "A supportive space for riding anxiety, family pressure, harassment experiences and confidence issues.",
    benefit: "Riders can share sensitive experiences, including anonymously, and receive support from people who understand the same challenges.",
  },
  {
    title: "Weather & Ride Alerts",
    icon: "thunderstorm",
    summary: "Get weather warnings before a planned ride, including rain, storms and risky conditions.",
    benefit: "Supports safer ride decisions before riders leave home or start a long route.",
  },
  {
    title: "Emergency & SOS",
    icon: "sos",
    summary: "Emergency support for accident, harassment and bike breakdown situations.",
    benefit: "Helps riders reach selected contacts and support faster when they need urgent assistance.",
  },
  {
    title: "Nearby Riders & Help",
    icon: "near_me",
    summary: "Find nearby verified female riders, workshops, fuel stations, hospitals and other useful support.",
    benefit: "Makes unfamiliar places less stressful and gives riders a nearby support network when needed.",
  },
  {
    title: "Learn, Mentor & Ride Together",
    icon: "groups",
    summary: "Connect with mentors, improve riding skills and join verified group rides.",
    benefit: "New riders can learn step by step and gain confidence while experienced riders can support the community.",
  },
  {
    title: "Opportunities & Marketplace",
    icon: "workspace_premium",
    summary: "Future access to brand campaigns, sponsorships, jobs, training, collaborations and a trusted rider marketplace.",
    benefit: "Creates real career, earning and affordable gear opportunities inside the verified female biker community.",
  },
];

export default function RiderBenefitsPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <section className="mb-6">
        <p className="font-label-caps text-label-caps text-accent-magenta mb-2">SheRides</p>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Rider Benefits</h1>
        <p className="mt-2 max-w-3xl font-body-md text-secondary">
          Practical benefits designed to support female bikers from their first ride to becoming confident, experienced riders.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((item, index) => (
          <article key={item.title} className="rounded-xl border border-surface-border bg-surface-container-lowest p-5 shadow-premium transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 shrink-0 rounded-full bg-accent-magenta/12 text-accent-magenta flex items-center justify-center">
                <Icon name={item.icon} size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-accent-magenta">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">{item.title}</h2>
                </div>
                <p className="mt-2 font-body-sm text-secondary">{item.summary}</p>
                <div className="mt-4 rounded-lg bg-soft-off-white px-4 py-3">
                  <p className="font-label-lg text-label-lg text-on-surface mb-1">Benefit</p>
                  <p className="font-body-sm text-secondary">{item.benefit}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
