import { generateEmbed, sendErrorMessage } from '#utils/embed';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { DateTime } from 'luxon';
import { MONTHS } from '#utils/constants';
import User from '#models/User';

@ApplyOptions<Command.Options>({ description: 'Встановити дату свого дня народження' })
export class BirthdayCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addIntegerOption(option => option.setName('день').setDescription('День місяця').setMinValue(1).setMaxValue(31).setRequired(true))
        .addStringOption(option =>
          option
            .setName('місяць')
            .setDescription('Місяць')
            .setChoices(MONTHS.map(([name], i) => ({ name: `[${i + 1}] ${name}`, value: `${i}` })))
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(ctx: Command.ChatInputCommandInteraction<'cached'>) {
    const day = ctx.options.getInteger('день', true);
    const monthIndex = +ctx.options.getString('місяць', true);
    const testDate = DateTime.local(2024, monthIndex + 1, day);

    if (!testDate.isValid) {
      await sendErrorMessage({ ctx, content: 'Вкажіть, будь ласка, коректну дату.' });
      return;
    }

    const user = await User.findOne({ guildId: ctx.guildId, userId: ctx.user.id });
    if (user?.birthday?.day === day && user?.birthday?.month === monthIndex) {
      await sendErrorMessage({ ctx, content: 'Дата яку ви вказали вже була встановлена.' });
      return;
    }

    if (user) await user.updateOne({ birthday: { day, month: monthIndex } }, { upsert: true });
    else await User.create({ guildId: ctx.guildId, userId: ctx.user.id, birthday: { day, month: monthIndex } });

    await ctx.reply({
      embeds: [
        generateEmbed({
          color: 0xdca1e3,
          description: `Дата вашого дня народження успішно встановлена на **\`${day} ${MONTHS[monthIndex][1].toLocaleLowerCase()}\`**.`,
          footer: { icon_url: ctx.user.displayAvatarURL(), text: ctx.client.user.username },
        }),
      ],
      ephemeral: true,
    });
  }
}
