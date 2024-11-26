import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { generateEmbed, sendErrorMessage } from '#utils/embed';
import { ApplyOptions } from '@sapphire/decorators';
import BumpBot from '#models/BumpBot';
import { Duration } from '@sapphire/duration';
import { ModalSubmitInteraction } from 'discord.js';
import { reFormatDuration } from '#utils/util';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.ModalSubmit })
export class EditBotBeginHandler extends InteractionHandler {
  public override parse(ctx: ModalSubmitInteraction<'cached'>) {
    if (!ctx.customId.startsWith('bot_settings_')) return this.none();
    const botId = ctx.customId.split('_')[2];

    return this.some<string>(botId);
  }

  public override async run(ctx: ModalSubmitInteraction<'cached'>, botId: string) {
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

    const field = ctx.fields.fields.first();
    if (!field) {
      await sendErrorMessage({ ctx, content: 'Сталася помилка під час читання нового значення.' });
      return;
    }

    const type = field.customId.split('_')[1];
    if (type !== 'cmdName' && type !== 'successColor' && type !== 'cooldown') {
      await sendErrorMessage({ ctx, content: 'Невідомий тип налаштування.' });
      return;
    }

    let value =
      type === 'cooldown'
        ? new Duration(field.value).offset
        : type === 'successColor'
          ? /\b[0-9A-F]{6}\b/gi.exec(field.value)?.[0]
          : field.value;

    if (type === 'cooldown' && (typeof value !== 'number' || value < 0 || isNaN(value))) {
      await sendErrorMessage({ ctx, content: 'Значення проміжку між бампами вказано невірно. Формат: 1d/1h/1s' });
      return;
    } else if (type === 'successColor' && !field.value) {
      await sendErrorMessage({ ctx, content: 'Колір успіху вказано невірно. Вкажіть колір в hex-форматі.' });
      return;
    }

    if (type === 'successColor') value = `#${value}`;

    const oldData = await BumpBot.findOne({ guildId: ctx.guildId, botId }).lean();

    await BumpBot.updateOne({ guildId: ctx.guildId, botId }, { $set: { [type]: value } }).lean();

    const description = `${type === 'cmdName' ? 'Команда' : type === 'successColor' ? 'Колір успіху' : 'Проміжок між бампами'}: ${[oldData![type], value].map(v => (type === 'cooldown' ? reFormatDuration(v as number) : v)).join(' ↣ ')}`;

    await ctx.reply({
      embeds: [
        generateEmbed({
          title: '🤖 | Налаштування бота',
          color: bot.displayColor,
          description: `Бот: ${bot}\n${description}`,
        }),
      ],
      ephemeral: true,
    });
  }
}
