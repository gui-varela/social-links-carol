import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [dir, out, bg = '#888888'] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
const cellW = 360;
const cellH = 150;
const cols = 4;
const rows = Math.ceil(files.length / cols);

const tiles = [];
for (let i = 0; i < files.length; i++) {
  const img = await sharp(path.join(dir, files[i]))
    .resize(cellW - 20, cellH - 40, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const label = Buffer.from(
    `<svg width="${cellW}" height="20"><text x="6" y="14" font-size="13" fill="#fff" font-family="sans-serif">${files[i]}</text></svg>`
  );
  tiles.push({ input: img, left: (i % cols) * cellW + 10, top: Math.floor(i / cols) * cellH + 20 });
  tiles.push({ input: label, left: (i % cols) * cellW, top: Math.floor(i / cols) * cellH });
}

await sharp({
  create: { width: cols * cellW, height: rows * cellH, channels: 4, background: bg },
})
  .composite(tiles)
  .png()
  .toFile(out);
