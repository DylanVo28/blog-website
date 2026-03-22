import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetailExperience } from "@/components/posts/PostDetailExperience";
import { postsApi } from "@/services/api/posts.api";

async function getPost(slug: string) {
  try {
    return await postsApi.getBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.excerpt ?? post.contentPlain ?? "Chi tiết bài viết",
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : [],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <PostDetailExperience post={post} />
  );
}
