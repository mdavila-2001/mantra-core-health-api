import { normalizeSearchText } from '../../../common/text/normalize-search-text';
import { addDecimals } from '../../../common/money/decimal-money';

/**
 * Las reglas puras de P37: las sucursales de una farmacia y qué tiene cada una
 * de una receta escrita a mano.
 *
 * Viven acá, sin base ni Nest, porque son las que deciden lo que la persona lee
 * («ésta tiene todo», «a 1,2 km») y cada una tiene un caso límite que una
 * prueba de servicio no ve.
 */

/** Tope de renglones de una receta (una receta de papel no trae veinte). */
export const PRESCRIPTION_MAX_ITEMS = 20;
/** Tope de largo de un renglón: «Amoxicilina 500 mg cada 8 horas por 7 días» cabe de sobra. */
export const PRESCRIPTION_ITEM_MAX_LENGTH = 120;
/** Tope de sucursales de una cadena servidas en una lectura. */
export const PUBLIC_BRANCHES_MAX = 200;

/** Un punto en grados decimales. */
export interface GeoPointPure {
  readonly lat: number;
  readonly lng: number;
}

/** Una sede de farmacia tal como sale de la base, con su sucursal y su dirección. */
export interface PublicBranchRow {
  /** `pharmacy.pharmacy_sites.id`: la clave de la sucursal. */
  readonly siteId: string;
  readonly siteName: string;
  /** Nombre comercial (o razón social) de la farmacia dueña de la sede. */
  readonly pharmacyName: string;
  readonly addressLines: string | null;
  readonly city: string | null;
  /** `numeric` como texto; primero el de `directory.branches`, si no el de la dirección. */
  readonly latitude: string | null;
  readonly longitude: string | null;
  readonly description: string | null;
  readonly locationUrl: string | null;
}

/** Un producto en stock de una sede que casa con algún renglón. */
export interface BranchProductRow {
  readonly siteId: string;
  readonly productId: string;
  readonly genericName: string;
  readonly brandName: string | null;
  readonly strengthText: string | null;
  readonly packageSizeText: string | null;
  /** Texto donde se busca: genérico, marca, medicamento, concentración y presentación. */
  readonly searchText: string;
  /** Precio vigente para esa sede como texto exacto, o `null`. */
  readonly price: string | null;
  readonly currency: string | null;
}

/** La sucursal publicada. Mismo contrato que `PublicPharmacyBranch` del front. */
export interface PublicBranchView {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly siteName: string;
  readonly city: string | null;
  readonly addressText: string | null;
  readonly phone: string | null;
  readonly openingHours: string | null;
  readonly description: string | null;
  readonly locationUrl: string | null;
  readonly location: GeoPointPure | null;
  readonly locationAccuracy: string | null;
  readonly isCurrent: boolean;
}

export interface PublicBranchMatchView {
  readonly term: string;
  readonly genericName: string;
  readonly brandName: string | null;
  readonly presentation: string | null;
  readonly price: string | null;
  readonly currency: string | null;
}

export interface PublicBranchAvailabilityView {
  readonly branch: PublicBranchView;
  readonly matches: PublicBranchMatchView[];
  readonly missing: string[];
  readonly complete: boolean;
  readonly totalAmount: string | null;
  readonly currency: string | null;
  readonly distanceKm: number | null;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Distancia en línea recta (haversine), con una decimal — la misma fórmula y
 * el mismo redondeo que `pharmacy-inventory/availability` (PAC-MED-005).
 */
export function straightLineKm(a: GeoPointPure, b: GeoPointPure): number {
  const toRad = (degrees: number): number => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return Math.round(distance * 10) / 10;
}

/**
 * Los renglones de la receta, limpios: sin vacíos, sin repetidos (sin tildes ni
 * mayúsculas) y en el orden en que se escribieron.
 *
 * @param items - Lo que mandó el cliente (ya validado en tipo y largo por el DTO).
 * @returns Los renglones a buscar.
 */
export function cleanPrescriptionItems(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    const key = normalizeSearchText(trimmed);
    if (key === '' || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

/** Una coordenada `numeric` de BD como número dentro de rango, o `null`. */
function coordinate(value: string | null, limit: number): number | null {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : null;
}

/** «500 mg · caja x 10», o `null` si no hay ninguna de las dos partes. */
function presentationOf(row: BranchProductRow): string | null {
  const text = [row.strengthText, row.packageSizeText]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' · ');
  return text === '' ? null : text;
}

/**
 * La proyección pública de una sede, campo por campo.
 *
 * El `slug` es el de la ficha: todas las sedes de un tenant comparten ficha
 * (decisión D-6 de P37). Por eso `isCurrent` sólo es `true` cuando la cadena
 * tiene una única sucursal — es la que se está mirando—; con varias, ninguna
 * es «la ficha», todas lo son.
 *
 * @param row - La sede como sale de la base.
 * @param slug - Slug de la ficha pública.
 * @param onlyOne - Si la cadena tiene una sola sucursal.
 */
export function toPublicBranch(
  row: PublicBranchRow,
  slug: string,
  onlyOne: boolean,
): PublicBranchView {
  const lat = coordinate(row.latitude, 90);
  const lng = coordinate(row.longitude, 180);
  const pharmacy = row.pharmacyName.trim();
  const site = row.siteName.trim();
  const name =
    pharmacy === '' || site.toLowerCase().includes(pharmacy.toLowerCase())
      ? site
      : `${pharmacy} · ${site}`;
  const description = row.description?.trim() ?? '';
  const locationUrl = row.locationUrl?.trim() ?? '';
  return {
    id: row.siteId,
    slug,
    name,
    siteName: site,
    city: row.city?.trim() || null,
    addressText: row.addressLines?.trim() || null,
    phone: null,
    openingHours: null,
    description: description === '' ? null : description,
    // La API ya valida `http(s)` al guardar (P54); se vuelve a exigir acá
    // porque esto se pinta como enlace en una página pública.
    locationUrl: /^https?:\/\//i.test(locationUrl) ? locationUrl : null,
    location: lat === null || lng === null ? null : { lat, lng },
    locationAccuracy: null,
    isCurrent: onlyOne,
  };
}

/**
 * El producto que surte un renglón en una sede, o `undefined`.
 *
 * Casa si el texto de búsqueda del producto **contiene** el renglón, sin tildes
 * ni mayúsculas. Si casan varios gana el más barato con precio, después el que
 * tiene precio, después por genérico e id (determinista).
 */
function bestMatch(
  term: string,
  products: readonly BranchProductRow[],
): BranchProductRow | undefined {
  const wanted = normalizeSearchText(term);
  const candidates = products.filter((product) =>
    normalizeSearchText(product.searchText).includes(wanted),
  );
  return [...candidates].sort(compareCandidates)[0];
}

function compareCandidates(a: BranchProductRow, b: BranchProductRow): number {
  if (a.price !== null && b.price !== null) {
    const byPrice = Number(a.price) - Number(b.price); // sólo para COMPARAR
    if (byPrice !== 0) return byPrice;
  } else if (a.price !== b.price) {
    return a.price === null ? 1 : -1;
  }
  return (
    a.genericName.localeCompare(b.genericName, 'es') ||
    a.productId.localeCompare(b.productId)
  );
}

/**
 * Qué tiene una sucursal de los renglones de una receta.
 *
 * Sólo llegan productos **en stock**: un agotado cuenta como faltante, que es
 * lo que le pasa a quien va con la receta en la mano. El total es exacto
 * (enteros) y es `null` si no encontró nada, si a algún encontrado le falta
 * precio o si mezclan monedas: un total parcial sería un precio que miente.
 *
 * @param branch - La sucursal ya proyectada.
 * @param terms - Renglones limpios de la receta.
 * @param products - Productos en stock de ESA sede que casan con algún renglón.
 * @param origin - Desde dónde medir, si la persona lo entregó.
 */
export function availabilityOf(
  branch: PublicBranchView,
  terms: readonly string[],
  products: readonly BranchProductRow[],
  origin: GeoPointPure | null,
): PublicBranchAvailabilityView {
  const matches: PublicBranchMatchView[] = [];
  const missing: string[] = [];
  for (const term of terms) {
    const product = bestMatch(term, products);
    if (product === undefined) {
      missing.push(term);
      continue;
    }
    matches.push({
      term,
      genericName: product.genericName,
      brandName: product.brandName,
      presentation: presentationOf(product),
      price: product.price,
      currency: product.price === null ? null : product.currency,
    });
  }

  const priced = matches.filter((match) => match.price !== null);
  const currencies = new Set(priced.map((match) => match.currency));
  const totalKnown =
    matches.length > 0 &&
    priced.length === matches.length &&
    currencies.size === 1;

  return {
    branch,
    matches,
    missing,
    complete: terms.length > 0 && missing.length === 0,
    totalAmount: totalKnown
      ? addDecimals(priced.map((match) => match.price))
      : null,
    currency: totalKnown ? (priced[0].currency ?? null) : null,
    distanceKm:
      origin === null || branch.location === null
        ? null
        : straightLineKm(origin, branch.location),
  };
}

/**
 * El orden del resultado: primero las completas, después la más cercana
 * (sin distancia al final), después la que más tiene, y por nombre. La
 * pantalla no reordena: recomienda la primera.
 */
export function compareBranchAvailability(
  a: PublicBranchAvailabilityView,
  b: PublicBranchAvailabilityView,
): number {
  if (a.complete !== b.complete) return a.complete ? -1 : 1;
  if (a.distanceKm !== b.distanceKm) {
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  }
  if (a.matches.length !== b.matches.length) {
    return b.matches.length - a.matches.length;
  }
  return (
    a.branch.siteName.localeCompare(b.branch.siteName, 'es') ||
    a.branch.id.localeCompare(b.branch.id)
  );
}

/** Orden de la lista de sucursales sin receta: por ciudad y nombre. */
export function compareBranches(
  a: PublicBranchView,
  b: PublicBranchView,
): number {
  return (
    (a.city ?? '￿').localeCompare(b.city ?? '￿', 'es') ||
    a.siteName.localeCompare(b.siteName, 'es') ||
    a.id.localeCompare(b.id)
  );
}
