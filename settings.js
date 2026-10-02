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
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import moment from "moment-timezone";

//——————————[ Config Owner ]——————————//
global.ownernumber = '' // Ganti nomer mu
global.ownername = ''

//——————————[ Config Bot ]——————————//
global.namabot = "Kuroko Botz"
global.nomorbot = '' // Ganti no botmu
global.pair = "KUROKOKU"
global.version = '6.6.1'
global.prefix = '°zZ#$@+,.?=\'\'():√%!¢£¥€π¤ΠΦ&><`™©®Δ^βα¦|/\\©^'

// false = nonaktif, true = aktif
global.owneronly = true // true = self (hanya owner), false = public
global.autojoingc = false
global.anticall = false
global.autoreadsw = false
global.autoread = false

//——————————[ Config Sosmed ]——————————//
global.web = "https://shirokode.web.id"
global.linkSaluran = "https://whatsapp.com/channel/0029Vb6w7eO9sBIEUYRgeC30"
global.idSaluran = "120363421570647022@newsletter"
global.nameSaluran = "Shirokode Ch."

//——————————[ Config Wm ]——————————//
global.packname = `Dιвυαт σℓєн Kυяσкσ Bσтz
⏰ ${moment.tz("Asia/Makassar").format("HH:mm:ss")}
Sєωα вσт ρυѕнкσитαк? Cнαт: ${ownernumber}`
global.author = ``
global.foother = '© 2026 - Made By Zass Desuta'

//——————————[ Config Payment ]——————————//
// Note : Kalau gada isi aja jadi false
global.dana = "085298027445"
global.ovo = false
global.gopay = "085298027445"
global.qris = false
global.an = {
    dana: "nama_dana",
    ovo: "nama_ovo",
    gopay: "nama_gopay"
}

//——————————[ Config Media ]——————————//
global.img = "https://cdn.zass.in/FbLNWbdBWH.jpg"
global.thumbxm = "https://cdn.zass.in/mHTr17wX9h.jpg"
global.thumbbc = "https://cdn.zass.in/MN6qW1z4iH.png"
global.thumb = "https://cdn.zass.in/YQiS1s3Im1.jpg"
global.favicon = "https://cdn.zass.in/DEYBJTN5PV.png"
global.vnMenu = "https://cdn.zass.in/utZPNPyOtw.mp3"

//——————————[ Config Broadcast ]——————————//
// Delay Jpm & Pushctc || 1000 = 1detik
global.delayJpm = 3500
global.delayPushkontak = 5000
global.namakontak = "AutoSave Kuroko"

//——————————[ Config Message ]——————————//
global.mess = {
  success: 'Sєℓєѕαι. Bєянαѕιℓ ∂ιєкѕєкυѕι.',
  wait: 'Tυиɢɢυ ѕєвєитαя. Aкυ ѕє∂αиɢ вєкєяנα...',
  admin: 'Kαмυ вυкαи A∂мιи ∂ι ѕιиι.',
  botAdmin: 'Aкυ вєℓυм мєиנα∂ι A∂мιи ∂ι Gяσυρ ιиι.',
  creator: 'Kαмυ ѕιαρα? Pєяιитαн ιиι нαиуα υитυк Oωиєякυ.',
  group: 'Nɢɢαк вιѕα ∂ι ѕιиι. Pαкαι ∂ι Gяσυρ.',
  private: 'Pαкαι ∂ι Cнαт Pяιвαт αנα.',
  error: 'Tєяנα∂ι Eяяσя. Cσвα ℓαɢι.',
  limit: 'Lιмιтмυ нαвιѕ. Iѕтιяαнαт ∂υℓυ уα.',
}


// *** message *** 
global.closeMsgInterval = 30; // 30 menit. maksimal 60 menit, minimal 1 menit
global.backMsgInterval = 2; // 2 jam. maksimal 24 jam, minimal 1 jam


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let file = __filename;
fs.watchFile(file, async () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${file}`));
    try {
        const module = await import(`${file}?update=${Date.now()}`); 
    } catch (err) {
        console.error(err);
    }
});