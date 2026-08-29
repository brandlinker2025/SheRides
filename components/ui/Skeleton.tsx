export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton animate-shimmer ${className}`} />;
}
