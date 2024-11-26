import { Schema, model } from 'mongoose';

export interface IBumpBot {
  guildId: string;
  botId: string;
  cmdName: string;
  successColor: string;
  cooldown: number;

  createdAt: Date;
  updatedAt: Date;
}

export const bumpBotSchema = new Schema<IBumpBot>(
  {
    guildId: { type: String, required: true, index: 1 },
    botId: { type: String, required: true, index: 1 },
    cmdName: { type: String, required: true, index: 1 },
    successColor: { type: String, required: true, index: 1 },
    cooldown: { type: Number, required: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false, timestamps: true },
);

export default model<IBumpBot>('bump_bots', bumpBotSchema);
