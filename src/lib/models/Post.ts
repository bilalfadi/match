import mongoose, { Schema, Model } from "mongoose";
import slugify from "slugify";

export type PostCategory = "news" | "football" | "premier-league";

export interface IPost {
  _id?: string;
  title: string;
  slug: string;
  category: PostCategory;
  content: string;
  excerpt?: string;
  image: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, enum: ["news", "football", "premier-league"], required: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    image: { type: String, required: true },
    author: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

PostSchema.index({ category: 1, createdAt: -1 });
PostSchema.index({ slug: 1 });

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);
export default Post;

export function generateSlug(title: string): string {
  return slugify(title, { lower: true, strict: true });
}
