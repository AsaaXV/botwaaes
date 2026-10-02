import { modul } from '../module.js';
import * as logger from './logger.js';

const { fs, path, axios } = modul;

const METADATA_URL = 'https://raw.githubusercontent.com/xsalazar/emoji-kitchen-backend/main/app/metadata.json';
const CACHE_PATH = path.join(process.cwd(), 'database', 'emoji-kitchen-metadata.json');
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

let memoryCache = null;

function toCodepoint(emoji) {
  return [...emoji]
    .map((c) => c.codePointAt(0))
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join('-');
}

async function ensureMetadata() {
  if (memoryCache) return memoryCache;

  let needsDownload = true;
  if (fs.existsSync(CACHE_PATH)) {
    const stat = fs.statSync(CACHE_PATH);
    if (Date.now() - stat.mtimeMs < MAX_AGE_MS) needsDownload = false;
  }

  if (needsDownload) {
    try {
      logger.info('Mengunduh data Emoji Kitchen (sekali saja, akan di-cache lokal)...');
      const res = await axios.get(METADATA_URL, { responseType: 'text', timeout: 60000 });
      fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
      fs.writeFileSync(CACHE_PATH, res.data);
    } catch (err) {
      if (!fs.existsSync(CACHE_PATH)) throw err;
      logger.warn('Gagal memperbarui data Emoji Kitchen, memakai cache lama.');
    }
  }

  memoryCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  return memoryCache;
}

async function getEmojiMixUrl(emoji1, emoji2) {
  const metadata = await ensureMetadata();
  const cp1 = toCodepoint(emoji1);
  const cp2 = toCodepoint(emoji2);

  const combos =
    metadata.data?.[cp1]?.combinations?.[cp2] ||
    metadata.data?.[cp2]?.combinations?.[cp1];

  if (!combos || !combos.length) return null;

  const latest = combos.find((c) => c.isLatest) || combos[0];
  return latest.gStaticUrl || null;
}

export { getEmojiMixUrl };
