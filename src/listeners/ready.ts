import { birthdaysCheck, checkBirthdayRoles } from '#lib/controllers/birthdays';
import type { AdvancedClient } from '#lib/AdvancedClient';
import { Listener } from '@sapphire/framework';
import { bumpsCheck } from '#lib/controllers/bumps';

export class ClientListener extends Listener {
  public override async run(client: AdvancedClient<true>) {
    client.logger.info(`Application logged in as ${client.user?.tag}!`);

    for (const guild of client.guilds.cache.values()) {
      if (guild.memberCount !== guild.members.cache.size) {
        await guild.members.fetch();
        client.logger.info(`Fetched ${guild.memberCount} members in ${guild.name}!`);
      }
    }

    await this.cron(client);

    setInterval(async () => {
      await this.cron(client);
    }, 10 * 1000);
  }

  private async cron(client: AdvancedClient<true>) {
    await Promise.allSettled([
      (client.logger.debug(`Bumps check started.`), bumpsCheck(client)),
      (client.logger.debug(`Birthdays check started.`), birthdaysCheck(client)),
      (client.logger.debug(`Birthday roles check started.`), checkBirthdayRoles(client)),
    ]);
  }
}
