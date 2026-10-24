const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { templates, zone } = require('../templates');
const store = require('../db');
const { embed } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Automatically set up server channels using a template')
    .addStringOption((o) =>
      o.setName('type').setDescription('Template yang dipakai').setRequired(true)
        .addChoices(...Object.entries(templates).map(([v, t]) => ({ name: `${t.emoji} ${t.label}`, value: v }))))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(i) {
    await i.deferReply();
    const tpl = templates[i.options.getString('type')];
    const guild = i.guild;
    const cats = [...tpl.categories, zone];
    const aiChannels = store.getJSON(guild.id, 'ai_channels', []);
    let nCats = 0, nChans = 0;
    const summary = [];

    for (const cat of cats) {
      const readonly = cat.readonly || false;
      const overwrites = readonly
        ? [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }]
        : [];
      const parent = await guild.channels.create({
        name: cat.name, type: ChannelType.GuildCategory, permissionOverwrites: overwrites,
      });
      nCats++;
      summary.push(`\n**${cat.name}**`);

      for (const c of cat.channels) {
        const ow = c.ro && !readonly
          ? [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }]
          : [];
        const ch = await guild.channels.create({
          name: c.n, parent: parent.id,
          type: c.t === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
          permissionOverwrites: ow,
        });
        nChans++;
        if (c.key === 'ai_channel') { if (!aiChannels.includes(ch.id)) aiChannels.push(ch.id); }
        else if (c.key) store.set(guild.id, c.key, ch.id);
        summary.push(`${c.t === 'voice' ? '🔊' : '#'} ${ch}`);
      }
    }
    store.setJSON(guild.id, 'ai_channels', aiChannels);

    const desc = [
      `✅ Template **${tpl.emoji} ${tpl.label}** berhasil diterapkan!`,
      `\n📂 ${nCats} categories created\n💬 ${nChans} channels created`,
      cats.some((c) => c.readonly) ? '\n🔒 Kategori **INFORMATION** read-only untuk @everyone' : '',
      '\n🤖 Kategori **AI ZONE** selalu dibuat otomatis',
      '\n📋 **Channel Summary**', ...summary,
    ].join('\n').slice(0, 4000);
    await i.editReply({ embeds: [embed('Server Setup Complete!', desc)] });
  },
};
