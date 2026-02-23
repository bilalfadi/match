import dbConnect from "@/lib/db";
import Post from "@/lib/models/Post";
import type { PostCategory } from "@/lib/models/Post";

export async function getLatestPostsByCategory(
  category: PostCategory,
  limit: number = 6
) {
  await dbConnect();
  const posts = await Post.find({ category })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return posts.map((p) => ({
    ...p,
    id: p._id?.toString(),
    createdAt: p.createdAt?.toISOString?.(),
  }));
}
