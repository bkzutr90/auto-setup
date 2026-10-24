const { Events } = require('discord.js');
const store = require('../db');
const { embed, BOT_NAME } = require('../utils');
const { need } = require('../commands/level');

const cooldown = new Map();

const MODEL = () => process.env.GEMINI_MODEL || 'gemini-3.8-flash';

async function askAI(channel, botId) {
  const fetched = await channel.messages.fetch({ limit: 12 });
  const turns = [];
  for (const m of [...fetched.values()].reverse()) {
    if (!m.content?.trim()) continue;
    const role = m.author.id === botId ? 'model' : 'user';
    const text = role === 'user' ? `${m.member?.displayName ?? m.author.username}: ${m.content}` : m.content;
    if (turns.length && turns[turns.length - 1].role === role) turns[turns.length - 1].parts[0].text += `\n${text}`;
    else turns.push({ role, parts: [{ text }] });
  }
  while (turns.length && turns[0].role !== 'user') turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== 'user') return null;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL()}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: `Kamu adalah ${BOT_NAME}, asisten ramah di server Discord. Balas singkat, natural, dan dalam bahasa yang dipakai user. Pesan user diawali nama mereka; jangan awali balasanmu dengan namamu.` }],
      },
      contents: turns,
      generationConfig: { maxOutputTokens: 1500 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  return text || null;
}

async function handleLevel(msg) {
  const g = msg.guild.id;
  if (store.get(g, 'level_on', '1') !== '1') return;
  const key = `${g}:${msg.author.id}`;
  if (Date.now() - (cooldown.get(key) ?? 0) < 60_000) return;
  cooldown.set(key, Date.now());

  const { db } = store;
  const row = db.prepare('SELECT xp, level FROM levels WHERE guild_id = ? AND user_id = ?').get(g, msg.author.id) ?? { xp: 0, level: 0 };
  let { xp, level } = row;
  xp += 15 + Math.floor(Math.random() * 11);
  let leveled = false;
  while (xp >= need(level)) { xp -= need(level); level++; leveled = true; }
  db.prepare(`INSERT INTO levels (guild_id, user_id, xp, level, last_msg) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET xp = excluded.xp, level = excluded.level, last_msg = excluded.last_msg`)
    .run(g, msg.author.id, xp, level, Date.now());

  if (leveled) {
    const chId = store.get(g, 'level_channel');
    const ch = (chId && msg.guild.channels.cache.get(chId)) || msg.channel;
    await ch.send({ content: `${msg.author}`, embeds: [embed('🎉 Level Up!', `Selamat ${msg.author}, kamu naik ke **level ${level}**!`)] });
  }
}

module.exports = {
  name: Events.MessageCreate,
  async execute(msg, client) {
    if (msg.author.bot || !msg.guild) return;

    await handleLevel(msg).catch((e) => console.error('[level]', e));

    const aiChannels = store.getJSON(msg.guild.id, 'ai_channels', []);
    if (!aiChannels.includes(msg.channelId) || !process.env.GEMINI_API_KEY) return;
    if (msg.content.startsWith('!')) return; // awali dengan ! agar diabaikan bot
    try {
      await msg.channel.sendTyping();
      const reply = await askAI(msg.channel, client.user.id);
      if (reply) await msg.reply({ content: reply.slice(0, 1990), allowedMentions: { repliedUser: false, parse: [] } });
    } catch (e) { console.error('[ai]', e.message); }
  },
};
