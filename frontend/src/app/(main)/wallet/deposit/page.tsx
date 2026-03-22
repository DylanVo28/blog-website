import { AuthGuard } from "@/components/auth/AuthGuard";
import { DepositForm } from "@/components/wallet/DepositForm";

export default function DepositPage() {
  return (
    <AuthGuard>
      <DepositForm />
    </AuthGuard>
  );
}
