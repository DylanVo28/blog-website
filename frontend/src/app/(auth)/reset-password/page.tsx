import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

function ResetPasswordFallback() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center rounded-[1.75rem] border border-border/70 bg-card/80">
      <Loader2 className="size-7 animate-spin text-primary" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
