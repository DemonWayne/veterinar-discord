import { ActionRowBuilder, ModalBuilder, type StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import BumpBot from '#models/BumpBot';
import { reFormatDuration } from '#utils/util';
import { sendErrorMessage } from '#utils/embed';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.SelectMenu })
export class EditBotBeginHandler extends InteractionHandler {
  public override parse(ctx: StringSelectMenuInteraction<'cached'>) {
    if (!ctx.customId.startsWith('bot_settings_')) return this.none();
    const botId = ctx.customId.split('_')[2];

    return this.some<string>(botId);
  }

  public override async run(ctx: StringSelectMenuInteraction<'cached'>, botId: string) {
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

    const typeRaw = ctx.values[0].split('_')[1];
    const type = typeRaw === 'cmd' ? 'cmdName' : typeRaw === 'color' ? 'successColor' : typeRaw === 'cooldown' ? 'cooldown' : null;
    if (!type) {
      await sendErrorMessage({ ctx, content: 'Невідома зміна налаштування.' });
      return;
    }

    const value = type === 'cooldown' ? reFormatDuration(botBump[type]) : botBump[type];

    await ctx.showModal(
      new ModalBuilder({
        title: '🤖 | Налаштування бота',
        customId: `bot_settings_${botId}`,
        components: [
          new ActionRowBuilder<TextInputBuilder>({
            components: [
              new TextInputBuilder({
                custom_id: `value_${type}`,
                label: 'Значення',
                style: TextInputStyle.Short,
                value: `${value}`,
              }),
            ],
          }),
        ],
      }),
    );
  }
}
