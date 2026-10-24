const {
  SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');
const store = require('../db');
const { embed } = require('../utils');

const textChan = (o, desc = 'Channel tujuan') =>
  o.setName('channel').setDescription(desc).addChannelTypes(ChannelType.GuildText).setRequired(true);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set')
    .setDescription('Configure the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('ticket').setDescription('Set up a channel for creating support tickets').addChannelOption((o) => textChan(o, 'Channel untuk panel tiket')))
    .addSubcommand((s) => s.setName('ban').setDescription('Configure ban notifications').addChannelOption((o) => textChan(o)))
    .addSubcommand((s) => s.setName('kick').setDescription('Configure kick notifications').addChannelOption((o) => textChan(o)))
    .addSubcommand((s) => s.setName('mute').setDescription('Configure mute/timeout notifications').addChannelOption((o) => textChan(o)))
    .addSubcommand((s) => s.setName('welcome').setDescription('Set the welcome message channel').addChannelOption((o) => textChan(o)))
    .addSubcommand((s) => s.setName('goodbye').setDescription('Set the goodbye message channel').addChannelOption((o) => textChan(o)))
    .addSubcommand((s) => s.setName('chat').setDescription('Enable/disable AI chat in this channel')
      .addBooleanOption((o) => o.setName('status').setDescription('true = aktif, false = nonaktif').setRequired(true)))
    .addSubcommand((s) => s.setName('level').setDescription('Configure the leveling system (Admin Only)')
      .addBooleanOption((o) => o.setName('status').setDescription('Aktif / nonaktif').setRequired(true))
      .addChannelOption((o) => o.setName('channel').setDescription('Channel pengumuman level-up (opsional)').addChannelTypes(ChannelType.GuildText))),

  async execute(i) {
    const sub = i.options.getSubcommand();
    const g = i.guild.id;
    const eph = MessageFlags.Ephemeral;

    if (['ban', 'kick', 'mute'].includes(sub)) {
      const ch = i.options.getChannel('channel');
      store.set(g, `log_${sub}`, ch.id);
      return i.reply({ content: `✅ Notifikasi **${sub}** akan dikirim ke ${ch}.`, flags: eph });
    }
    if (sub === 'welcome' || sub === 'goodbye') {
      const ch = i.options.getChannel('channel');
      store.set(g, `${sub}_channel`, ch.id);
      return i.reply({ content: `✅ Channel **${sub}** diatur ke ${ch}.`, flags: eph });
    }
    if (sub === 'chat') {
      const on = i.options.getBoolean('status');
      let list = store.getJSON(g, 'ai_channels', []);
      list = on ? [...new Set([...list, i.channelId])] : list.filter((x) => x !== i.channelId);
      store.setJSON(g, 'ai_channels', list);
      const warn = on && !process.env.GEMINI_API_KEY ? '\n⚠️ `GEMINI_API_KEY` belum diisi di environment.' : '';
      return i.reply({ content: `🤖 AI chat di channel ini: **${on ? 'AKTIF' : 'NONAKTIF'}**${warn}`, flags: eph });
    }
    if (sub === 'level') {
      const on = i.options.getBoolean('status');
      const ch = i.options.getChannel('channel');
      store.set(g, 'level_on', on ? '1' : '0');
      if (ch) store.set(g, 'level_channel', ch.id);
      return i.reply({ content: `📈 Leveling: **${on ? 'AKTIF' : 'NONAKTIF'}**${ch ? ` — pengumuman di ${ch}` : ''}`, flags: eph });
    }
    if (sub === 'ticket') {
      const ch = i.options.getChannel('channel');
      store.set(g, 'ticket_channel', ch.id);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket:open').setLabel('Buat Tiket').setEmoji('🎫').setStyle(ButtonStyle.Success));
      await ch.send({
        embeds: [embed('🎫 Support Tickets', 'Butuh bantuan? Tekan tombol di bawah untuk membuat tiket privat dengan staff.')],
        components: [row],
      });
      return i.reply({ content: `✅ Panel tiket dikirim ke ${ch}.`, flags: eph });
    }
  },
};
