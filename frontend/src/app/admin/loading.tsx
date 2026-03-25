import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-[2rem]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-40 rounded-[1.75rem]" />
        <Skeleton className="h-40 rounded-[1.75rem]" />
        <Skeleton className="h-40 rounded-[1.75rem]" />
        <Skeleton className="h-40 rounded-[1.75rem]" />
      </div>
      <Skeleton className="h-[560px] w-full rounded-[1.75rem]" />
    </div>
  );
}
