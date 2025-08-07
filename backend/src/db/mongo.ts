import mongoose, { Schema, Document } from "mongoose";

await mongoose.connect(process.env.MONGO_URI as string);

export interface ISession extends Document {
  phone_number: string;
  session_id: string;
  cookies: any[];
  dom_snapshot: string;
  created_at: Date;
}

const sessionSchema = new Schema<ISession>({
  phone_number: String,
  session_id: String,
  cookies: Array,
  dom_snapshot: String,
  created_at: { type: Date, default: Date.now },
});

export const SessionModel = mongoose.model<ISession>("Session", sessionSchema);
