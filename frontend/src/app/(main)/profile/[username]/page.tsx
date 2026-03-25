import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfilePosts } from "@/components/profile/ProfilePosts";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { usersApi } from "@/services/api/users.api";

async function getProfileBundle(identifier: string) {
  try {
    const profile = await usersApi.getPublicProfile(identifier);
    const [stats, posts] = await Promise.all([
      usersApi.getUserStats(identifier),
      usersApi.getUserPosts(identifier, profile),
    ]);

    return {
      profile,
      stats,
      posts,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileBundle(username);

  if (!profile) {
    return {};
  }

  const canonicalSlug = profile.profile.username ?? profile.profile.id;

  return {
    title: `${profile.profile.displayName}`,
    description:
      profile.profile.bio ??
      `${profile.profile.displayName} tren Inkline: ${profile.stats.postsCount} bai viet va ${profile.stats.questionsCount} cau hoi.`,
    alternates: {
      canonical: `/profile/${canonicalSlug}`,
    },
    openGraph: {
      title: profile.profile.displayName,
      description:
        profile.profile.bio ??
        `${profile.profile.displayName} tren Inkline`,
      images: profile.profile.avatarUrl ? [profile.profile.avatarUrl] : [],
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const bundle = await getProfileBundle(username);

  if (!bundle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProfileHeader profile={bundle.profile} stats={bundle.stats} />
      <ProfileStats stats={bundle.stats} />
      <ProfilePosts posts={bundle.posts} displayName={bundle.profile.displayName} />
    </div>
  );
}
