import { Schema, model } from 'mongoose';

export interface IBump {
  guildId: string;
  botId: string;
  cmdName: string;
  nextIn: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const bumpSchema = new Schema<IBump>(
  {
    guildId: { type: String, required: true, index: 1 },
    botId: { type: String, required: true, index: 1 },
    cmdName: { type: String, required: true },
    nextIn: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false, timestamps: true },
);

export default model<IBump>('bumps', bumpSchema);
