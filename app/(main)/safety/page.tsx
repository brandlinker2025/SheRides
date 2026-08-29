"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export default function SafetyPage() {
  const [toast, setToast] = useState<string | null>(null);
  const ping = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const tiles = [
    { icon: "share_location", title: "Share My Ride", body: "Broadcast your live route and estimated arrival time to trusted friends or family." },
    { icon: "contacts", title: "Emergency Contacts", body: "Manage the priority list of people to notify in case of an incident during your ride." },
    { icon: "car_repair", title: "Roadside Help", body: "Request immediate mechanical assistance or a tow from verified partners nearby." },
    { icon: "flag", title: "Report User", body: "Anonymously report inappropriate behavior to maintain our premium community standards.", danger: true },
    { icon: "block", title: "Block User", body: "Prevent specific members from viewing your profile, routes, or contacting you.", danger: true },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-container-margin-mobile lg:px-container-margin-desktop py-12">
      <div className="mb-12">
        <h1 className="font-headline-xl text-headline-xl text-on-background mb-2">Safety Center</h1>
        <p className="font-body-lg text-secondary max-w-2xl">
          Your well-being is our priority. Access immediate assistance, manage your ride visibility, and control your community experience with these essential tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          type="button"
          onClick={() => ping("SOS alert sent to your emergency contacts.")}
          className="col-span-1 md:col-span-2 lg:col-span-1 bg-accent-magenta text-on-primary rounded-xl p-8 flex flex-col items-center justify-center gap-4 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          <Icon name="emergency" filled className="text-[64px] drop-shadow-md" />
          <div className="text-center">
            <h3 className="font-headline-md text-headline-md font-bold mb-1">SOS Alert</h3>
            <p className="font-body-sm opacity-90">
              Send immediate distress signal with live location to emergency contacts and authorities.
            </p>
          </div>
        </button>

        {tiles.map((tile) => (
          <button
            key={tile.title}
            type="button"
            onClick={() => ping(`${tile.title} opened.`)}
            className="bg-surface-container-lowest text-on-background rounded-xl p-6 flex flex-col items-start gap-4 shadow-premium border border-surface-border hover:-translate-y-1 hover:shadow-premium-hover transition-all duration-300 group text-left"
          >
            <div
              className={`w-12 h-12 rounded-full bg-soft-off-white flex items-center justify-center ${
                tile.danger
                  ? "text-secondary group-hover:text-error"
                  : "text-accent-magenta group-hover:bg-accent-magenta group-hover:text-on-primary"
              } transition-colors`}
            >
              <Icon name={tile.icon} filled />
            </div>
            <div>
              <h3 className="font-label-lg text-label-lg mb-1">{tile.title}</h3>
              <p className="font-body-sm text-secondary">{tile.body}</p>
            </div>
          </button>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 bg-deep-charcoal text-white font-label-lg px-5 py-3 rounded-full shadow-premium z-[60]">
          {toast}
        </div>
      )}
    </div>
  );
}
