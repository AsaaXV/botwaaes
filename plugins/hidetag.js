/*═══════════════════════════════════════════════════════
 *  ⌬  YT NeoShiroko Labs
 *═══════════════════════════════════════════════════════
 *  🌐  Website     : https://shirokode.web.id
 *  ⌨︎  Developer   : https://zass.in
 *  ▶︎  YouTube     : https://www.youtube.com/@shirokode
 *  ⚙︎  Panel Murah : pterokudesu.web.id
 *
 *  ⚠︎  Mohon untuk tidak menghapus watermark ini
 *═══════════════════ © 2025 Zass Desuta ─════════════════════
 */

let handler = async (m, { zassbtz, isAdmins, isBotAdmins, text, participants }) => {
  if (!m.isGroup) return m.reply(mess.group);
  if (!isAdmins) return m.reply(mess.admin);
  if (!isBotAdmins) return m.reply(mess.botAdmin);

  let message =
    text ||
    m.quoted?.text ||
    m.quoted?.caption;

  if (!message) return m.reply('Kirim teks atau reply pesan untuk dihidetag.');

  // fallback kalau participants kosong
  if (!participants || !participants.length) {
    const meta = await zassbtz.groupMetadata(m.chat);
    participants = meta.participants;
  }

  let member = participants.map(u => u.id);

  await zassbtz.sendMessage(m.chat, {
    text: message,
    mentions: member
  });
};

handler.command = ['hidetag', 'ht'];
handler.tags = ['group'];
handler.help = ['hidetag'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;