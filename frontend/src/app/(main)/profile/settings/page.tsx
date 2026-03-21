import { AuthGuard } from "@/components/auth/AuthGuard";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function ProfileSettingsPage() {
  return (
    <AuthGuard>
      <PagePlaceholder
        phase="Phase 8"
        title="Cài đặt hồ sơ sẽ đến ở phase profile."
        description="Route đã được bảo vệ bởi proxy và auth guard để auth flow và điều hướng được kiểm tra sớm."
      />
    </AuthGuard>
  );
}
