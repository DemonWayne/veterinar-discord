import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { checkMessage } from '#lib/controllers/bumps';

export class MessageCreateListener extends Listener {
  public async run(message: Message<true>) {
    await checkMessage(message);
  }
}
