// Gera data/reviews.json a partir da Google Places API (New).
// Uso: GOOGLE_PLACES_API_KEY=... PLACE_ID=... node scripts/fetch-reviews.mjs [saida.json]
import fs from 'node:fs';
import path from 'node:path';

const key = process.env.GOOGLE_PLACES_API_KEY;
const placeId = process.env.PLACE_ID;
const out = process.argv[2] || 'data/reviews.json';

if (!key || !placeId) {
  console.error('Defina GOOGLE_PLACES_API_KEY e PLACE_ID.');
  process.exit(1);
}

const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=pt-BR`;
const res = await fetch(url, {
  headers: {
    'X-Goog-Api-Key': key,
    'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,googleMapsUri,reviews',
    // Só necessário se a chave tiver restrição por "referenciador HTTP"
    ...(process.env.PLACES_REFERER ? { Referer: process.env.PLACES_REFERER } : {}),
  },
});

if (!res.ok) {
  console.error(`Places API respondeu ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const place = await res.json();
const reviews = (place.reviews || [])
  .map((r) => ({
    author: r.authorAttribution?.displayName || 'Paciente',
    photo: r.authorAttribution?.photoUri || null,
    rating: r.rating,
    when: r.relativePublishTimeDescription || '',
    text: (r.originalText?.text || r.text?.text || '').trim(),
  }))
  .filter((r) => r.text);

const data = {
  updatedAt: new Date().toISOString(),
  placeName: place.displayName?.text || '',
  rating: place.rating ?? 0,
  userRatingCount: place.userRatingCount ?? reviews.length,
  googleMapsUri: place.googleMapsUri || '',
  reviews,
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
console.log(`${reviews.length} avaliações salvas em ${out} (nota ${data.rating}, total ${data.userRatingCount}).`);
