import { Icon } from "./Icon";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-premium border border-surface-border p-10 text-center">
      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-accent-magenta/10 text-accent-magenta flex items-center justify-center">
        <Icon name="two_wheeler" size={32} />
      </div>
      <p className="font-headline-md text-headline-md mb-2">{title}</p>
      {body && <p className="font-body-sm text-secondary max-w-md mx-auto">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
