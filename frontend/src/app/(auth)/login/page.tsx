import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      badge="Đăng nhập"
      title="Quay lại để tiếp tục viết, đọc và đặt câu hỏi."
      description="Bạn có thể đăng nhập bằng email/mật khẩu hoặc dùng Google, GitHub để tạo phiên nhanh với cùng hệ thống JWT + refresh token."
      helperTitle="JWT flow + social login"
      helperDescription="Backend sẽ xử lý OAuth callback, auto-link theo email nếu phù hợp và trả bạn về đúng route đang cần truy cập."
      footer={
        <p>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Tạo tài khoản mới
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
