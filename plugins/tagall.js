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

let handler = async (m, { zassbtz, isAdmins, isBotAdmins, reply, text }) => {
  if (!m.isGroup) return reply(mess.group);
  if (!isAdmins) return reply(mess.admin);
  if (!isBotAdmins) return reply(mess.botAdmin);

  let metadata = await zassbtz.groupMetadata(m.chat);
  let teks = `📢 *TagAll oleh Admin*\n\n${text ? text + "\n\n" : ""}`;
  let mentionAll = metadata.participants.map(a => a.id);
  mentionAll.forEach(u => (teks += `👤 @${u.split('@')[0]}\n`));

  await zassbtz.sendMessage(m.chat, { text: teks, mentions: mentionAll });
};

handler.command = ["tagall"];
handler.tags = ["group"];
handler.help = ["tagall"];
handler.group = true;

export default handler;