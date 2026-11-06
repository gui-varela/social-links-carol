import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const core = path.join(root, 'tools/node_modules/@phosphor-icons/core/assets');

// id no sprite -> [peso, arquivo Phosphor]
const icons = {
  whatsapp: ['fill', 'whatsapp-logo'],
  instagram: ['regular', 'instagram-logo'],
  youtube: ['regular', 'youtube-logo'],
  google: ['bold', 'google-logo'],
  star: ['fill', 'star'],
  pin: ['regular', 'map-pin'],
  left: ['regular', 'caret-left'],
  right: ['regular', 'caret-right'],
  down: ['bold', 'caret-down'],
  quote: ['fill', 'quotes'],
  pause: ['fill', 'pause'],
  play: ['fill', 'play'],
};

let symbols = '';
for (const [id, [weight, name]] of Object.entries(icons)) {
  const file = path.join(core, weight, weight === 'regular' ? `${name}.svg` : `${name}-${weight}.svg`);
  const svg = fs.readFileSync(file, 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  symbols += `<symbol id="${id}" viewBox="0 0 256 256">${inner}</symbol>\n`;
}

fs.writeFileSync(
  path.join(root, 'assets/icons/sprite.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols}</svg>\n`
);
console.log('sprite', Object.keys(icons).length);
