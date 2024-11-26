import { Schema, model } from 'mongoose';

export interface ISettings {
  guildId: string;
  bumps: BumpSettings;
  birthdays: BirthdaySettings;

  createdAt: Date;
  updatedAt: Date;
}

export const settingsSchema = new Schema<ISettings>(
  {
    guildId: { type: String, required: true, index: 1 },
    bumps: {
      notifyChannelId: { type: String, default: '' },
      mentionRoleIds: { type: [String], default: [] },
    },
    birthdays: {
      notifyChannelId: { type: String, default: '' },
      roleIds: { type: [String], default: [] },
      hour: { type: Number, default: 12 },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false, timestamps: true },
);

export default model<ISettings>('settings', settingsSchema);

export interface BumpSettings {
  notifyChannelId: string;
  mentionRoleIds: string[];
}

export interface BirthdaySettings {
  notifyChannelId: string;
  roleIds: string[];
  hour: number;
}
