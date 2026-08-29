import { Icon } from "./Icon";

const VARIANT_ICON = {
  feed: "two_wheeler",
  messages: "chat_bubble",
  notifications: "notifications",
  saved: "bookmark",
  groups: "diversity_3",
  events: "event",
  rides: "route",
  search: "search",
  generic: "two_wheeler",
} as const;

export type EmptyStateVariant = keyof typeof VARIANT_ICON;

export function EmptyState({
  title,
  body,
  action,
  variant = "generic",
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  variant?: EmptyStateVariant;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-premium border border-surface-border p-10 text-center animate-fade-in-up">
      <div className="relative mx-auto mb-6 w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-accent-magenta/10" />
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-accent-magenta/30 animate-[ring-spin_18s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full bg-accent-magenta/15 flex items-center justify-center text-accent-magenta">
          <Icon name={VARIANT_ICON[variant]} size={32} />
        </div>
        <span className="absolute -top-1 right-2 w-2.5 h-2.5 rounded-full bg-primary-fixed-dim" />
        <span className="absolute bottom-0 -left-1 w-2 h-2 rounded-full bg-accent-magenta/60" />
      </div>
      <p className="font-headline-md text-headline-md mb-2 text-on-surface">{title}</p>
      {body && <p className="font-body-sm text-secondary max-w-md mx-auto">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
