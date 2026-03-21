"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { PostForm } from "@/components/posts/PostForm";

export function NewPostScreen() {
  return (
    <AuthGuard>
      <PostForm mode="create" />
    </AuthGuard>
  );
}
