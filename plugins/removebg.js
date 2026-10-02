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

let handler = async (m, { zassbtz, text, example, axios, fs, uploader, isUrl }) => {
  let quoted = m.quoted ? m.quoted : m;
  let mime = (quoted.msg || quoted).mimetype || "";
  let imgUrl = isUrl(text) ? text.trim() : null;

  if (!imgUrl && !/image/.test(mime)) {
    return example("(reply gambar / kirim gambar dengan caption ini, atau sertakan URL gambar)");
  }

  await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

  let mediaPath;
  try {
    if (!imgUrl) {
      mediaPath = await zassbtz.downloadAndSaveMediaMessage(quoted);
      imgUrl = await uploader.auto(mediaPath);
    }

    if (!imgUrl) return m.reply("❌ Gagal mendapatkan URL gambar.");

    const { data } = await axios.get("https://api.ammaricano.my.id/api/ai/removal", {
      params: { imgUrl },
      headers: { accept: "application/json" },
    });

    const resultUrl = data?.result?.url || data?.result?.low_resolution;
    if (!data?.success || !resultUrl) return m.reply("❌ Gagal menghapus background gambar.");

    await zassbtz.sendMessage(
      m.chat,
      { image: { url: resultUrl }, caption: "✅ *Background berhasil dihapus!*" },
      { quoted: m }
    );
  } catch (err) {
    console.error(err);
    m.reply(`❌ Error: ${err.message}`);
  } finally {
    try { if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath); } catch {}
  }
};

handler.command = ["removebg"];
handler.tags = ["tools"];
handler.help = ["removebg <url>"];

export default handler;
