import { mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const svgPath = path.resolve('assets/icon.svg')
const pngPath = path.resolve('assets/icon.png')

await mkdir(path.dirname(pngPath), { recursive: true })
await sharp(svgPath).resize(1024, 1024).png().toFile(pngPath)

const builderPath = path.resolve('node_modules/.bin/electron-icon-builder')
const result = spawnSync(
  builderPath,
  ['--input=assets/icon.png', '--output=assets'],
  { stdio: 'inherit', shell: process.platform === 'win32' },
)

if (result.status !== 0) {
  process.exit(result.status || 1)
}
