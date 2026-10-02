import { modul } from '../module.js';
import readline from 'readline';
import * as logger from './logger.js';

const { fs, chalk } = modul;

function ask(text) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(text, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function sanitizePhoneNumber(input) {
  return input.replace(/[^0-9]/g, "");
}

async function collectOwnerConfig() {
  let didAsk = false;

  if (!global.ownernumber || global.ownernumber.trim() === "") {
    console.log(chalk.cyanBright.bold("✦ Isi Data Owner & Bot"));
    console.log(chalk.magentaBright("Data ini akan disimpan secara permanen di settings.js\n"));
    console.log(chalk.yellowBright("➜ Daftarkan nomor owner (ex: 628xxxxxx): "));
    global.ownernumber = sanitizePhoneNumber(await ask("> "));
    didAsk = true;
  }

  if (!global.ownername || global.ownername.trim() === "") {
    console.log(chalk.yellowBright("➜ Siapa nama mu?: "));
    global.ownername = await ask("> ");
    didAsk = true;
  }

  if (!global.nomorbot || global.nomorbot.trim() === "") {
    console.log(chalk.yellowBright("➜ Masukkan nomor bot untuk pairing (ex: 628xxxxxx): "));
    global.nomorbot = sanitizePhoneNumber(await ask("> "));
    didAsk = true;
  }

  if (!didAsk) return;

  const settingsPath = "./settings.js";
  let settingsContent = fs.existsSync(settingsPath) ? fs.readFileSync(settingsPath, "utf-8") : "";

  try {
    settingsContent = settingsContent
      .replace(/global\.ownernumber\s*=\s*(['"`]).*?\1/, `global.ownernumber = '${global.ownernumber}'`)
      .replace(/global\.ownername\s*=\s*(['"`]).*?\1/, `global.ownername = '${global.ownername}'`)
      .replace(/global\.nomorbot\s*=\s*(['"`]).*?\1/, `global.nomorbot = '${global.nomorbot}'`);
    fs.writeFileSync(settingsPath, settingsContent, "utf-8");
    logger.success("Data berhasil disimpan ke settings.js");
  } catch (err) {
    logger.error("Gagal menyimpan ke settings.js:", err);
  }
}

export { collectOwnerConfig };
