import { Colors, RoleSelectMenuInteraction } from 'discord.js';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { generateEmbed, sendErrorMessage } from '#utils/embed';
import { ApplyOptions } from '@sapphire/decorators';
import Settings from '#models/Settings';
@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.SelectMenu })
export class BumpNotifySelectHandler extends InteractionHandler {
  public override parse(ctx: RoleSelectMenuInteraction<'cached'>) {
    if (ctx.customId !== 'settings_bumps_mentionRoleIds') return this.none();

    return this.some();
  }

  public override async run(ctx: RoleSelectMenuInteraction<'cached'>) {
    if (!ctx.memberPermissions.has(8n)) {
      await sendErrorMessage({ ctx, content: 'У вас недостатньо прав для виконання цієї дії.' });
      return;
    }

    const roles = [...ctx.roles.values()];

    await Settings.findOneAndUpdate(
      { guildId: ctx.guildId },
      { 'bumps.mentionRoleIds': roles.map(role => role.id) },
      { upsert: true, new: true },
    );

    await ctx.update({
      embeds: [
        generateEmbed({
          color: Colors.Green,
          title: '✅ | Налаштування збережено',
          description: `Ви змінили ролі для згадування при нагадуванні бампів.`,
        }),
      ],
      components: [],
    });
  }
}
