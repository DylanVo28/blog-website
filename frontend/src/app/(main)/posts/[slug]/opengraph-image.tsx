import { ImageResponse } from "next/og";
import { postsApi } from "@/services/api/posts.api";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function getPost(slug: string) {
  try {
    return await postsApi.getBySlug(slug);
  } catch {
    return null;
  }
}

export default async function PostOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "radial-gradient(circle at top left, rgba(244,196,126,0.36), transparent 34%), linear-gradient(135deg, rgb(255, 250, 242), rgb(243, 235, 223))",
          color: "rgb(34, 36, 44)",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgb(141, 84, 34)",
          }}
        >
          Inkline Post
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "980px" }}>
          <div style={{ fontSize: 76, lineHeight: 1.04, fontWeight: 700 }}>
            {post?.title ?? "Chi tiết bài viết"}
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.45, color: "rgb(87, 91, 107)" }}>
            {post?.excerpt ?? post?.contentPlain ?? "Bài viết trên Inkline."}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28 }}>
          <div>{post?.author.displayName ?? "Inkline"}</div>
          <div>{post?.readingTime ? `${post.readingTime} phút đọc` : "Story"}</div>
        </div>
      </div>
    ),
    size,
  );
}
