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
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.",
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
  .regex(/^[a-zA-Z0-9._-]+$/, "Username chỉ gồm chữ, số, dấu chấm hoặc gạch dưới.");

export const optionalUsernameSchema = z
  .union([usernameSchema, z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
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
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  username: optionalUsernameSchema,
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
