import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { AutocompleteInteraction } from 'discord.js';
import BumpBot from '#models/BumpBot';

@ApplyOptions<InteractionHandler.Options>({ interactionHandlerType: InteractionHandlerTypes.Autocomplete })
export default class BotOptionHandler extends InteractionHandler {
  public override parse(ctx: AutocompleteInteraction<'cached'>) {
    if (ctx.commandName === 'settings' && ctx.options.getFocused(true).name === 'бот') return this.some();

    return this.none();
  }

  public override async run(ctx: AutocompleteInteraction<'cached'>) {
    const botsRaw = await BumpBot.find({ guildId: ctx.guild.id }).lean();

    const bots = botsRaw.map(bot => ctx.guild.members.cache.get(bot.botId)).filter(bot => !!bot);

    await ctx.respond(bots.map(bot => ({ name: bot.displayName, value: bot.id })));
  }
}
