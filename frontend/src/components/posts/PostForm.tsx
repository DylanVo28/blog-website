"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getApiErrorMessage } from "@/lib/api";
import { buildExcerpt } from "@/lib/posts";
import { EMPTY_EDITOR_CONTENT } from "@/lib/tiptap";
import { PostEditor } from "@/components/posts/PostEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { postsApi } from "@/services/api/posts.api";
import type { CreatePostPayload, Post, UpdatePostPayload } from "@/types/post.types";

const optionalUuidField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || /^[0-9a-fA-F-]{36}$/.test(value), {
    message: "Giá trị phải là UUID hợp lệ hoặc để trống.",
  });

const postFormSchema = z.object({
  title: z.string().trim().min(8, "Tiêu đề nên có ít nhất 8 ký tự.").max(500),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  excerpt: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  categoryId: optionalUuidField,
  tagIdsText: z.string().trim().optional().default(""),
});

type PostFormValues = z.input<typeof postFormSchema>;

interface PostFormProps {
  mode: "create" | "edit";
  post?: Post;
}

function parseTagIds(tagIdsText?: string) {
  if (!tagIdsText?.trim()) {
    return undefined;
  }

  return tagIdsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PostForm({ mode, post }: PostFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editorContent, setEditorContent] = useState<Record<string, unknown>>(
    post?.content ?? EMPTY_EDITOR_CONTENT,
  );
  const [editorText, setEditorText] = useState(post?.contentPlain ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(post?.coverImageUrl ?? null);
  const coverObjectUrlRef = useRef<string | null>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      categoryId: post?.categoryId ?? "",
      tagIdsText: post?.tags.map((tag) => tag.id).join(", ") ?? "",
    },
  });

  useEffect(() => {
    return () => {
      if (coverObjectUrlRef.current) {
        URL.revokeObjectURL(coverObjectUrlRef.current);
      }
    };
  }, []);

  function handleCoverChange(file: File | null) {
    if (coverObjectUrlRef.current) {
      URL.revokeObjectURL(coverObjectUrlRef.current);
      coverObjectUrlRef.current = null;
    }

    setCoverFile(file);

    if (!file) {
      setCoverPreview(post?.coverImageUrl ?? null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    coverObjectUrlRef.current = previewUrl;
    setCoverPreview(previewUrl);
  }

  async function handleMutation(
    values: PostFormValues,
    status: "draft" | "published",
  ) {
    if (!editorText.trim()) {
      toast.error("Nội dung bài viết không được để trống.");
      return;
    }

    const payload: CreatePostPayload | UpdatePostPayload = {
      title: values.title.trim(),
      slug: values.slug,
      excerpt: values.excerpt || buildExcerpt(editorText),
      categoryId: values.categoryId,
      tagIds: parseTagIds(values.tagIdsText),
      content: editorContent,
      contentPlain: editorText,
      coverImage: coverFile,
      coverImageUrl: post?.coverImageUrl,
      status,
    };

    if (mode === "edit" && post) {
      return updateMutation.mutateAsync(payload);
    }

    return createMutation.mutateAsync(payload as CreatePostPayload);
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreatePostPayload) => postsApi.create(payload),
    onSuccess: (createdPost) => {
      toast.success("Đã tạo bài viết thành công.");
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      startTransition(() => {
        router.push(
          createdPost.status === "published"
            ? `/posts/${createdPost.slug}`
            : "/dashboard/posts?status=draft",
        );
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể tạo bài viết."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePostPayload) => {
      if (!post) {
        throw new Error("Không tìm thấy bài viết để cập nhật.");
      }

      return postsApi.update(post.id, payload);
    },
    onSuccess: (updatedPost) => {
      toast.success("Đã cập nhật bài viết.");
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      startTransition(() => {
        router.push(
          updatedPost.status === "published"
            ? `/posts/${updatedPost.slug}`
            : "/dashboard/posts?status=draft",
        );
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật bài viết."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!post) {
        throw new Error("Không tìm thấy bài viết để lưu trữ.");
      }

      return postsApi.remove(post.id);
    },
    onSuccess: () => {
      toast.success("Đã lưu trữ bài viết.");
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      startTransition(() => {
        router.push("/dashboard/posts");
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể lưu trữ bài viết."));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              {mode === "create" ? "Viết một bài blog mới" : "Chỉnh sửa bài viết"}
            </CardTitle>
            <CardDescription>
              Nội dung được lưu dưới dạng rich-text JSON để các phase comment, question
              và AI có thể tái sử dụng dễ hơn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="post-title">
                Tiêu đề
              </label>
              <Input id="post-title" placeholder="Ví dụ: Hành trình xây một nền tảng blog trả phí" {...form.register("title")} />
              {form.formState.errors.title ? (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="post-slug">
                  Slug tùy chọn
                </label>
                <Input id="post-slug" placeholder="de-xuat-slug-seo" {...form.register("slug")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="post-category">
                  Category ID
                </label>
                <Input id="post-category" placeholder="UUID của category nếu đã có sẵn" {...form.register("categoryId")} />
                {form.formState.errors.categoryId ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.categoryId.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="post-excerpt">
                Tóm tắt
              </label>
              <Textarea
                id="post-excerpt"
                rows={4}
                placeholder="Nếu để trống, frontend sẽ tự sinh excerpt từ nội dung editor."
                {...form.register("excerpt")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="post-tags">
                Tag IDs
              </label>
              <Input
                id="post-tags"
                placeholder="UUID1, UUID2, UUID3"
                {...form.register("tagIdsText")}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Backend hiện chưa có endpoint taxonomy riêng, nên phase 3 dùng input UUID
                trực tiếp cho tag/category khi bạn đã có dữ liệu seed.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="post-cover">
                Ảnh bìa
              </label>
              <Input
                id="post-cover"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  handleCoverChange(event.target.files?.[0] ?? null);
                }}
              />
              {coverPreview ? (
                <div className="overflow-hidden rounded-[1.4rem] border border-border/70">
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    width={1200}
                    height={720}
                    unoptimized
                    className="max-h-72 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Nội dung chính</p>
                  <p className="text-xs text-muted-foreground">
                    {editorText.trim().split(/\s+/).filter(Boolean).length} từ đã được ghi nhận.
                  </p>
                </div>
                <Link href="/dashboard/posts" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  Xem danh sách bài của tôi
                </Link>
              </div>
              <PostEditor
                content={editorContent}
                onChange={({ json, text }) => {
                  setEditorContent(json);
                  setEditorText(text);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="paper-grid">
          <CardHeader>
            <CardTitle>Hành động</CardTitle>
            <CardDescription>
              Draft sẽ lưu bằng `POST /posts`, còn publish sẽ gọi thêm endpoint publish sau khi lưu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              className="w-full"
              variant="outline"
              disabled={isSubmitting}
              onClick={() =>
                form.handleSubmit(
                  (values) => {
                    void handleMutation(values, "draft");
                  },
                  () => {
                    toast.error("Vui lòng kiểm tra lại form bài viết.");
                  },
                )()
              }
            >
              {isSubmitting ? "Đang lưu..." : "Lưu draft"}
            </Button>
            <Button
              type="button"
              className="w-full"
              disabled={isSubmitting}
              onClick={() =>
                form.handleSubmit(
                  (values) => {
                    void handleMutation(values, "published");
                  },
                  () => {
                    toast.error("Vui lòng kiểm tra lại form bài viết.");
                  },
                )()
              }
            >
              {isSubmitting ? "Đang xuất bản..." : "Xuất bản"}
            </Button>

            {mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  const confirmed = window.confirm("Lưu trữ bài viết này?");
                  if (confirmed) {
                    void deleteMutation.mutateAsync();
                  }
                }}
              >
                {deleteMutation.isPending ? "Đang lưu trữ..." : "Lưu trữ bài viết"}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phù hợp backend hiện tại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Posts API hiện lưu content ở dạng JSON, nên editor phase 3 giữ nguyên cấu trúc TipTap thay vì HTML thuần.</p>
            <p>Upload service backend hiện trả presigned URL mock. Frontend vẫn cắm luồng upload để bạn test end-to-end từ form.</p>
            <p>Category/tag chưa có endpoint liệt kê riêng, nên form đang hỗ trợ nhập UUID trực tiếp khi hệ thống đã có seed data.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
