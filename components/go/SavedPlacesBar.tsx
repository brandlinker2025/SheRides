"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { GoPlace } from "@/lib/go";
import { loadSavedPlaces, type SavedPlace } from "@/lib/saved-places";

const SLOT_ICON = { home: "home", work: "work", other: "bookmark" } as const;

export function SavedPlacesBar({ onPick }: { onPick: (place: GoPlace) => void }) {
  const [places, setPlaces] = useState<SavedPlace[]>([]);

  useEffect(() => {
    void loadSavedPlaces().then(setPlaces);
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {places.map((place) => (
        <button
          key={place.id}
          type="button"
          onClick={() => onPick({ label: place.label, lat: place.lat, lng: place.lng })}
          className="btn btn-ghost h-9 min-h-9 shrink-0 px-3 text-xs"
        >
          <Icon name={SLOT_ICON[place.slot]} size={16} />
          <span className="max-w-[9rem] truncate">{place.slot === "other" ? place.label : place.slot === "home" ? "Home" : "Work"}</span>
        </button>
      ))}
      <Link href="/places" className="btn btn-ghost h-9 min-h-9 shrink-0 px-3 text-xs">
        <Icon name="add_location_alt" size={16} />
        {places.length ? "Edit places" : "Save home & work"}
      </Link>
    </div>
  );
}
