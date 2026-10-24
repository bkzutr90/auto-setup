// t: 'text' | 'voice' | ro: read-only | key: disimpan sebagai setting channel
const templates = {
  basic: {
    label: 'Basic', emoji: '📁',
    categories: [
      {
        name: '「✦ 📄｜GENERAL ✦」',
        channels: [
          { t: 'text', n: '📢｜announcements', ro: true, key: 'announce_channel' },
          { t: 'text', n: '📌｜rules', ro: true },
          { t: 'text', n: '💬｜general' },
          { t: 'text', n: '🎵｜music-request' },
          { t: 'text', n: '🛠｜voice-settings' },
          { t: 'voice', n: '➕｜Join to Create' },
        ],
      },
    ],
  },
  community: {
    label: 'Community', emoji: '🏘️',
    categories: [
      {
        name: '「✦ 📄｜INFORMATION ✦」', readonly: true,
        channels: [
          { t: 'text', n: '📢｜announcements', key: 'announce_channel' },
          { t: 'text', n: '📌｜rules' },
          { t: 'text', n: '🎉｜welcome', key: 'welcome_channel' },
          { t: 'text', n: '👋｜goodbye', key: 'goodbye_channel' },
          { t: 'text', n: '📄｜roles' },
        ],
      },
      {
        name: '「✦ 💬｜GENERAL ✦」',
        channels: [
          { t: 'text', n: '💬｜general' },
          { t: 'text', n: '😂｜memes' },
          { t: 'text', n: '🖼｜media' },
          { t: 'text', n: '🤖｜bot-commands' },
          { t: 'voice', n: '🔊｜Lounge' },
        ],
      },
      {
        name: '「✦ 🎮｜GAMING ✦」',
        channels: [
          { t: 'text', n: '🎮｜gaming' },
          { t: 'text', n: '🎬｜clips' },
          { t: 'voice', n: '🎧｜Game 1' },
          { t: 'voice', n: '🎧｜Game 2' },
        ],
      },
      {
        name: '「✦ 🎵｜MUSIC ✦」',
        channels: [
          { t: 'text', n: '🎵｜music-request' },
          { t: 'voice', n: '🎶｜Music 1' },
        ],
      },
      {
        name: '「✦ 🆘｜SUPPORT ✦」',
        channels: [
          { t: 'text', n: '🆘｜help' },
          { t: 'text', n: '🎫｜tickets', key: 'ticket_channel' },
          { t: 'voice', n: '🔊｜Support Voice' },
        ],
      },
    ],
  },
};

// Selalu dibuat otomatis di setiap template
const zone = {
  name: '「✦ 🤖｜AI ZONE ✦」',
  channels: [{ t: 'text', n: '🧠｜ai-chat', key: 'ai_channel' }],
};

module.exports = { templates, zone };
