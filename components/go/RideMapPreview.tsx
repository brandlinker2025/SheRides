"use client";

import { RideDeck } from "./BookRide";

const PICKUP = { label: "Gulshan 2, Dhaka", lat: 23.7946, lng: 90.415 };
const DROP = { label: "Dhanmondi 27, Dhaka", lat: 23.7556, lng: 90.376 };

/** Signed-out surface used to check that the ride map draws. Hidden unless MAP_PREVIEW=1. */
export function RideMapPreview() {
  return (
    <div className="min-h-dvh bg-[#1B1324] text-[#F0EBF6]">
      <RideDeck
        className="relative flex h-dvh w-full flex-col bg-[#131318] text-[#e4e1e9] lg:grid lg:h-dvh lg:grid-cols-[minmax(320px,420px)_1fr]"
        initialPickup={PICKUP}
        initialDrop={DROP}
      >
        <header className="mb-3 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FFB804]">Sanctuary</p>
            <h1 className="text-2xl font-bold leading-tight">Book A Ride</h1>
            <p className="text-sm text-white/70">Women riders only · Dhaka</p>
          </div>
        </header>
      </RideDeck>
    </div>
  );
}
