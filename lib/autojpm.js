import { modul } from '../module.js';
import { sleep } from './myfunc.js';
import * as logger from './logger.js';

const { fs } = modul;

function resolveIntervalMs(autoJpm) {
  let ms = autoJpm.interval * 60000;
  if (autoJpm.type === "hour") ms *= 60;
  if (autoJpm.type === "day") ms *= 1440;
  return ms;
}

function pickNextMessage(messages, startIndex) {
  for (let i = 0; i < messages.length; i++) {
    const idx = (startIndex + i) % messages.length;
    const current = messages[idx];

    if (current.type === "text") return { pesan: current, idx };
    if (current.type !== "text" && current.path && fs.existsSync(current.path)) return { pesan: current, idx };
  }
  return { pesan: null, idx: startIndex };
}

async function runAutoJpm(zassbtz, { loadPenting, savePenting }) {
  if (!zassbtz?.user || !zassbtz.ws?.isOpen) return;

  const penting = loadPenting();
  if (!penting.autoJpm || !penting.autoJpm.status) return;

  const messages = penting.autoJpm.messages;
  if (!Array.isArray(messages) || !messages.length) return;

  const ms = resolveIntervalMs(penting.autoJpm);

  if (!penting.autoJpm._lastRun) penting.autoJpm._lastRun = 0;
  if (Date.now() - penting.autoJpm._lastRun < ms) return;

  penting.autoJpm._lastRun = Date.now();
  if (typeof penting.autoJpm.lastIndex !== "number") penting.autoJpm.lastIndex = 0;

  const { pesan, idx } = pickNextMessage(messages, penting.autoJpm.lastIndex);

  if (!pesan) {
    logger.autoJpmSkipped("Semua pesan AutoJPM invalid");
    return;
  }

  const allGroups = await zassbtz.groupFetchAllParticipating();
  const groupIDs = Object.keys(allGroups).filter((id) => !penting.blacklistJpm.includes(id));

  for (const gid of groupIDs) {
    if (!zassbtz?.user || !zassbtz.ws?.isOpen) {
      logger.autoJpmSkipped("AutoJPM dihentikan: koneksi terputus saat loop");
      break;
    }
    try {
      if (pesan.type === "text") {
        await zassbtz.sendMessage(gid, { text: pesan.text });
      } else {
        await zassbtz.sendMessage(gid, {
          [pesan.type]: fs.readFileSync(pesan.path),
          caption: pesan.caption || "",
        });
      }

      await sleep(global.delayJpm || 4000);
    } catch (e) {
      logger.autoJpmFailed(gid, e.message);

      if (e.message?.includes("Connection Closed") || e.message?.includes("stream")) {
        logger.autoJpmSkipped("AutoJPM dihentikan: koneksi stream error");
        break;
      }

      await sleep(1000);
    }
  }

  penting.autoJpm.lastIndex = (idx + 1) % messages.length;
  savePenting(penting);
}

function startAutoJpm(zassbtz, pentingStore, intervalMs = 60 * 1000) {
  return setInterval(async () => {
    try {
      await runAutoJpm(zassbtz, pentingStore);
    } catch (err) {
      logger.autoJpmError(err.message);
    }
  }, intervalMs);
}

export { startAutoJpm };
