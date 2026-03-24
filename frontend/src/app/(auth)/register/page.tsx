import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      badge="Đăng ký"
      title="Xác thực email trước, rồi tạo tài khoản trong một flow liền mạch."
      description="Trang đăng ký giờ đi theo 3 bước: gửi OTP vào email, xác thực mã, rồi mới hoàn tất hồ sơ và tự đăng nhập."
      helperTitle="Bảo vệ ngay từ bước đầu"
      helperDescription="OTP giúp chặn account ảo trước khi ghi user vào database, đồng thời backend chỉ cho phép register khi kèm verification token còn hạn."
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
