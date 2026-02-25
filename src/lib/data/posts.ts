import slugify from "slugify";
import { readJson, writeJson, generateId } from "../store";

export type PostCategory = "news" | "football" | "premier-league";

export interface IPost {
  _id: string;
  title: string;
  slug: string;
  category: PostCategory;
  content: string;
  excerpt?: string;
  image: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

const FILE = "posts.json";

async function getPosts(): Promise<IPost[]> {
  return readJson<IPost[]>(FILE);
}

async function savePosts(posts: IPost[]): Promise<void> {
  await writeJson(FILE, posts);
}

export function generateSlug(title: string): string {
  return slugify(title, { lower: true, strict: true });
}

export async function findPosts(options: {
  category?: PostCategory;
  page?: number;
  limit?: number;
}): Promise<{ posts: IPost[]; total: number; page: number; totalPages: number }> {
  let posts = await getPosts();
  if (options.category) {
    posts = posts.filter((p) => p.category === options.category);
  }
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = posts.length;
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(30, Math.max(6, options.limit ?? 12));
  const skip = (page - 1) * limit;
  const slice = posts.slice(skip, skip + limit);
  return {
    posts: slice,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function findPostById(id: string): Promise<IPost | null> {
  const posts = await getPosts();
  return posts.find((p) => p._id === id) ?? null;
}

export async function findPostBySlug(slug: string): Promise<IPost | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function createPost(data: {
  title: string;
  category: PostCategory;
  content: string;
  image: string;
  excerpt?: string;
  author?: string;
}): Promise<IPost> {
  const posts = await getPosts();
  let slug = generateSlug(data.title);
  const existing = posts.find((p) => p.slug === slug);
  if (existing) slug = `${slug}-${Date.now()}`;
  const now = new Date().toISOString();
  const post: IPost = {
    _id: generateId(),
    title: data.title,
    slug,
    category: data.category,
    content: data.content,
    excerpt: data.excerpt ?? data.content.slice(0, 160),
    image: data.image,
    author: data.author ?? "Admin",
    createdAt: now,
    updatedAt: now,
  };
  posts.push(post);
  await savePosts(posts);
  return post;
}

export async function updatePost(id: string, data: Partial<Omit<IPost, "_id" | "createdAt">>): Promise<IPost | null> {
  const posts = await getPosts();
  const idx = posts.findIndex((p) => p._id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  posts[idx] = { ...posts[idx], ...data, _id: id, createdAt: posts[idx].createdAt, updatedAt: now };
  await savePosts(posts);
  return posts[idx];
}

export async function findRelatedPosts(category: PostCategory, excludeId: string, limit = 3): Promise<IPost[]> {
  const { posts } = await findPosts({ category, limit: limit + 10 });
  return posts.filter((p) => p._id !== excludeId).slice(0, limit);
}

/** For sitemap: all post slugs and lastmod */
export async function getAllPostSlugsWithDates(): Promise<{ slug: string; updatedAt: string }[]> {
  const posts = await getPosts();
  posts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return posts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
}

export async function deletePost(id: string): Promise<boolean> {
  const posts = await getPosts();
  const filtered = posts.filter((p) => p._id !== id);
  if (filtered.length === posts.length) return false;
  await savePosts(filtered);
  return true;
}
