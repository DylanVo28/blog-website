"use client";

import dynamic from "next/dynamic";
import { useEffect, useEffectEvent, useState } from "react";
import { PostDetail } from "@/components/posts/PostDetail";
import { buildAiQuestionFromSelection } from "@/lib/questions";
import type { Post } from "@/types/post.types";
import type { QuestionPrefill } from "@/types/question.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PostDetailExperienceProps {
  post: Post;
}

type DetailTab = "questions" | "comments";

const CommentSection = dynamic(
  () => import("@/components/comments/CommentSection").then((mod) => mod.CommentSection),
  {
    loading: () => <InteractionPanelSkeleton label="Đang tải bình luận..." />,
  },
);

const QuestionSection = dynamic(
  () => import("@/components/questions/QuestionSection").then((mod) => mod.QuestionSection),
  {
    loading: () => <InteractionPanelSkeleton label="Đang tải question..." />,
  },
);

function InteractionPanelSkeleton({ label }: { label: string }) {
  return (
    <div className="surface-panel space-y-4 rounded-[1.6rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent_44%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_90%,transparent),color-mix(in_oklab,var(--color-card)_76%,var(--color-accent)_24%))] p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">{label}</p>
      <Skeleton className="h-20 rounded-[1.3rem]" />
      <Skeleton className="h-32 rounded-[1.3rem]" />
      <Skeleton className="h-28 rounded-[1.3rem]" />
    </div>
  );
}

export function PostDetailExperience({ post }: PostDetailExperienceProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("questions");
  const [questionPrefill, setQuestionPrefill] = useState<QuestionPrefill | null>(null);

  const syncTabWithHash = useEffectEvent(() => {
    if (typeof window === "undefined") {
      return;
    }

    const { hash } = window.location;

    if (hash === "#comment-section") {
      setActiveTab("comments");

      window.setTimeout(() => {
        document.getElementById("comment-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 40);

      return;
    }

    if (hash === "#question-section") {
      setActiveTab("questions");
    }
  });

  useEffect(() => {
    syncTabWithHash();
    window.addEventListener("hashchange", syncTabWithHash);

    return () => {
      window.removeEventListener("hashchange", syncTabWithHash);
    };
  }, []);

  useEffect(() => {
    if (questionPrefill) {
      const timeout = window.setTimeout(() => {
        document.getElementById("question-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 20);

      return () => {
        window.clearTimeout(timeout);
      };
    }
  }, [questionPrefill]);

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <PostDetail
        post={post}
        onAskAI={(selectedText) => {
          setActiveTab("questions");
          setQuestionPrefill({
            content: buildAiQuestionFromSelection(selectedText),
            target: "ai",
            nonce: Date.now(),
          });
        }}
      />

      <Separator />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DetailTab)}>
        <TabsList className="surface-panel h-auto w-full rounded-[1.6rem] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_82%,transparent),color-mix(in_oklab,var(--color-card)_68%,var(--color-accent)_32%))] p-1.5">
          <TabsTrigger
            value="questions"
            className="flex-1 text-muted-foreground hover:text-foreground data-[state=active]:bg-[color-mix(in_oklab,var(--color-card)_92%,transparent)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_12px_32px_-24px_rgba(25,32,56,0.55)]"
          >
            Câu hỏi ({post.questionCount})
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="flex-1 text-muted-foreground hover:text-foreground data-[state=active]:bg-[color-mix(in_oklab,var(--color-card)_92%,transparent)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_12px_32px_-24px_rgba(25,32,56,0.55)]"
          >
            Bình luận ({post.commentCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-5">
          <div id="question-section">
            <QuestionSection
              postId={post.id}
              authorId={post.author.id}
              postTitle={post.title}
              postSlug={post.slug}
              prefill={questionPrefill}
            />
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-5">
          <div id="comment-section">
            <CommentSection
              postId={post.id}
              onSwitchToQuestion={(content) => {
                setActiveTab("questions");
                setQuestionPrefill({
                  content,
                  target: "author",
                  nonce: Date.now(),
                });
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </article>
  );
}
