const { SlashCommandBuilder } = require('discord.js');
const { embed } = require('../utils');

module.exports = [
  {
    data: new SlashCommandBuilder().setName('help').setDescription('Daftar perintah'),
    async execute(i) {
      const lines = [...i.client.commands.values()].map((c) => `\`/${c.data.name}\` — ${c.data.description}`);
      await i.reply({ embeds: [embed('📖 Commands', lines.join('\n'))] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('ping').setDescription('Cek latency bot'),
    async execute(i) { await i.reply(`🏓 ${Math.round(i.client.ws.ping)}ms`); },
  },
];
