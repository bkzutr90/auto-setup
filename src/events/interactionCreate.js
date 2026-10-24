const {
  Events, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');
const { embed } = require('../utils');

const isStaff = (m) => m.permissions.has(PermissionFlagsBits.ManageMessages);

module.exports = {
  name: Events.InteractionCreate,
  async execute(i, client) {
    if (i.isChatInputCommand()) {
      const cmd = client.commands.get(i.commandName);
      if (!cmd) return;
      if (!i.guild) return i.reply({ content: 'Perintah ini hanya bisa dipakai di server.', flags: MessageFlags.Ephemeral });
      try { await cmd.execute(i); }
      catch (err) {
        console.error(`[/${i.commandName}]`, err);
        const msg = { content: '❌ Terjadi error saat menjalankan perintah. Pastikan bot punya izin yang cukup.', flags: MessageFlags.Ephemeral };
        if (i.deferred || i.replied) await i.followUp(msg).catch(() => {});
        else await i.reply(msg).catch(() => {});
      }
      return;
    }

    if (!i.isButton()) return;

    if (i.customId === 'ticket:open') {
      const existing = i.guild.channels.cache.find((c) => c.topic === `ticket:${i.user.id}`);
      if (existing)
        return i.reply({ content: `Kamu masih punya tiket terbuka: ${existing}`, flags: MessageFlags.Ephemeral });

      const staffRoles = i.guild.roles.cache.filter((r) => !r.managed && r.permissions.has(PermissionFlagsBits.ManageMessages));
      const allow = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles];
      const ch = await i.guild.channels.create({
        name: `ticket-${i.user.username}`.slice(0, 90),
        type: ChannelType.GuildText,
        parent: i.channel.parentId ?? undefined,
        topic: `ticket:${i.user.id}`,
        permissionOverwrites: [
          { id: i.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: i.user.id, allow },
          { id: i.client.user.id, allow: [...allow, PermissionFlagsBits.ManageChannels] },
          ...staffRoles.map((r) => ({ id: r.id, allow })),
        ],
      });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket:close').setLabel('Tutup Tiket').setEmoji('🔒').setStyle(ButtonStyle.Danger));
      await ch.send({
        content: `${i.user}`,
        embeds: [embed('🎫 Tiket dibuat', 'Jelaskan masalahmu, staff akan segera membantu.')],
        components: [row],
      });
      return i.reply({ content: `✅ Tiket dibuat: ${ch}`, flags: MessageFlags.Ephemeral });
    }

    if (i.customId === 'ticket:close') {
      const ownerId = i.channel.topic?.replace('ticket:', '');
      if (i.user.id !== ownerId && !isStaff(i.member))
        return i.reply({ content: '❌ Hanya pembuat tiket atau staff yang bisa menutup.', flags: MessageFlags.Ephemeral });
      await i.reply('🔒 Tiket akan dihapus dalam 5 detik...');
      setTimeout(() => i.channel.delete().catch(() => {}), 5000);
    }
  },
};
