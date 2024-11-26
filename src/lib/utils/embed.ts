import { type APIEmbed, EmbedBuilder, type EmbedData, Message } from 'discord.js';
import { client } from '#root/index';
import { pickRandom } from '@sapphire/utilities';
import type { sendErrorMessageOptions } from '#types/index';

export const generateEmbed = (options: EmbedData | APIEmbed) => {
  if (!options.footer) options.footer = { text: `${client.user.username}`, icon_url: client.user.displayAvatarURL() };
  else if (options.footer && !('iconURL' in options.footer || 'icon_url' in options.footer)) {
    options.footer = { text: options.footer.text, icon_url: client.user.displayAvatarURL() };
  }
  return new EmbedBuilder(options);
};

export const sendErrorMessage = async ({ ctx, content, data, emoji, follow, member }: sendErrorMessageOptions) => {
  const isMessage = ctx instanceof Message;
  if (!emoji) emoji = pickRandom(['😥', '😔', '🤔', '⚠️', '⛔', '🚫']);

  if (!ctx.channel?.isSendable?.()) return;

  const embed = generateEmbed({
    ...(data ? data : {}),
    color: data?.color ?? 0xed4245,
    title: data?.title ?? `**${emoji} | Виникла помилка**`,
    description: data?.description ?? (content ? `**${content}**` : content),
    footer: { text: `${ctx.client.user.username} | Помилка`, icon_url: ctx.client.user.avatarURL() ?? undefined },
  });

  if (isMessage) {
    const res = await ctx.channel.send({ content: `${member ?? ctx.member}`, embeds: [embed] }).catch(() => null);
    if (res) setTimeout(() => res.delete().catch(() => null), 15 * 1000);
  } else if (follow) await ctx.followUp({ content: `${member ?? ctx.member}`, embeds: [embed], ephemeral: true });
  else if (ctx.replied || ctx.deferred) await ctx.editReply({ content: `${member ?? ctx.member}`, embeds: [embed] });
  else await ctx.reply({ content: `${member ?? ctx.member}`, embeds: [embed], ephemeral: true });
};
