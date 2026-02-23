import mongoose, { Schema, Model } from "mongoose";

export type AdPosition =
  | "hero"
  | "home-between-sections"
  | "post-content"
  | "above-iframe"
  | "below-iframe"
  | "sidebar";

export interface IAd {
  _id?: string;
  position: AdPosition;
  code: string;
  name?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AdSchema = new Schema<IAd>(
  {
    position: {
      type: String,
      enum: [
        "hero",
        "home-between-sections",
        "post-content",
        "above-iframe",
        "below-iframe",
        "sidebar",
      ],
      required: true,
    },
    code: { type: String, required: true },
    name: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AdSchema.index({ position: 1, active: 1 });

const Ad: Model<IAd> = mongoose.models.Ad || mongoose.model<IAd>("Ad", AdSchema);
export default Ad;
