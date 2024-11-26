import { Colors, StringSelectMenuInteraction } from 'discord.js';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { generateEmbed, sendErrorMessage } from '#utils/embed';
import { ApplyOptions } from '@sapphire/decorators';
import Settings from '#models/Settings';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.SelectMenu })
export class BirthdayNotifySelectHandler extends InteractionHandler {
  public override parse(ctx: StringSelectMenuInteraction<'cached'>) {
    if (ctx.customId !== 'settings_birthdays_hour') return this.none();

    return this.some();
  }

  public override async run(ctx: StringSelectMenuInteraction<'cached'>) {
    if (!ctx.memberPermissions.has(8n)) {
      await sendErrorMessage({ ctx, content: 'У вас недостатньо прав для виконання цієї дії.' });
      return;
    }

    const hour = +ctx.values[0];
    if (isNaN(hour)) {
      await sendErrorMessage({ ctx, content: 'Не вдалось отримати обрану годину.' });
      return;
    }

    await Settings.findOneAndUpdate({ guildId: ctx.guildId }, { 'birthdays.hour': hour }, { upsert: true, new: true });

    await ctx.update({
      embeds: [
        generateEmbed({
          color: Colors.Green,
          title: '✅ | Налаштування збережено',
          description: `Ви змінили час надсилання привітання з днем народження.`,
        }),
      ],
      components: [],
    });
  }
}
