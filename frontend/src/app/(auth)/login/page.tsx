import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      badge="Đăng nhập"
      title="Quay lại để tiếp tục viết, đọc và đặt câu hỏi."
      description="Đăng nhập sẽ khôi phục phiên người dùng, bootstrap số dư ví và mở khóa các route đã được bảo vệ ở phase 1."
      helperTitle="Nền auth đã sẵn sàng cho phase sau"
      helperDescription="Form này dùng thật với backend hiện tại và redirect về route gốc bạn vừa định truy cập."
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
