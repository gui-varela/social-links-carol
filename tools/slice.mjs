import sharp from 'sharp';
import path from 'node:path';

const [file, sliceH = '1400', prefix] = process.argv.slice(2);
const meta = await sharp(file).metadata();
const h = Number(sliceH);
let i = 0;
for (let top = 0; top < meta.height; top += h) {
  const height = Math.min(h, meta.height - top);
  await sharp(file).extract({ left: 0, top, width: meta.width, height }).toFile(`${prefix}-${String(i++).padStart(2, '0')}.png`);
}
console.log(i, 'slices', meta.width, meta.height);
