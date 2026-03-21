import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      badge="Đăng ký"
      title="Tạo một hồ sơ mới để bắt đầu hệ sinh thái blog trả phí."
      description="Sau khi đăng ký thành công, frontend sẽ tự tạo phiên đăng nhập và kéo số dư ví mặc định từ backend."
      helperTitle="Một form, nhiều nền móng"
      helperDescription="Register page này đang bám theo backend thật: email, display name và password. Username public sẽ nối tiếp khi backend bổ sung schema."
      footer={
        <p>
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
