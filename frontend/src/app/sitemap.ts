import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { postsApi } from "@/services/api/posts.api";

const staticRoutes = [
  "",
  "/explore",
  "/login",
  "/register",
  "/forgot-password",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL.replace(/\/$/, "");

  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  })) satisfies MetadataRoute.Sitemap;

  try {
    const posts = await postsApi.getAll({
      page: 1,
      limit: 200,
      status: "published",
    });

    const postEntries = posts.data.map((post) => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticEntries, ...postEntries];
  } catch {
    return staticEntries;
  }
}
