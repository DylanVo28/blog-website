import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Email không hợp lệ.");

export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự.");

export const strongPasswordSchema = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự.")
  .max(50, "Mật khẩu tối đa 50 ký tự.")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]+$/,
    "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (co the dung dau cham).",
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Tên hiển thị tối thiểu 2 ký tự.")
  .max(100, "Tên hiển thị tối đa 100 ký tự.");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username tối thiểu 3 ký tự.")
  .max(30, "Username tối đa 30 ký tự.")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.",
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const emailVerificationSchema = z.object({
  email: emailSchema,
});

export const otpVerificationSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, "Mã OTP phải có đúng 6 chữ số.")
    .regex(/^\d{6}$/, "Mã OTP chỉ gồm chữ số."),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema.transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Token không được để trống."),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().trim().min(1, "Vui lòng xác nhận mật khẩu."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export const registerSchema = z.object({
  password: strongPasswordSchema,
  displayName: displayNameSchema,
  username: usernameSchema,
});

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Nội dung bình luận không được để trống.")
    .max(1_000, "Bình luận quá dài."),
});

export const questionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, "Câu hỏi nên có ít nhất 10 ký tự.")
    .max(1_500, "Câu hỏi quá dài."),
});

export const moneyAmountSchema = z
  .coerce
  .number()
  .refine((value) => Number.isFinite(value), {
    message: "Số tiền không hợp lệ.",
  })
  .positive("Số tiền phải lớn hơn 0.");

const optionalTrimmedString = (max: number, message: string) =>
  z.string().trim().max(max, message);

export const profileSettingsSchema = z
  .object({
    displayName: displayNameSchema,
    username: usernameSchema,
    bio: optionalTrimmedString(1000, "Bio tối đa 1000 ký tự."),
    bankName: optionalTrimmedString(120, "Tên ngân hàng tối đa 120 ký tự."),
    bankAccount: optionalTrimmedString(50, "Số tài khoản tối đa 50 ký tự."),
    bankHolder: optionalTrimmedString(120, "Tên chủ tài khoản tối đa 120 ký tự."),
  })
  .refine(
    (value) => {
      const bankValues = [value.bankName, value.bankAccount, value.bankHolder].filter(
        (item) => item.length > 0,
      );

      return bankValues.length === 0 || bankValues.length === 3;
    },
    {
      message: "Nếu lưu thông tin ngân hàng, vui lòng nhập đủ tên ngân hàng, số tài khoản và chủ tài khoản.",
      path: ["bankName"],
    },
  );
