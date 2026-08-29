import { Icon } from "../ui/Icon";
import type { Rider } from "@/lib/types";

export function RoleBadge({ rider }: { rider: Pick<Rider, "role" | "verified"> }) {
  if (rider.role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-magenta/10 text-accent-magenta font-label-caps text-label-caps">
        <Icon name="shield" filled size={16} /> Community Admin
      </span>
    );
  }
  if (rider.verified) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-label-caps text-label-caps">
        <Icon name="verified" filled size={16} /> Verified Rider
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-tertiary font-label-caps text-label-caps">
      Rider
    </span>
  );
}
