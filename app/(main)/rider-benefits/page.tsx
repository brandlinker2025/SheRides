import { Icon } from "@/components/ui/Icon";

const benefits = [
  {
    title: "Ride Log & Achievements",
    icon: "route",
    summary: "Keep a personal record of riding distance, completed rides and major riding milestones.",
    features: ["Total kilometres", "Completed rides", "First Highway Ride", "100 / 500 / 1000 km badges"],
    benefit: "Shows riding progress clearly and gives riders visible milestones that encourage confidence and consistency.",
  },
  {
    title: "Bike Health & Renewal Reminder",
    icon: "build_circle",
    summary: "Keep bike maintenance and important renewal dates organised in one rider-friendly place.",
    features: ["Service reminder", "Engine oil reminder", "Tyre check", "Insurance renewal", "Fitness / document renewal"],
    benefit: "Helps riders maintain their bike properly and reduces the chance of missing important service or document dates.",
  },
  {
    title: "Anonymous Safety Alert",
    icon: "report",
    summary: "Share safety concerns with the SheRides community without exposing your identity when anonymity is needed.",
    features: ["Harassment report", "Unsafe road report", "Unsafe area warning", "Anonymous reporting", "Community safety alert"],
    benefit: "Lets female riders warn one another about risky roads, places and incidents while protecting the reporter's privacy.",
  },
  {
    title: "Verified Riding Instructors",
    icon: "school",
    summary: "A directory of female-friendly riding instructors with verification and rider feedback.",
    features: ["Verified status", "Female-friendly instructors", "Instructor profile", "Rider rating", "Training information"],
    benefit: "Makes it easier for new riders to choose a trustworthy trainer instead of depending on unknown sources.",
  },
  {
    title: "Peer Support Space",
    icon: "favorite",
    summary: "A supportive community space for personal challenges that female riders may face on and off the road.",
    features: ["Riding anxiety", "Family / social pressure", "Harassment experience", "Confidence support", "Optional anonymous sharing"],
    benefit: "Gives riders a safer place to share experiences and receive peer support from people who understand similar challenges.",
  },
  {
    title: "Weather & Ride Alerts",
    icon: "thunderstorm",
    summary: "Show important weather warnings before a planned ride so riders can make safer decisions.",
    features: ["Rain warning", "Storm warning", "Extreme weather", "Flood-risk warning", "Planned ride alert"],
    benefit: "Helps riders avoid starting a ride in dangerous conditions and prepare better before leaving home.",
  },
  {
    title: "Emergency & SOS",
    icon: "sos",
    summary: "Fast access to emergency assistance for serious situations while riding.",
    features: ["Accident SOS", "Harassment SOS", "Breakdown assistance", "Emergency contacts", "Location-based help"],
    benefit: "Reduces isolation during emergencies and helps riders reach trusted contacts or nearby support faster.",
  },
  {
    title: "Nearby Riders & Help",
    icon: "near_me",
    summary: "Find useful nearby support while keeping rider location privacy in mind.",
    features: ["Verified nearby female riders", "Workshop", "Fuel station", "Hospital", "Nearby help"],
    benefit: "Provides a trusted support network when riders are in an unfamiliar area or need practical assistance quickly.",
  },
  {
    title: "Learn, Mentor & Ride Together",
    icon: "groups",
    summary: "Bring learning, mentoring and verified group riding together in one rider development path.",
    features: ["Mentor connection", "Beginner progression", "City / highway skills", "Verified group rides", "Ride Together"],
    benefit: "Helps new riders improve step by step while giving experienced riders a structured way to support the community.",
  },
  {
    title: "Opportunities & Marketplace",
    icon: "workspace_premium",
    summary: "Create future professional and trusted commerce opportunities for verified SheRides members.",
    features: ["Brand campaigns", "Sponsorship", "Jobs / training", "Content collaboration", "Future trusted marketplace"],
    benefit: "Can create career, earning, collaboration and affordable gear opportunities inside the verified female biker ecosystem.",
  },
];

export default function RiderBenefitsPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
      <section className="mb-6 rounded-2xl border border-surface-border bg-surface-container-lowest p-5 sm:p-6 shadow-premium">
        <p className="font-label-caps text-label-caps text-accent-magenta mb-2">SheRides</p>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Rider Benefits</h1>
        <p className="mt-2 max-w-3xl font-body-md text-secondary">
          Safety, support, learning, maintenance and opportunity tools designed around the real needs of female bikers in Bangladesh.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-magenta/10 px-3 py-1.5 text-accent-magenta">
          <Icon name="verified" size={18} />
          <span className="font-label-sm text-label-sm">10 rider-focused benefit areas</span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((item, index) => (
          <article
            key={item.title}
            className="rounded-xl border border-surface-border bg-surface-container-lowest p-5 shadow-premium transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 shrink-0 rounded-full bg-accent-magenta/12 text-accent-magenta flex items-center justify-center">
                <Icon name={item.icon} size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <span className="mt-1 text-xs font-semibold text-accent-magenta">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">{item.title}</h2>
                </div>
                <p className="mt-2 font-body-sm text-secondary">{item.summary}</p>

                <div className="mt-4">
                  <p className="mb-2 font-label-lg text-label-lg text-on-surface">Feature scope</p>
                  <div className="flex flex-wrap gap-2">
                    {item.features.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full border border-surface-border bg-soft-off-white px-3 py-1 text-xs font-medium text-secondary"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-soft-off-white px-4 py-3">
                  <p className="font-label-lg text-label-lg text-on-surface mb-1">Rider benefit</p>
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
