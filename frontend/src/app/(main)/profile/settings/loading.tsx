import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-[2rem]" />
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="h-[420px] rounded-[1.75rem]" />
        <div className="space-y-6">
          <Skeleton className="h-[260px] rounded-[1.75rem]" />
          <Skeleton className="h-[220px] rounded-[1.75rem]" />
          <Skeleton className="h-28 rounded-[1.75rem]" />
        </div>
      </div>
    </div>
  );
}
