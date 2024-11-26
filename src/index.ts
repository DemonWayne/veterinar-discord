import 'dotenv/config';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-subcommands/register';
import { AdvancedClient } from '#lib/AdvancedClient';

export const client = new AdvancedClient<true>();

client.login();
