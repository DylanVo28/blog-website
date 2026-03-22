"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { questionsApi } from "@/services/api/questions.api";

interface AuthorAnswerFormProps {
  questionId: string;
  postId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function AuthorAnswerForm({
  questionId,
  postId,
  onCancel,
  onSuccess,
}: AuthorAnswerFormProps) {
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState("");

  const answerMutation = useMutation({
    mutationFn: () => questionsApi.answer(questionId, answer.trim()),
    onSuccess: () => {
      toast.success("Đã gửi câu trả lời.");
      void queryClient.invalidateQueries({ queryKey: ["questions", postId] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể gửi câu trả lời."));
    },
  });

  return (
    <div className="space-y-3 rounded-[1.35rem] border border-border/70 bg-white/80 p-4">
      <Textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        rows={4}
        placeholder="Viết câu trả lời của bạn..."
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Hủy
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={answerMutation.isPending}
          onClick={() => {
            if (answer.trim().length < 2) {
              toast.error("Câu trả lời cần ít nhất 2 ký tự.");
              return;
            }

            void answerMutation.mutateAsync();
          }}
        >
          {answerMutation.isPending ? "Đang gửi..." : "Gửi câu trả lời"}
        </Button>
      </div>
    </div>
  );
}
