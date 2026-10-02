/*
 *═══════════════════════════════════════════════════════
 *  ⌬  YT NeoShiroko Labs
 *═══════════════════════════════════════════════════════
 *  🌐  Website     : https://shirokode.web.id
 *  ⌨︎  Developer   : https://zass.in
 *  ▶︎  YouTube     : https://www.youtube.com/@shirokode
 *  ⚙︎  Panel Murah : https://pterokudesu.web.id
 *
 *  ⚠︎  Mohon untuk tidak menghapus watermark ini
 *═══════════════════ © 2025 Zass Desuta ─════════════════════
 */

import { Button } from "@ryuu-reinzz/luna-lib";

let handler = async (m, { penting, zassbtz, isCreator }) => {
  if (!isCreator) return m.reply("⚠️ Fitur ini hanya untuk Developer bot!")

  const allGroups = await zassbtz.groupFetchAllParticipating()
  const groupIDs = Object.keys(allGroups).filter(id => !penting?.blacklistJpm?.includes(id))
  let sentCount = 0
  let failCount = 0
  let isAborted = false
  if (!groupIDs.length) return m.reply("❌ Tidak ada grup terdaftar.")

  const processMsg = await zassbtz.sendMessage(m.chat, { text: `⏳ *Memproses JPM Slide...*\nJumlah grup: ${groupIDs.length}\nTipe: Carousel Slide` }, { quoted: m })

  const dataSlide = [
    {
      title: `</> ${global.ownername} Menyediakan </>`,
      caption: `* Panel Pterodactyl Server Private
* Script Bot WhatsApp
* Domain (Request Nama Domain & Free Akses Cloudflare)
* Nokos WhatsApp All Region (Tergantung Stok!)
* Jasa Fix/Edit/Rename & Tambah Fitur Script Bot WhatsApp
* Jasa Suntik Followers/Like/Views All Sosmed
* Jasa Install Panel Pterodactyl
* Dan Lain Lain Langsung Tanyakan Saja.

* *Channel Testimoni :*
${global.linkSaluran}`,
      image: global.thumbbc,
      button: "Hubungi Kami",
      source: "https://wa.me/" + global.ownernumber,
    },
    {
      title: "</> List Panel Run Bot Private </>",
      caption: `* Ram 1GB : Rp2000
* Ram 2 GB : Rp3000
* Ram 3 GB : Rp4000
* Ram 4 GB : Rp5000
* Ram 5 GB : Rp6000
* Ram 6 GB : Rp7000
* Ram 7 GB : Rp8000
* Ram 8 GB : Rp9000
* Ram 9 GB : Rp10.000
* Ram Unlimited : Rp10.000

*Syarat & Ketentuan :*
_• Server private & kualitas terbaik!_
_• Script bot dijamin aman (anti drama/maling)_
_• Garansi 30 hari (unlimited replace)_
_• Server anti delay/lemot!_
_• Claim garansi wajib bawa bukti transaksi_`,
      image: global.thumbbc,
      button: "Beli Sekarang",
      source: "https://pterokudesu.web.id",
    },
    {
      title: "</> Simulasi Template Slide </>",
      caption: `* Tsundere : Rp99999
* Loli : Rp99999999999
* Milf : Rp99999999
* Kuudere : Rp9000
* Dandere : Rp99000
* Yandere : Rp1000
* Onee-chan : Rp999999999999999
* Shoujo : Rp9000
* Maid : Rp10.000

_Benefit:_
• Kualitas terbaik
• Anti drama
• Garansi sekian kali
• Anti delay
• Masih segel pastinya 😳`,
      image: global.thumbbc,
      button: "Klik aja",
      source: "https://hanime.tv",
    },
  ]

  for (let i = 0; i < groupIDs.length; i++) {
    const id = groupIDs[i]

    if (!zassbtz.ws?.isOpen) {
      isAborted = true
      console.log(`⚠️  JPM Slide dihentikan di grup ke-${i+1}: socket disconnect`)
      break
    }

    try {
      let builder = zassbtz.messageBuilder(id)
        .setType('Carousel')
        .setBody('*All Transaksi Open*\n*Cek Produk Kami Dibawah Ini*')
        .setFooter(global.foother || '')

      for (const item of dataSlide) {
        const card = await new Button(zassbtz)
          .setTitle(item.title)
          .setBody(item.caption)
          .setImage(item.image)
          .addUrl(item.button || 'Buka', item.source || 'https://shirokode.web.id', true)
          .toCard()

        builder = builder.addCard(card)
      }

      await builder.send()
      sentCount++
    } catch (err) {
      failCount++
      const errMsg = err.message || ''
      console.error(`❌ Gagal kirim JPM Slide ke ${id}:`, errMsg)

      if (errMsg.includes('Connection Closed') || errMsg.includes('stream') || errMsg.includes('timed out')) {
        isAborted = true
        console.log(`⚠️  JPM Slide dihentikan: ${errMsg}`)
        break
      }
    }

    if ((i + 1) % 10 === 0 || i + 1 === groupIDs.length) {
      try {
        await zassbtz.sendMessage(m.chat, {
          text: `⏳ *JPM Slide Progress...*\n${i+1}/${groupIDs.length} grup\n✅ ${sentCount} berhasil | ❌ ${failCount} gagal`,
          edit: processMsg.key
        })
      } catch {}
    }

    await new Promise(resolve => setTimeout(resolve, global.delayJpm || 4000))
  }

  const statusText = isAborted
    ? `⚠️ *JPM Slide Terhenti!* (koneksi terputus)\nTerkirim ke *${sentCount}* dari ${groupIDs.length} grup sebelum berhenti.`
    : `✅ *JPM Slide Selesai!*\nBerhasil: *${sentCount}* | Gagal: *${failCount}* dari total ${groupIDs.length} grup.`

  await zassbtz.sendMessage(m.chat, { text: statusText, edit: processMsg.key })
}

handler.help = ["jpmslide"]
handler.tags = ["owner"]
handler.command = ["jpmslide"]

export default handler;
