import type { PostCategory } from "@/lib/data/posts";
import { findPosts } from "@/lib/data/posts";

export async function getLatestPostsByCategory(
  category: PostCategory,
  limit: number = 6
) {
  try {
    const { posts } = await findPosts({ category, page: 1, limit });
    return posts.map((p) => ({
      ...p,
      id: p._id,
      createdAt: p.createdAt,
    }));
  } catch {
    return [];
  }
}
