import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/comments/CommentSection";
import { PostDetail } from "@/components/posts/PostDetail";
import { QuestionSection } from "@/components/questions/QuestionSection";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <article className="mx-auto max-w-4xl space-y-8">
      <PostDetail post={post} />

      <Separator />

      <Tabs defaultValue="questions">
        <TabsList className="w-full">
          <TabsTrigger value="questions" className="flex-1">
            Câu hỏi ({post.questionCount})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex-1">
            Bình luận ({post.commentCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <QuestionSection postId={post.id} authorId={post.author.id} />
        </TabsContent>

        <TabsContent value="comments">
          <CommentSection postId={post.id} />
        </TabsContent>
      </Tabs>
    </article>
  );
}
