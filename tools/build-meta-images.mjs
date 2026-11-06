import sharp from 'sharp';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const img = (f) => path.join(root, 'assets/img', f);
const NAVY = '#304556';
const CREAM = '#f3ece4';

// Favicon e apple-touch: símbolo navy sobre creme
const icon = async (size, pad, file) => {
  const inner = size - pad * 2;
  const symbol = await sharp(img('simbolo-navy.png')).resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: symbol, gravity: 'center' }])
    .png()
    .toFile(img(file));
};
await icon(512, 100, 'favicon-512.png');
await icon(180, 34, 'apple-touch-icon.png');

// Imagem de compartilhamento 1200x630
const W = 1200;
const H = 630;
const photoW = 420;
const photoH = 630;
const arch = Buffer.from(
  `<svg width="${photoW}" height="${photoH}"><rect width="${photoW}" height="${photoH}" rx="${photoW / 2}" ry="${photoW / 2}" fill="#fff"/><rect y="${photoH / 2}" width="${photoW}" height="${photoH / 2}" fill="#fff"/></svg>`
);
const photo = await sharp(path.join(root, 'images/nutri-carol-varela-consultorio.jfif'))
  .resize(photoW, photoH, { fit: 'cover', position: 'centre' })
  .composite([{ input: arch, blend: 'dest-in' }])
  .png()
  .toBuffer();
const logo = await sharp(img('logo-empilhado-claro.png')).resize({ width: 520 }).toBuffer();
const logoMeta = await sharp(logo).metadata();

await sharp({ create: { width: W, height: H, channels: 4, background: NAVY } })
  .composite([
    { input: logo, left: 100, top: Math.round((H - logoMeta.height) / 2) },
    { input: photo, left: W - photoW - 90, top: 0 },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(img('og.jpg'));
console.log('ok');
