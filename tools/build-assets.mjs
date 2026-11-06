import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const wawoff2 = require('wawoff2');

const root = path.resolve(import.meta.dirname, '..');
const fontsSrc = process.env.FONTS_SRC;
const logosSrc = process.env.LOGOS_SRC;
const imgSrc = path.join(root, 'images');
const out = (...p) => path.join(root, ...p);

fs.mkdirSync(out('assets/img'), { recursive: true });
fs.mkdirSync(out('assets/fonts'), { recursive: true });
fs.mkdirSync(out('assets/icons'), { recursive: true });

// Black Mango: OTF (Drive) -> WOFF2
for (const f of fs.readdirSync(fontsSrc).filter((n) => n.endsWith('.otf'))) {
  const buf = await wawoff2.compress(fs.readFileSync(path.join(fontsSrc, f)));
  const name = f.replace('BlackMango-', 'black-mango-').replace('.otf', '.woff2').toLowerCase();
  fs.writeFileSync(out('assets/fonts', name), buf);
  console.log('font', name, buf.length);
}

// Photos: JFIF/JPG -> responsive JPG + WebP
const photos = {
  consultorio: { file: 'nutri-carol-varela-consultorio.jfif', widths: [480, 800, 960] },
  sobre: { file: 'nutri-carol-varela-foto-branca.jfif', widths: [480, 800, 1068] },
  perfil: { file: 'nutri-carol-varela-perfil.jfif', widths: [480, 800] },
  'cmt-passaporte': { file: 'passaporte-CMT-fechado.jpg', widths: [480, 864] },
  'cmt-aberto': { file: 'passaporte-CMT.jpg', widths: [480, 768] },
  'cmt-dados': { file: 'passaporte-CMT-dados.jfif', widths: [480, 900] },
  'cmt-mapa': { file: 'passaporte-CMT-mapa.jfif', widths: [480, 960] },
};

for (const [slug, { file, widths }] of Object.entries(photos)) {
  const src = path.join(imgSrc, file);
  for (const w of widths) {
    const base = sharp(src).rotate().resize({ width: w, withoutEnlargement: true });
    await base.clone().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(out('assets/img', `${slug}-${w}.jpg`));
    await base.clone().webp({ quality: 80 }).toFile(out('assets/img', `${slug}-${w}.webp`));
  }
  console.log('photo', slug);
}

// Brand logos (Drive): trim transparent padding, keep PNG + WebP
const logos = {
  'logo-header': 'logotipo_6_-_8.png',
  'logo-empilhado-claro': 'logotipo_3_-_3.png',
  'simbolo-navy': '../simbolo1.png',
};
for (const [slug, file] of Object.entries(logos)) {
  const trimmed = await sharp(path.join(logosSrc, file)).trim().toBuffer();
  const meta = await sharp(trimmed).metadata();
  const w = Math.min(meta.width, 900);
  await sharp(trimmed).resize({ width: w }).png({ compressionLevel: 9 }).toFile(out('assets/img', `${slug}.png`));
  await sharp(trimmed).resize({ width: w }).webp({ quality: 90 }).toFile(out('assets/img', `${slug}.webp`));
  console.log('logo', slug, meta.width, meta.height);
}
