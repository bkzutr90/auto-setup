const {
  SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');
const store = require('../db');
const { embed } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cleanup')
    .setDescription('Delete all channels & categories to redesign the server from scratch')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(i) {
    if (i.user.id !== i.guild.ownerId)
      return i.reply({ content: '❌ Hanya **owner server** yang bisa memakai perintah ini.', flags: MessageFlags.Ephemeral });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('cleanup_yes').setLabel('Ya, hapus semua').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('cleanup_no').setLabel('Batal').setStyle(ButtonStyle.Secondary),
    );
    const msg = await i.reply({
      content: '⚠️ **Semua channel & kategori akan dihapus** (kecuali channel ini). Tindakan ini tidak bisa dibatalkan. Lanjut?',
      components: [row], flags: MessageFlags.Ephemeral, fetchReply: true,
    });
    const btn = await msg.awaitMessageComponent({ filter: (b) => b.user.id === i.user.id, time: 30000 }).catch(() => null);
    if (!btn) return i.editReply({ content: 'Waktu habis, dibatalkan.', components: [] });
    if (btn.customId === 'cleanup_no') return btn.update({ content: 'Dibatalkan.', components: [] });

    await btn.update({ content: '🧹 Menghapus channel...', components: [] });
    const keep = i.channelId;
    const all = [...i.guild.channels.cache.values()].filter((c) => c.id !== keep);
    // hapus channel dulu, baru kategori
    for (const c of all.filter((c) => c.type !== 4)) await c.delete().catch(() => {});
    for (const c of all.filter((c) => c.type === 4)) await c.delete().catch(() => {});
    for (const k of ['announce_channel', 'welcome_channel', 'goodbye_channel', 'ticket_channel', 'ai_channels'])
      store.del(i.guild.id, k);

    await i.channel.send({
      embeds: [embed('Cleanup Finished!', `The server has been cleared by ${i.user}. You can now start designing it again with \`/setup\`.`, 0xfee75c)],
    });
  },
};
