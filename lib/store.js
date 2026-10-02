import Database from "better-sqlite3";
//import Database from "bun:sqlite";
import EventEmitter from "events";
import fs from 'fs';

export function makeInMemoryStore({ logger } = {}) {
if (!fs.existsSync("./session")) {
    fs.mkdirSync("./session", { recursive: true, force: true })
  };
      const db = new Database("./session/store.db");

  db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      jid TEXT,
      id TEXT,
      data TEXT,
      PRIMARY KEY (jid, id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      data TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      data TEXT
    )
  `).run();

  const store = {
    logger,
    state: {
      chats: [],
      messages: {},
      contacts: {}
    },

    get contacts() {
      return store.state.contacts;
    },

    get chats() {
      return store.state.chats;
    },

    loadMessage: (jid, id) => {
      const row = db.prepare(
        `SELECT data FROM messages WHERE jid = ? AND id = ?`
      ).get(jid, id);
      return row ? JSON.parse(row.data) : null;
    },

    loadMessages: jid => {
      const rows = db
        .prepare(`SELECT data FROM messages WHERE jid = ?`)
        .all(jid);

      store.state.messages[jid] =
        rows.map(r => JSON.parse(r.data));

      return store.state.messages[jid];
    },

    loadChats: () => {
      const rows = db.prepare(`SELECT data FROM chats`).all();
      store.state.chats = rows.map(r => JSON.parse(r.data));
      return store.state.chats;
    },

    loadContacts: () => {
      const rows = db.prepare(`SELECT data FROM contacts`).all();
      store.state.contacts = {};

      for (const row of rows) {
        const d = JSON.parse(row.data);
        store.state.contacts[d.id] = d;
      }

      return store.state.contacts;
    },

    bind: ev => {
      ev.on("messages.upsert", ({ messages }) => {
        for (const msg of messages) {
          const jid = msg.key.remoteJid;
          const id = msg.key.id;

          db.prepare(
            `INSERT OR REPLACE INTO messages (jid, id, data) VALUES (?, ?, ?)`
          ).run(jid, id, JSON.stringify(msg));

          if (!store.state.messages[jid])
            store.state.messages[jid] = [];

          store.state.messages[jid].push(msg);
        }
      });

      ev.on("chats.update", updates => {
        for (const upd of updates) {
          const existing =
            store.state.chats.find(c => c.id === upd.id) || {};

          const merged = { ...existing, ...upd };

          db.prepare(
            `INSERT OR REPLACE INTO chats (id, data) VALUES (?, ?)`
          ).run(merged.id, JSON.stringify(merged));

          const idx = store.state.chats.findIndex(c => c.id === upd.id);

          if (idx !== -1) store.state.chats[idx] = merged;
          else store.state.chats.push(merged);
        }
      });

      ev.on("contacts.update", updates => {
        for (const upd of updates) {
          const id = upd.id;
          const merged = {
            ...(store.state.contacts[id] || {}),
            ...upd
          };

          db.prepare(
            `INSERT OR REPLACE INTO contacts (id, data) VALUES (?, ?)`
          ).run(id, JSON.stringify(merged));

          store.state.contacts[id] = merged;
        }
      });
    }
  };

  return store;
}
