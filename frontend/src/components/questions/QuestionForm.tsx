"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { getApiErrorMessage } from "@/lib/api";
import { QUESTION_FEE } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { InsufficientBalance } from "@/components/wallet/InsufficientBalance";
import { PaymentConfirmDialog } from "@/components/questions/PaymentConfirmDialog";
import { QuestionTargetSelect } from "@/components/questions/QuestionTargetSelect";
import { questionsApi } from "@/services/api/questions.api";
import { useAuthStore } from "@/stores/authStore";
import { useWalletStore } from "@/stores/walletStore";
import type { QuestionPostRef, QuestionPrefill } from "@/types/question.types";

const questionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, "Câu hỏi cần ít nhất 10 ký tự.")
    .max(2000, "Câu hỏi tối đa 2000 ký tự."),
  target: z.enum(["author", "ai"]),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  post: QuestionPostRef;
  prefill?: QuestionPrefill | null;
}

export function QuestionForm({ post, prefill }: QuestionFormProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const balance = useWalletStore((state) => state.balance);
  const deduct = useWalletStore((state) => state.deduct);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      content: "",
      target: "author",
    },
  });
  const selectedTarget = useWatch({
    control: form.control,
    name: "target",
  });

  useEffect(() => {
    if (!prefill) {
      return;
    }

    form.setValue("content", prefill.content, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("target", prefill.target, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, prefill]);

  const createMutation = useMutation({
    mutationFn: (values: QuestionFormValues) =>
      questionsApi.create(
        {
          postId: post.id,
          content: values.content.trim(),
          target: values.target,
          fee: QUESTION_FEE,
        },
        post,
      ),
    onSuccess: (createdQuestion) => {
      deduct(createdQuestion.fee);
      void queryClient.invalidateQueries({ queryKey: ["questions", post.id] });
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      form.reset({
        content: "",
        target: "author",
      });
      toast.success(
        createdQuestion.target === "ai"
          ? "Đã gửi câu hỏi cho AI. Hệ thống sẽ cập nhật câu trả lời sớm nhất."
          : "Đã gửi câu hỏi đến tác giả.",
      );
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể gửi câu hỏi."));
    },
  });

  function handleAttemptSubmit() {
    if (!isAuthenticated) {
      return;
    }

    if (balance < QUESTION_FEE) {
      setShowInsufficientBalance(true);
      return;
    }

    setShowConfirm(true);
  }

  return (
    <>
      <div className="rounded-[1.8rem] border border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,250,236,0.96),rgba(255,245,214,0.92))] p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
            Premium Question
          </span>
          <span className="rounded-full border border-amber-300/70 bg-white/80 px-3 py-1 text-sm font-semibold text-amber-800">
            {formatCurrency(QUESTION_FEE)}
          </span>
        </div>

        <h3 className="mt-4 font-serif text-3xl font-medium tracking-tight text-balance">
          Đặt câu hỏi nổi bật cho bài viết này
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-950/80">
          Bạn có thể hỏi tác giả hoặc nhờ AI giải thích ngay trong ngữ cảnh bài viết.
          Nếu câu hỏi cho tác giả quá hạn 48 giờ, backend sẽ hoàn tiền tự động.
        </p>

        {isAuthenticated ? (
          <form
            className="mt-5 space-y-4"
            onSubmit={form.handleSubmit(handleAttemptSubmit)}
          >
            <QuestionTargetSelect
              value={selectedTarget}
              onChange={(value) => {
                form.setValue("target", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />

            <Textarea
              rows={5}
              placeholder="Ví dụ: Giải thích giúp mình luận điểm chính trong đoạn 3 và cách áp dụng nó vào thực tế."
              {...form.register("content")}
            />
            {form.formState.errors.content ? (
              <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-amber-950/75">
                Số dư hiện tại: <span className="font-semibold">{formatCurrency(balance)}</span>
              </p>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? "Đang gửi..."
                  : `Gửi câu hỏi (${formatCurrency(QUESTION_FEE)})`}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-5 rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
            <p className="text-sm text-muted-foreground">
              Đăng nhập để đặt câu hỏi trả phí và theo dõi trạng thái trả lời.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Đăng nhập để hỏi</Link>
            </Button>
          </div>
        )}
      </div>

      <PaymentConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          void createMutation.mutateAsync(form.getValues());
        }}
        amount={QUESTION_FEE}
        target={selectedTarget}
        isLoading={createMutation.isPending}
      />

      <InsufficientBalance
        open={showInsufficientBalance}
        onClose={() => setShowInsufficientBalance(false)}
        requiredAmount={QUESTION_FEE}
        currentBalance={balance}
      />
    </>
  );
}
