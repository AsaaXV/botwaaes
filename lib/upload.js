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
import fs from "fs"
import axios from "axios"
import FormData from "form-data"

const uploader = {}

uploader.zass = async (filePath) => {
  try {
    const form = new FormData()
    form.append("file", fs.createReadStream(filePath))

    const res = await axios.post(
      "https://cdn.zass.in/upload",
      form,
      { headers: { ...form.getHeaders() } }
    )

    if (!res.data?.success || !res.data?.url) {
      throw new Error("Upload gagal (zass)")
    }

    return res.data.url
  } catch (err) {
    throw new Error("Zass CDN error: " + err.message)
  }
}

uploader.ryuudev = async (filePath) => {
  try {
    const form = new FormData()
    form.append("image", fs.createReadStream(filePath))
    form.append("title", "Upload via WhatsApp Bot")

    const res = await axios.post(
      "https://ryuu-dev.offc.my.id/tools/upload-image",
      form,
      { headers: { ...form.getHeaders() } }
    )

    const data = res.data

    if (!data.success || !data.result?.success) {
      throw new Error("Upload gagal (ryuudev)")
    }

    return data.result.data.link
  } catch (err) {
    throw new Error("Ryuudev error: " + err.message)
  }
}

uploader.catbox = async (filePath) => {
  try {
    const form = new FormData()
    form.append("reqtype", "fileupload")
    form.append("fileToUpload", fs.createReadStream(filePath))

    const res = await axios.post(
      "https://catbox.moe/user/api.php",
      form,
      { headers: { ...form.getHeaders() } }
    )

    if (!res.data.startsWith("https://")) {
      throw new Error("Upload gagal (catbox)")
    }

    return res.data.trim()
  } catch (err) {
    throw new Error("Catbox error: " + err.message)
  }
}

uploader.uguu = async (filePath) => {
  try {
    const form = new FormData()
    form.append("files[]", fs.createReadStream(filePath))

    const res = await axios.post(
      "https://uguu.se/upload.php",
      form,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
          ...form.getHeaders()
        }
      }
    )

    if (!res.data?.files?.[0]?.url) {
      throw new Error("Upload gagal (uguu)")
    }

    return res.data.files[0].url
  } catch (err) {
    throw new Error("Uguu error: " + err.message)
  }
}

uploader.auto = async (filePath) => {
  const providers = [uploader.zass, uploader.uguu, uploader.catbox]
  let lastError
  for (const provider of providers) {
    try {
      return await provider(filePath)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error("Semua provider upload gagal")
}

export default uploader