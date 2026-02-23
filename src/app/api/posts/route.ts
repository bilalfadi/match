import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Post, { generateSlug } from "@/lib/models/Post";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(30, Math.max(6, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    const filter = category ? { category: category as "news" | "football" | "premier-league" } : {};
    const [posts, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments(filter),
    ]);

    return NextResponse.json({
      posts: posts.map((p) => ({ ...p, id: p._id?.toString() })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
    await dbConnect();
    const body = await req.json();
    const { title, category, content, image, author, excerpt } = body;
    if (!title || !category || !content || !image) {
      return NextResponse.json(
        { error: "title, category, content, image required" },
        { status: 400 }
      );
    }
    const slug = generateSlug(title);
    const existing = await Post.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;
    const post = await Post.create({
      title,
      slug: finalSlug,
      category,
      content,
      image,
      author: author || "Admin",
      excerpt: excerpt || content.slice(0, 160),
    });
    return NextResponse.json({ post: { ...post.toObject(), id: post._id.toString() } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
