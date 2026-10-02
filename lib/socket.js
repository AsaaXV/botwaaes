import {
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  jidDecode,
} from '@whiskeysockets/baileys';

import { getBuffer, getSizeMedia } from './myfunc.js';
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid, exifAvatar } from './exif.js';
import haruka from '@ryuu-reinzz/luna-lib';
import * as baileysLib from '@whiskeysockets/baileys';
import * as logger from './logger.js';

function normalizeNumber(jid = '') {
  return jid.split('@')[0].split(':')[0];
}

let cachedOwnerPN = null;
let cachedOwnerLID = null;
let lidResolvePromise = null;

async function resolveOwnerLid(zassbtz) {
  const currentPN = String(global.ownernumber || '').trim();
  if (!currentPN) return null;
  if (cachedOwnerPN === currentPN && cachedOwnerLID) return cachedOwnerLID;
  if (lidResolvePromise) return lidResolvePromise;

  lidResolvePromise = (async () => {
    try {
      const jid = currentPN + '@s.whatsapp.net';
      const lid = await zassbtz.signalRepository.lidMapping.getLIDForPN(jid);
      if (!lid) return null;
      cachedOwnerPN = currentPN;
      cachedOwnerLID = lid.split('@')[0].split(':')[0];
      return cachedOwnerLID;
    } catch {
      return null;
    } finally {
      lidResolvePromise = null;
    }
  })();

  return lidResolvePromise;
}

function attachCallHandler(zassbtz, { previewAd, sleep }) {
  zassbtz.ev.on("call", async (user) => {
    if (!global.anticall) return;
    for (const ff of user) {
      if (ff.isGroup === false && ff.status === "offer") {
        const sendcall = await zassbtz.sendMessage(ff.from, {
          text: `@${ff.from.split("@")[0]} Maaf Kamu Akan Saya Block Karna Ownerbot Menyalakan Fitur *Anticall*\nJika Tidak Sengaja Segera Hubungi Owner Untuk Membuka Blokiran Ini`,
          ...previewAd({
            title: "｢ CALL DETECTED ｣",
            body: global.namabot,
            thumbnail: global.img,
            sourceUrl: global.web,
            mention: [ff.from],
          }),
        }, { quoted: null });
        zassbtz.sendContact(ff.from, [global.ownernumber], sendcall);
        await sleep(10000);
        await zassbtz.updateBlockStatus(ff.from, "block");
      }
    }
  });
}

function attachSocketHelpers(zassbtz, deps) {
  const { fs, fileTypeFromBuffer, parsePhoneNumber, store, axios } = deps;

  const formatNumber = (rawJid) => {
    const num = rawJid.split('@')[0].split(':')[0];
    if (rawJid.endsWith('@lid') || !/^\d+$/.test(num)) return num;
    try {
      const parsed = parsePhoneNumber('+' + num);
      return (parsed.valid && parsed.number?.international) || num;
    } catch {
      return num;
    }
  };

  try {
    haruka.addProperty(zassbtz, baileysLib);
  } catch (err) {
    logger.warn('luna-lib gagal di-inject ke socket, fitur previewThumbnail/Button/Carousel mungkin tidak bekerja optimal.');
  }

  zassbtz.getFollowedChannels = async () => {
    const candidates = (store?.chats || []).filter((c) => c.id?.endsWith('@newsletter'));
    const results = [];
    for (const chat of candidates) {
      try {
        const meta = await zassbtz.newsletterMetadata('jid', chat.id);
        if (meta) results.push(meta);
      } catch {}
    }
    return results;
  };

  zassbtz.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (
        (decode.user && decode.server && decode.user + '@' + decode.server) ||
        jid
      );
    } else return jid;
  };

  zassbtz.isOwnerJid = async (jid) => {
    if (!jid) return false;
    const num = normalizeNumber(jid);
    const owners = String(global.ownernumber || '').split(',').map((v) => v.trim()).filter(Boolean);
    const bots = String(global.nomorbot || '').split(',').map((v) => v.trim()).filter(Boolean);

    if (owners.includes(num) || bots.includes(num)) return true;

    if (jid.endsWith('@lid')) {
      const lid = await resolveOwnerLid(zassbtz);
      if (lid && lid === num) return true;
    }

    return false;
  };

  zassbtz.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
    zassbtz.sendMessage(
      jid,
      {
        text,
        mentions: [...text.matchAll(/@(\d{0,16})/g)].map((v) => v[1] + '@s.whatsapp.net'),
        ...options,
      },
      { quoted },
    );

  zassbtz.ev.on('contacts.update', (update) => {
    for (const contact of update) {
      const id = zassbtz.decodeJid(contact.id);
      if (store && store.contacts) {
        store.contacts[id] = { id, name: contact.notify };
      }
    }
  });

  zassbtz.getName = (jid, withoutContact = false) => {
    const id = zassbtz.decodeJid(jid);
    withoutContact = zassbtz.withoutContact || withoutContact;
    let v;
    if (id.endsWith('@g.us')) {
      return new Promise(async (resolve) => {
        v = (store && store.contacts && store.contacts[id]) || {};
        if (!(v.name || v.subject)) {
          try {
            v = (await zassbtz.groupMetadata(id)) || {};
          } catch {
            v = {};
          }
        }
        resolve(
          v.name ||
            v.subject ||
            formatNumber(id),
        );
      });
    }
    v =
      id === '0@s.whatsapp.net'
        ? { id, name: 'WhatsApp' }
        : id === zassbtz.decodeJid(zassbtz.user.id)
          ? zassbtz.user
          : (store && store.contacts && store.contacts[id]) || {};
    return (
      (withoutContact ? '' : v.name) ||
      v.subject ||
      v.verifiedName ||
      formatNumber(jid)
    );
  };

  zassbtz.parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + '@s.whatsapp.net');
  };

  zassbtz.sendContact = async (jid, kon, quoted = '', opts = {}) => {
    const list = [];
    for (const i of kon) {
      const displayName = await zassbtz.getName(i);
      list.push({
        displayName,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${displayName}\nFN:${displayName}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${global.namabot}\nitem2.X-ABLabel:Bot\nitem3.URL:${global.web}\nitem3.X-ABLabel:Website\nitem4.ADR:;;${global.ownername};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
      });
    }
    return zassbtz.sendMessage(
      jid,
      { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts },
      { quoted },
    );
  };

  zassbtz.setStatus = (status) => {
    zassbtz.query({
      tag: 'iq',
      attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
      content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }],
    });
    return status;
  };

  async function resolveBuffer(source) {
    if (Buffer.isBuffer(source)) return source;
    if (/^data:.*?\/.*?;base64,/i.test(source)) return Buffer.from(source.split(',')[1], 'base64');
    if (/^https?:\/\//.test(source)) return await getBuffer(source);
    if (fs.existsSync(source)) return fs.readFileSync(source);
    return Buffer.alloc(0);
  }

  zassbtz.sendImage = async (jid, source, caption = '', quoted = '', options) => {
    const buffer = await resolveBuffer(source);
    return zassbtz.sendMessage(jid, { image: buffer, caption, ...options }, { quoted });
  };

  zassbtz.sendImageAsSticker = async (jid, source, quoted, options = {}) => {
    const buff = await resolveBuffer(source);
    const buffer =
      options && (options.packname || options.author)
        ? await writeExifImg(buff, options)
        : await imageToWebp(buff);
    return zassbtz.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted }).then((response) => {
      if (typeof buffer === 'string' && fs.existsSync(buffer)) fs.unlinkSync(buffer);
      return response;
    });
  };

  zassbtz.sendVideoAsSticker = async (jid, source, quoted, options = {}) => {
    const buff = await resolveBuffer(source);
    const buffer =
      options && (options.packname || options.author)
        ? await writeExifVid(buff, options)
        : await videoToWebp(buff);
    await zassbtz.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
  };

  zassbtz.sendImageAsStickerAvatar = async (jid, source, quoted, options = {}) => {
    const buff = await resolveBuffer(source);
    const webp = await imageToWebp(buff);
    const buffer = await exifAvatar(webp, options.packname || '', options.author || '');
    return zassbtz.sendMessage(jid, { sticker: buffer, ...options }, { quoted });
  };

  zassbtz.sendVideoAsStickerAvatar = async (jid, source, quoted, options = {}) => {
    const buff = await resolveBuffer(source);
    const webp = await videoToWebp(buff);
    const buffer = await exifAvatar(webp, options.packname || '', options.author || '');
    return zassbtz.sendMessage(jid, { sticker: buffer, ...options }, { quoted });
  };

  zassbtz.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    if (options.readViewOnce) {
      message.message =
        message.message?.ephemeralMessage?.message || message.message || undefined;
      const vtype = Object.keys(message.message.viewOnceMessage.message)[0];
      delete message.message.viewOnceMessage.message[vtype].viewOnce;
      message.message = { ...message.message.viewOnceMessage.message };
    }
    const mtype = Object.keys(message.message)[0];
    const content = await generateForwardMessageContent(message, forceForward);
    const ctype = Object.keys(content)[0];
    let context = {};
    if (mtype != 'conversation') context = message.message[mtype].contextInfo;
    content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
    const waMessage = await generateWAMessageFromContent(
      jid,
      content,
      options
        ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo
              ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } }
              : {}),
          }
        : {},
    );
    await zassbtz.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
    return waMessage;
  };

  zassbtz.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    const quoted = message.msg ? message.msg : message;
    const mime = (message.msg || message).mimetype || '';
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    const type = await fileTypeFromBuffer(buffer);
    const isAudio = type?.ext === 'ogg' || type?.ext === 'opus';
    const trueFileName = attachExtension ? `${filename}.${isAudio ? 'mp3' : type?.ext || 'bin'}` : filename;
    fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };

  zassbtz.downloadMediaMessage = async (message) => {
    const quoted = message.msg ? message.msg : message;
    const mime = (message.msg || message).mimetype || '';
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
  };

  zassbtz.getFile = async (source, save) => {
    let res;
    let filename;
    let data;
    if (Buffer.isBuffer(source)) {
      data = source;
    } else if (/^data:.*?\/.*?;base64,/i.test(source)) {
      data = Buffer.from(source.split(',')[1], 'base64');
    } else if (/^https?:\/\//.test(source)) {
      res = await getBuffer(source);
      data = res;
    } else if (fs.existsSync(source)) {
      filename = source;
      data = fs.readFileSync(source);
    } else {
      data = typeof source === 'string' ? source : Buffer.alloc(0);
    }
    const type = (await fileTypeFromBuffer(data)) || { mime: 'application/octet-stream', ext: 'bin' };
    if (data && save && filename) fs.promises.writeFile(filename, data);
    return { res, filename, size: await getSizeMedia(data), ...type, data };
  };

  zassbtz.sendText = (jid, text, quoted = '', options) =>
    zassbtz.sendMessage(jid, { text, ...options }, { quoted });

  zassbtz.sendFile = async (jid, media, options = {}) => {
    const file = await zassbtz.getFile(media);
    let type;
    switch (file.ext) {
      case 'mp3':
        type = 'audio';
        options.mimetype = 'audio/mpeg';
        options.ptt = options.ptt || false;
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
        type = 'image';
        break;
      case 'webp':
        type = 'sticker';
        break;
      case 'mp4':
        type = 'video';
        break;
      default:
        type = 'document';
    }
    return zassbtz.sendMessage(
      jid,
      { [type]: file.data, caption: options.caption || '', ...options },
      { quoted: options.quoted || '', ...options },
    );
  };

  zassbtz.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    const res = await axios.head(url);
    const mime = res.headers['content-type'] || '';
    const kind = mime.split('/')[0];

    if (mime.split('/')[1] === 'gif') {
      return zassbtz.sendMessage(
        jid,
        { video: await getBuffer(url), caption, gifPlayback: true, ...options },
        { quoted, ...options },
      );
    }
    if (mime === 'application/pdf') {
      return zassbtz.sendMessage(
        jid,
        { document: await getBuffer(url), mimetype: 'application/pdf', caption, ...options },
        { quoted, ...options },
      );
    }
    if (kind === 'image') {
      return zassbtz.sendMessage(jid, { image: await getBuffer(url), caption, ...options }, { quoted, ...options });
    }
    if (kind === 'video') {
      return zassbtz.sendMessage(
        jid,
        { video: await getBuffer(url), caption, mimetype: 'video/mp4', ...options },
        { quoted, ...options },
      );
    }
    if (kind === 'audio') {
      return zassbtz.sendMessage(
        jid,
        { audio: await getBuffer(url), caption, mimetype: 'audio/mpeg', ...options },
        { quoted, ...options },
      );
    }
  };


  return zassbtz;
}

export { attachSocketHelpers, attachCallHandler };
