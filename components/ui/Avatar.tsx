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
  const fillParent = /(?:^|\s)!?(?:w|h)-full(?:\s|$)/.test(className);
  const dimStyle = fillParent ? undefined : { width: size, height: size };
  if (!src) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-[#ff4d8d] via-accent-magenta to-[#9c27b0] text-white flex items-center justify-center font-bold tracking-wide overflow-hidden shadow-inner ${className}`}
        style={{ ...dimStyle, fontSize: Math.max(12, size * 0.36) }}
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
      style={dimStyle}
    />
  );
}
