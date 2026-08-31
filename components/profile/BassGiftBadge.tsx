import { BASS_GIFT_FOLLOWERS } from "@/lib/social";
import { Icon } from "../ui/Icon";

export function BassGiftBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-accent-magenta text-deep-charcoal font-label-caps shadow-magenta animate-badge-pop ${
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-label-caps"
      }`}
    >
      <Icon name="redeem" filled size={compact ? 14 : 16} />
      Bass Gift
      {!compact ? <span className="opacity-80">· {BASS_GIFT_FOLLOWERS.toLocaleString()} followers</span> : null}
    </span>
  );
}
