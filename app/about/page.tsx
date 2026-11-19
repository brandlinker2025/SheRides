import type { Metadata } from "next";
import Link from "next/link";
import { InfoSection, PublicInfoPage, infoLinkClass } from "@/components/public-app/PublicInfoPage";

export const metadata: Metadata = {
  title: "About SheRides",
  description: "SheRides is a women-only ride sharing service in Bangladesh. Book now, pre-book, or hire by the hour.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About SheRides",
    description: "Women-only ride sharing in Bangladesh. Book now, pre-book, or hire by the hour.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <PublicInfoPage kicker="ABOUT" title="About SheRides">
      <p>
        SheRides is a women-only ride sharing service in Bangladesh. Rides are by women, for women. On sherides.online you can book a ride now, pre-book a pickup time, or hire by the hour.
      </p>
      <InfoSection title="Take a ride or become a partner">
        <p>
          The home page has two paths. Take a Ride is for passengers. Become a Partner is for women who carry passengers on a motorcycle or scooter. Partners are asked to carry a second helmet for the passenger.
        </p>
        <p>
          You create an account with your name, date of birth, a password, and either an email address or a Bangladesh mobile number. An administrator approves the account before you can continue. SheRides rides are only for women. Before you can book or carry passengers, an administrator checks your face, name, and NID by hand.
        </p>
      </InfoSection>
      <InfoSection title="On a ride">
        <p>
          A booking stores the pickup, the destination when the ride has one, the fare, and the payment method you choose. The booking screen offers cash and bKash. You can add a landmark, a note for the captain, an optional extra stop, and one photo of a nearby landmark. During an active ride the passenger and the captain can send short messages. The passenger receives a 4-digit PIN and can share a trip link that shows the ride status and the captain&apos;s live location.
        </p>
      </InfoSection>
      <InfoSection title="More">
        <p>
          <Link className={infoLinkClass} href="/privacy">
            Privacy Policy
          </Link>{" "}
          describes the information the app collects.{" "}
          <Link className={infoLinkClass} href="/contact">
            Contact
          </Link>{" "}
          has the email address for questions about the service or your account.
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}
