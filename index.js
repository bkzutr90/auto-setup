require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,      // privileged
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,    // privileged
    GatewayIntentBits.GuildModeration,
  ],
});

client.commands = new Collection();
const cmdDir = path.join(__dirname, 'src/commands');
for (const f of fs.readdirSync(cmdDir).filter((f) => f.endsWith('.js'))) {
  for (const c of [].concat(require(path.join(cmdDir, f)))) client.commands.set(c.data.name, c);
}

const evDir = path.join(__dirname, 'src/events');
for (const f of fs.readdirSync(evDir).filter((f) => f.endsWith('.js'))) {
  for (const e of [].concat(require(path.join(evDir, f)))) {
    client.on(e.name, async (...args) => {
      try { await e.execute(...args, client); }
      catch (err) { console.error(`[event:${e.name}]`, err); }
    });
  }
}

client.once(Events.ClientReady, async (c) => {
  const body = [...client.commands.values()].map((x) => x.data.toJSON());
  try {
    if (process.env.DEV_GUILD_ID) await c.application.commands.set(body, process.env.DEV_GUILD_ID);
    else await c.application.commands.set(body);
    console.log(`Registered ${body.length} commands`);
  } catch (err) { console.error('Command registration failed:', err); }
  c.user.setPresence({
    activities: [{ name: '/help | Use to see commands', type: ActivityType.Watching }],
  });
  console.log(`Logged in as ${c.user.tag}`);
});

process.on('unhandledRejection', (e) => console.error('unhandledRejection', e));
client.login(process.env.DISCORD_TOKEN);
