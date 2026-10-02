import { modul } from '../module.js';
import * as logger from './logger.js';

const { fs, path } = modul;

function bootstrapFiles(dbPath) {
  const dbFile = path.join(dbPath, "database.json");
  const pentingFile = path.join(dbPath, "penting.json");
  const usersJson = path.join(dbPath, "user.json");
  const contactsFile = path.join(dbPath, "contacts.vcf");

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath);
    logger.db("Folder dibuat otomatis.");
  }
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({}, null, 2));
    logger.db("File database.json dibuat.");
  }
  if (!fs.existsSync(usersJson)) {
    fs.writeFileSync(usersJson, JSON.stringify([], null, 2));
    logger.db("File user.json dibuat.");
  }
  if (!fs.existsSync(pentingFile)) {
    const pentingDefault = {
      blacklistJpm: [],
      autoJpm: {
        status: false,
        interval: 0,
        type: "hour",
        messages: [],
        lastIndex: 0,
      },
    };
    fs.writeFileSync(pentingFile, JSON.stringify(pentingDefault, null, 2));
    logger.db("File penting.json dibuat.");
  }
  if (!fs.existsSync(contactsFile)) {
    fs.writeFileSync(contactsFile, "");
    logger.db("File contacts.vcf dibuat.");
  }

  return { dbFile, pentingFile, usersJson, contactsFile };
}

function makePentingStore(pentingFile) {
  function loadPenting() {
    return JSON.parse(fs.readFileSync(pentingFile));
  }

  function savePenting(data) {
    fs.writeFileSync(pentingFile, JSON.stringify(data, null, 2));
  }

  return { loadPenting, savePenting };
}

export { bootstrapFiles, makePentingStore };
