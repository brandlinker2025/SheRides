import { initialsFromName } from "@/lib/profile";

type AvatarProps = {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  initials?: string;
};

export function Avatar({ src, alt = "", size = 40, className = "", initials }: AvatarProps) {
  const label = initials || initialsFromName(alt);
  if (!src) {
    return (
      <div
        className={`rounded-full bg-accent-magenta/15 text-accent-magenta flex items-center justify-center font-label-lg overflow-hidden ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(12, size * 0.36) }}
        aria-label={alt}
      >
        {label}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover bg-soft-off-white ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
