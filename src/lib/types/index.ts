import type {
  CacheType,
  ChatInputCommandInteraction,
  CommandInteraction,
  EmbedData,
  GuildMember,
  Message,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';

export type Context<InGuild extends boolean = boolean, Cached extends CacheType = undefined> =
  | ChatInputCommandInteraction<Cached>
  | Message<InGuild>;

export interface sendErrorMessageOptions {
  ctx: Context | CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction;
  content?: string;
  data?: EmbedData;
  follow?: boolean;
  member?: GuildMember;
  emoji?: string;
}

export type Writeable<T> = { -readonly [P in keyof T]-?: T[P] };
