import { Skeleton } from "../ui/Skeleton";

export function FeedPostSkeleton() {
  return (
    <div className="card-surface p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 items-center">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="w-full aspect-[16/9] mb-4" />
      <div className="flex gap-6 border-t border-surface-border pt-4">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
      </div>
    </div>
  );
}
