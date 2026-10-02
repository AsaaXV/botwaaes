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

let handler = async (m, { zassbtz, isAdmins, isBotAdmins, reply }) => {
  if (!m.isGroup) return reply(mess.group);
  if (!isAdmins) return reply(mess.admin);
  if (!isBotAdmins) return reply(mess.botAdmin);

  if (!m.quoted) return reply("Reply pesan yang mau dihapus, baru ketik *.delete*");

  try {
    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });
    await zassbtz.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.quoted.id,
        participant: m.quoted.sender
      }
    });
  } catch (err) {
    console.log(err);
    reply("❌ Gagal menghapus pesan, mungkin pesan terlalu lama atau bukan dari member.");
  }
};

handler.command = ["delete", "del"];
handler.tags = ["group"];
handler.help = ["delete"];
handler.group = true;

export default handler;