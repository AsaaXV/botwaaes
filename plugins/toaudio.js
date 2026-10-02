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

import { videoToAudio } from "../lib/convert.js";

let handler = async (m, { zassbtz, example }) => {
  let quoted = m.quoted ? m.quoted : m;
  let mime = (quoted.msg || quoted).mimetype || "";

  if (!/video/.test(mime)) {
    return example("(reply video untuk diambil audionya)");
  }

  await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

  try {
    const buffer = await zassbtz.downloadMediaMessage(quoted);
    const audio = await videoToAudio(buffer, "mp3");

    await zassbtz.sendMessage(
      m.chat,
      { audio, mimetype: "audio/mpeg", fileName: "audio.mp3" },
      { quoted: m }
    );
  } catch (err) {
    console.error(err);
    m.reply(`❌ Error: ${err.message}`);
  }
};

handler.command = ["toaudio", "videotoaudio"];
handler.tags = ["tools"];
handler.help = ["toaudio"];

export default handler;
