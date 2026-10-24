const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const store = require('./db');

const BOT_NAME = process.env.BOT_NAME || 'Ciel';
const COLOR = 0x57f287;

const embed = (title, desc, color = COLOR) =>
  new EmbedBuilder().setColor(color).setTitle(title).setDescription(desc)
    .setFooter({ text: `${BOT_NAME} Bot` }).setTimestamp();

const getChannel = (guild, key) => {
  const id = store.get(guild.id, key);
  return id ? guild.channels.cache.get(id) ?? null : null;
};

async function recentAudit(guild, type, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 6 });
    return logs.entries.find((e) => e.target?.id === targetId && Date.now() - e.createdTimestamp < 15000) ?? null;
  } catch { return null; }
}

module.exports = { BOT_NAME, COLOR, embed, getChannel, recentAudit, AuditLogEvent };
