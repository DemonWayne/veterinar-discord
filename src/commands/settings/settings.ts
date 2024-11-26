import {
  ActionRowBuilder,
  type BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { generateEmbed, sendErrorMessage } from '#utils/embed';
import { isNullOrUndefinedOrEmpty, range } from '@sapphire/utilities';
import { ApplyOptions } from '@sapphire/decorators';
import BumpBot from '#models/BumpBot';
import { Duration } from '@sapphire/duration';
import { MessageLinkRegex } from '@sapphire/discord.js-utilities';
import Settings from '#models/Settings';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { reFormatDuration } from '#utils/util';

@ApplyOptions<Subcommand.Options>({
  description: 'Settings',
  subcommands: [
    {
      name: 'birthday',
      chatInputRun: 'birthdaySettings',
    },
    {
      name: 'bump',
      type: 'group',
      entries: [{ name: 'general', chatInputRun: 'generalBumpSettings' }],
    },
    {
      name: 'bump_bots',
      type: 'group',
      entries: [
        { name: 'add', chatInputRun: 'addBumpBot' },
        { name: 'edit', chatInputRun: 'editBumpBot' },
        { name: 'delete', chatInputRun: 'deleteBumpBot' },
      ],
    },
  ],
})
export class SettingsCommand extends Subcommand {
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(8n)
        .addSubcommand(subCommand =>
          subCommand
            .setName('birthday')
            .setDescription('Змінити налаштування привітань з днем народження')
            .addStringOption(option =>
              option
                .setName('налаштування')
                .setDescription('Оберіть налаштування')
                .setRequired(true)
                .setChoices(
                  { name: 'Канал для привітань', value: 'notifyChannelId' },
                  { name: 'Ролі для іменинників', value: 'roleIds' },
                  { name: 'Година сповіщення', value: 'hour' },
                ),
            ),
        )
        .addSubcommandGroup(group =>
          group
            .setName('bump')
            .setDescription('Змінити загальні налаштування системи нагадування про бампи')
            .addSubcommand(subCommand =>
              subCommand
                .setName('general')
                .setDescription('Змінити загальні налаштування системи нагадування про бампи')
                .addStringOption(option =>
                  option
                    .setName('налаштування')
                    .setDescription('Оберіть налаштування')
                    .setChoices(
                      { name: 'Канал для нагадування', value: 'notifyChannelId' },
                      { name: 'Ролі для згадування', value: 'mentionRoleIds' },
                    )
                    .setRequired(true),
                ),
            ),
        )
        .addSubcommandGroup(group =>
          group
            .setName('bump_bots')
            .setDescription('Змінити налаштування ботів бампів')
            .addSubcommand(subCommand =>
              subCommand
                .setName('add')
                .setDescription('Додати запис бота бампів')
                .addUserOption(option => option.setName('бот').setDescription('Згадування бота').setRequired(true))
                .addStringOption(option => option.setName('проміжок').setDescription('Проміжок між бампами (30m/3h)').setRequired(true))
                .addStringOption(option => option.setName('команда').setDescription('Яку назву має команда бампу?').setRequired(true))
                .addStringOption(option =>
                  option.setName('повідомлення').setDescription('Посилання на повідомлення успішного бампу').setRequired(true),
                ),
            )
            .addSubcommand(subCommand =>
              subCommand
                .setName('edit')
                .setDescription('Редагувати запис бота бампів')
                .addStringOption(option => option.setName('бот').setDescription('Бот бампу').setRequired(true).setAutocomplete(true)),
            )
            .addSubcommand(subCommand =>
              subCommand
                .setName('delete')
                .setDescription('Видалити запис бота бампів')
                .addStringOption(option => option.setName('бот').setDescription('Бот бампу').setRequired(true).setAutocomplete(true)),
            ),
        ),
    );
  }

  public async generalBumpSettings(ctx: Subcommand.ChatInputCommandInteraction<'cached'>) {
    const check = await this.checkPerms(ctx);
    if (!check) return;

    const setting = ctx.options.getString('налаштування', true);
    const options: BaseMessageOptions = {};

    let settings = await Settings.findOne({ guildId: ctx.guildId }).lean();
    if (!settings) settings = await Settings.create({ guildId: ctx.guildId });

    if (setting === 'notifyChannelId') {
      const channelSelectMenu = new ChannelSelectMenuBuilder({
        custom_id: `settings_bumps_${setting}`,
        placeholder: 'Оберіть канал',
        channel_types: [ChannelType.GuildText],
        min_values: 0,
        max_values: 1,
      });

      if (!isNullOrUndefinedOrEmpty(settings.bumps.notifyChannelId)) {
        channelSelectMenu.setDefaultChannels(settings.bumps.notifyChannelId);
      }

      options.embeds = [
        generateEmbed({
          color: Colors.DarkVividPink,
          title: '#️⃣ | Встановлення каналу для нагадування',
          description: 'В списку нижче оберіть канал в який будуть надсилатись нагадування про бампи.',
        }),
      ];
      options.components = [new ActionRowBuilder<ChannelSelectMenuBuilder>({ components: [channelSelectMenu] })];
    } else {
      options.embeds = [
        generateEmbed({
          color: Colors.DarkVividPink,
          title: '👥 | Встановлення ролей для згадування',
          description: 'В списку нижче оберіть ролі які будуть згадуватись під час нагадування про бампи.',
        }),
      ];
      options.components = [
        new ActionRowBuilder<RoleSelectMenuBuilder>({
          components: [
            new RoleSelectMenuBuilder({
              custom_id: `settings_bumps_${setting}`,
              placeholder: 'Оберіть ролі',
              min_values: 0,
              max_values: 25,
            }).setDefaultRoles(...settings.bumps.mentionRoleIds),
          ],
        }),
      ];
    }

    await ctx.reply({ ...options, ephemeral: true });
  }

  public async addBumpBot(ctx: Subcommand.ChatInputCommandInteraction<'cached'>) {
    const check = await this.checkPerms(ctx);
    if (!check) return;

    const userBot = ctx.options.getUser('бот', true);
    const rawTime = ctx.options.getString('проміжок', true);
    const cmdName = ctx.options.getString('команда', true).replace('/', '');
    const msgUrlRaw = ctx.options.getString('повідомлення', true);
    const msgUrl = MessageLinkRegex.exec(msgUrlRaw);

    const time = new Duration(rawTime);

    if (!userBot.bot) {
      await sendErrorMessage({ ctx, content: 'Вказаний користувач не є ботом.' });
      return;
    } else if (!time.offset) {
      await sendErrorMessage({ ctx, content: 'Вкажіть правильний час (30m/3h/5h).' });
      return;
    } else if (!MessageLinkRegex.test(msgUrlRaw) || !msgUrl?.groups) {
      await sendErrorMessage({ ctx, content: 'Вкажіть правильне посилання на повідомлення.' });
      return;
    } else if (!('channelId' in msgUrl?.groups) || !('messageId' in msgUrl?.groups)) {
      await sendErrorMessage({ ctx, content: 'Вкажіть правильне посилання на повідомлення.' });
      return;
    }

    const channel = ctx.guild.channels.cache.get(msgUrl.groups.channelId);
    if (!channel?.isTextBased()) {
      await sendErrorMessage({ ctx, content: 'Вказаний канал не є текстовим.' });
      return;
    }

    const msg = await channel.messages.fetch(msgUrl.groups.messageId);
    if (!msg) {
      await sendErrorMessage({ ctx, content: 'Вказане повідомлення не знайдено.' });
      return;
    } else if (msg.author.id !== userBot.id) {
      await sendErrorMessage({ ctx, content: 'Вказане повідомлення не є повідомленням від бота.' });
      return;
    } else if (!msg.embeds[0]?.hexColor) {
      await sendErrorMessage({ ctx, content: 'Вказане повідомлення не містить кольору.' });
      return;
    }

    await BumpBot.findOneAndUpdate(
      { guildId: ctx.guildId, botId: userBot.id },
      { cmdName, cooldown: time.offset, successColor: msg.embeds[0].hexColor },
      { upsert: true },
    );

    await ctx.reply({
      embeds: [
        generateEmbed({
          color: Colors.Green,
          title: '✅ | Налаштування збережено',
          description: `Дані про бота для бампів були успішно записані.`,
        }),
      ],
      ephemeral: true,
    });
  }

  public async editBumpBot(ctx: Subcommand.ChatInputCommandInteraction<'cached'>) {
    const check = await this.checkPerms(ctx);
    if (!check) return;

    const botId = ctx.options.getString('бот', true);
    const bot = await ctx.guild.members.fetch(botId).catch(() => null);
    if (!bot) {
      await sendErrorMessage({ ctx, content: 'Вказаного бота не знайдено на сервері.' });
      return;
    }

    const botBump = await BumpBot.findOne({ guildId: ctx.guildId, botId }).lean();
    if (!botBump) {
      await sendErrorMessage({ ctx, content: 'Налаштування для вказаного бота відсутні.' });
      return;
    }

    await ctx.reply({
      embeds: [
        generateEmbed({
          title: '🤖 | Налаштування бота',
          color: bot.displayColor,
          description: `Бот: ${bot}\nКоманда: /${botBump.cmdName}\nПроміжок між бампами: ${reFormatDuration(botBump.cooldown)}\nКолір успіху: ${botBump.successColor}`,
        }),
      ],
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>({
          components: [
            new StringSelectMenuBuilder({
              custom_id: `bot_settings_${botId}`,
              placeholder: 'Оберіть налаштування',
              options: [
                { label: 'Змінити команду', value: 'change_cmd' },
                { label: 'Змінити проміжок', value: 'change_cooldown', description: 'Проміжок між бампами (1h/1m/1s)' },
                { label: 'Змінити колір', value: 'change_color', description: 'Колір успішного бампу' },
              ],
            }),
          ],
        }),
      ],
      ephemeral: true,
    });
  }

  public async deleteBumpBot(ctx: Subcommand.ChatInputCommandInteraction<'cached'>) {
    const check = await this.checkPerms(ctx);
    if (!check) return;

    const botId = ctx.options.getString('бот', true);

    const bot = await ctx.guild.members.fetch(botId).catch(() => null);
    if (!bot) {
      await sendErrorMessage({ ctx, content: 'Вказаного бота не знайдено на сервері.' });
      return;
    }

    const botBump = await BumpBot.findOne({ guildId: ctx.guildId, botId }).lean();
    if (!botBump) {
      await sendErrorMessage({ ctx, content: 'Налаштування для вказаного бота відсутні.' });
      return;
    }

    await ctx.reply({
      embeds: [
        generateEmbed({
          title: '🤖 | Видалення бота',
          color: bot.displayColor,
          description: `Ви дійсно хочете видалити налаштування бампів для бота ${bot}?`,
        }),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>({
          components: [
            new ButtonBuilder({
              custom_id: `bot_delete_confirm_${botId}`,
              emoji: '🗑️',
              label: 'Видалити',
              style: ButtonStyle.Danger,
            }),
            new ButtonBuilder({
              custom_id: `bot_delete_cancel_${botId}`,
              emoji: '❌',
              label: 'Скасувати',
              style: ButtonStyle.Secondary,
            }),
          ],
        }),
      ],
      ephemeral: true,
    });
  }

  public async birthdaySettings(ctx: Subcommand.ChatInputCommandInteraction<'cached'>) {
    const check = await this.checkPerms(ctx);
    if (!check) return;

    const setting = ctx.options.getString('налаштування', true);
    const options: BaseMessageOptions = {};

    let settings = await Settings.findOne({ guildId: ctx.guildId }).lean();
    if (!settings) settings = await Settings.create({ guildId: ctx.guildId });

    if (setting === 'notifyChannelId') {
      const channelSelectMenu = new ChannelSelectMenuBuilder({
        custom_id: `settings_birthdays_${setting}`,
        placeholder: 'Оберіть канал',
        channel_types: [ChannelType.GuildText],
        min_values: 0,
        max_values: 1,
      });

      if (!isNullOrUndefinedOrEmpty(settings.birthdays.notifyChannelId)) {
        channelSelectMenu.setDefaultChannels(settings.bumps.notifyChannelId);
      }

      options.embeds = [
        generateEmbed({
          color: Colors.DarkVividPink,
          title: '#️⃣ | Встановлення каналу для привітання',
          description: 'В списку нижче оберіть канал в який будуть надсилатись привітання з днем народження.',
        }),
      ];
      options.components = [new ActionRowBuilder<ChannelSelectMenuBuilder>({ components: [channelSelectMenu] })];
    } else if (setting === 'roleIds') {
      options.embeds = [
        generateEmbed({
          color: Colors.DarkVividPink,
          title: '👥 | Встановлення ролей для іменинників',
          description: 'В списку нижче оберіть ролі які тимчасово будуть надаватись іменинникам.',
        }),
      ];
      options.components = [
        new ActionRowBuilder<RoleSelectMenuBuilder>({
          components: [
            new RoleSelectMenuBuilder({
              custom_id: `settings_birthdays_${setting}`,
              placeholder: 'Оберіть ролі',
              min_values: 0,
              max_values: 25,
            }).setDefaultRoles(...settings.birthdays.roleIds),
          ],
        }),
      ];
    } else {
      options.embeds = [
        generateEmbed({
          color: Colors.DarkVividPink,
          title: '⌚ | Встановлення години привітання',
          description: 'В списку нижче оберіть годину в яку будуть надсилатись привітання з днем народження.',
        }),
      ];
      options.components = [
        new ActionRowBuilder<RoleSelectMenuBuilder>({
          components: [
            new StringSelectMenuBuilder({
              custom_id: `settings_birthdays_${setting}`,
              placeholder: 'Оберіть годину',
              min_values: 1,
              max_values: 1,
              options: range(0, 23, 1).map(hour => ({
                label: `${hour} година`,
                value: `${hour}`,
                default: hour === settings.birthdays.hour,
              })),
            }),
          ],
        }),
      ];
    }

    await ctx.reply({ ...options, ephemeral: true });
  }

  private async checkPerms(ctx: Subcommand.ChatInputCommandInteraction<'cached'>) {
    if (!ctx.memberPermissions.has(8n)) {
      await sendErrorMessage({
        ctx,
        content: 'У вас недостатньо прав для виконання цієї команди.',
      });
      return false;
    }

    return true;
  }
}
