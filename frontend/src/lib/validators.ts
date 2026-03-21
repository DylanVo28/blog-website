import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Email không hợp lệ.");

export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự.");

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

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  username: usernameSchema.optional(),
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
