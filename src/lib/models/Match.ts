import mongoose, { Schema, Model } from "mongoose";

export type MatchStatus = "LIVE" | "UPCOMING" | "FINISHED";

export interface IMatch {
  _id?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  status: MatchStatus;
  streamUrl?: string;
  matchTime: Date;
  homeScore?: number;
  awayScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    homeLogo: { type: String, required: true },
    awayLogo: { type: String, required: true },
    status: { type: String, enum: ["LIVE", "UPCOMING", "FINISHED"], required: true },
    streamUrl: { type: String },
    matchTime: { type: Date, required: true },
    homeScore: { type: Number, default: 0 },
    awayScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MatchSchema.index({ status: 1 });
MatchSchema.index({ matchTime: -1 });

const Match: Model<IMatch> = mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);
export default Match;
