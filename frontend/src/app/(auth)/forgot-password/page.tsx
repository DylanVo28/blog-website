import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      badge="Khôi phục"
      title="Lấy lại quyền truy cập bằng link khôi phục gửi đến email của bạn."
      description="Mình sẽ gọi trực tiếp forgot-password flow ở backend, áp dụng rate limit và tạo token reset riêng cho từng yêu cầu."
      helperTitle="Forgot + Reset đã nối liền mạch"
      helperDescription="Sau bước này, người dùng có thể đi thẳng sang trang reset-password với token đã được backend verify trước khi đổi mật khẩu."
      footer={
        <p>
          Nhớ lại mật khẩu rồi?{" "}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
