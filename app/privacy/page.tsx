import type { Metadata } from "next";
import Link from "next/link";
import {
  InfoList,
  InfoSection,
  PublicInfoPage,
  SHERIDES_CONTACT_EMAIL,
  infoLinkClass,
} from "@/components/public-app/PublicInfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy — SheRides",
  description:
    "What SheRides collects for women-only ride sharing in Bangladesh, including accounts, identity checks, location, cookies, and advertising cookies.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — SheRides",
    description: "How SheRides collects, uses, and keeps account, identity, ride, and location information.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage kicker="PRIVACY" title="Privacy Policy">
      <p>
        This policy describes the information SheRides handles when you use sherides.online. SheRides is a women-only ride sharing service in Bangladesh. It does not sell your personal information.
      </p>

      <InfoSection title="Accounts">
        <p>Accounts are stored with Supabase Authentication and a SheRides profile. When you sign up, SheRides collects:</p>
        <InfoList
          items={[
            "Full name",
            "Email address or Bangladesh mobile number",
            "Password, which is used to sign in and is not shown again",
            "Date of birth. Sign-up accepts ages from 13 to 100.",
            "A username. Phone sign-ups use the mobile number as the username.",
          ]}
        />
        <p>
          If you sign up with a mobile number, the sign-in address is a non-deliverable address at phone.sherides.online so the account can exist in Supabase. You can add a recovery email later. That address can be used to sign in and reset the password. SheRides also stores whether an administrator has approved the account, and the account role.
        </p>
        <p>After approval you can edit a profile. The profile can include a bio, a city in Bangladesh, motorcycle brand and model, a profile photo, and a cover photo. Profile and cover photos are stored in a public image bucket, so anyone with the file address can load them. Profile pages are shown to signed-in members.</p>
      </InfoSection>

      <InfoSection title="Phone codes">
        <p>
          When the product sends a phone verification code, for example for a code sign-up or a password reset, the SMS is sent through sms.net.bd. The message includes the code and says it expires in 10 minutes. sms.net.bd receives the mobile number and the message text. A short-lived cookie stores the code check until that code expires. A separate cookie can remember that a phone was verified for 30 days.
        </p>
      </InfoSection>

      <InfoSection title="Identity check">
        <p>
          SheRides rides are only for women. An administrator compares your face, name, and NID before you can book or carry passengers. The application asks you to confirm that you are a woman and that the documents are yours. SheRides collects:
        </p>
        <InfoList
          items={[
            "Full name as on the NID, and the NID number (10 to 17 digits)",
            "A selfie",
            "A photo or PDF of the NID front, and optionally the NID back",
            "An emergency contact name and Bangladesh mobile number. That number is not shown to captains.",
          ]}
        />
        <p>Partners who will carry passengers also provide:</p>
        <InfoList
          items={[
            "Driving licence number and a photo or PDF of the licence",
            "Motorcycle brand, model, number plate, and chassis number",
            "A photo or PDF of the registration and tax token",
          ]}
        />
        <p>
          An older verification form can also store an NID number, a driving licence number or a chassis number, and one document image or PDF. Identity files are stored in a private bucket. The member who uploaded a file and administrators can open it. Administrators can see the NID number while they review an application.
        </p>
      </InfoSection>

      <InfoSection title="Rides and location">
        <p>A ride record can include:</p>
        <InfoList
          items={[
            "Whether the ride is now, pre-booked, or a hire, including the hire length (1 to 12 hours) or the scheduled time",
            "Pickup text and coordinates, destination text and coordinates when there is a destination, and an optional extra stop",
            "Distance, fare, and the payment method you choose. The booking screen offers cash and bKash. It does not ask for a wallet number, card number, or bank account.",
            "An optional note, landmark, and waiting note, up to 300 characters",
            "One landmark photo, stored privately. The passenger, the assigned captain, and administrators can view it.",
            "The captain's live GPS while she is online for a ride, sent about every 4 seconds. The passenger sees it on the ride, and anyone with the trip link can see it.",
            "A 4-digit ride PIN for the passenger, and a trip-share token. The trip link stops working 2 hours after the ride ends. The shared page shows status, pickup, destination, the captain's first name, number plate, and live location. It does not show the PIN.",
            "Short messages between the passenger and the captain during the ride, up to 300 characters each",
            "Ratings from 1 to 5, written feedback, and a cancellation reason",
          ]}
        />
        <p>
          The site asks for your device location when you set a pickup or when a captain shares her position. You can refuse that permission in the browser. Booking and live tracking that depend on GPS then cannot use your position. Saved places (home, work, or another label, with coordinates) and favourite captains are stored on your account when that feature is available, and a copy can also stay in this browser&apos;s local storage.
        </p>
        <p>Place search and maps send data to other services:</p>
        <InfoList
          items={[
            "Photon (photon.komoot.io) receives the place text you type and a map center.",
            "OpenStreetMap Nominatim receives the place text if Photon has no result, and receives coordinates when a map pin is turned into an address.",
            "Route estimates send pickup and destination coordinates to routing.openstreetmap.de and, if needed, router.project-osrm.org.",
            "The map loads street and satellite tiles from Esri (server.arcgisonline.com). A tile request includes the map area on screen.",
          ]}
        />
      </InfoSection>

      <InfoSection title="How the information is used">
        <p>SheRides uses this information to:</p>
        <InfoList
          items={[
            "Create your account and keep you signed in",
            "Approve membership and check identity for the women-only rule",
            "Book, price, assign, and complete rides, including live location and the trip link",
            "Show in-app notices about rides and account approval",
            "Let administrators review documents, rides, and member accounts, and remove an account when they do so",
            "Send a phone code when that step is used",
            "Remember this browser's theme, saved places, and favourite-captain names",
          ]}
        />
      </InfoSection>

      <InfoSection title="Cookies and local storage">
        <p>SheRides uses cookies that are needed to run the service:</p>
        <InfoList
          items={[
            "A Supabase sign-in cookie. On this site it is kept for about 400 days so a member can stay signed in on her phone.",
            "An OTP cookie while a phone code is being checked, until that code expires (10 minutes).",
            "A phone-verified cookie for up to 30 days after a successful code check.",
          ]}
        />
        <p>
          This browser also stores the theme choice, saved places, and favourite-captain names in local storage. SheRides registers a service worker for the installable app. That worker does not cache pages. The icon font is loaded from Google Fonts (fonts.googleapis.com), so your browser sends that request, including your IP address, to Google.
        </p>
      </InfoSection>

      <InfoSection title="Advertising cookies">
        <p>
          This site may show ads served by Google AdSense. Google and other advertising partners, including DoubleClick, may set and read cookies to serve ads, limit how often you see an ad, and measure ads. Those cookies can be used to remember your browser and to show ads based on sites you have visited.
        </p>
        <p>
          You can manage personalized ads in{" "}
          <a className={infoLinkClass} href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
            Google&apos;s ad settings
          </a>
          . How Google uses cookies in advertising is described in{" "}
          <a className={infoLinkClass} href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google&apos;s advertising technologies policy
          </a>
          .
        </p>
      </InfoSection>

      <InfoSection title="Who else receives it">
        <InfoList
          items={[
            "Supabase hosts the accounts, database, file storage, and live ride updates.",
            "sms.net.bd receives the mobile number and SMS text when a phone code is sent.",
            "Photon, OpenStreetMap Nominatim, the OpenStreetMap routing service, Project OSRM, and Esri receive the place and map data described above.",
            "Google receives the font request, and Google AdSense / DoubleClick may receive cookie and ad-measurement data when ads are shown.",
            "The other person on a ride sees what the ride screen shows: places, messages, the captain's first name and bike details, and live location. A person with the trip link sees the shared trip page.",
            "Administrators and moderators can review applications, documents, rides, and accounts as part of running SheRides.",
          ]}
        />
      </InfoSection>

      <InfoSection title="How long it is kept">
        <p>
          Account, profile, verification, and ride records are kept while the account exists and as needed to operate rides, review identity, and look into a safety question. The product does not set one automatic deletion date for all of that information. These shorter limits do apply:
        </p>
        <InfoList
          items={[
            "A phone code expires in 10 minutes, and its cookie expires with it.",
            "The phone-verified cookie lasts up to 30 days.",
            "The sign-in cookie lasts about 400 days unless you sign out or clear cookies.",
            "A trip link stops working 2 hours after the ride ends.",
          ]}
        />
        <p>
          When an administrator removes a member, the sign-in account and profile are deleted. Database rows that are set to be deleted with the profile are removed with it. Ask us if you also want verification files or ride photos deleted. There is no button for a member to delete her own account.
        </p>
      </InfoSection>

      <InfoSection title="Your choices">
        <InfoList
          items={[
            "Update your name, bio, city, motorcycle, photos, date of birth, and recovery email from your profile after your account is approved.",
            "Refuse location permission in the browser or device settings.",
            "Block or delete cookies in the browser. Blocking the sign-in cookie will sign you out.",
            "Turn off personalized ads in Google's ad settings, linked above.",
            `Email ${SHERIDES_CONTACT_EMAIL} to ask for a copy of your information, a correction, or deletion of your account.`,
          ]}
        />
      </InfoSection>

      <InfoSection title="Contact">
        <p>
          Privacy questions go to{" "}
          <a className={infoLinkClass} href={`mailto:${SHERIDES_CONTACT_EMAIL}`}>
            {SHERIDES_CONTACT_EMAIL}
          </a>
          . See the{" "}
          <Link className={infoLinkClass} href="/contact">
            contact page
          </Link>{" "}
          for the same address.
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}
