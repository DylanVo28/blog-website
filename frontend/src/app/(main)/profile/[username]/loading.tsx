import { Skeleton } from "@/components/ui/skeleton";

export default function PublicProfileLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-72 w-full rounded-[2rem]" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-[1.75rem]" />
        <Skeleton className="h-32 rounded-[1.75rem]" />
        <Skeleton className="h-32 rounded-[1.75rem]" />
      </div>
      <Skeleton className="h-56 w-full rounded-[1.75rem]" />
      <Skeleton className="h-56 w-full rounded-[1.75rem]" />
    </div>
  );
}
