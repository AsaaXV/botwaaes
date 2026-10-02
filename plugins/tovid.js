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

import { webpToVideo } from "../lib/convert.js";

let handler = async (m, { zassbtz, example }) => {
  let quoted = m.quoted ? m.quoted : m;
  let mime = (quoted.msg || quoted).mimetype || "";

  if (!/webp/.test(mime)) {
    return example("(reply stiker animasi/gif untuk diubah jadi video)");
  }

  await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

  try {
    const buffer = await zassbtz.downloadMediaMessage(quoted);
    const video = await webpToVideo(buffer);

    await zassbtz.sendMessage(
      m.chat,
      { video, caption: "✅ *Berhasil diubah jadi video*" },
      { quoted: m }
    );
  } catch (err) {
    console.error(err);
    m.reply(`❌ Error: ${err.message}`);
  }
};

handler.command = ["tovid", "stickertovideo", "toanimasi"];
handler.tags = ["tools"];
handler.help = ["tovid"];

export default handler;
