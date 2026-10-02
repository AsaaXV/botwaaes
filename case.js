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


import "./settings.js";
import {
  clockString,
  parseMention,
  isUrl,
  sleep,
  runtime,
  getBuffer,
  jsonformat,
  capital,
  previewAd,
} from "./lib/myfunc.js";
import uploader from "./lib/upload.js";
import { getEmojiMixUrl } from "./lib/emojikitchen.js";
import {
  generateWAMessageFromContent,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  prepareWAMessageMedia,
  areJidsSameUser,
  getContentType,
  delay,
} from "@whiskeysockets/baileys";
import crypto from "crypto";
import { modul } from "./module.js";
import { exec, spawn, execSync } from "child_process";
import { color, bgcolor } from "./lib/color.js";
import path from "path";
import util from "util";
import * as logger from "./lib/logger.js";
const {
  os,
  axios,
  baileys,
  chalk,
  cheerio,
  fs,
  process,
  moment,
} = modul;
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

const readFile = util.promisify(fs.readFile);

const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

const yy1 = "`";
const yy2 = "```";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pluginsCache = [];
let pluginsSignatureCache = "";

function pluginsSignature(directory) {
  const files = fs.readdirSync(directory).filter((f) => f.endsWith(".js"));
  return files.map((f) => `${f}:${fs.statSync(path.join(directory, f)).mtimeMs}`).join("|");
}

async function loadPlugins(directory) {
  const plugins = [];
  const files = fs.readdirSync(directory).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(directory, file);
    try {
      const plugin = await import(`file://${filePath}?update=${Date.now()}`);
      const handler = plugin.default || plugin;
      if (handler && Array.isArray(handler.command)) plugins.push(handler);
    } catch (error) {
      logger.warn(`Gagal memuat plugin di ${filePath}: ${error.message}`);
    }
  }
  return plugins;
}

async function getPlugins() {
  const directory = path.resolve(__dirname, "plugins");
  const signature = pluginsSignature(directory);
  if (pluginsCache.length && signature === pluginsSignatureCache) return pluginsCache;

  pluginsSignatureCache = signature;
  pluginsCache = await loadPlugins(directory);
  return pluginsCache;
}

export default async function mainHandler(zassbtz, m, chatUpdate, store) {
try {
  const cachedGroupMeta = async (jid) => {
    const cache = global.groupCache
    const cached = cache?.get(jid)
    if (cached) return cached
    const meta = await zassbtz.groupMetadata(jid)
    cache?.set(jid, meta)
    return meta
  }

  async function groupStatus(sock, jid, content) {
    const { backgroundColor } = content;
    delete content.backgroundColor;

    const inside = await generateWAMessageContent(content, {
      upload: sock.waUploadToServer,
      backgroundColor
    });

    const messageSecret = crypto.randomBytes(32);

    const msg = generateWAMessageFromContent(
      jid,
      {
        messageContextInfo: { messageSecret },
        groupStatusMessageV2: {
          message: {
            ...inside,
            messageContextInfo: { messageSecret }
          }
        }
      },
      {}
    );

    await sock.relayMessage(jid, msg.message, {
      messageId: msg.key.id
    });

    return msg;
  }

  async function appenTextMessage(text, chatUpdate) {
    let messages = await generateWAMessage(
      m.chat,
      {
        text: text,
        mentions: m.mentionedJid,
      },
      {
        userJid: zassbtz.user.id,
        quoted: m.quoted && m.quoted.fakeObj,
      },
    );
    messages.key.fromMe = areJidsSameUser(m.sender, zassbtz.user.id);
    messages.key.id = m.key.id;
    messages.pushName = m.pushName;
    if (m.isGroup) messages.participant = m.sender;
    let msg = {
      ...chatUpdate,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: "append",
    };
    zassbtz.ev.emit("messages.upsert", msg);
  }
  const { type, quotedMsg, mentioned, now, fromMe } = m;
  let body = !m.message
    ? ""
    : m.mtype === "interactiveResponseMessage"
      ? JSON.parse(
          m.message.interactiveResponseMessage?.nativeFlowResponseMessage
            ?.paramsJson || "{}",
        ).id || ""
      : m.mtype === "conversation"
        ? m.message.conversation
        : m.mtype == "imageMessage"
          ? m.message.imageMessage?.caption
          : m.mtype == "videoMessage"
            ? m.message.videoMessage?.caption
            : m.mtype == "extendedTextMessage"
              ? m.message.extendedTextMessage?.text
              : m.mtype == "buttonsResponseMessage"
                ? m.message.buttonsResponseMessage?.selectedButtonId
                : m.mtype == "listResponseMessage"
                  ? m.message.listResponseMessage?.singleSelectReply
                      ?.selectedRowId
                  : m.mtype == "templateButtonReplyMessage"
                    ? m.message.templateButtonReplyMessage?.selectedId
                    : m.mtype == "messageContextInfo"
                      ? m.message.buttonsResponseMessage?.selectedButtonId ||
                        m.message.listResponseMessage?.singleSelectReply
                          ?.selectedRowId ||
                        m.text
                      : m.mtype === "editedMessage"
                        ? (m.message.editedMessage?.message?.protocolMessage
                            ?.editedMessage?.extendedTextMessage?.text ??
                          m.message.editedMessage?.message?.protocolMessage
                            ?.editedMessage?.conversation ??
                          m.message.protocolMessage?.editedMessage
                            ?.extendedTextMessage?.text ??
                          m.message.protocolMessage?.editedMessage
                            ?.conversation ??
                          "")
                        : m.mtype === "protocolMessage"
                          ? (m.message.protocolMessage?.editedMessage
                              ?.extendedTextMessage?.text ??
                            m.message.protocolMessage?.editedMessage
                              ?.conversation ??
                            "")
                          : "";

  body = body || "";

const thumbs = global.thumb
const randomThumbUrl = global.thumb

const budy = (typeof m.text == 'string' ? m.text : '.')
const prefixChars = global.prefix || '.'
const prefixCharClass = prefixChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
const prefixRegex = new RegExp(`^[${prefixCharClass}]`)
const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.'
  const chath = body;
  const pes = body;
  const messagesC = pes.slice(0).trim();
  const content = JSON.stringify(m.message || {});
  const isCmd = body.startsWith(prefix);
  const from = m.key.remoteJid;
  const messagesD = body.slice(0).trim().split(/ +/).shift().toLowerCase();
  const command = body
    .replace(prefix, "")
    .trim()
    .split(/ +/)
    .shift()
    .toLowerCase();
  const args = body.trim().split(/ +/).slice(1);
  const isCreator = await zassbtz.isOwnerJid(m.sender);
  const pushname = m.pushName || "Anomali";
  const q = args.join(" ");
  const text = q;
  const quoted = m.quoted ? m.quoted : m;
  const mime = (quoted.msg || quoted).mimetype || "";
  const qmsg = quoted.msg || quoted;
  const isMedia = /image|video|sticker|audio/.test(mime);
  const isImage = type == "imageMessage";
  const isVideo = type == "videoMessage";
  const isAudio = type == "audioMessage";
  const isSticker = type == "stickerMessage";
  const isQuotedImage =
    type === "extendedTextMessage" && content.includes("imageMessage");
  const isQuotedLocation =
    type === "extendedTextMessage" && content.includes("locationMessage");
  const isQuotedVideo =
    type === "extendedTextMessage" && content.includes("videoMessage");
  const isQuotedSticker =
    type === "extendedTextMessage" && content.includes("stickerMessage");
  const isQuotedAudio =
    type === "extendedTextMessage" && content.includes("audioMessage");
  const isQuotedContact =
    type === "extendedTextMessage" && content.includes("contactMessage");
  const isQuotedDocument =
    type === "extendedTextMessage" && content.includes("documentMessage");
  const sender = m.isGroup
    ? m.key.participant
      ? m.key.participant
      : m.participant
    : m.key.remoteJid;
  const senderNumber = sender.split("@")[0];
  const isGroup = m.chat.endsWith('@g.us')
  const groupMetadata = m.isGroup
    ? await cachedGroupMeta(m.chat).catch((e) => {})
    : "";
  const participants =
    m.isGroup && groupMetadata ? groupMetadata.participants : [];
  const groupAdmins = m.isGroup
    ? await participants.filter((v) => v.admin !== null).map((v) => v.id)
    : [];
  const groupName = m.isGroup && groupMetadata ? groupMetadata.subject : [];
  const groupOwner = m.isGroup && groupMetadata ? groupMetadata.owner : [];
  const groupMembership =
    m.isGroup && groupMetadata ? groupMetadata.membership : [];
  const groupMembers =
    m.isGroup && groupMetadata ? groupMetadata.participants : [];
  const isBotAdmins = m.isGroup ? groupAdmins.includes(zassbtz.user.lid.split(":")[0]+"@lid") : false;
  const senderForAdminCheck = m.fromMe ? zassbtz.user.lid.split(":")[0]+"@lid" : m.sender;
  const isGroupAdmins = m.isGroup ? groupAdmins.includes(senderForAdminCheck) : false;
  const isAdmins = m.isGroup ? groupAdmins.includes(senderForAdminCheck) : false;
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
  const deviceinfo = /^3A/.test(m.id) ? 'ɪᴏs' : m.id.startsWith('3EB') ? 'ᴡᴇʙ' : /^.{21}/.test(m.id) ? 'ᴀɴᴅʀᴏɪᴅ' : /^.{18}/.test(m.id) ? 'ᴅᴇsᴋᴛᴏᴘ' : 'ᴜɴᴋɴᴏᴡ';
  const ments = (text) => {return text.match('@') ? [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net') : []}
  const froms = m.quoted ? m.quoted.sender : text ? (text.replace(/[^0-9]/g, '') ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false) : false;
  const mentionUser = [
    ...new Set([
      ...(m.mentionedJid || []),
      ...(m.quoted ? [m.quoted.sender] : []),
    ]),
  ];
  const mentionByTag =
    type == "extendedTextMessage" &&
    m.message.extendedTextMessage.contextInfo != null
      ? m.message.extendedTextMessage.contextInfo.mentionedJid
      : [];
  const mentionByReply =
    type == "extendedTextMessage" &&
    m.message.extendedTextMessage.contextInfo != null
      ? m.message.extendedTextMessage.contextInfo.participant || ""
      : "";
  const numberQuery =
    q.replace(new RegExp("[()+-/ +/]", "gi"), "") + "@s.whatsapp.net";
  const usernya = mentionByReply ? mentionByReply : mentionByTag[0];
  const Input = mentionByTag[0]
    ? mentionByTag[0]
    : mentionByReply
      ? mentionByReply
      : q
        ? numberQuery
        : false;

const pentingPath = path.join(process.cwd(), "database", "penting.json")
let penting = JSON.parse(fs.readFileSync(pentingPath))

function savePenting() {
  fs.writeFileSync(pentingPath, JSON.stringify(penting, null, 2))
}

  const xtime = moment.tz("Asia/Jakarta").format("HH:mm:ss");
  const xdate = moment.tz("Asia/Jakarta").format("DD/MM/YYYY");
  const time2 = moment().tz("Asia/Jakarta").format("HH:mm:ss");
  if (time2 < "23:59:00") {
    var timewisher = `Selamat Malam`;
  }
  if (time2 < "19:00:00") {
    var timewisher = `Selamat Malam`;
  }
  if (time2 < "18:00:00") {
    var timewisher = `Selamat Sore`;
  }
  if (time2 < "15:00:00") {
    var timewisher = `Selamat Siang`;
  }
  if (time2 < "11:00:00") {
    var timewisher = `Selamat Pagi`;
  }
  if (time2 < "05:00:00") {
    var timewisher = `Selamat Pagi`;
  }

  let sekarang = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  function tanggal(ms) {
    return new Date(ms).getDate().toString().padStart(2, "0");
  }
  function bulan(ms) {
    return (new Date(ms).getMonth() + 1).toString().padStart(2, "0");
  }
  function tahun(ms) {
    return new Date(ms).getFullYear();
  }

  function formatJam(date) {
    let jam = date.getHours().toString().padStart(2, "0");
    let menit = date.getMinutes().toString().padStart(2, "0");
    let detik = date.getSeconds().toString().padStart(2, "0");
    return `${jam}:${menit}:${detik}`;
  }

  let futureDescription = `
📅 *Update Kurs:* ${tanggal(sekarang.getTime())}/${bulan(sekarang.getTime())}/${tahun(sekarang.getTime())}
🕰 *Waktu Jakarta (WIB):* ${formatJam(sekarang)}`

const qkuro = { key:{ remoteJid: 'status@broadcast', participant: '0@s.whatsapp.net' }, message:{ newsletterAdminInviteMessage: { newsletterJid: global.idSaluran, newsletterName: 'ᴠᴇʀɪғɪᴄᴀᴛɪᴏɴ', caption: `${namabot} Made By ${ownername}`, inviteExpiration: 0}}}

const qtext = {
  key: {
    remoteJid: "status@broadcast",
    participant: "0@s.whatsapp.net"
  },
  message: {
    extendedTextMessage: {
      text: global.namabot
    }
  }
};

const qloc = {key: {participant: '0@s.whatsapp.net', ...(m.chat ? {remoteJid: `status@broadcast`} : {})}, message: {locationMessage: {name: `${global.namabot} by ${ownername}`,jpegThumbnail: ""}}}

const qlocJpm = {key: {participant: '0@s.whatsapp.net', ...(m.chat ? {remoteJid: `status@broadcast`} : {})}, message: {locationMessage: {name: `${global.namabot} Made By ${ownername}`,jpegThumbnail: ""}}}

const qtoko = {key: {fromMe: false, participant: `0@s.whatsapp.net`, ...(m.chat ? {remoteJid: "status@broadcast"} : {})}, message: {"productMessage": {"product": {"productImage": {"mimetype": "image/jpeg", "jpegThumbnail": ""}, "title": `Payment By ${ownername}`, "description": null, "currencyCode": "IDR", "priceAmount1000": "999999999999999", "retailerId": `Powered By ${ownername}`, "productImageCount": 1}, "businessOwnerJid": `0@s.whatsapp.net`}}}

var ppuser
try {
ppuser = await zassbtz.profilePictureUrl(m.sender, 'image')
} catch (err) {
ppuser = 'https://telegra.ph/file/a059a6a734ed202c879d3.jpg'
}
const qlive = {key: {participant: '0@s.whatsapp.net', ...(m.chat ? {remoteJid: `status@broadcast`} : {})}, message: {liveLocationMessage: {caption: `ꪎ ${global.ownername}`,jpegThumbnail: ""}}}

async function reply(txt, opts = {}) {
  return zassbtz.sendMessage(m.chat, {
    text: txt,
    ...previewAd({
      title: `- ${namabot} -`,
      body: `Runtime : ${runtime(process.uptime())}`,
      thumbnail: global.img,
      sourceUrl: global.web,
      mention: opts.mentions || [],
      forward: true,
    }),
  }, { quoted: m });
}

const reply2 = (teks) => {
zassbtz.sendMessage(from, { text : teks }, { quoted : m })
}

const example = async (teks) => {
  await zassbtz.sendMessage(m.chat, {
    react: { text: '✖️', key: m.key }
  });

  const commander = `• *Example:* ${prefix+command} ${teks}`;

  return zassbtz.sendMessage(m.chat, {
    text: commander,
    ...previewAd({
      title: `Dame dayo !!!!`,
      body: `Runtime : ${runtime(process.uptime())}`,
      thumbnail: global.thumbxm,
      sourceUrl: global.web,
      mention: [m.sender],
      forward: true,
      largerThumbnail: false,
    }),
  }, { quoted: m });
};

const larang = async () => {
  await zassbtz.sendMessage(m.chat, {
    react: { text: '✖️', key: m.key }
  });

  return zassbtz.sendMessage(m.chat, {
    text: mess.creator,
    ...previewAd({
      title: `- Prohibition Message -`,
      body: `Command ${prefix+command} From ${pushname}`,
      thumbnail: global.img,
      sourceUrl: global.web,
      mention: [m.sender],
      forward: true,
      largerThumbnail: false,
    }),
  }, { quoted: qlocJpm });
};

if (m.message) {
    logger.newMessage({
        time: moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss'),
        msgType: budy ? budy : m.mtype,
        senderLabel: pushname,
        senderJid: m.sender,
        locationLabel: m.isGroup
            ? `${chalk.blue('Group:')} ${chalk.yellow(groupName)} ${chalk.gray(`(${m.chat})`)}`
            : chalk.blue('Private Chat'),
        isOwner: isCreator,
    });
}

  async function sendconnMessage(chatId, message, options = {}) {
    let generate = await generateWAMessage(chatId, message, options);
    let type2 = getContentType(generate.message);
    if ("contextInfo" in options)
      generate.message[type2].contextInfo = options?.contextInfo;
    if ("contextInfo" in message)
      generate.message[type2].contextInfo = message?.contextInfo;
    return await zassbtz.relayMessage(chatId, generate.message, {
      messageId: generate.key.id,
    });
  }

  function GetType(Data) {
    return new Promise((resolve, reject) => {
      let Result, Status;
      if (Buffer.isBuffer(Data)) {
        Result = new Buffer.from(Data).toString("base64");
        Status = 0;
      } else {
        Status = 1;
      }
      resolve({
        status: Status,
        result: Result,
      });
    });
  }

  function randomId() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  function monospace(string) {
    return '```' + string + '```'
}

function monospa(string) {
    return '`' + string + '`'
}

function getRandomFile(ext) {
return `${Math.floor(Math.random() * 10000)}${ext}`;
}

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)]
}

function randomNomor(min, max = null){
if (max !== null) {
min = Math.ceil(min);
max = Math.floor(max);
return Math.floor(Math.random() * (max - min + 1)) + min;
} else {
return Math.floor(Math.random() * min) + 1
}
}

function generateRandomPassword() {
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#%^&*';
const length = 10;
let password = '';
for (let i = 0; i < length; i++) {
const randomIndex = Math.floor(Math.random() * characters.length);
password += characters[randomIndex];
}
return password;
}

function generateRandomNumber(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}

const prefixOperator = {
  telkomsel: ['0811', '0812', '0813', '0821', '0822', '0852', '0853', '0823'],
  indosat: ['0814', '0815', '0816', '0855', '0856', '0857', '0858'],
  xl: ['0817', '0818', '0819', '0859', '0877', '0878'],
  axis: ['0838', '0831', '0832', '0833'],
  tri: ['0895', '0896', '0897', '0898', '0899'],
  smartfren: ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'],
  byu: ['0851']
};

function detectOperator(nomor) {
  const prefix = nomor.slice(0, 4);
  for (let [operator, daftar] of Object.entries(prefixOperator)) {
    if (daftar.includes(prefix)) {
      return operator.charAt(0).toUpperCase() + operator.slice(1);
    }
  }
  return 'Tidak diketahui';
}

function makeProgressBar(current, total, length = 20) {
  const progress = Math.floor((current / total) * length);
  const bar = "▓".repeat(progress) + "░".repeat(length - progress);
  return `[${bar}] ${Math.floor((current / total) * 100)}%`;
}

async function listbut2(m, teks, listnye, qtext) {
let msg = generateWAMessageFromContent(m.chat, {
viewOnceMessage: {
message: {
"messageContextInfo": {
"deviceListMetadata": {},
"deviceListMetadataVersion": 2
},
interactiveMessage: proto.Message.InteractiveMessage.create({
contextInfo: {
mentionedJid: [m.sender],
forwardingScore: 999999,
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: idSaluran,
newsletterName: nameSaluran,
serverMessageId: 145
}
},
body: proto.Message.InteractiveMessage.Body.create({
text: teks
}),
footer: proto.Message.InteractiveMessage.Footer.create({
text: `${namabot} By ${ownername}`
}),
header: proto.Message.InteractiveMessage.Header.create({
title: ``,
thumbnailUrl: "",
gifPlayback: true,
subtitle: "",
hasMediaAttachment: true,
...(await prepareWAMessageMedia({ image: { url: randomThumbUrl } }, { upload: zassbtz.waUploadToServer })),
}),
gifPlayback: true,
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
buttons: [
{
"name": "single_select",
"buttonParamsJson": JSON.stringify(listnye)
}],
}), })}
}}, {quoted: qtext})
await zassbtz.relayMessage(msg.key.remoteJid, msg.message, {
messageId: msg.key.id
})
}

async function dellCase(filePath, caseNameToRemove) {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Terjadi kesalahan:', err);
                    return;
                }

                const regex = new RegExp(`case\\s+'${caseNameToRemove}':[\\s\\S]*?break`, 'g');
                const modifiedData = data.replace(regex, '');

                fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
                    if (err) {
                        console.error('Terjadi kesalahan saat menulis file:', err);
                        return;
                    }

                    console.log(`Teks dari case '${caseNameToRemove}' telah dihapus dari file.`);
                });
            });
        }

if (isCmd) {
    const plugins = await getPlugins();
    const kyykzy = { zassbtz, prefix, command, reply, text, isGroup: m.isGroup, isCreator, example, sender, senderNumber, pushname, args, runtime, sleep, getBuffer, isBotAdmins, isAdmins, isCmd, qtext, randomNomor, monospace, pickRandom, getRandomFile, penting, axios, fs, uploader, isUrl };
    const matchedPlugin = plugins.find((plugin) => plugin.command.includes(command.toLowerCase()));
    if (matchedPlugin) {
        await matchedPlugin(m, kyykzy);
        return;
    }

switch (command) {
case "menu": {
let teksmenu = `
▲ 𝐂𝐫𝐞𝐚𝐭𝐨𝐫 : *${ownername}*
▲ 𝐍𝐮𝐦𝐛𝐞𝐫 : *${global.ownernumber}*
▲ 𝐍𝐚𝐦𝐚 𝐁𝐨𝐭 : *${global.namabot}*
▲ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧 : *${version}*
▲ 𝐌𝐨𝐝𝐞 : *${global.owneronly ? 'Self' : 'Public'}*
▲ 𝐑𝐮𝐧𝐭𝐢𝐦𝐞 : *${runtime(process.uptime())}*
▲ 𝐕𝐏𝐒 𝐔𝐩𝐭𝐢𝐦𝐞 : *${runtime(os.uptime())}*

╭─────────────────────➤
│╭─▣「 *Cнαииєℓ Mєиυ* 」▣─╮
││ ⟿ .cekidch
│╰─➤
│
│╭─▣「 *Gяσυp Mєиυ* 」▣─╮
││ ⟿ .delete
││ ⟿ .leavegc
││ ⟿ .promote
││ ⟿ .demote
││ ⟿ .kick
││ ⟿ .hidetag
││ ⟿ .tagall
││ ⟿ .upswgc
│╰─➤
│
│╭─▣「 *Bяσαdcαѕт Gяσυp* 」▣─╮
││ ⟿ .autojpm
││ ⟿ .bcgc
││ ⟿ .bljpm
││ ⟿ .cekidgc
││ ⟿ .jpm
││ ⟿ .jpmht
││ ⟿ .jpmslide
││ ⟿ .jpmswgc
││ ⟿ .listgc
│╰─➤
│
│╭─▣「 *Bяσαdcαѕт Kσηтαк* 」▣─╮
││ ⟿ .pushkontak
││ ⟿ .pushkontak2
││ ⟿ .pushkontak3
││ ⟿ .pushkontakid
││ ⟿ .pushkontakid2
││ ⟿ .savekontak
││ ⟿ .tutor
│╰─➤
│
│╭─▣「 *Rαиdσм Mєиυ* 」▣─╮
││ ⟿ .bluearchive
││ ⟿ .cosplayba
││ ⟿ .cekkhodam
││ ⟿ .cekkontol
││ ⟿ .getpp
││ ⟿ .pinterest
││ ⟿ .iqc
││ ⟿ .remini
││ ⟿ .waifu
│╰─➤
│
│╭─▣「 *Dσωиlσαdєя Mєиυ* 」▣─╮
││ ⟿ .play
││ ⟿ .capcut
││ ⟿ .igdl
││ ⟿ .mediafire
││ ⟿ .spotify
││ ⟿ .ttdl
││ ⟿ .twitter
│╰─➤
│
│╭─▣「 *Cσηtrσl Mєиυ* 」▣─╮
││ ⟿ .addcase
││ ⟿ .addplugin
││ ⟿ .ambilq
││ ⟿ .anticall
││ ⟿ .autoread
││ ⟿ .autoreadsw
││ ⟿ .autojoingc
││ ⟿ .delcase
││ ⟿ .delplugin
││ ⟿ .getcase
││ ⟿ .getplugin
││ ⟿ .joingc
││ ⟿ .ping
││ ⟿ .runtime
││ ⟿ .setbiobot
││ ⟿ .setnamabot
││ ⟿ .setppbot
││ ⟿ .setting
│╰─➤
│
│╭─▣「 *Cσηνєятєя Mєиυ* 」▣─╮
││ ⟿ .removebg
││ ⟿ .toaudio
││ ⟿ .toimg
││ ⟿ .tovid
││ ⟿ .tovn
││ ⟿ .tourl
│╰─➤
│
│╭─▣「 *Sтι¢кєя Mєиυ* 」▣─╮
││ ⟿ .brat
││ ⟿ .bratvid
││ ⟿ .sticker
││ ⟿ .smeme
││ ⟿ .emojimix
││ ⟿ .qc
│╰─➤
│
│╭─▣「 *Sтσяє Mєиυ* 」▣─╮
││ ⟿ .dana
││ ⟿ .gopay
││ ⟿ .ovo
││ ⟿ .qris
│╰─➤
│
│╭==⊱ *Official Source* ▣─╮
││↻ YouTube: NeoShiroko Labs (@shirokode)
│╰───➤
╰─────┈➤

    ⌕ ❙❘❙❙❘❙❚❙❘❙❙❚❙❘❙❘❙❚❙❘❙❙❚❙❘❙❙❘❙❚❙❘ ⌕
  『 *© 2026 Shirokode Labs* 』
  `
await zassbtz.sendMessage(m.chat, {
  text: teksmenu,
  ...previewAd({
    title: `© ${namabot} - v${version}`,
    body: `Made by ${ownername}.`,
    thumbnail: randomThumbUrl,
    sourceUrl: global.web,
    mention: [m.sender],
    forward: true,
    largerThumbnail: true,
  })
}, { quoted: qkuro });

if (global.vnMenu) {
  try {
    await zassbtz.sendMessage(m.chat, {
      audio: { url: global.vnMenu },
      mimetype: "audio/mp4",
      ptt: true,
    }, { quoted: qkuro });
  } catch {}
}
}
break
case "upswgc":
case "swgc":
case "swgrup": {
  let targetGid = m.chat;
  let caption = text.replace(new RegExp(`^${prefix + command}\\s*`, "i"), "").trim();

  if (!m.isGroup) {
    const sep = caption.indexOf("|");
    if (sep === -1 || !caption.slice(0, sep).trim()) {
      return example(`idgc|teks\n\nContoh: 120363xxxxxxxxx@g.us|Halo semua!\n(dipakai di private chat, di grup cukup .${command} teks)`);
    }
    targetGid = caption.slice(0, sep).trim();
    if (!targetGid.endsWith("@g.us")) targetGid += "@g.us";
    caption = caption.slice(sep + 1).trim();
  }

  const qmsg = m.quoted ? m.quoted : m;
  const mime = (qmsg.msg || qmsg).mimetype || "";

  try {
    if (!mime && !caption) {
      return example(m.isGroup ? `Halo semua (opsional reply media)` : `idgc|teks`);
    }
    let payload = {};

    if (/image/.test(mime)) {
      const buffer = await qmsg.download();
      payload = {
        image: buffer,
        caption
      };
    }
    else if (/video/.test(mime)) {
      const buffer = await qmsg.download();
      payload = {
        video: buffer,
        caption
      };
    }
    else if (/audio/.test(mime)) {
      const buffer = await qmsg.download();
      payload = {
        audio: buffer,
        mimetype: "audio/mp4"
      };
    }
    else if (caption) {
      payload = {
        text: caption
      };
    }

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    await groupStatus(zassbtz, targetGid, payload);

    m.reply("✅ Status grup berhasil diposting.");

  } catch (err) {
    console.error("upswgc error:", err);
    m.reply("❌ Gagal upload status grup.", err);
  }
}
break
case "emojimix": {
  if (!text) return example("😭+😂");

  let [emoji1, emoji2] = text.split("+");
  if (!emoji1 || !emoji2) return example("😭+😂");

  await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

  try {
    const imgUrl = await getEmojiMixUrl(emoji1, emoji2);

    if (!imgUrl) {
      return m.reply("❌ Kombinasi emoji ini tidak didukung Emoji Kitchen.");
    }

    const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data);

    const tempFile = `./database/emojimix-${Date.now()}.png`;
    await fs.promises.writeFile(tempFile, buffer);

    await zassbtz.sendImageAsSticker(
      m.chat,
      tempFile,
      m,
      { packname: global.packname, author: global.author }
    );

    try { fs.unlinkSync(tempFile); } catch {}

  } catch (err) {
    console.error("emojimix cmd error:", err);
    m.reply("❌ Gagal membuat emoji mix.");
  }
}
break
case "iqc": {
  if (!text) return example("teks nya");

  await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

  try {
    let jam = new Date().toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit"
    });

    let batre = Math.floor(Math.random() * 90) + 5;

    const apiUrl = `https://api-faa.my.id/faa/iqcv2?prompt=${encodeURIComponent(text)}&jam=${encodeURIComponent(jam)}&batre=${batre}`;

    const res = await axios.get(apiUrl, {
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(res.data);

    await zassbtz.sendMessage(m.chat, {
      image: buffer,
      caption: `🖼️ *Image Quote Creator*\n\n"${text}"`
    }, { quoted: m });

  } catch (err) {
    console.error("iqc cmd error:", err);
    m.reply("❌ Gagal membuat image quote.");
  }
}
break
case "jpmch": {
  if (!isCreator) return larang()
  if (!text && !m.quoted) return example(`Halo semua!\nKirim media + caption (opsional)`)

  const qmsg = m.quoted ? m.quoted : m
  const mime = (qmsg.msg || qmsg).mimetype || ""
  let mediaPath, broadcastMsg

  if (/image|video|audio|document/.test(mime)) {
    mediaPath = await zassbtz.downloadAndSaveMediaMessage(qmsg)
  }

  const allCh = await zassbtz.getFollowedChannels()

  let validChannels = []
  for (const ch of allCh) {
    if (
      ch &&
      ch.state === "ACTIVE" &&
      ch.viewer_metadata &&
      ch.viewer_metadata.view_role === "ADMIN" &&
      !penting.blacklistJpm.includes(ch.id)
    ) {
      validChannels.push(ch.id)
    }
  }

  if (validChannels.length === 0) {
    return reply(`❌ Tidak ada channel aktif yang memenuhi kriteria (role: admin, mute: off, tidak di blacklist).`)
  }

  if (mediaPath) {
    if (/image/.test(mime)) broadcastMsg = { image: fs.readFileSync(mediaPath), caption: text || "" }
    if (/video/.test(mime)) broadcastMsg = { video: fs.readFileSync(mediaPath), caption: text || "" }
    if (/audio/.test(mime)) broadcastMsg = { audio: fs.readFileSync(mediaPath), mimetype: "audio/mpeg", ptt: true }
    if (/document/.test(mime)) {
      broadcastMsg = {
        document: fs.readFileSync(mediaPath),
        mimetype: qmsg.mimetype,
        fileName: `file_${Date.now()}`
      }
    }
  } else {
    broadcastMsg = { text }
  }

  const qmeta = {
    key: {
      participant: `13135550002@s.whatsapp.net`,
      ...(botNumber ? { remoteJid: `status@broadcast` } : {})
    },
    message: {
      contactMessage: {
        displayName: `Kuroko Botz JPM Channel: ${mediaPath ? mime : "Text"}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=13135550002:+62 852-9802-7445\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
        sendEphemeral: true
      }
    }
  }

  const processMsg = await zassbtz.sendMessage(
    m.chat,
    {
      text: `⏳ *Memproses JPM Channel...*\nJumlah Channel: ${validChannels.length}\nTipe: ${mediaPath ? mime : "Text"}`
    },
    { quoted: m }
  )

  let sentCount = 0
  for (const id of validChannels) {
    try {
      await zassbtz.sendMessage(id, broadcastMsg, { quoted: qmeta })
      sentCount++
    } catch (e) {
      console.log(`[Gagal kirim ke CH] ${id}`, e)
    }
    await sleep(global.delayJpm || 4000)
  }

  if (mediaPath) fs.unlinkSync(mediaPath)

  await zassbtz.sendMessage(
    m.chat,
    {
      text: `✅ *JPM Channel Selesai!*\nBerhasil terkirim ke *${sentCount}* channel dari total ${validChannels.length}.`,
      edit: processMsg.key
    }
  )
}
break
case "getpp": {
    if (!m.quoted && !m.mentionedJid?.length) {
        return example(`Tag atau reply user target.\n\nContoh: *${prefix + command} @user*`)
    }

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } })

    try {
        let target
        if (m.quoted) {
            target = m.quoted.sender
        } else if (m.mentionedJid?.length) {
            target = m.mentionedJid[0]
        } else {
            target = m.sender
        }
        let no = target.split("@")[0]
        let pp
        try {
            pp = await zassbtz.profilePictureUrl(target, "image")
        } catch {
            return m.reply("❌ User tidak punya foto profil atau disembunyikan.")
        }

        await zassbtz.sendMessage(
            m.chat,
            {
                image: { url: pp },
                caption: `✅ Foto profil @${no}`,
                mentions: [target]
            },
            { quoted: m }
        )

    } catch (err) {
        console.error(err)
        m.reply("❌ Gagal mengambil foto profil.")
    }
}
break

case "waifu": {
    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } })

    try {
        let res = await axios.get("https://api.ryuu-dev.offc.my.id/random/waifupic", {
            responseType: "arraybuffer"
        })
        let buffer = Buffer.from(res.data)

        await zassbtz.sendMessage(
            m.chat,
            { image: buffer, caption: "✅ *Random Waifu Pic* 💮" },
            { quoted: m }
        )
    } catch (err) {
        console.error(err)
        m.reply(`❌ Error: ${err.message}`)
    }
}
break

case "cosba":
case "cosplayba": {
    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } })

    try {
        let res = await axios.get("https://api.ryuu-dev.offc.my.id/random/cosplay-ba", {
            responseType: "arraybuffer"
        })
        let buffer = Buffer.from(res.data)

        await zassbtz.sendMessage(
            m.chat,
            { image: buffer, caption: "✅ *Random Blue Archive Cosplay*" },
            { quoted: m }
        )
    } catch (err) {
        console.error(err)
        m.reply(`❌ Error: ${err.message}`)
    }
}
break

case "bluearchive":
case "ba": {
    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } })

    try {
        let res = await axios.get("https://api.siputzx.my.id/api/r/blue-archive", {
            responseType: "arraybuffer"
        })
        let buffer = Buffer.from(res.data)

        await zassbtz.sendMessage(
            m.chat,
            { image: buffer, caption: "✅ *Random Blue Archive Waifu*" },
            { quoted: m }
        )
    } catch (err) {
        console.error(err)
        m.reply(`❌ Error: ${err.message}`)
    }
}
break

case "pinterest":
case "pin": {
    if (!text) return example(`Masukkan query!\n\n*Contoh:* ${prefix + command} Sunaookami Shiroko`)

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } })

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/pinterest`, {
            params: { query: text, type: "image" }
        })

        if (!data.status || !data.data?.length) return m.reply("❌ Tidak ada hasil ditemukan.")

        const results = data.data.slice(0, 15)

        const album = results
            .filter(r => r.image_url)
            .map(r => ({
                image: { url: r.image_url },
                caption: `👤 Uploader: *${r.pinner?.username || "Unknown"}*\n👥 Followers: *${r.pinner?.follower_count ?? 0}*\n💬 ${r.description?.trim() || "-"}\n🔗 ${r.pin}`
            }))

        if (!album.length) return m.reply("❌ Tidak ada gambar yang bisa ditampilkan.")

        await zassbtz.sendAlbum(m.chat, album, { quoted: m })
    } catch (err) {
        console.error(err)
        m.reply(`❌ Error: ${err.message}`)
    }
}
break

case "play": {
    if (!text) return example(`cinta`);
    if (!text.includes("|")) {
        return await zassbtz.sendButton(m.chat, {
            text: `🎧 Pilih sumber musik untuk:\n*${text}*`,
            footer: global.foother,
            buttons: [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "▶ YouTube",
                        id: `.play yt|${text}`
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🎵 Spotify",
                        id: `.play spotify|${text}`
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "☁ SoundCloud",
                        id: `.play soundcloud|${text}`
                    })
                }
            ]
        }, { quoted: m });
    }
    const [source, ...queryArr] = text.split("|");
    const query = queryArr.join("|").trim().toLowerCase();

    if (!query) return m.reply("❌ Query lagu tidak boleh kosong.");

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    try {
        let info, audioUrl, thumbnail, title, artist, sourceUrl;
        if (source === "spotify") {
            const apiUrl = `https://api-faa.my.id/faa/spotify-play?q=${encodeURIComponent(query)}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status) return m.reply("❌ Lagu tidak ditemukan di Spotify.");

            info = data.info;
            audioUrl = data.download.url;
            thumbnail = info.thumbnail;
            title = info.title;
            artist = info.artist;
            sourceUrl = info.spotify_url;
        }
        else if (source === "yt" || source === "youtube") {
            const apiUrl = `https://api-faa.my.id/faa/ytplay?query=${encodeURIComponent(query)}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status) return m.reply("❌ Lagu tidak ditemukan di YouTube.");

            const res = data.result;
            audioUrl = res.mp3;
            thumbnail = res.thumbnail;
            title = res.title;
            artist = res.author;
            sourceUrl = res.url;
        }
        else if (source === "soundcloud" || source === "sc") {
            const apiUrl = `https://api-faa.my.id/faa/soundcloud-play?query=${encodeURIComponent(query)}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status) return m.reply("❌ Lagu tidak ditemukan di SoundCloud.");

            const res = data.result;
            audioUrl = res.download_url;
            thumbnail = res.thumbnail;
            title = res.title;
            artist = res.user;
            sourceUrl = res.source_url;
        }

        else {
            return m.reply("❌ Sumber tidak dikenal. Gunakan: yt | spotify | soundcloud");
        }
        await zassbtz.sendMessage(m.chat, {
            text:
`🎵 *PLAY MUSIC*

📌 Judul : ${title}
🎤 Artis : ${artist}

🔗 Sumber:
${sourceUrl}`,
            ...previewAd({
                title,
                body: artist,
                thumbnail,
                sourceUrl,
                largerThumbnail: true,
            })
        }, { quoted: m });
        await zassbtz.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            ptt: false
        }, { quoted: m });

    } catch (err) {
        console.error("play cmd error:", err);
        m.reply("❌ Terjadi kesalahan saat memutar lagu.");
    }
}
break

case "capcut": {
    if (!text) return example(`https://www.capcut.com/tv2/ZSSCR6UFU/`);
    if (!/^https?:\/\/(www\.)?capcut\.com\/.+/i.test(text)) {
        return m.reply("❌ URL CapCut tidak valid.");
    }

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    try {
        const apiUrl = `https://api.siputzx.my.id/api/d/capcutv2?url=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data || !data.data.medias.length) {
            return m.reply("❌ Gagal mengambil media dari CapCut.");
        }

        const { title, thumbnail, medias } = data.data;

        let media = medias.find(m => /HD No Watermark/i.test(m.quality)) || medias[0];

        await zassbtz.sendMessage(
            m.chat,
            {
                video: { url: media.url },
                caption: `✅ *CapCut Template*\n\n🎬 Judul: ${title}\n💾 Kualitas: ${media.quality}\n📦 Size: ${media.formattedSize}`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error(err);
        m.reply(`❌ Error: ${err.message}`);
    }
}
break

case "twitter":
case "twitdl": {
    if (!text) return example(`https://twitter.com/9GAG/status/1661175429859012608`);
    if (!/^https?:\/\/(www\.)?(twitter|x)\.com\/.+/i.test(text)) {
        return m.reply("❌ URL Twitter/X tidak valid.");
    }

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    try {
        const apiUrl = `https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data || !data.data.downloadLink) {
            return m.reply("❌ Gagal mengambil media dari Twitter.");
        }

        const { downloadLink, imgUrl, videoTitle, videoDescription } = data.data;

        await zassbtz.sendMessage(
            m.chat,
            {
                video: { url: downloadLink },
                caption: `✅ *Twitter Video Downloaded*\n\n🎬 Title: ${videoTitle || "-"}\n📝 Desc: ${videoDescription || "-"}`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error(err);
        m.reply(`❌ Error: ${err.message}`);
    }
}
break

case "igdl": {
    if (!text) return example(`https://www.instagram.com/reel/DMNiqN2TV3v/`);

    if (!/^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/.+/i.test(text)) {
        return m.reply("❌ URL Instagram tidak valid.");
    }

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    try {
        const apiUrl = `https://api-faa.my.id/faa/igdl?url=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.result || !data.result.url || !data.result.url.length) {
            return m.reply("❌ Gagal mengambil media dari Instagram.");
        }

        const { url: medias, metadata } = data.result;

        for (let mediaUrl of medias) {
            if (metadata.isVideo || mediaUrl.includes(".mp4")) {

                await zassbtz.sendMessage(
                    m.chat,
                    {
                        video: { url: mediaUrl },
                        caption: `✅ Instagram Video berhasil didownload.\n\n👤 ${metadata.username}\n❤️ ${metadata.like}\n💬 ${metadata.comment}`
                    },
                    { quoted: m }
                );
            } else {

                await zassbtz.sendMessage(
                    m.chat,
                    {
                        image: { url: mediaUrl },
                        caption: `✅ Instagram Photo berhasil didownload.\n\n👤 ${metadata.username}\n❤️ ${metadata.like}\n💬 ${metadata.comment}`
                    },
                    { quoted: m }
                );
            }

            await sleep(1500);
        }

    } catch (err) {
        console.error(err);
        m.reply(`❌ Error: ${err.message}`);
    }
}
break

case "spotify": {
    if (!text) return example(`https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh`);
    if (!/^https?:\/\/(open|play)\.spotify\.com\/.+/i.test(text)) {
        return m.reply("❌ URL Spotify tidak valid.");
    }

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    try {
        const apiUrl = `https://api.siputzx.my.id/api/d/spotifyv2?url=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.data) return m.reply("❌ Gagal mengambil detail lagu dari Spotify.");

        const track = data.data;

        let cap = `🎶 *Spotify Downloader*\n\n`;
        cap += `🎵 Judul: *${track.songTitle}*\n`;
        cap += `👤 Artis: *${track.artist}*\n`;
        cap += `🔗 [Link Asli](${track.url})\n\n`;
        cap += `✅ Lagu berhasil didownload!`;

        await zassbtz.sendMessage(
            m.chat,
            {
                audio: { url: track.mp3DownloadLink },
                mimetype: "audio/mpeg",
                fileName: `${track.songTitle}.mp3`,
                ptt: false
            },
            { quoted: m }
        );

        await zassbtz.sendMessage(
            m.chat,
            {
                image: { url: track.coverImage },
                caption: cap
            },
            { quoted: m }
        );

    } catch (err) {
        console.error(err);
        m.reply(`❌ Error: ${err.message}`);
    }
}
break

case "mediafire": {
  if (!text) return example(`https://www.mediafire.com/file/iojnikfucf67q74/Base_Bot_Simpel.zip/file`);
  if (!/^https?:\/\/(www\.)?mediafire\.com\/.+/i.test(text)) {
    return m.reply("❌ URL MediaFire tidak valid.");
  }

  await zassbtz.sendMessage(m.chat, { react: { text: "📥", key: m.key } });

  try {
    const apiUrl = `https://api-faa.my.id/faa/mediafire?url=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.result) {
      return m.reply("❌ Gagal mengambil file dari MediaFire.");
    }

    const file = data.result;

    let cap = `📥 *MediaFire Downloader*\n\n`;
    cap += `📌 Nama File: *${file.filename}*\n`;
    cap += `📦 Ukuran: *${file.size}*\n`;
    cap += `📂 Tipe: ${file.mime}\n\n`;
    cap += `⏬ File sedang dikirim...`;

    await zassbtz.sendMessage(m.chat, {
      document: { url: file.download_url },
      fileName: file.filename,
      mimetype: "application/zip",
      caption: cap
    }, { quoted: m });

  } catch (err) {
    console.error("mediafire cmd error:", err);
    m.reply("❌ Terjadi kesalahan saat download file MediaFire.");
  }
}
break

case "tt-dl":
case "tt":
case "tiktok": {
    if (!text) return example(`https://vt.tiktok.com/ZSBhtXeVr/`);
    if (!/^https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\/.+/i.test(text)) {
        return m.reply("❌ URL TikTok tidak valid.");
    }

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    try {
        const { data } = await axios.get("https://tiktok-scraper7.p.rapidapi.com", {
            headers: {
                "Accept-Encoding": "gzip",
                "Connection": "Keep-Alive",
                "Host": "tiktok-scraper7.p.rapidapi.com",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
                "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com",
                "X-RapidAPI-Key": "ca5c6d6fa3mshfcd2b0a0feac6b7p140e57jsn72684628152a"
            },
            params: { url: text, hd: "1" }
        });

        const res = data.data;
        if (!res || !res.hdplay) return m.reply("❌ Gagal mengambil data video TikTok.");

        let cap = `✅ *Tiktok Downloader*\n\n`;
        cap += `🎥 Judul: ${res.title || "-"}\n`;
        cap += `👤 Author: ${res.author?.nickname || "-"} (@${res.author?.unique_id || "-"})\n`;
        cap += `🌎 Region: ${res.region}\n`;
        cap += `▶️ Play Count: ${res.play_count}\n❤️ Likes: ${res.digg_count}\n💬 Comments: ${res.comment_count}\n🔄 Share: ${res.share_count}`;

        await zassbtz.sendMessage(
            m.chat,
            {
                video: { url: res.hdplay },
                caption: cap
            },
            { quoted: m }
        );

    } catch (err) {
        console.error(err);
        m.reply(`❌ Error: ${err.message}`);
    }
}
break

case "toimg": {
    let quoted = m.quoted ? m.quoted : m;
    let mime = (quoted.msg || quoted).mimetype || "";
    if (!/webp/.test(mime)) return example(" Sambil Kirim atau reply sticker untuk diubah jadi gambar.");

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    try {
        let mediaPath = await zassbtz.downloadAndSaveMediaMessage(quoted);
        let url = await uploader.auto(mediaPath);

        if (!url) {
            if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
            return m.reply("❌ Gagal upload sticker.");
        }

        await zassbtz.sendMessage(
            m.chat,
            { image: { url }, caption: `✅ *Sticker berhasil diubah jadi gambar*\n📎 URL: ${url}` },
            { quoted: m }
        );

        if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
    } catch (err) {
        console.error(err);
        m.reply(`❌ Error: ${err.message}`);
    }
}
break

case "autojpm": {
  if (!isCreator) return larang()

  let [cmd, ...args] = text.split(" ")
  cmd = cmd ? cmd.toLowerCase() : null

  if (!cmd) {
    let list = penting.autoJpm.messages.map((m, i) => `${i + 1}. ${m.caption || m.text || "(media tanpa teks)"}`).join("\n") || "- kosong -"
    return reply(
`*AUTO JPM SYSTEM*

Status: ${penting.autoJpm.status ? "ON" : "OFF"}
Interval: ${penting.autoJpm.interval} ${penting.autoJpm.type}
Pesan tersimpan:
${list}

Command:
.autojpm on
.autojpm off
.autojpm add <teks/caption> (reply gambar/video jika ada media)
.autojpm del <nomor/all>
.autojpm set <angka> menit/jam/hari`
    )
  }

  if (cmd === "on") {
    if (penting.autoJpm.status) return m.reply("✖️ Auto JPM sudah aktif.")
    if (!penting.autoJpm.interval || !penting.autoJpm.messages.length) {
      return m.reply("✖️ Set interval dan tambah pesan dulu!")
    }
    penting.autoJpm.status = true
    savePenting()
    reply("✅ Auto JPM berhasil diaktifkan.")
  }

  else if (cmd === "off") {
    penting.autoJpm.status = false
    savePenting()
    reply("✅ Auto JPM dimatikan.")
  }

  else if (cmd === "add") {
  let qmsg = m.quoted ? m.quoted : m
  let mime = (qmsg.msg || qmsg).mimetype || ''
  let caption = args.join(" ")
  let tmpDir = path.join(process.cwd(), "tmp", "autojpm")
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  if (/image|video/.test(mime)) {
    let ext = mime.split("/")[1] || "bin"
    let fileName = `autojpm_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`
    let filePath = path.join(tmpDir, fileName)

    let buffer = await qmsg.download()
    fs.writeFileSync(filePath, buffer)

    penting.autoJpm.messages.push({
      type: /image/.test(mime) ? "image" : "video",
      path: filePath,
      caption
    })
  } else {
    penting.autoJpm.messages.push({
      type: "text",
      text: caption
    })
  }
  penting.autoJpm._lastRun = 0

  savePenting()
  reply("✅ Pesan berhasil ditambahkan ke Auto JPM.")
}

  else if (cmd === "del") {
    let idx = args[0]
    if (!idx) return reply("✖️ Masukkan nomor pesan atau 'all'.")
    if (idx === "all") {
      penting.autoJpm.messages = []
    } else {
      idx = parseInt(idx) - 1
      if (isNaN(idx) || idx < 0 || idx >= penting.autoJpm.messages.length) {
        return m.reply("✖️ Nomor tidak valid.")
      }
      penting.autoJpm.messages.splice(idx, 1)
    }
    savePenting()
    reply("✅ Pesan berhasil dihapus.")
  }

  else if (cmd === "set") {
    let num = parseInt(args[0])
    let unit = (args[1] || "").toLowerCase()
    if (isNaN(num) || num <= 0) return m.reply("✖️ Masukkan angka yang valid.")
    if (!["menit","jam","hari","minute","hour","day"].includes(unit)) {
      return reply("✖️ Gunakan satuan menit/jam/hari.")
    }

    penting.autoJpm.interval = num
    penting.autoJpm.type = unit.startsWith("m") ? "minute" : unit.startsWith("j") ? "hour" : "day"
    savePenting()
    reply(`✅ Interval diatur ke ${num} ${penting.autoJpm.type}.`)
  }
}
break

case "remini": case "hd": {
    let quoted = m.quoted ? m.quoted : m;
    let mime = (quoted.msg || quoted).mimetype || "";
    if (!/image/.test(mime)) return example(" Sambil kirim atau reply gambar untuk di-HD-in.");

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    try {
        let mediaPath = await zassbtz.downloadAndSaveMediaMessage(quoted);
        let url = await uploader.auto(mediaPath);

        let apiUrl = `https://api-faa.my.id/faa/hdv2?url=${encodeURIComponent(url)}`;
        let { data } = await axios.get(apiUrl);

        if (!data.status || !data.result) {
            if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
            return m.reply(`❌ Gagal memproses gambar: ${data.message || 'Unknown error'}`);
        }

        await zassbtz.sendMessage(
            m.chat,
            { image: { url: data.result }, caption: `✅ *Successful Upscale 4k Quality*\n📎 URL: ${data.result}` },
            { quoted: m }
        );

        if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
    } catch (err) {
        console.error(err);
        m.reply(`❌ Error: ${err.message}`);
    }
}
break

case "tourl": {
    if (!m.quoted) return example(`Reply media yang mau diupload.\nContoh: *${prefix+command}*`);
    let mime = (m.quoted.msg || m.quoted).mimetype || "";
    if (!mime) return m.reply("Media tidak ditemukan.");

    await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

    try {
        let mediaPath = await zassbtz.downloadAndSaveMediaMessage(m.quoted);
        let url = await uploader.auto(mediaPath);
        await m.reply(`✅ *Berhasil Upload*\n\n📎 *URL:* ${url}`);
        if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
    } catch (err) {
        console.error(err);
        m.reply(`❌ Gagal upload: ${err.message}`);
    }
}
break

case "bratvid": {
  if (!text) return example("teksnya");
  try {
    await zassbtz.sendMessage(m.chat, {
      react: { text: "👁️‍🗨️", key: m.key }
    });

    const url = `https://api-faa.my.id/faa/bratvid?text=${encodeURIComponent(text)}`;
    const response = await axios.get(url, { responseType: "arraybuffer" });

    await zassbtz.sendVideoAsSticker(
      m.chat,
      response.data,
      m,
      {
        packname: global.packname,
        author: global.author
      }
    );

  } catch (err) {
    console.error("Error:", err);
    await zassbtz.sendMessage(m.chat, {
      text: "Maaf, terjadi kesalahan saat mencoba membuat stiker brat video. Coba lagi nanti."
    }, { quoted: m });
  }
}
break

case "brat": {
  if (!text) return example("teksnya");
  try {
    await zassbtz.sendMessage(m.chat, {
      react: { text: "👁️‍🗨️", key: m.key }
    });

    const url = `https://api-faa.my.id/faa/brat?text=${encodeURIComponent(text)}`;
    const response = await axios.get(url, { responseType: "arraybuffer" });

    await zassbtz.sendImageAsSticker(
      m.chat,
      response.data,
      m,
      {
        packname: global.packname,
        author: global.author
      }
    );

  } catch (err) {
    console.error("Error:", err);
    await zassbtz.sendMessage(m.chat, {
      text: "Maaf, terjadi kesalahan saat mencoba membuat stiker brat. Coba lagi nanti."
    }, { quoted: m });
  }
}
break

case "sticker":
case "stiker":
case "sgif":
case "s": {
  if (!/image|video|webp/.test(mime)) return example("Kirim atau reply gambar/video (maks 15 detik)");

  if (/video/.test(mime) && (qmsg?.seconds > 15)) {
    return m.reply("✖️ Durasi video maksimal 15 detik.");
  }

  await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

  let media;
  try {

    media = await zassbtz.downloadAndSaveMediaMessage(qmsg);

    if (/image|webp/.test(mime)) {
      await zassbtz.sendImageAsSticker(
        m.chat,
        media,
        m,
        { packname: global.packname, author: global.author }
      );
    } else if (/video/.test(mime)) {
      await zassbtz.sendVideoAsSticker(
        m.chat,
        media,
        m,
        { packname: global.packname, author: global.author }
      );
    } else {
      return m.reply("✖️ Format tidak didukung. Kirim gambar atau video pendek.");
    }

  } catch (e) {
    console.error("sticker cmd error:", e);
    m.reply("✖️ Terjadi kesalahan saat mengeksekusi perintah.");
  } finally {
    try { if (media && fs.existsSync(media)) fs.unlinkSync(media); } catch {}
  }
}
break

case "smeme": {
  if (!/image|webp/.test(mime)) {
    return example("Kirim atau reply gambar/webp dengan teks atas|bawah");
  }

  let [atas, bawah] = text.split("|");
  if (!atas) return example("teksatas|teksbawah (teks bawah opsional)");

  await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

  let media, uploadedUrl, tempFile;
  try {

    media = await zassbtz.downloadAndSaveMediaMessage(qmsg);
    tempFile = media;

    uploadedUrl = await uploader.auto(tempFile);

    const apiUrl = `https://api.ryuu-dev.offc.my.id/tools/smeme?img=${encodeURIComponent(uploadedUrl)}&atas=${encodeURIComponent(atas)}&bawah=${encodeURIComponent(bawah || "")}`;
    const { data } = await axios.get(apiUrl, { responseType: "arraybuffer" });

    await zassbtz.sendImageAsSticker(
      m.chat,
      data,
      m,
      { packname: global.packname, author: global.author }
    );

  } catch (err) {
    console.error("❌ smeme cmd error:", err);
    m.reply(`✖️ Terjadi kesalahan saat membuat meme:\n${err.message || err}`);
  } finally {

    try {
      if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch (cleanupErr) {
      console.error("Gagal hapus file temp:", cleanupErr);
    }
  }
}
break

case "qc": {
  let qcText, qcName, qcSenderJid;

  if (m.quoted) {
    qcText = m.quoted.text || m.quoted.caption || "";
    if (!qcText) return example("Balas pesan yang ada tulisannya, atau ketik .qc <teks>");
    qcSenderJid = m.quoted.sender;
    qcName = (await zassbtz.getName(qcSenderJid)) || qcSenderJid?.split("@")[0] || "User";
  } else {
    if (!text) return example("teksnya (atau reply pesan orang untuk dijadikan qc)");
    qcText = text;
    qcSenderJid = m.sender;
    qcName = m.pushName || "User";
  }

  let avatarUrl;
  try {
    avatarUrl = await zassbtz.profilePictureUrl(qcSenderJid, "image");
  } catch {
    avatarUrl = "https://i.ibb.co/6BRf4Rc/no-profile.png";
  }

  let replyName, replyText;
  const nestedQuoted = m.quoted?.contextInfo?.quotedMessage;
  if (nestedQuoted) {
    const nestedType = Object.keys(nestedQuoted)[0];
    const nestedContent = nestedQuoted[nestedType];
    replyText =
      nestedQuoted.conversation ||
      (typeof nestedContent === "string" ? nestedContent : nestedContent?.text || nestedContent?.caption) ||
      "";
    const nestedSenderJid = zassbtz.decodeJid(m.quoted.contextInfo.participant || "");
    if (nestedSenderJid) {
      replyName = (await zassbtz.getName(nestedSenderJid)) || nestedSenderJid.split("@")[0];
    }
  }

  let mediaUrl;
  const quotedMime = m.quoted ? (m.quoted.msg || m.quoted).mimetype || "" : "";
  if (m.quoted && /image|video/.test(quotedMime)) {
    let mediaPath;
    try {
      mediaPath = await zassbtz.downloadAndSaveMediaMessage(m.quoted);
      mediaUrl = await uploader.auto(mediaPath);
    } catch {
      mediaUrl = undefined;
    } finally {
      try { if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath); } catch {}
    }
  }

  await zassbtz.sendMessage(m.chat, { react: { text: "👁️‍🗨️", key: m.key } });

  const qcParams = { name: qcName, text: qcText };
  if (avatarUrl) qcParams.avatar = avatarUrl;
  if (replyName) qcParams.replyName = replyName;
  if (replyText) qcParams.replyText = replyText;
  if (mediaUrl) qcParams.media = mediaUrl;

  let tempnya;
  try {
    const { data } = await axios.get("https://api.ammaricano.my.id/api/image/quotly", {
      params: qcParams,
      headers: { accept: "image/png" },
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(data);
    tempnya = `./database/${Date.now()}.png`;

    await fs.promises.writeFile(tempnya, buffer);

    await zassbtz.sendImageAsSticker(
      m.chat,
      tempnya,
      m,
      { packname: global.packname, author: global.author }
    );

  } catch (err) {
    console.error("qc cmd error:", err);
    m.reply("✖️ Terjadi kesalahan saat membuat quote.");
  } finally {

    try { if (tempnya && fs.existsSync(tempnya)) fs.unlinkSync(tempnya); } catch {}
  }
}
break

case "setppbot": case "setpp": {
if (!isCreator) return larang();
if (/image/g.test(mime)) {
let media = await zassbtz.downloadAndSaveMediaMessage(qmsg)
await zassbtz.updateProfilePicture(botNumber, {url: media})
await fs.unlinkSync(media)
m.reply("*Berhasil Mengganti Profil ✅*")
} else return example("dengan mengirim foto")
}
break

case "setnamabot": {
if (!isCreator) return larang();
if (!text) return example("teksnya")
zassbtz.updateProfileName(text)
m.reply("*Berhasil Mengganti Nama Bot ✅*")
}
break

case "setbio": case "setbiobot": {
if (!isCreator) return larang();
if (!text) return example("teksnya")
zassbtz.updateProfileStatus(text)
m.reply("*Berhasil Mengganti Bio Bot ✅*")
}
break

case "self": {
if (!isCreator) return m.reply(mess.creator)

global.owneronly = true
zassbtz.public = false

let file = path.join(process.cwd(), "settings.js")
let text = fs.readFileSync(file, "utf8")

text = text.replace(/global\.owneronly\s*=\s*(true|false)/, "global.owneronly = true")

fs.writeFileSync(file, text)

m.reply("*Berhasil Mengganti Mode ✅*\nMode Bot Beralih Ke *Self*")
}
break

case "public": {
if (!isCreator) return larang()

global.owneronly = false
zassbtz.public = true

let file = path.join(process.cwd(), "settings.js")
let text = fs.readFileSync(file, "utf8")

text = text.replace(/global\.owneronly\s*=\s*(true|false)/, "global.owneronly = false")

fs.writeFileSync(file, text)

m.reply("*Berhasil Mengganti Mode ✅*\nMode Bot Beralih Ke *Public*")
}
break

case "getcase": {
   if (!isCreator) return larang();
   if (!text) return example("menu")

   const getcase = (cases) => {
      let data = fs.readFileSync('./case.js', 'utf-8')
      let regex = new RegExp(`case ['"]${cases}['"]([\\s\\S]*?)break`, "i")
      let hasil = data.match(regex)
      return hasil ? hasil[0] : null
   }

   let result = getcase(text)
   if (!result) return m.reply(`❌ Case *${text}* Tidak Ditemukan`)

   await zassbtz.messageBuilder(m.chat, { quoted: m })
      .setType('AIRich')
      .setTitle(`Get Case`)
      .addText(`Nama: ${text}\nUkuran: ${result.length} karakter`)
      .addCode('javascript', result)
      .addSource([
         [global.favicon, 'https://shirokode.web.id', 'Shirokode'],
         [global.favicon, 'https://www.youtube.com/@shirokode', 'YT Neoshiroko Labs'],
      ])
      .send()
}
break

case "getplugin": {
   if (!isCreator) return larang();
   if (!text) return example("removebg")

   const pluginsDir = path.resolve(__dirname, "plugins")
   const fileName = text.replace(/\.js$/i, "").trim()
   let filePath = path.join(pluginsDir, `${fileName}.js`)

   if (!fs.existsSync(filePath)) {
      const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith(".js"))
      const matched = files.find(f => {
         const content = fs.readFileSync(path.join(pluginsDir, f), "utf-8")
         const regex = new RegExp(`command\\s*=\\s*\\[[^\\]]*['"]${fileName}['"]`, "i")
         return regex.test(content)
      })
      if (matched) filePath = path.join(pluginsDir, matched)
   }

   if (!fs.existsSync(filePath)) return m.reply(`❌ Plugin *${text}* Tidak Ditemukan`)

   const result = fs.readFileSync(filePath, "utf-8")
   const displayName = path.basename(filePath)

   await zassbtz.messageBuilder(m.chat, { quoted: m })
      .setType('AIRich')
      .setTitle(`Get Plugin`)
      .addText(`Nama: ${displayName}\nUkuran: ${result.length} karakter`)
      .addCode('javascript', result)
      .addSource([
         [global.favicon, 'https://shirokode.web.id', 'Shirokode'],
         [global.favicon, 'https://www.youtube.com/@shirokode', 'YT Neoshiroko Labs'],
      ])
      .send()
}
break

case 'bcgc':
case 'bcgroup': {
if (!isCreator) return larang();
if (!text) return example(`teksnya`)
  let getGroups = await zassbtz.groupFetchAllParticipating()
  let groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
  let anu = groups.map(v => v.id)
m.reply(`Mengirim Broadcast Ke ${anu.length} Group Chat, Waktu Selesai ${anu.length * 1.5} detik`)
for (let i of anu) {
await sleep(global.delayJpm)
  let a = '```' + `\n\n${text}\n\n` + '```' + '\n\n\nʙʀᴏᴀᴅᴄᴀsᴛ'
zassbtz.sendMessage(i, {
  text: a,
   ...previewAd({
            title: `Broadcast By ${namabot}`,
            body: `Telah Terkirim Ke ${anu.length} Group`,
            thumbnail: global.thumbbc,
            sourceUrl: global.web,
            largerThumbnail: true,
                    })
                })
                }
m.reply(`Sukses Mengirim Broadcast Ke ${anu.length} Group`)
}
break

case "tutor":
case "tutorial": {
let ttutor = `
📦 *PUSH KONTAK GRUP TERBUKA*
Digunakan untuk push kontak dari dalam grup itu sendiri (terbuka), tanpa ID grup.

🔸 *.pushkontak teksmu*
🔸 *.pushkontak2 teksmu*
🔸 *.pushkontak3 jeda|teksmu*

📌 *Catatan:*
- Kirim perintah langsung di dalam grup target.
- *jeda* adalah delay per kontak. Contoh: \`1000 = 1 detik\`.
- Auto-save hanya berlaku untuk *.pushkontak2* dan *.pushkontak3*.
- *pushkontak* biasa hanya mengirim tanpa simpan kontak.

📡 *PUSH KONTAK GRUP TERTUTUP*
Digunakan untuk push kontak dari luar grup, menggunakan ID grup manual.

🔸 *.pushkontakid idgc|teksmu*
🔸 *.pushkontakid2 idgc|teksmu*
🔸 *.pushkontakid3 idgc|jeda|teksmu*

📌 *Contoh:*
\`\`\`
.pushkontakid2 1203xxx@g.us|Save saya
.pushkontakid3 1203xxx@g.us|1500|Save saya
\`\`\`

📌 *Catatan:*
- Ketik *.listgc* atau *.cekidgc* untuk melihat ID grup.
- pushkontakid tidak auto-save, pushkontakid2 dan pushkontak3 auto-save.
- *pushkontakid3* paling advance karena ada delay dan nama kontak!

💾 *SAVE KONTAK (AUTO / MANUAL)*
Digunakan untuk menyimpan kontak member grup sebelum push.

🔸 *.savekontak idgc|nama* (private message)
🔸 *.savekontak nama* (dalam grup)

📌 *Contoh:*
\`\`\`
.savekontak 1203xxx@g.us|buyerku
.savekontak buyerku
\`\`\`

📣 *JPM / BROADCAST GROUP CHAT*
Digunakan untuk mengirim pesan ke seluruh grup, dengan atau tanpa tag.

🔸 *.jpm teksmu* — Kirim pesan biasa
🔸 *.jpmht teksmu* — Kirim pesan + mention semua anggota
🔸 *.bljpm on/off|<angka>* (private message)
🔸 *.bljpm on/off* (dalam grup)

*Auto Jpm Beta*
.autojpm on
.autojpm off
.autojpm add <teks/caption> (reply gambar/video jika ada media)
.autojpm del <nomor/all>
.autojpm set <angka> menit/jam/hari

📌 *Tips:*
- Kamu bisa kirim media juga, dengan reply atau caption media + cmd.
- Hindari spam *.jpmht* agar tidak mengganggu member 🙏

⚠️ *PERINGATAN DAN SARAN:*
- Jangan push terlalu cepat, bisa kena limit WhatsApp!
- Gunakan jeda minimal \`6000 ms\` (6 detik) agar lebih aman.
- Simpan kontak dulu sebelum push untuk memperbesar deliver rate & menghindari blokir.

_*© Zass Desuta 2025*_
  `
await zassbtz.sendMessage(m.chat, {
  text: ttutor,
  ...previewAd({
    title: `© ${namabot} - v${version}`,
    body: `Runtime : ${runtime(process.uptime())}`,
    thumbnail: img,
    sourceUrl: global.web,
    mention: [m.sender],
    forward: true,
    largerThumbnail: false,
  })
}, { quoted: qkuro });
}
break

case 'pushkontak': {
  if (!isGroup) return m.reply(mess.group);
  if (!isCreator) return larang();

  const groupMetadata = await cachedGroupMeta(from);
  const participants = groupMetadata.participants;

  if (!text) return example('Save Namaku!');

  const pesan = text.trim();
  let success = 0;
  let failed = 0;
  const total = participants.length;
  let isAborted = false;

  const progMsg = await zassbtz.sendMessage(m.chat, {
    text: `*⏳ Memulai push kontak...*\nTarget: ${total} kontak\n\n⚠️ Jangan spam atau pakai command berat (seperti JPM) selama push berlangsung!`
  }, { quoted: m });

  for (let i = 0; i < participants.length; i++) {
    const member = participants[i];

    if (!zassbtz.ws?.isOpen) {
      isAborted = true;
      console.log(`⚠️  Pushkontak dihentikan di kontak ke-${i+1}: socket disconnect`);
      break;
    }

    try {
      await zassbtz.sendMessage(member.id, { text: pesan }, { quoted: qkuro });
      success++;
    } catch (e) {
      failed++;
      const errMsg = e.message || '';
      if (errMsg.includes('Connection Closed') || errMsg.includes('stream') || errMsg.includes('timed out')) {
        isAborted = true;
        break;
      }
    }
    await sleep(global.delayPushkontak || 1500);

    const percent = Math.floor(((i + 1) / total) * 100);
    if (percent % 20 === 0 || i + 1 === total) {
      const bar = makeProgressBar(i + 1, total);
      try {
        await zassbtz.sendMessage(m.chat, {
          text: `*Progres Push Kontak*\n${i + 1}/${total} kontak\n${bar}\n\n⚠️ Jangan spam atau jalankan command lain dulu.`
        }, { edit: progMsg.key });
      } catch {}
    }
  }

  const finalText = isAborted
    ? `*⚠️ Push Kontak Terhenti!* (koneksi putus)\nTerkirim: ${success} | Gagal: ${failed}`
    : `*✅ Push Kontak Selesai!*\n\nTotal: ${total}\nBerhasil: ${success}\nGagal: ${failed}\n\n_(Opsional: pakai *.savekontak* untuk simpan kontak)_`;

  await zassbtz.sendMessage(m.chat, { text: finalText }, { quoted: m });
}
break

case 'pushkontak2': {
  if (!isGroup) return m.reply(mess.group);
  if (!isCreator) return larang();

  const groupMetadata = await cachedGroupMeta(from);
  const participants = groupMetadata.participants || [];

  if (!text) return example('Save Namaku!');

  const pesan = text.trim();
  let success = 0;
  let failed = 0;
  const total = participants.length;
  let vcfList = '';
  let isAborted = false;

  const progMsg = await zassbtz.sendMessage(m.chat, {
    text: `*⏳ Memulai push kontak (mode VCF)...*\nTarget: ${total} kontak\n\n⚠️ Jangan spam atau pakai command berat selama push berlangsung!`
  }, { quoted: m });

  for (let i = 0; i < participants.length; i++) {
    const member = participants[i];

    if (!zassbtz.ws?.isOpen) { isAborted = true; break; }

    try {
      await zassbtz.sendMessage(member.id, { text: pesan }, { quoted: qkuro });
      success++;
      if (member.phoneNumber) {
        const nomor = member.phoneNumber.split('@')[0];
        vcfList += `BEGIN:VCARD
VERSION:3.0
FN:${global.namakontak || 'Contact'} - ${nomor}
TEL;type=CELL;type=VOICE;waid=${nomor}:+${nomor}
END:VCARD

`;
      }
    } catch (e) {
      failed++;
      const em = e.message || '';
      if (em.includes('Connection Closed') || em.includes('stream') || em.includes('timed out')) { isAborted = true; break; }
    }

    await sleep(global.delayPushkontak || 1500);

    const percent = Math.floor(((i + 1) / total) * 100);
    if (percent % 20 === 0 || i + 1 === total) {
      const bar = makeProgressBar(i + 1, total);
      try { await zassbtz.sendMessage(m.chat, { text: `*Progres Push Kontak (VCF)*\n${i + 1}/${total} kontak\n${bar}\n\n⚠️ Jangan jalankan command berat lain dulu.` }, { edit: progMsg.key }); } catch {}
    }
  }

  if (vcfList) {
    const vcfPath = `./database/contacts.vcf`;
    fs.writeFileSync(vcfPath, vcfList);
    await zassbtz.sendMessage(m.sender, {
      document: fs.readFileSync(vcfPath),
      fileName: `KontakGrup-${groupMetadata.subject}.vcf`,
      mimetype: 'text/x-vcard',
      caption: `*${isAborted ? '⚠️ Push Kontak Terhenti!' : '✅ Push Kontak Selesai!'}*\nGrup: ${groupMetadata.subject}\nTotal: ${total}\nBerhasil: ${success}\nGagal: ${failed}`
    }, { quoted: m });
    try { fs.unlinkSync(vcfPath); } catch {}
  }
}
break

case 'pushkontak3': {
  if (!isCreator) return larang();
  if (!text.includes('|')) return example(`jeda(ms)|pesan\n\n*Contoh:* 1000|Halo semua`);

  const [jedaStr, ...pesanArr] = text.split('|');
  const delay = Number(jedaStr.trim());
  const pesan = pesanArr.join('|').trim();
  if (isNaN(delay) || !pesan) return m.reply("Format salah!");

  const groupMetadata = await cachedGroupMeta(m.chat);
  const participants = groupMetadata.participants || [];
  const total = participants.length;

  let success = 0, failed = 0;
  let vcfList = '';
  let isAborted = false;

  const progMsg = await zassbtz.sendMessage(m.chat, {
    text: `*⏳ Broadcast dimulai...*\nTarget: ${total} kontak\nDelay: ${delay}ms\n\n⚠️ Jangan spam/jalankan command lain dulu.`
  }, { quoted: m });

  for (let i = 0; i < participants.length; i++) {
    const member = participants[i];

    if (!zassbtz.ws?.isOpen) { isAborted = true; break; }

    try {
      await zassbtz.sendMessage(member.id, { text: pesan }, { quoted: qkuro });
      success++;
      if (member.phoneNumber) {
        const nomor = member.phoneNumber.split('@')[0];
        vcfList += `BEGIN:VCARD
VERSION:3.0
FN:${global.namakontak || 'Contact'} - ${nomor}
TEL;type=CELL;type=VOICE;waid=${nomor}:+${nomor}
END:VCARD

`;
      }
    } catch (e) {
      failed++;
      const em = e.message || '';
      if (em.includes('Connection Closed') || em.includes('stream') || em.includes('timed out')) { isAborted = true; break; }
    }

    await sleep(delay);

    const percent = Math.floor(((i + 1) / total) * 100);
    if (percent % 20 === 0 || i + 1 === total) {
      const bar = makeProgressBar(i + 1, total);
      try { await zassbtz.sendMessage(m.chat, { text: `*Progres Broadcast*\n${i + 1}/${total} kontak\n${bar}\n\n⚠️ Jangan jalankan command berat lain dulu.` }, { edit: progMsg.key }); } catch {}
    }
  }

  if (vcfList) {
    const vcfPath = './database/push_contacts.vcf';
    fs.writeFileSync(vcfPath, vcfList);
    await zassbtz.sendMessage(m.sender, {
      document: fs.readFileSync(vcfPath),
      mimetype: 'text/x-vcard',
      fileName: 'PushKontak.vcf',
      caption: `*${isAborted ? '⚠️ Broadcast Terhenti!' : '✅ Broadcast selesai!'}*\nTotal: ${total}\nSukses: ${success}\nGagal: ${failed}`
    }, { quoted: m });
    try { fs.unlinkSync(vcfPath); } catch {}
  }
}
break

case 'pushkontakid': {
  if (!isCreator) return larang();

  const args = text.split('|');
  if (args.length < 2) return example(`<id_grup>|<pesan>\nKetik *.listgc* untuk menampilkan ID grup`);

  const groupId = args[0].trim();
  const pesan = args[1].trim();

  try {
    const groupMetadata = await cachedGroupMeta(groupId);
    const participants = groupMetadata.participants;

    let success = 0;
    let failed = 0;
    const total = participants.length;
    let vcfList = '';

    const progMsg = await zassbtz.sendMessage(m.chat, {
      text: `*⏳ Memulai push kontak...*\nTarget: ${total} anggota di grup *${groupMetadata.subject}*\n\n⚠️ Jangan spam atau jalankan command berat lain selama proses ini.`
    }, { quoted: m });

    for (let i = 0; i < participants.length; i++) {
      const member = participants[i];
      try {
        await zassbtz.sendMessage(member.id, { text: pesan }, { quoted: qkuro });
        success++;
        if (member.phoneNumber) {
          const nomor = member.phoneNumber.split('@')[0];
          vcfList += `BEGIN:VCARD
VERSION:3.0
FN:${global.namakontak} - ${nomor}
TEL;type=CELL;type=VOICE;waid=${nomor}:+${nomor}
END:VCARD

`;
        }

      } catch {
        failed++;
      }

      await sleep(global.delayPushkontak || 1500);

      const percent = Math.floor(((i + 1) / total) * 100);
      if (percent % 20 === 0 || i + 1 === total) {
        const bar = makeProgressBar(i + 1, total);
        await zassbtz.sendMessage(m.chat, {
          text: `*Progres Push Kontak*\n${i + 1}/${total} anggota\n${bar}\n\n⚠️ Jangan jalankan command lain dulu.`
        }, { edit: progMsg.key });
      }
    }

    const vcfPath = `./database/contacts.vcf`;
    fs.writeFileSync(vcfPath, vcfList);

    await zassbtz.sendMessage(m.sender, {
      document: fs.readFileSync(vcfPath),
      fileName: `Kontak-${groupMetadata.subject}.vcf`,
      mimetype: 'text/x-vcard',
      caption: `✅ Pushkontak ke *${total} member* selesai!\nBerhasil: *${success}*\nGagal: *${failed}*`
    });

    fs.unlinkSync(vcfPath);

  } catch (err) {
    console.error(err);
    return m.reply('❌ Gagal mengambil metadata grup. Pastikan ID grup valid dan bot masih ada di grup.');
  }
}
break

case 'pushkontakid2': {
  if (!isCreator) return larang();
  if (!text.includes('|')) return example(`idgc|jeda(ms)|pesan\n\n*Note:* 1 detik = 1000\nGunakan *.listgc* atau *.cekidgc* untuk melihat id grup`);

  const [idgc, jedaStr, ...pesanArr] = text.split('|');
  const delay = Number(jedaStr.trim());
  const pesan = pesanArr.join('|').trim();

  if (!idgc.endsWith('@g.us')) return m.reply("❌ ID Grup tidak valid!");
  if (isNaN(delay)) return m.reply("❌ Format jeda tidak valid!\nGunakan angka (contoh: 1000)");
  if (!pesan) return m.reply("❌ Pesan tidak boleh kosong!");

  let groupMetadata;
  try {
    groupMetadata = await cachedGroupMeta(idgc.trim());
  } catch {
    return m.reply("❌ Gagal ambil metadata grup! Pastikan bot masih ada di grup.");
  }

  const participants = groupMetadata.participants || [];
  const halls = participants.map(p => p.id).filter(Boolean);
  const phoneMap = {};
participants.forEach(p => {
  if (p.id && p.phoneNumber) {
    phoneMap[p.id] = p.phoneNumber;
  }
});

  const contactName = global.namakontak || "Kuroko Broadcast";
  let success = 0, failed = 0;
  let contacts = [];

  const progMsg = await zassbtz.sendMessage(m.chat, {
    text: `*⏳ Broadcast dimulai...*\nTarget: ${halls.length} kontak di grup *${groupMetadata.subject}*\nDelay: ${delay}ms\n\n⚠️ Jangan spam atau pakai command berat lain.`
  }, { quoted: m });

  for (let i = 0; i < halls.length; i++) {
    try {
      await zassbtz.sendMessage(halls[i], { text: pesan }, { quoted: qkuro });
      success++;
      contacts.push(halls[i]);
    } catch { failed++; }
    await sleep(delay);

    const percent = Math.floor(((i + 1) / halls.length) * 100);
    if (percent % 20 === 0 || i + 1 === halls.length) {
      const bar = makeProgressBar(i + 1, halls.length);
      await zassbtz.sendMessage(m.chat, {
        text: `*Progres Broadcast*\n${i + 1}/${halls.length} kontak\n${bar}\n\n⚠️ Jangan jalankan command lain dulu.`
      }, { edit: progMsg.key });
    }
  }

  try {
    const uniqueContacts = [...new Set(contacts)];
    const vcardContent = uniqueContacts.map((lid, i) => {
    const pn = phoneMap[lid];
  if (!pn) return null;

  const num = pn.split("@")[0];
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contactName} ${i + 1}`,
    `TEL;type=CELL;type=VOICE;waid=${num}:+${num}`,
    'END:VCARD', ''
  ].join('\n');
}).filter(Boolean).join('\n');

    fs.writeFileSync('./database/push_contacts.vcf', vcardContent, 'utf8');

    await zassbtz.sendMessage(m.sender, {
      document: fs.readFileSync('./database/push_contacts.vcf'),
      mimetype: 'text/vcard',
      fileName: 'contacts.vcf',
      caption: `✅ *Push Kontak Selesai!*\nTotal: ${halls.length}\nSukses: ${success}\nGagal: ${failed}`
    }, { quoted: qkuro });

  } catch (err) {
    console.error('❌ Gagal generate vcf:', err);
    await m.reply('⚠️ Push selesai, namun gagal membuat file .vcf');
  }
}
break

case 'savekontak': {
  if (!isCreator) return larang();

  const buildVcard = (list, contactName) => {
    let vcard = ''
    let no = 1

    for (let jid of list) {
      const num = jid.split('@')[0]
      vcard += `BEGIN:VCARD
VERSION:3.0
FN:${contactName} ${no}
TEL;type=CELL;type=VOICE;waid=${num}:+${num}
END:VCARD

`
      no++
    }

    return vcard
  }

  const getContacts = (participants) => {
    return [...new Set(
      participants
        .map(p => p.phoneNumber || p.id)
        .filter(jid => jid && jid.endsWith('@s.whatsapp.net') && jid !== m.sender)
    )]
  }

  if (m.isGroup && !text.includes('|')) {
    if (!text) return example("nama kontak");

    const contactName = text.trim()
    let metadata

    try {
      metadata = await cachedGroupMeta(m.chat)
    } catch (e) {
      return m.reply("❌ Gagal mengambil metadata grup!")
    }

    const kontakUnik = getContacts(metadata.participants)

    if (!kontakUnik.length) return m.reply("⚠️ Tidak ada kontak yang bisa disimpan!")

    const vcardList = buildVcard(kontakUnik, contactName)
    const filePath = './database/kontak-grup.vcf'

    fs.writeFileSync(filePath, vcardList)

    await zassbtz.sendMessage(m.sender, {
      document: fs.readFileSync(filePath),
      fileName: 'kontak-grup.vcf',
      mimetype: 'text/x-vcard',
      caption: `📥 *Kontak Grup Tersimpan!*\n\n👥 Grup: *${metadata.subject}*\n📁 Jumlah: *${kontakUnik.length}*\n🔖 Nama Kontak: *${contactName}*`,
    }, { quoted: m })

    await m.reply("✅ File kontak berhasil dikirim ke chat pribadi Anda!")
    fs.unlinkSync(filePath)
  }

  else {
    if (!text.includes('|')) {
      return example("<idgc>|<namakontak>\nKetik *.listgc* untuk menampilkan idgc")
    }

    const [idgc, contactName] = text.split('|').map(v => v.trim())
    if (!idgc || !contactName) return m.reply("✖️ Format salah!")

    let metadata
    try {
      metadata = await cachedGroupMeta(idgc)
    } catch (e) {
      return m.reply("✖️ ID grup tidak valid atau bot tidak ada di grup!")
    }

    const kontakUnik = getContacts(metadata.participants)
    if (!kontakUnik.length) return m.reply("⚠️ Tidak ada kontak yang bisa disimpan!")

    const vcardList = buildVcard(kontakUnik, contactName)
    const filePath = './database/kontak-saved.vcf'

    fs.writeFileSync(filePath, vcardList)

    await zassbtz.sendMessage(m.sender, {
      document: fs.readFileSync(filePath),
      fileName: "kontak-saved.vcf",
      mimetype: "text/x-vcard",
      caption: `*✅ Kontak Berhasil Disimpan!*\n📁 Total: *${kontakUnik.length}* kontak\n📌 Nama: *${contactName}*`,
    }, { quoted: m })

    if (m.chat !== m.sender) m.reply("✅ File kontak berhasil dikirim ke chat pribadi Anda!")
    fs.unlinkSync(filePath)
  }
}
break

case "jpm": {
  if (!isCreator) return larang()
  if (!text && !m.quoted) return example(`Halo semua!\nKirim media + caption (opsional)`)

  let mediaPath, broadcastMsg
  if (/image|video|audio|document/.test(mime)) {
    mediaPath = await zassbtz.downloadAndSaveMediaMessage(qmsg)
  }

  const allGroups = await zassbtz.groupFetchAllParticipating()
  const groupIDs = Object.keys(allGroups).filter(id => !penting.blacklistJpm.includes(id))
  let sentCount = 0, failCount = 0
  let isAborted = false

  if (mediaPath) {
    if (/image/.test(mime)) broadcastMsg = { image: fs.readFileSync(mediaPath), caption: text || "" }
    if (/video/.test(mime)) broadcastMsg = { video: fs.readFileSync(mediaPath), caption: text || "" }
    if (/audio/.test(mime)) broadcastMsg = { audio: fs.readFileSync(mediaPath), mimetype: "audio/mpeg", ptt: true }
    if (/document/.test(mime)) broadcastMsg = { document: fs.readFileSync(mediaPath), mimetype: qmsg.mimetype, fileName: `file_${Date.now()}` }
  } else {
    broadcastMsg = { text }
  }

  const processMsg = await zassbtz.sendMessage(
    m.chat,
    { text: `⏳ *Memproses JPM...*\nJumlah grup: ${groupIDs.length}\nTipe: ${mediaPath ? mime : "Text"}` },
    { quoted: m }
  )

  for (let i = 0; i < groupIDs.length; i++) {
    const id = groupIDs[i]

    if (!zassbtz.ws?.isOpen) {
      isAborted = true
      console.log(`⚠️  JPM dihentikan di grup ke-${i+1}: socket disconnect`)
      break
    }

    try {
      await zassbtz.sendMessage(id, broadcastMsg, { quoted: qloc })
      sentCount++
    } catch (e) {
      failCount++
      const errMsg = e.message || ''

      if (errMsg.includes('Connection Closed') || errMsg.includes('stream') || errMsg.includes('timed out')) {
        isAborted = true
        console.log(`⚠️  JPM dihentikan: ${errMsg}`)
        break
      }
    }

    if ((i + 1) % 10 === 0 || i + 1 === groupIDs.length) {
      try {
        await zassbtz.sendMessage(m.chat, {
          text: `⏳ *JPM Progress...*\n${i+1}/${groupIDs.length} grup\n✅ ${sentCount} berhasil | ❌ ${failCount} gagal`,
          edit: processMsg.key
        })
      } catch {}
    }

    await sleep(global.delayJpm || 4000)
  }

  if (mediaPath) { try { fs.unlinkSync(mediaPath) } catch {} }

  const statusText = isAborted
    ? `⚠️ *JPM Terhenti!* (koneksi terputus)\nTerkirim ke *${sentCount}* dari ${groupIDs.length} grup sebelum berhenti.`
    : `✅ *JPM Selesai!*\nBerhasil: *${sentCount}* | Gagal: *${failCount}* dari total ${groupIDs.length} grup.`

  await zassbtz.sendMessage(m.chat, { text: statusText, edit: processMsg.key })
}
break

case "jpmswgc": {
  if (!isCreator) return larang()
  if (!text && !m.quoted) return example(`Halo semua!\\nKirim media + caption (opsional)`)

  const qmsg = m.quoted ? m.quoted : m
  const mime = (qmsg.msg || qmsg).mimetype || ""
  const caption = text.replace(new RegExp(`^${prefix + command}\\s*`, "i"), "").trim()

  const allGroups = await zassbtz.groupFetchAllParticipating()
  const groupIDs = Object.keys(allGroups).filter(id => !penting.blacklistJpm.includes(id))
  let sentCount = 0, failCount = 0
  let isAborted = false

  let payload = {}
  if (/image/.test(mime)) {
    const buffer = await qmsg.download()
    payload = { image: buffer, caption }
  } else if (/video/.test(mime)) {
    const buffer = await qmsg.download()
    payload = { video: buffer, caption }
  } else if (/audio/.test(mime)) {
    const buffer = await qmsg.download()
    payload = { audio: buffer, mimetype: "audio/mp4" }
  } else if (caption) {
    payload = { text: caption }
  } else {
    return example(`Halo semua (opsional reply media)`)
  }

  const processMsg = await zassbtz.sendMessage(
    m.chat,
    { text: `⏳ *Memproses JPM Status GC...*\nJumlah grup: ${groupIDs.length}\nTipe: ${mime || "Text"}` },
    { quoted: m }
  )

  for (let i = 0; i < groupIDs.length; i++) {
    const id = groupIDs[i]

    if (!zassbtz.ws?.isOpen) {
      isAborted = true
      console.log(`⚠️  JPM Status GC dihentikan di grup ke-${i+1}: socket disconnect`)
      break
    }

    try {
      await groupStatus(zassbtz, id, { ...payload })
      sentCount++
    } catch (e) {
      failCount++
      const errMsg = e.message || ''

      if (errMsg.includes('Connection Closed') || errMsg.includes('stream') || errMsg.includes('timed out')) {
        isAborted = true
        console.log(`⚠️  JPM Status GC dihentikan: ${errMsg}`)
        break
      }
    }

    if ((i + 1) % 10 === 0 || i + 1 === groupIDs.length) {
      try {
        await zassbtz.sendMessage(m.chat, {
          text: `⏳ *JPM Status GC Progress...*\n${i+1}/${groupIDs.length} grup\n✅ ${sentCount} berhasil | ❌ ${failCount} gagal`,
          edit: processMsg.key
        })
      } catch {}
    }

    await sleep(global.delayJpm || 4000)
  }

  const statusText = isAborted
    ? `⚠️ *JPM Status GC Terhenti!* (koneksi terputus)\nTerkirim ke *${sentCount}* dari ${groupIDs.length} grup sebelum berhenti.`
    : `✅ *JPM Status GC Selesai!*\nBerhasil: *${sentCount}* | Gagal: *${failCount}* dari total ${groupIDs.length} grup.`

  await zassbtz.sendMessage(m.chat, { text: statusText, edit: processMsg.key })
}
break

case "jpmht": {
  if (!isCreator) return larang()
  if (!text && !m.quoted) return example(`Halo semua!\nKirim media + caption (opsional)`)

  let mediaPath, msgContent
  if (/image|video|audio|document/.test(mime)) {
    mediaPath = await zassbtz.downloadAndSaveMediaMessage(qmsg)
  }

  const allGroups = await zassbtz.groupFetchAllParticipating()
  const groupIDs = Object.keys(allGroups).filter(id => !penting.blacklistJpm.includes(id))
  let sentCount = 0, failCount = 0
  let isAborted = false

  const processMsg = await zassbtz.sendMessage(
    m.chat,
    { text: `⏳ *Memproses Broadcast Hidetag...*\nJumlah grup: ${groupIDs.length}\nTipe: ${mediaPath ? mime : "Text"}` },
    { quoted: m }
  )

  for (let i = 0; i < groupIDs.length; i++) {
    const id = groupIDs[i]

    if (!zassbtz.ws?.isOpen) {
      isAborted = true
      console.log(`⚠️  JPM Hidetag dihentikan di grup ke-${i+1}: socket disconnect`)
      break
    }

    const groupData = allGroups[id]
    const participants = (groupData?.participants || []).map(p => p.id)

    if (mediaPath) {
      if (/image/.test(mime)) msgContent = { image: fs.readFileSync(mediaPath), caption: text || "", mentions: participants }
      if (/video/.test(mime)) msgContent = { video: fs.readFileSync(mediaPath), caption: text || "", mentions: participants }
      if (/audio/.test(mime)) msgContent = { audio: fs.readFileSync(mediaPath), mimetype: "audio/mpeg", ptt: true, mentions: participants }
      if (/document/.test(mime)) msgContent = { document: fs.readFileSync(mediaPath), mimetype: qmsg.mimetype, fileName: `file_${Date.now()}`, mentions: participants }
    } else {
      msgContent = { text: text, mentions: participants }
    }

    try {
      await zassbtz.sendMessage(id, msgContent, { quoted: qloc })
      sentCount++
    } catch (e) {
      failCount++
      const errMsg = e.message || ''
      if (errMsg.includes('Connection Closed') || errMsg.includes('stream') || errMsg.includes('timed out')) {
        isAborted = true
        console.log(`⚠️  JPM Hidetag dihentikan: ${errMsg}`)
        break
      }
    }

    if ((i + 1) % 10 === 0 || i + 1 === groupIDs.length) {
      try {
        await zassbtz.sendMessage(m.chat, {
          text: `⏳ *Hidetag Progress...*\n${i+1}/${groupIDs.length} grup\n✅ ${sentCount} berhasil | ❌ ${failCount} gagal`,
          edit: processMsg.key
        })
      } catch {}
    }

    await sleep(global.delayJpm || 4000)
  }

  if (mediaPath) { try { fs.unlinkSync(mediaPath) } catch {} }

  const statusText = isAborted
    ? `⚠️ *Hidetag Terhenti!* (koneksi terputus)\nTerkirim ke *${sentCount}* dari ${groupIDs.length} grup.`
    : `✅ *Hidetag Broadcast Selesai!*\nBerhasil: *${sentCount}* | Gagal: *${failCount}* dari ${groupIDs.length} grup.`

  await zassbtz.sendMessage(m.chat, { text: statusText, edit: processMsg.key })
}
break

case "bljpm": {
  if (!isCreator) return larang();

  const pentingPath = path.join(process.cwd(), "database", "penting.json");
  if (!fs.existsSync(pentingPath)) {
    fs.writeFileSync(pentingPath, JSON.stringify({ blacklistJpm: [] }, null, 2));
  }
  let penting = JSON.parse(fs.readFileSync(pentingPath));
  function savePenting() {
    fs.writeFileSync(pentingPath, JSON.stringify(penting, null, 2));
  }

  let [act, arg] = text.split("|").map(a => a?.trim()?.toLowerCase());

  if (act === "list") {
    if (!penting.blacklistJpm.length) return reply("✖️ Belum ada grup/channel yang di-blacklist.");

    let allGroupsList = {};
    let allChannelsList = {};
    try { allGroupsList = await zassbtz.groupFetchAllParticipating(); } catch {}
    try {
      const arr = await zassbtz.getFollowedChannels();
      allChannelsList = Object.fromEntries(arr.map((ch) => [ch.id, ch]));
    } catch {}

    let listText = `*🚫 Daftar Blacklist JPM (${penting.blacklistJpm.length}):*\n\n`;
    penting.blacklistJpm.forEach((id, i) => {
      const isChannel = id.endsWith("@newsletter");
      const name = isChannel
        ? (allChannelsList[id]?.name || "Tanpa Nama")
        : (allGroupsList[id]?.subject || "Tidak diketahui");
      listText += `${i + 1}. ${isChannel ? "📢" : "🧩"} *${name}*\n   ↳ ${id}\n`;
    });
    return reply(listText);
  }

  if (m.isGroup) {
    if (arg) {
      const targets = arg.split(",").map(x => x.trim()).filter(Boolean);
      let hasil = [];
      for (const targetID of targets) {
        if (act === "on") {
          if (!penting.blacklistJpm.includes(targetID)) {
            penting.blacklistJpm.push(targetID);
            hasil.push(`✅ ${targetID} ditambahkan ke blacklist.`);
          } else hasil.push(`⚠️ ${targetID} sudah ada di blacklist.`);
        } else if (act === "off") {
          if (penting.blacklistJpm.includes(targetID)) {
            penting.blacklistJpm = penting.blacklistJpm.filter(x => x !== targetID);
            hasil.push(`✅ ${targetID} dihapus dari blacklist.`);
          } else hasil.push(`⚠️ ${targetID} belum ada di blacklist.`);
        }
      }
      if (!hasil.length) return reply(`Gunakan:\n.bljpm on|idgc\n.bljpm off|idgc`);
      savePenting();
      return reply(hasil.join("\n"));
    }

    const gid = m.chat;
    if (act === "on") {
      if (!penting.blacklistJpm.includes(gid)) {
        penting.blacklistJpm.push(gid);
        savePenting();
        return reply(`✅ Grup ini berhasil ditambahkan ke *Blacklist JPM*.`);
      } else return reply(`✖️ Grup ini sudah ada di daftar blacklist.`);
    } else if (act === "off") {
      if (penting.blacklistJpm.includes(gid)) {
        penting.blacklistJpm = penting.blacklistJpm.filter(x => x !== gid);
        savePenting();
        return reply(`✅ Grup ini berhasil dihapus dari *Blacklist JPM*.`);
      } else return reply(`✖️ Grup ini belum ada di daftar blacklist.`);
    } else return reply(`Gunakan:\n.bljpm on\n.bljpm off\n.bljpm on|idgc\n.bljpm off|idgc\n.bljpm list`);
  }

  if (m.chat.endsWith("@newsletter")) {
    const cid = m.chat;
    if (act === "on") {
      if (!penting.blacklistJpm.includes(cid)) {
        penting.blacklistJpm.push(cid);
        savePenting();
        return reply(`✅ Channel ini berhasil ditambahkan ke *Blacklist JPM*.`);
      } else return reply(`✖️ Channel ini sudah ada di daftar blacklist.`);
    } else if (act === "off") {
      if (penting.blacklistJpm.includes(cid)) {
        penting.blacklistJpm = penting.blacklistJpm.filter(x => x !== cid);
        savePenting();
        return reply(`✅ Channel ini berhasil dihapus dari *Blacklist JPM*.`);
      } else return reply(`✖️ Channel ini belum ada di daftar blacklist.`);
    } else return reply(`Gunakan:\n.bljpm on\n.bljpm off`);
  }

  if (!m.isGroup && !m.chat.endsWith("@newsletter")) {
    const allGroups = await zassbtz.groupFetchAllParticipating();
    const groupIDs = Object.keys(allGroups);
    const allChannelsArr = await zassbtz.getFollowedChannels();
    const allChannels = Object.fromEntries(allChannelsArr.map((ch) => [ch.id, ch]));
    const channelIDs = allChannelsArr.map((ch) => ch.id);

    if (!groupIDs.length && !channelIDs.length)
      return reply("✖️ Tidak ada grup atau channel yang diikuti bot.");

    if (!act) {
      let listText = `*📋 Daftar Grup & Channel Bot:*\n\n`;

      listText += `*🧩 Grup:*\n`;
      groupIDs.forEach((id, i) => {
        const isBl = penting.blacklistJpm.includes(id);
        listText += `${i + 1}. ${allGroups[id].subject} ${isBl ? "(BL)" : ""}\n`;
      });

      if (channelIDs.length) {
        listText += `\n*📢 Channel:*\n`;
        channelIDs.forEach((id, i) => {
          const index = groupIDs.length + i + 1;
          const name = allChannels[id]?.name || "Tanpa Nama";
          const isBl = penting.blacklistJpm.includes(id);
          listText += `${index}. ${name} ${isBl ? "(BL)" : ""}\n`;
        });
      }

      listText += `\nGunakan:\n.bljpm on|1,3\n.bljpm off|2\n\nNomor sesuai urutan di atas.`;
      return reply(listText);
    }

    const idxList = arg.split(",").map(x => parseInt(x.trim()) - 1);
    const isOn = act === "on";
    const isOff = act === "off";
    let hasil = [];

    const combined = [...groupIDs, ...channelIDs];
    for (const idx of idxList) {
      if (isNaN(idx) || idx < 0 || idx >= combined.length) continue;
      const targetID = combined[idx];
      const isChannel = targetID.endsWith("@newsletter");

      if (isOn) {
        if (!penting.blacklistJpm.includes(targetID)) {
          penting.blacklistJpm.push(targetID);
          hasil.push(`✅ ${isChannel ? "Channel" : "Grup"} *${isChannel ? allChannels[targetID]?.name : allGroups[targetID]?.subject}* ditambahkan ke blacklist.`);
        } else {
          hasil.push(`⚠️ ${isChannel ? "Channel" : "Grup"} *${isChannel ? allChannels[targetID]?.name : allGroups[targetID]?.subject}* sudah ada di blacklist.`);
        }
      } else if (isOff) {
        if (penting.blacklistJpm.includes(targetID)) {
          penting.blacklistJpm = penting.blacklistJpm.filter(x => x !== targetID);
          hasil.push(`✅ ${isChannel ? "Channel" : "Grup"} *${isChannel ? allChannels[targetID]?.name : allGroups[targetID]?.subject}* dihapus dari blacklist.`);
        } else {
          hasil.push(`⚠️ ${isChannel ? "Channel" : "Grup"} *${isChannel ? allChannels[targetID]?.name : allGroups[targetID]?.subject}* belum ada di blacklist.`);
        }
      }
    }

    savePenting();
    if (!hasil.length) return reply("✖️ Tidak ada ID yang valid.");
    return reply(hasil.join("\n"));
  }
}
break

case 'listgc':
case 'listgrup': {
  if (!isCreator) return larang();

  await zassbtz.sendMessage(m.chat, { react: { text: '👁️‍🗨️', key: m.key } });

  let gcall;
  try {
    gcall = Object.values(await zassbtz.groupFetchAllParticipating());
  } catch (e) {
    return m.reply("*✖️ Gagal mengambil daftar grup.*");
  }

  let teks = `╭─❐ 『 *DAFTAR GRUP* 』\n│\n`;
  gcall.forEach((group, index) => {
    const isBl = penting.blacklistJpm.includes(group.id);
    teks += `├─◆ ${index + 1}. *${group.subject}*\n`;
    teks += `│    ➤ ID     : ${group.id}\n`;
    teks += `│    ➤ Member : ${group.participants.length} orang\n`;
    teks += `│    ➤ Status : ${group.announce ? "🔒 Tertutup" : "🔓 Terbuka"}\n`;
    teks += `│    ➤ Owner  : ${group.owner ? "@" + group.owner.split('@')[0] : '✖️ Tidak Diketahui'}\n`;
    teks += `│    ➤ BL JPM : ${isBl ? "✅ Ya" : "❌ Tidak"}\n│\n`;
  });
  teks += `╰─❐ Total: *${gcall.length}* Grup`;

  zassbtz.sendMessage(m.chat, {
    text: teks,
    ...previewAd({
      title: `${gcall.length} Grup Aktif`,
      body: `Runtime : ${runtime(process.uptime())}`,
      sourceUrl: global.web,
      thumbnail: global.img,
      mention: [m.sender],
      largerThumbnail: true,
    })
  }, { quoted: m });
}
break

case 'cekidgc': case 'getidgrup': {
   if (!isCreator) return larang()

   if (!q) {
      if (!m.isGroup) return example(`link grupnya`)
      return m.reply(m.chat)
   }

   let linkRegex = args.join(" ")
   let coded = linkRegex.split("https://chat.whatsapp.com/")[1]
   if (!coded) return m.reply("Link Invalid")

   try {
      let res = await zassbtz.groupGetInviteInfo(coded)
      let tekse = res.id ? res.id : "undefined"
      m.reply(tekse)
   } catch (e) {
      console.log(e)
      m.reply("❌ Gagal mengambil ID grup, mungkin link invalid / sesi error")
   }
}
break

case "autoread": {
if (!isCreator) return larang()
if (!text) return example("on/off\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
if (text.toLowerCase() == "on") {
if (autoread) return m.reply("*Autoread* Sudah Aktif!\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
autoread = true
m.reply("*Berhasil Menyalakan Autoread ✅*\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
} else if (text.toLowerCase() == "off") {
if (!autoread) return m.reply("*Autoread* Sudah Tidak Aktif!\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
autoread = false
m.reply("*Berhasil Mematikan Autoread ✅*\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
} else {
return example("on/off\n\nKetik *.statusbot* Untuk Melihat Status Settingan Bot")
}}
break

case "autoreadsw": {
if (!isCreator) return larang()
if (!text) return example("on/off\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
if (text.toLowerCase() == "on") {
if (autoreadsw) return m.reply("*Autoreadsw* Sudah Aktif!\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
autoreadsw = true
m.reply("*Berhasil Menyalakan Autoreadsw ✅*\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
} else if (text.toLowerCase() == "off") {
if (!autoreadsw) return m.reply("*Autoread* Sudah Tidak Aktif!\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
autoreadsw = false
m.reply("*Berhasil Mematikan Autoreadsw ✅*\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
} else {
return example("on/off\n\nKetik *.statusbot* Untuk Melihat Status Settingan Bot")
}}
break

case "anticall": {
if (!isCreator) return larang()
if (!text) return example("on/off\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
if (text.toLowerCase() == "on") {
if (anticall) return m.reply("*Anticall* Sudah Aktif!\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
anticall = true
m.reply("*Berhasil Menyalakan Anticall ✅*\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
} else if (text.toLowerCase() == "off") {
if (!anticall) return m.reply("*Anticall* Sudah Tidak Aktif!\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
anticall = false
m.reply("*Berhasil Mematikan Anticall ✅*\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
} else {
return example("on/off\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
}}
break

case "autojoingc": {
    if (!isCreator) return larang()
    if (!text) return example("on/off")

    let input = text.trim().toLowerCase()
    if (input === "on") {
    if (autojoingc) return m.reply("*Autojoingc* Sudah Aktif!\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
        autojoingc = true
        reply("✅ Fitur Auto Join GC berhasil diaktifkan.")
    } else if (input === "off") {
    if (autojoingc) return m.reply("*Autojoingc* Sudah Tidak Aktif!\nKetik *.statusbot* Untuk Melihat Status Setting Bot")
        autojoingc = false
        reply("✅ Fitur Auto Join GC berhasil dimatikan.")
    } else {
        return example("on/off")
    }
}
break

case "setting":
case "settingbot":
case "option":
case "statusbot": {
  if (!isCreator) return larang()

  var teks = `
*List Status Setting Bot :*

* Autoread   : ${global.autoread ? "*Aktif*" : "*Tidak Aktif*"}
* Autoreadsw : ${global.autoreadsw ? "*Aktif*" : "*Tidak Aktif*"}
* Autojoingc : ${global.autojoingc ? "*Aktif*" : "*Tidak Aktif*"}
* Anticall   : ${global.anticall ? "*Aktif*" : "*Tidak Aktif*"}
* AutoJPM    : ${penting.autoJpm.status ? "*Aktif*" : "*Tidak Aktif*"}

*Contoh Penggunaan :*
.autoread on/off
`
  m.reply(teks)
}
break

case "joingc": case "join": {
if (!isCreator) return larang()
if (!text && !m.quoted) return example('linknya')
let teks = m.quoted ? m.quoted.text : text
if (!teks.includes('whatsapp.com')) return m.reply("Link Tautan Tidak Valid!")
let result = teks.split('https://chat.whatsapp.com/')[1]
await zassbtz.groupAcceptInvite(result).then(respon => m.reply("Berhasil Bergabung Ke Dalam Grup ✅")).catch(error => m.reply(error.toString()))
}
break
case "leavegc2": case "leave2": case "leave": case "leavegc": {
    if (!isCreator) return larang();

    if (isGroup && !args[0]) {
        await m.reply("Otw Bosss");
        await sleep(3000);
        return zassbtz.groupLeave(m.chat);
    }

    let gcall = Object.values(await zassbtz.groupFetchAllParticipating().catch(_ => null));
    let num = [];
    let listgc = `*Contoh Cara Penggunaan :*\nKetik *${prefix+command}* <Nomor Grup / all / tertutup>\n\n`;

    gcall.forEach((u, i) => {
        num.push(i);
        listgc += `*${i+1}.* ${u.subject}
* ID:* ${u.id}
* Total Member:* ${u.participants.length} Member
* Status Grup:* ${u.announce == true ? "Tertutup" : "Terbuka"}
* Pembuat:* ${u.owner ? u.owner.split('@')[0] : 'Sudah keluar'}\n\n`;
    });

    if (!args[0]) {
        return zassbtz.sendMessage(
            m.chat,
            {
                text: listgc,
                ...previewAd({
                    thumbnail: ppuser,
                    title: `[ ${gcall.length} Group Chat ] `,
                    body: `Runtime : ${runtime(process.uptime())}`,
                    sourceUrl: global.web,
                    mention: [m.sender],
                })
            },
            { quoted: qkuro }
        );
    }

    if (args[0].toLowerCase() === "all") {
        for (let gc of gcall) {
            await zassbtz.groupLeave(gc.id);
        }
        return m.reply(`Berhasil keluar dari semua grup ✅`);
    }

    if (args[0].toLowerCase() === "tertutup") {
        let leftCount = 0;
        for (let gc of gcall) {
            if (gc.announce && !gc.participants.find(p => p.id === zassbtz.user.id && p.admin)) {
                await zassbtz.groupLeave(gc.id);
                leftCount++;
            }
        }
        return m.reply(`Berhasil keluar dari ${leftCount} grup tertutup di mana bot bukan admin ✅`);
    }

    if (!num.includes(Number(args[0]) - 1)) return m.reply("Grup tidak ditemukan");
    let leav = Number(args[0]) - 1;
    await m.reply(`Berhasil keluar dari grup:\n*${gcall[leav].subject}*`);
    await zassbtz.groupLeave(gcall[leav].id);
}
break

case'cekkhodam':
 if (!text) return m.reply('Nama nya mana yang mau di cek khodam nya')
function pickRandom(list) {
 return list[Math.floor(Math.random() * list.length)]
}
 m.reply(`
╭━━━━°「 *Khodam ${text}* 」°
┃
┊• Nama : ${text}
┊• Khodam : ${pickRandom(['Macan Tutul', 'Gajah Sumatera', 'Orangutan', 'Harimau Putih', 'Badak Jawa', 'Pocong', 'Kuntilanak', 'Genderuwo', 'Wewe Gombel', 'Kuyang', 'Lembuswana', 'Anoa', 'Komodo', 'Elang Jawa', 'Burung Cendrawasih', 'Tuyul', 'Babi Ngepet', 'Sundel Bolong', 'Jenglot', 'Lele Sangkuriang', 'Kucing Hutan', 'Ayam Cemani', 'Cicak', 'Burung Merak', 'Kuda Lumping', 'Buaya Muara', 'Banteng Jawa', 'Monyet Ekor Panjang', 'Tarsius', 'Cenderawasih Biru', 'Setan Merah', 'Kolor Ijo', 'Palasik', 'Nyi Roro Kidul', 'Siluman Ular', 'Kelabang', 'Beruang Madu', 'Serigala', 'Hiu Karang', 'Rajawali', 'Lutung Kasarung', 'Kuda Sumba', 'Ikan Arwana', 'Jalak Bali', 'Kambing Etawa', 'Kelelawar', 'Burung Hantu', 'Ikan Cupang'])}
┊• Mendampingi dari : ${pickRandom(['1 tahun lalu','2 tahun lalu','3 tahun lalu','4 tahun lalu','dari lahir'])}
┃• Expired : ${pickRandom(['2024','2025','2026','2027','2028','2029','2030','2031','2032','2033','2034','2035'])}
╰═┅═━––––––๑`)
break

case'cekkontol':
 if (!text) return m.reply('Nama nya mana yang mau di cek kontol nya')
 m.reply(`
╭━━━━°「 *Kontol ${text}* 」°
┃
┊• Nama : ${text}
┃• Kontol : ${pickRandom(['ih item','Belang wkwk','Muluss','Putih Mulus','Black Doff','Pink wow','Item Glossy'])}
┊• True : ${pickRandom(['perjaka','ga perjaka','udah pernah dimasukin','masih ori','jumbo'])}
┃• jembut : ${pickRandom(['lebat','ada sedikit','gada jembut','tipis','muluss'])}
┃• ukuran : ${pickRandom(['1cm','2cm','3cm','4cm','5cm','20cm','45cm','50cm','90meter','150meter','5km','gak normal'])}
╰═┅═━––––––๑`)
break
case "ambilq": {
let jsonData = JSON.stringify({ [m.quoted.mtype]: m.quoted }, null, 2)
m.reply(jsonData)
}
break
case "dana": {
if (global.dana == false) return m.reply('Payment Dana Tidak Tersedia')
let teks = `
*Nomor Dana :*
${global.dana}
*A/N :* ${an.dana}

*Note :*
Demi Keamanan Bersama, Buyyer Wajib Mengirim Bukti Pembayaran Agar Tidak Terjadi Hal Yang Tidak Di Inginkan!
`
await zassbtz.sendText(m.chat, teks, qkuro)
}
break
case "ovo": {
if (global.ovo == false) return m.reply('Payment Ovo Tidak Tersedia')
let teks = `
*Nomor Ovo :*
${global.ovo}
*A/N :* ${an.ovo}

*Note :*
Demi Keamanan Bersama, Buyyer Wajib Mengirim Bukti Pembayaran Agar Tidak Terjadi Hal Yang Tidak Di Inginkan!
`
await zassbtz.sendText(m.chat, teks, qkuro)
}
break
case "gopay": {
if (global.gopay == false) return m.reply('Payment Gopay Tidak Tersedia')
let teks = `
*Nomor Gopay :*
${global.gopay}
*A/N :* ${an.gopay}

*Note :*
Demi Keamanan Bersama, Buyyer Wajib Mengirim Bukti Pembayaran Agar Tidak Terjadi Hal Yang Tidak Di Inginkan!
`
await zassbtz.sendText(m.chat, teks, qkuro)
}
break
case "qris": {
  if (!global.qris == false) return m.reply('Payment QRIS Tidak Tersedia')
  m.reply('Memproses Mengambil QRIS, Tunggu Sebentar . . .')

  let teks = `
*Untuk Pembayaran Melalui QRIS All Payment, Silahkan Scan Foto QRIS Diatas Ini*
_WAJIB TAMBAH 500P KALAU PAKAI QRIS_
*Note :*
Demi Keamanan Bersama, Buyyer Wajib Mengirim Bukti Pembayaran Agar Tidak Terjadi Hal Yang Tidak Di Inginkan!
  `.trim()

await zassbtz.sendMessage(
    m.chat,
    {
      image: { url: global.qris },
      caption: teks
    },
    { quoted: qkuro }
  )
  break
}

      case "runtime":
      {
        let lowq = `*Telah Online Selama:*\n${runtime(
          process.uptime(),
        )}*`;
        m.reply(`${lowq}`);
      }
      break

case 'addcase': {
 if (!isCreator) return reply(mess.creator)
 if (!text) return reply('Mana case nya');
const namaFile = 'case.js';
const caseBaru = `${text}`;
fs.readFile(namaFile, 'utf8', (err, data) => {
    if (err) {
        console.error('Terjadi kesalahan saat membaca file:', err);
        return;
    }
    const posisiAwalGimage = data.indexOf("case 'addcase':");

    if (posisiAwalGimage !== -1) {
        const kodeBaruLengkap = data.slice(0, posisiAwalGimage) + '\n' + caseBaru + '\n' + data.slice(posisiAwalGimage);
        fs.writeFile(namaFile, kodeBaruLengkap, 'utf8', (err) => {
            if (err) {
                reply('Terjadi kesalahan saat menulis file:', err);
            } else {
                reply('Sukses Menambahkan Fitur\nJika Ingin Menginfokan Ss Dan Reply Ssan Barcaption .newfitur');
            }
        });
    } else {
        reply('Tidak dapat menambahkan case dalam file.');
    }
});

}
break
case 'delcase': {
if (!isCreator) return reply('Fitur Khusus Owner!')
if (!text) return reply('Mana case nya bang?');
dellCase('./case.js', q)
m.reply('Berhasil menghapus case!.');
}
break

    default:

if (budy.startsWith('=>')) {
    if (!isCreator) return

    function Return(sul) {
        sat = JSON.stringify(sul, null, 2)
        bang = util.format(sat)
        if (sat == undefined) {
            bang = util.format(sul)
        }
        return m.reply(bang)
    }
    try {
        m.reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)))
    } catch (e) {
        m.reply(String(e))
    }
}

if (budy.startsWith('>')) {
    if (!isCreator) return;
    try {
        let evaled = await eval(budy.slice(2));

        if (typeof evaled !== 'string') {
            const util = await import('util')
            evaled = util.inspect(evaled, { depth: 1 })
        }

        await m.reply(evaled);
    } catch (err) {
        m.reply(String(err));
    }
}

if (budy.startsWith('$')) {
    if (!isCreator) return
    exec(budy.slice(2), (err, stdout) => {
        if (err) return m.reply(`${err}`)
        if (stdout) return m.reply(stdout)
    })
}

}
}
} catch (err) {
    console.log(util.format(err))
}
}