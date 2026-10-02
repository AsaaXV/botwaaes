import { modul } from '../module.js';
const { fs } = modul;
import { color } from './color.js'

async function uncache(modulePath) {
    return true;
}

async function nocache(modulePath, cb = () => {}) {
    console.log(color('Module', 'blue'), color(`'${modulePath} is up to date!'`, 'cyan'))
    fs.watchFile(modulePath, async () => {
        fs.unwatchFile(modulePath);
        await uncache(modulePath);
        cb(modulePath);
    })
}

export {
    uncache,
    nocache
}
