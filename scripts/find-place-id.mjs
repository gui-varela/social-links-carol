// Descobre o PLACE_ID do perfil da Carol no Google (Text Search da Places API New).
// Uso: GOOGLE_PLACES_API_KEY=... node scripts/find-place-id.mjs "Carol Varela nutricionista Barra Olímpica"
const key = process.env.GOOGLE_PLACES_API_KEY;
const query = process.argv[2] || 'Carol Varela nutricionista';

if (!key) {
  console.error('Defina GOOGLE_PLACES_API_KEY.');
  process.exit(1);
}

const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': key,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount',
    ...(process.env.PLACES_REFERER ? { Referer: process.env.PLACES_REFERER } : {}),
  },
  body: JSON.stringify({ textQuery: query, languageCode: 'pt-BR' }),
});

if (!res.ok) {
  console.error(`Places API respondeu ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const { places = [] } = await res.json();
for (const p of places) {
  console.log(`${p.id}\t${p.displayName?.text}\t${p.formattedAddress || ''}\t${p.rating ?? '-'} (${p.userRatingCount ?? 0})`);
}
if (!places.length) console.log('Nenhum resultado.');
