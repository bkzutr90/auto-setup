// Satu file untuk beberapa event moderasi + welcome/goodbye
const { Events } = require('discord.js');
const { embed, getChannel, recentAudit, AuditLogEvent } = require('../utils');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = [
  {
    name: Events.GuildBanAdd,
    async execute(ban) {
      const ch = getChannel(ban.guild, 'log_ban');
      if (!ch) return;
      await wait(1000);
      const entry = await recentAudit(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
      await ch.send({
        embeds: [embed('🔨 Member Banned',
          `**User:** ${ban.user.tag} (${ban.user.id})\n**By:** ${entry?.executor ?? 'Unknown'}\n**Reason:** ${entry?.reason ?? ban.reason ?? 'No reason'}`, 0xed4245)],
      });
    },
  },
  {
    name: Events.GuildMemberRemove,
    async execute(member) {
      await wait(1500);
      const entry = await recentAudit(member.guild, AuditLogEvent.MemberKick, member.id);
      if (entry) {
        const ch = getChannel(member.guild, 'log_kick');
        if (ch) await ch.send({
          embeds: [embed('👢 Member Kicked',
            `**User:** ${member.user.tag} (${member.id})\n**By:** ${entry.executor}\n**Reason:** ${entry.reason ?? 'No reason'}`, 0xe67e22)],
        });
        return;
      }
      const bye = getChannel(member.guild, 'goodbye_channel');
      if (bye) await bye.send({ embeds: [embed('👋 Goodbye', `**${member.user.username}** telah meninggalkan server.`, 0x95a5a6)] });
    },
  },
  {
    name: Events.GuildMemberUpdate,
    async execute(oldM, newM) {
      const before = oldM.communicationDisabledUntilTimestamp;
      const after = newM.communicationDisabledUntilTimestamp;
      if (before === after || !after || after < Date.now()) return;
      const ch = getChannel(newM.guild, 'log_mute');
      if (!ch) return;
      await wait(1000);
      const entry = await recentAudit(newM.guild, AuditLogEvent.MemberUpdate, newM.id);
      await ch.send({
        embeds: [embed('🔇 Member Timed Out',
          `**User:** ${newM.user.tag} (${newM.id})\n**By:** ${entry?.executor ?? 'Unknown'}\n**Until:** <t:${Math.floor(after / 1000)}:F>\n**Reason:** ${entry?.reason ?? 'No reason'}`, 0xf1c40f)],
      });
    },
  },
  {
    name: Events.GuildMemberAdd,
    async execute(member) {
      const ch = getChannel(member.guild, 'welcome_channel');
      if (!ch) return;
      await ch.send({
        content: `${member}`,
        embeds: [embed('🎉 Welcome!', `Selamat datang di **${member.guild.name}**, ${member}!\nKamu member ke-**${member.guild.memberCount}**.`)],
      });
    },
  },
];
