"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostDetail } from "@/components/posts/PostDetail";
import { CommentSection } from "@/components/comments/CommentSection";
import { QuestionSection } from "@/components/questions/QuestionSection";
import { buildAiQuestionFromSelection } from "@/lib/questions";
import type { Post } from "@/types/post.types";
import type { QuestionPrefill } from "@/types/question.types";

interface PostDetailExperienceProps {
  post: Post;
}

type DetailTab = "questions" | "comments";

export function PostDetailExperience({ post }: PostDetailExperienceProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("questions");
  const [questionPrefill, setQuestionPrefill] = useState<QuestionPrefill | null>(null);

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
        <TabsList className="w-full">
          <TabsTrigger value="questions" className="flex-1">
            Câu hỏi ({post.questionCount})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex-1">
            Bình luận ({post.commentCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
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

        <TabsContent value="comments">
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
        </TabsContent>
      </Tabs>
    </article>
  );
}
