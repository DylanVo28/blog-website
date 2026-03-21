import { AuthGuard } from "@/components/auth/AuthGuard";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function WalletPage() {
  return (
    <AuthGuard>
      <PagePlaceholder
        phase="Phase 5"
        title="Khu vực ví sẽ được mở rộng ở phase wallet."
        description="Middleware, auth guard và wallet bootstrap đã sẵn, nên lúc nối lịch sử giao dịch và nạp/rút chỉ cần gắn API thật."
      />
    </AuthGuard>
  );
}
