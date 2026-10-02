import fs from 'fs'
import { tmpdir } from 'os'
import Crypto from 'crypto'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
import webp from 'node-webpmux'
import path from 'path'

const ffmpegPath = ffmpegInstaller.path
ffmpeg.setFfmpegPath(ffmpegPath)

function tmpFile(ext) {
  return path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`)
}

function isWebpBuffer(media) {
  return Buffer.isBuffer(media) &&
    media.length > 12 &&
    media.slice(0, 4).toString('ascii') === 'RIFF' &&
    media.slice(8, 12).toString('ascii') === 'WEBP'
}

async function stripWebpExif(media) {
  const tmpIn = tmpFile('webp')
  const tmpOut = tmpFile('webp')
  try {
    fs.writeFileSync(tmpIn, media)
    const img = new webp.Image()
    await img.load(tmpIn)
    img.exif = null
    await img.save(tmpOut)
    return fs.readFileSync(tmpOut)
  } catch {
    return media
  } finally {
    try { if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn) } catch {}
    try { if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut) } catch {}
  }
}

async function webpToVideo(media) {
  if (!Buffer.isBuffer(media) || media.length < 50) {
    throw new Error('Data media kosong atau terlalu kecil untuk diproses.')
  }
  if (!isWebpBuffer(media)) {
    throw new Error('Data yang diterima bukan file webp yang valid.')
  }

  const cleanMedia = await stripWebpExif(media)

  const tmpIn = tmpFile('webp')
  const tmpOut = tmpFile('mp4')
  fs.writeFileSync(tmpIn, cleanMedia)

  await new Promise((resolve, reject) => {
    ffmpeg(tmpIn)
      .on('error', reject)
      .on('end', () => resolve(true))
      .addOutputOptions([
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vsync', '0',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
      ])
      .toFormat('mp4')
      .save(tmpOut)
  })

  const buff = fs.readFileSync(tmpOut)
  fs.unlinkSync(tmpIn)
  fs.unlinkSync(tmpOut)
  return buff
}

async function videoToAudio(media, format = 'mp3') {
  if (!Buffer.isBuffer(media) || media.length < 50) {
    throw new Error('Data media kosong atau terlalu kecil untuk diproses.')
  }

  const tmpIn = tmpFile('mp4')
  const tmpOut = tmpFile(format)
  fs.writeFileSync(tmpIn, media)

  await new Promise((resolve, reject) => {
    ffmpeg(tmpIn)
      .on('error', reject)
      .on('end', () => resolve(true))
      .noVideo()
      .toFormat(format)
      .save(tmpOut)
  })

  const buff = fs.readFileSync(tmpOut)
  fs.unlinkSync(tmpIn)
  fs.unlinkSync(tmpOut)
  return buff
}

export { webpToVideo, videoToAudio, isWebpBuffer }
