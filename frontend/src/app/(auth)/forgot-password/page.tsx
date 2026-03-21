import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function ForgotPasswordPage() {
  return (
    <PagePlaceholder
      phase="Phase 2"
      title="Khôi phục mật khẩu sẽ được mở ở phase 2."
      description="Route này đã sẵn để middleware và flow auth không bị gãy khi mình nối API sau."
    />
  );
}
