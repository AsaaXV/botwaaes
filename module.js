import axios from 'axios'
import * as baileys from '@whiskeysockets/baileys'
import chalk from 'chalk'
import * as cheerio from 'cheerio'
import fs from 'fs'
import fsx from 'fs-extra'
import moment from 'moment-timezone'
import path from 'path'
import pino from 'pino'
import process from 'process'
import { fileTypeFromBuffer } from 'file-type';
import parsems from 'parse-ms'
import os from 'os'
import { parsePhoneNumber } from 'awesome-phonenumber'
import util from 'util'
import * as Utils from '@whiskeysockets/baileys/lib/Utils/index.js'

export {
  axios,
  baileys,
  chalk,
  cheerio,
  fs,
  fsx,
  moment,
  fileTypeFromBuffer,
  path,
  pino,
  process,
  parsems,
  os,
  parsePhoneNumber,
  util,
  Utils
}

export const modul = {
  axios,
  baileys,
  chalk,
  cheerio,
  fs,
  fsx,
  moment,
  fileTypeFromBuffer,
  path,
  pino,
  process,
  parsems,
  os,
  parsePhoneNumber,
  util,
  Utils
}