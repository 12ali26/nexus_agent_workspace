import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const svgPath = path.resolve('assets/icon.svg')
const pngPath = path.resolve('assets/icon.png')
const linuxIconSizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]

await mkdir(path.dirname(pngPath), { recursive: true })
await sharp(svgPath).resize(1024, 1024).png().toFile(pngPath)

await mkdir(path.resolve('assets/icons/png'), { recursive: true })

await Promise.all(
  linuxIconSizes.map((size) =>
    sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.resolve(`assets/icons/png/${size}x${size}.png`)),
  ),
)

const requiredStaticIcons = [
  'assets/icons/win/icon.ico',
  'assets/icons/mac/icon.icns',
]

for (const iconPath of requiredStaticIcons) {
  try {
    await sharp(iconPath, { pages: -1 }).metadata()
  } catch {
    console.warn(
      `${iconPath} is a static packaging icon and was not regenerated. Make sure it remains committed.`,
    )
  }
}
