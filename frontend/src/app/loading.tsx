import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <LoadingSpinner label="Đang tải giao diện..." />
    </main>
  );
}
