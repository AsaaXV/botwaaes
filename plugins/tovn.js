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

import { AudioToOpus } from "@ryuu-reinzz/luna-lib";
import { videoToAudio } from "../lib/convert.js";

let handler = async (m, { zassbtz, example }) => {
  let quoted = m.quoted ? m.quoted : m;
  let mime = (quoted.msg || quoted).mimetype || "";

  if (!/audio|video/.test(mime)) {
    return example("(reply audio/video untuk diubah jadi voice note)");
  }

  await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

  try {
    let buffer = await zassbtz.downloadMediaMessage(quoted);
    if (/video/.test(mime)) buffer = await videoToAudio(buffer, "mp3");

    const opus = await AudioToOpus(buffer);

    await zassbtz.sendMessage(
      m.chat,
      { audio: opus, mimetype: "audio/ogg; codecs=opus", ptt: true },
      { quoted: m }
    );
  } catch (err) {
    console.error(err);
    m.reply(`❌ Error: ${err.message}`);
  }
};

handler.command = ["tovn", "toptt"];
handler.tags = ["tools"];
handler.help = ["tovn"];

export default handler;
