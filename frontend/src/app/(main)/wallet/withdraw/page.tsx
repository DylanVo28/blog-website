import { AuthGuard } from "@/components/auth/AuthGuard";
import { WithdrawForm } from "@/components/wallet/WithdrawForm";

export default function WithdrawPage() {
  return (
    <AuthGuard>
      <WithdrawForm />
    </AuthGuard>
  );
}
