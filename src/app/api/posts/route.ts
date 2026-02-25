import { NextRequest, NextResponse } from "next/server";
import { findPosts, createPost } from "@/lib/data/posts";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as "news" | "football" | "premier-league" | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(30, Math.max(6, parseInt(searchParams.get("limit") || "12", 10)));

    const result = await findPosts({
      category: category ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({
      posts: result.posts.map((p) => ({ ...p, id: p._id })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { title, category, content, image, author, excerpt } = body;
    if (!title || !category || !content || !image) {
      return NextResponse.json(
        { error: "title, category, content, image required" },
        { status: 400 }
      );
    }
    const post = await createPost({
      title,
      category: category as "news" | "football" | "premier-league",
      content,
      image,
      author: author || "Admin",
      excerpt: excerpt || content.slice(0, 160),
    });
    return NextResponse.json({ post: { ...post, id: post._id } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
