import type { AdvancedClient } from '#lib/AdvancedClient';
import Bump from '#models/Bump';
import BumpBot from '#models/BumpBot';
import type { Message } from 'discord.js';
import Settings from '#models/Settings';

export const checkMessage = async (message: Message<true>) => {
  if (!message.author.bot || !message.interactionMetadata) return;

  const botInfo = await BumpBot.findOne({ guildId: message.guild.id, botId: message.author.id }).lean();
  if (!botInfo || message.interaction?.commandName !== botInfo.cmdName) return;
  else if (message.embeds[0]?.hexColor !== botInfo.successColor) return;

  await Bump.deleteMany({ guildId: message.guild.id, botId: message.author.id });

  await Bump.create({
    guildId: message.guild.id,
    botId: message.author.id,
    cmdName: botInfo.cmdName,
    nextIn: Date.now() + botInfo.cooldown,
  });

  await message.react('👀');
};

export const bumpsCheck = async (client: AdvancedClient<true>) => {
  for await (const guild of client.guilds.cache.values()) {
    const settings = await Settings.findOne({ guildId: guild.id }).lean();
    if (!settings) continue;

    const timestamp = Date.now();
    const bumps = await Bump.find({ guildId: guild.id, nextIn: { $lte: timestamp } });
    if (!bumps.length) continue;

    const notifyChannel = guild.channels.cache.get(settings.bumps.notifyChannelId);
    if (!notifyChannel?.isTextBased?.()) continue;

    const rolesToNotify = settings.bumps.mentionRoleIds.map(id => guild.roles.cache.get(id)).filter(role => !!role);

    const contentStart = `${rolesToNotify.map(role => `${role}`).join(', ')}${rolesToNotify.length ? ' ' : ''}`;

    const promises = bumps.map(bump =>
      notifyChannel.send({ content: `${contentStart}Настав час бампу! <@${bump.botId}> \`/${bump.cmdName}\`` }),
    );

    await Promise.all(promises);
    await Bump.deleteMany({ nextIn: { $lte: timestamp } });
  }
};
