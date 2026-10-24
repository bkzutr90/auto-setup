const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../db');
const { embed } = require('../utils');

const need = (lvl) => 5 * lvl * lvl + 50 * lvl + 100;

module.exports = [
  {
    data: new SlashCommandBuilder().setName('rank').setDescription('Lihat level kamu')
      .addUserOption((o) => o.setName('user').setDescription('User lain (opsional)')),
    async execute(i) {
      const u = i.options.getUser('user') ?? i.user;
      const r = db.prepare('SELECT xp, level FROM levels WHERE guild_id = ? AND user_id = ?').get(i.guild.id, u.id) ?? { xp: 0, level: 0 };
      const pos = db.prepare('SELECT COUNT(*) AS c FROM levels WHERE guild_id = ? AND (level > ? OR (level = ? AND xp > ?))')
        .get(i.guild.id, r.level, r.level, r.xp).c + 1;
      await i.reply({ embeds: [embed(`📈 ${u.username}`, `**Level:** ${r.level}\n**XP:** ${r.xp} / ${need(r.level)}\n**Peringkat:** #${pos}`)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('leaderboard').setDescription('Top 10 level di server'),
    async execute(i) {
      const rows = db.prepare('SELECT user_id, xp, level FROM levels WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT 10').all(i.guild.id);
      const text = rows.length ? rows.map((r, n) => `**${n + 1}.** <@${r.user_id}> — Lv ${r.level} (${r.xp} XP)`).join('\n') : 'Belum ada data.';
      await i.reply({ embeds: [embed('🏆 Leaderboard', text)], allowedMentions: { parse: [] } });
    },
  },
];
module.exports.need = need;
