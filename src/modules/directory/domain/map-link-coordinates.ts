/** A point on the map. */
export interface MapCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

const NUMBER = '(-?\\d{1,3}(?:\\.\\d+)?)';
const PAIR = `${NUMBER}\\s*,\\s*${NUMBER}`;

/**
 * Patterns that carry the coordinates in the links people copy from Google
 * Maps and OpenStreetMap, from the most to the least precise:
 * the pin (`!3d…!4d…`), the viewport (`@lat,lng`), a query (`q=lat,lng`),
 * a path segment (`/place/lat,lng`), the OSM marker and, last, the OSM view.
 */
const PATTERNS: readonly RegExp[] = [
  new RegExp(`!3d${NUMBER}!4d${NUMBER}`),
  new RegExp(`@${PAIR}`),
  new RegExp(`[?&](?:q|ll|query|destination|center)=${PAIR}`),
  new RegExp(`/place/${PAIR}`),
  new RegExp(`[?&]mlat=${NUMBER}&mlon=${NUMBER}`),
  new RegExp(`#map=\\d{1,2}/${NUMBER}/${NUMBER}`),
];

const inRange = (lat: number, lng: number): boolean =>
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * The coordinates written inside a map link, or `undefined` when the link
 * does not carry them (a short link, a place name, a malformed URL).
 *
 * Pure: it reads the text and never fetches anything.
 */
export function coordinatesFromMapLink(
  link: string,
): MapCoordinates | undefined {
  let text = link;
  try {
    text = decodeURIComponent(link);
  } catch {
    // A stray `%` is not a reason to give up: match on the raw text.
  }
  for (const pattern of PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (inRange(latitude, longitude)) return { latitude, longitude };
  }
  return undefined;
}
