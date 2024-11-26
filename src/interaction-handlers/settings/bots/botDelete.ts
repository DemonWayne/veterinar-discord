import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { generateEmbed, sendErrorMessage } from '#utils/embed';
import { ApplyOptions } from '@sapphire/decorators';
import BumpBot from '#models/BumpBot';
import { ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.Button })
export class EditBotBeginHandler extends InteractionHandler {
  public override parse(ctx: ButtonInteraction<'cached'>) {
    if (!ctx.customId.startsWith('bot_delete_')) return this.none();
    const [, , action, botId] = ctx.customId.split('_');

    return this.some<string[]>([action, botId]);
  }

  public override async run(ctx: ButtonInteraction<'cached'>, [action, botId]: string[]) {
    if (!ctx.memberPermissions.has(8n)) {
      await sendErrorMessage({ ctx, content: 'У вас недостатньо прав для виконання цієї дії.' });
      return;
    }

    const bot = await ctx.guild.members.fetch(botId).catch(() => null);
    if (!bot) {
      await sendErrorMessage({ ctx, content: 'Обраного бота не знайдено на сервері.' });
      return;
    }

    const botBump = await BumpBot.findOne({ guildId: ctx.guildId, botId }).lean();
    if (!botBump) {
      await sendErrorMessage({ ctx, content: 'Налаштування для обраного бота відсутні.' });
      return;
    }

    if (action === 'cancel') {
      await ctx.update({
        embeds: [
          generateEmbed({
            title: '🤖 | Видалення бота',
            color: bot.displayColor,
            description: `Ви скасували видалення налаштувань для бота ${bot}.`,
          }),
        ],
        components: [],
      });
      return;
    } else if (action !== 'confirm') {
      await sendErrorMessage({ ctx, content: 'Невідома дія.' });
      return;
    }

    await BumpBot.deleteOne({ guildId: ctx.guildId, botId }).exec();

    await ctx.update({
      embeds: [
        generateEmbed({
          title: '🤖 | Видалення бота',
          color: bot.displayColor,
          description: `Налаштування для бота ${bot} було успішно видалено.`,
        }),
      ],
      components: [],
    });
  }
}
