import { Schema, model } from 'mongoose';

export interface IUser {
  guildId: string;
  userId: string;
  birthday?: BirthdayData;
  marry?: MarryData;

  createdAt: Date;
  updatedAt: Date;
}

export const userSchema = new Schema<IUser>(
  {
    guildId: { type: String, required: true, index: 1 },
    userId: { type: String, required: true, index: 1 },
    birthday: { _id: false, day: { type: Number }, month: { type: Number }, lastSend: { type: Date } },
    marry: { _id: false, partner: { type: String }, relationshipStart: { type: Date } },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false, timestamps: true },
);

export default model<IUser>('users', userSchema);

export interface BirthdayData {
  day: number;
  month: number;

  lastSend?: Date;
}

export interface MarryData {
  partnerId: string;

  relationshipStart: Date;
}
