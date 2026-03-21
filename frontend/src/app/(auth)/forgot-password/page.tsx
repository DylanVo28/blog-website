import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      badge="Khôi phục"
      title="Lấy lại quyền truy cập mà không phải tạo tài khoản mới."
      description="Trang này gọi trực tiếp endpoint quên mật khẩu từ backend. Khi chạy local, bạn sẽ thấy reset token trả về để kiểm thử nhanh."
      helperTitle="Auth flow đang đi đúng hướng"
      helperDescription="Forgot password đã được nối API thật, nên phase reset password hoặc email service có thể cắm tiếp mà không đụng lại layout."
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
