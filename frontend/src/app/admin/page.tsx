import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function AdminPage() {
  return (
    <PagePlaceholder
      phase="Phase 8"
      title="Admin dashboard sẽ được hoàn thiện ở phase admin."
      description="Hiện route này đã có middleware gate theo cookie role để chuẩn bị cho panel quản trị."
    />
  );
}
