import type { AdvancedClient } from '#lib/AdvancedClient';
import type { GuildMember } from 'discord.js';
import Settings from '#models/Settings';
import User from '#models/User';
import { generateEmbed } from '#utils/embed';
import { pickRandom } from '@sapphire/utilities';

const PHRASES = [
  `В цей чудовий день свій день народження {{celebrate}} {{members}}. Вітаємо {{pronoun}} з Днем народження!`,
  'Сьогодні свій день народження {{celebrate}} {{members}}. Вітаємо {{pronoun}} з Днем народження!',
  'Уявіть собі! Сьогодні свій день народження {{celebrate}} {{members}}. Вітаємо {{pronoun}} з Днем народження!',
];

const IMAGES = [
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXZxMDBmbHAwZ2w1c3RwbWoxN3BhMTg3NGdiYTF6Yzd5cjgxMjdmaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9rO5Aksmn0dHQKXJAu/giphy.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnBobHg1bDk1aG1wZ3F1emY5bzBrbndzanRzZ2ZwZ21wajFjZjNhYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nAELLSB7jV0wVejr1h/giphy.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExemhicWc4OHp0ZXk0N2N3eWwzc2lpbTJmZWV1M2w4aHFlanFhYWduMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/p0BreNwT6cfFkTkh1z/giphy.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzE1OTlteWVvMXV2b2RqMml5cnNxa2w5c2FydDUybDF3c3FmeHI0eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/P50NzRnKGIutpsQKaw/giphy.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2tvaWh2aGpwYmpleXRvZTl0YnIzeml4djVib281NjU0cjh4eXh4dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lSMxrbqwjkiHOsQ5x1/giphy.gif',
];

export const birthdaysCheck = async (client: AdvancedClient<true>) => {
  for await (const guild of client.guilds.cache.values()) {
    const date = new Date();
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' }));

    const settings = await Settings.findOne({ guildId: guild.id }).lean();
    if (!settings || (!settings.birthdays.notifyChannelId && !settings.birthdays.roleIds.length)) continue;
    else if (settings.birthdays.hour && localDate.getHours() !== settings.birthdays.hour) continue;

    const notifyChannel = guild.channels.cache.get(settings.birthdays.notifyChannelId);

    const usersWithBirthdays = await User.find({
      guildId: guild.id,
      'birthday.day': localDate.getDate(),
      'birthday.month': localDate.getMonth(),
      $or: [{ 'birthday.lastSend': { $exists: false } }, { 'birthday.lastSend': { $lte: new Date().setHours(0, 0, 0, 0) } }],
    }).lean();

    const membersWithBirthdays: GuildMember[] = [];
    for (const user of usersWithBirthdays) {
      const member = await guild.members.fetch(user.userId);
      if (member) membersWithBirthdays.push(member);
    }

    if (!membersWithBirthdays.length) continue;

    if (settings.birthdays.roleIds.length) {
      for (const member of membersWithBirthdays) await member.roles.add(settings.birthdays.roleIds);
    }

    await User.updateMany({ guildId: guild.id, userId: membersWithBirthdays.map(member => member.id) }, { 'birthday.lastSend': date });

    if (notifyChannel?.isTextBased?.()) {
      let phrase = pickRandom(PHRASES);
      phrase = phrase
        .replaceAll('{{celebrate}}', membersWithBirthdays.length > 1 ? 'святкують' : 'святкує')
        .replaceAll('{{members}}', membersWithBirthdays.map(member => `<@${member.id}>`).join(', '))
        .replaceAll('{{pronoun}}', membersWithBirthdays.length > 1 ? 'їх' : 'її/його');

      await notifyChannel.send({
        content: phrase,
        embeds: [
          generateEmbed({
            color: 0xdca4e0,
            image: { url: pickRandom(IMAGES) },
            footer: { text: 'Встановити дату дня народження /birthday' },
          }),
        ],
      });
    }
  }
};

export const checkBirthdayRoles = async (client: AdvancedClient<true>) => {
  const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' }));

  for await (const guild of client.guilds.cache.values()) {
    const settings = await Settings.findOne({ guildId: guild.id }).lean();
    if (!settings) continue;

    const membersWithRoles: Set<string> = new Set();
    if (guild.memberCount !== guild.members.cache.size) await guild.members.fetch();

    for (const roleId of settings.birthdays.roleIds) {
      const role = guild.roles.cache.get(roleId);
      if (!role) continue;

      for (const memberId of role.members.keys()) membersWithRoles.add(memberId);
    }

    for (const memberId of membersWithRoles) {
      const member = await guild.members.fetch(memberId);
      if (!member) continue;

      const user = await User.findOne({
        guildId: guild.id,
        userId: member.id,
        'birthday.day': localDate.getDate(),
        'birthday.month': localDate.getMonth(),
      }).lean();
      if (user) continue;

      await member.roles.remove(settings.birthdays.roleIds);
    }
  }
};
