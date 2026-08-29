"use client";

import { useState } from "react";
import Link from "next/link";
import { img } from "@/lib/images";
import { Icon } from "@/components/ui/Icon";

const applicants = [
  { id: "a1", name: "Sarah Jenkins", type: "ID & License Review", time: "2h ago", priority: true, location: "Dhaka", avatar: img.avatarSarah },
  { id: "a2", name: "Elena Rodriguez", type: "NID Review", time: "5h ago", location: "Chattogram", avatar: img.avatarElena },
  { id: "a3", name: "Amanda Chen", type: "License Review", time: "1d ago", location: "Sylhet", avatar: img.avatarAmanda },
];

export default function AdminVerificationsPage() {
  const [active, setActive] = useState(applicants[0].id);
  const [status, setStatus] = useState("Pending Review");
  const current = applicants.find((a) => a.id === active)!;

  return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-gutter py-base bg-deep-charcoal md:hidden">
          <span className="font-display-lg-mobile font-bold text-accent-magenta">SheRides</span>
        </header>
        <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-section-gap w-64 bg-deep-charcoal shadow-xl z-50">
          <div className="px-base mb-section-gap">
            <Link href="/home" className="font-display-lg text-display-lg text-accent-magenta font-bold">SheRides</Link>
            <div className="text-on-primary opacity-70 font-label-caps text-label-caps mt-2">SheRides Admin</div>
          </div>
          <div className="flex-1 flex flex-col gap-2 px-4">
            {[
              ["dashboard", "Dashboard", "/home"],
              ["verified_user", "Verifications", "/admin/verifications"],
              ["group", "Users", "/groups"],
              ["report", "Reports", "/safety"],
            ].map(([icon, label, href]) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-4 p-3 rounded-lg font-label-lg ${
                  label === "Verifications"
                    ? "text-accent-magenta font-bold border-r-4 border-accent-magenta bg-white/5"
                    : "text-on-primary opacity-70 hover:bg-white/10"
                }`}
              >
                <Icon name={icon} /> {label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="flex-1 mt-16 md:mt-0 md:ml-64 p-container-margin-mobile md:p-container-margin-desktop">
          <div className="mb-section-gap">
            <h1 className="font-headline-xl text-headline-xl mb-2">Verification Center</h1>
            <p className="font-body-lg text-secondary">Review and approve pending rider verifications to ensure community safety.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <div className="lg:col-span-4 flex flex-col gap-component-gap">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-headline-md text-headline-md">Pending ({applicants.length})</h2>
                <Icon name="filter_list" className="text-secondary" />
              </div>
              {applicants.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setActive(a.id);
                    setStatus("Pending Review");
                  }}
                  className={`bg-white rounded-xl p-4 shadow-premium text-left border ${
                    a.id === active ? "border-accent-magenta/30" : "border-surface-border opacity-70 hover:opacity-100"
                  }`}
                >
                  {a.id === active && <div className="absolute" />}
                  <div className="flex items-center gap-4">
                    <img src={a.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1">
                      <h3 className="font-label-lg">{a.name}</h3>
                      <p className="font-body-sm text-secondary">{a.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-label-caps text-secondary block">{a.time}</span>
                      {a.priority && (
                        <span className="inline-block bg-error-container text-on-error-container font-label-caps text-[10px] px-2 py-1 rounded-full mt-1">
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="lg:col-span-8">
              <div className="bg-white rounded-xl shadow-premium border border-surface-border p-gutter min-h-[600px] flex flex-col">
                <div className="flex items-center justify-between border-b border-surface-border pb-6 mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <img src={current.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
                    <div>
                      <h2 className="font-headline-xl text-headline-xl">{current.name}</h2>
                      <p className="font-body-sm text-secondary mt-2 flex items-center gap-1">
                        <Icon name="location_on" size={16} /> {current.location}
                      </p>
                    </div>
                  </div>
                  <div className="bg-soft-off-white px-4 py-2 rounded-lg border border-surface-variant text-center">
                    <span className="block font-label-caps text-secondary mb-1">Status</span>
                    <span className="font-label-lg flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-accent-magenta" /> {status}
                    </span>
                  </div>
                </div>
                <div className="relative bg-soft-off-white rounded-xl border border-surface-border flex-1 flex items-center justify-center min-h-[300px] overflow-hidden">
                  <img src={img.license} alt="Document" className="max-h-[400px] object-contain rounded-md" />
                </div>
                <div className="flex items-start gap-3 bg-primary-fixed/20 p-4 rounded-lg border border-primary-fixed-dim mt-4">
                  <Icon name="info" className="text-primary mt-0.5" />
                  <p className="font-body-sm">Automated scan found no anomalies. Name matches profile. Face comparison score: 92%.</p>
                </div>
                <div className="mt-8 pt-6 border-t border-surface-border flex justify-between items-center flex-wrap gap-3">
                  <button type="button" className="px-6 py-3 border border-outline rounded-lg font-label-lg">
                    Request More Info
                  </button>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStatus("Rejected")}
                      className="px-6 py-3 bg-soft-off-white border border-error/50 text-error rounded-lg font-label-lg"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("Approved")}
                      className="px-8 py-3 bg-accent-magenta text-white rounded-lg font-label-lg"
                    >
                      Approve Verification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}
