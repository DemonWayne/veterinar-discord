import { type ChannelSelectMenuInteraction, ChannelType, Colors } from 'discord.js';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { generateEmbed, sendErrorMessage } from '#utils/embed';
import { ApplyOptions } from '@sapphire/decorators';
import Settings from '#models/Settings';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.SelectMenu })
export class BirthdayNotifySelectHandler extends InteractionHandler {
  public override parse(ctx: ChannelSelectMenuInteraction<'cached'>) {
    if (ctx.customId !== 'settings_birthdays_notifyChannelId') return this.none();

    return this.some();
  }

  public override async run(ctx: ChannelSelectMenuInteraction<'cached'>) {
    if (!ctx.memberPermissions.has(8n)) {
      await sendErrorMessage({ ctx, content: 'У вас недостатньо прав для виконання цієї дії.' });
      return;
    }

    const channel = ctx.channels.first();
    if (!channel) {
      await sendErrorMessage({ ctx, content: 'Обраний канал не вдалось отримати.' });
      return;
    } else if (channel.type !== ChannelType.GuildText) {
      await sendErrorMessage({ ctx, content: 'Обраний канал не є текстовим.' });
      return;
    }

    await Settings.findOneAndUpdate({ guildId: ctx.guildId }, { 'birthdays.notifyChannelId': channel.id }, { upsert: true, new: true });

    await ctx.update({
      embeds: [
        generateEmbed({ color: Colors.Green, title: '✅ | Налаштування збережено', description: `Ви змінили канал для привітань.` }),
      ],
      components: [],
    });
  }
}
