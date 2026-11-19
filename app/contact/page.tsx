import type { Metadata } from "next";
import { InfoSection, PublicInfoPage, SHERIDES_CONTACT_EMAIL, infoLinkClass } from "@/components/public-app/PublicInfoPage";

export const metadata: Metadata = {
  title: "Contact SheRides",
  description: "Contact SheRides by email about the women-only ride service, your account, or this privacy policy.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact SheRides",
    description: "Email SheRides about the service, your account, or privacy.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <PublicInfoPage kicker="CONTACT" title="Contact">
      <p>Write to SheRides about the service, a ride, your account, or the privacy policy.</p>
      <InfoSection title="Email">
        <p>
          <a className={infoLinkClass} href={`mailto:${SHERIDES_CONTACT_EMAIL}`}>
            {SHERIDES_CONTACT_EMAIL}
          </a>
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}
