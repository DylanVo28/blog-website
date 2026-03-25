import { AuthGuard } from "@/components/auth/AuthGuard";
import { EditProfileForm } from "@/components/profile/EditProfileForm";

export default function ProfileSettingsPage() {
  return (
    <AuthGuard>
      <EditProfileForm />
    </AuthGuard>
  );
}
