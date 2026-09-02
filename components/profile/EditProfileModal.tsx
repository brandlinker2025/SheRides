"use client";

import { useEffect, useState } from "react";
import { bangladeshCities } from "@/lib/data";
import { bikeBrandNames } from "@/lib/bikes";
import { dobInputBounds } from "@/lib/birthday";
import { createClient } from "@/lib/supabase/client";
import { uploadPublicImage } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

export function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [brand, setBrand] = useState(user?.bikeBrand ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? "");
  const [coverUrl, setCoverUrl] = useState(user?.cover ?? "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user) return;
    void supabase
      .from("member_birthdays")
      .select("date_of_birth")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const value = data?.date_of_birth ? String(data.date_of_birth).slice(0, 10) : "";
        if (value) setDateOfBirth(value);
      });
  }, [user]);

  if (!user) return null;
  const rider = user;

  async function upload(kind: "avatar" | "cover", file: File) {
    const supabase = createClient();
    if (!supabase) return;
    setError(null);
    setProgress(kind === "avatar" ? "Uploading photo..." : "Uploading cover...");
    try {
      const url = await uploadPublicImage(supabase, "avatars", rider.id, file, (n) => {
        setProgress(`${kind === "avatar" ? "Photo" : "Cover"} ${n}%`);
      });
      if (kind === "avatar") setAvatarUrl(url);
      else setCoverUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-deep-charcoal/40 backdrop-blur-sm p-0 sm:p-6 animate-fade-in">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <form
        className="relative w-full max-w-lg bg-surface-container-lowest rounded-t-xl sm:rounded-xl shadow-premium-hover p-6 max-h-[90vh] overflow-y-auto animate-scale-in"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const message = await updateProfile({
            fullName,
            bio,
            location,
            bikeBrand: brand,
            bikeModel: "",
            avatarUrl,
            coverUrl,
            ...(dateOfBirth ? { dateOfBirth } : {}),
          });
          setBusy(false);
          if (message) setError(message);
          else onClose();
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-headline-md">Edit profile</h2>
          <button type="button" onClick={onClose} className="text-secondary"><Icon name="close" /></button>
        </div>
        <label className="block relative mb-6">
          <div className="h-28 rounded-xl overflow-hidden bg-soft-off-white">
            {coverUrl ? <img src={coverUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-r from-accent-magenta/20 to-soft-off-white" />}
          </div>
          <span className="absolute bottom-2 right-2 bg-white/90 px-3 py-1 rounded-full font-label-lg text-label-lg">Change cover</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && void upload("cover", e.target.files[0])} />
        </label>
        <label className="flex items-center gap-4 mb-6 cursor-pointer">
          <Avatar src={avatarUrl} alt={fullName} size={72} />
          <span className="font-label-lg text-accent-magenta">Upload profile picture</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && void upload("avatar", e.target.files[0])} />
        </label>
        <div className="flex flex-col gap-3">
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300" />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" rows={3} className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300" />
          <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3">
            <option value="">Location</option>
            {bangladeshCities.map((city) => <option key={city}>{city}</option>)}
          </select>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta">
            <option value="">Bike brand</option>
            {bikeBrandNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <label className="block">
            <span className="mb-1.5 block font-label-lg text-secondary">{user?.hasBirthday ? "Date of birth" : "Add your birthday"}</span>
            <input type="date" value={dateOfBirth} min={dobInputBounds().min} max={dobInputBounds().max} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300" />
          </label>
        </div>
        {progress && <p className="mt-3 font-body-sm text-accent-magenta">{progress}</p>}
        {error && <p className="mt-3 font-body-sm text-error">{error}</p>}
        <button type="submit" disabled={busy} className="mt-6 w-full h-12 bg-accent-magenta text-white rounded-lg font-label-lg transition-all duration-200 hover:shadow-magenta hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:pointer-events-none">{busy ? "Saving..." : "Save profile"}</button>
      </form>
    </div>
  );
}
