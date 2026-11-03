/**
 * Distancia en línea recta entre dos puntos WGS84.
 *
 * **Por qué otra copia.** Ya hay tres `haversineKm` locales a su módulo —
 * `pharmacy_inventory/application/pharmacy-inventory-read/read-pharmacy-inventory.use-case.ts`,
 * `community/services/community-public.service.ts` y
 * `pharmacy/services/pharmacy-marketplace.service.ts`—. Importar una de ellas
 * desde otro módulo ataría a ese módulo un cálculo que no es suyo. Esta vive en
 * `common` para el código nuevo; no reemplaza a las otras tres ni las toca.
 *
 * Es distancia sobre la esfera media terrestre: sirve para ordenar sedes de una
 * ciudad y para decir «a 3,2 km en línea recta». No es distancia de ruta.
 */

/** Un punto WGS84 en grados decimales. */
export interface GeoPoint {
  /** Latitud, de -90 a 90. */
  readonly lat: number;
  /** Longitud, de -180 a 180. */
  readonly lng: number;
}

/** Radio medio terrestre en kilómetros. */
const EARTH_RADIUS_KM = 6371;

/**
 * Distancia Haversine en kilómetros, redondeada a un decimal.
 *
 * @param a - Punto de origen.
 * @param b - Punto de destino.
 * @returns Los kilómetros en línea recta, con un decimal.
 */
export function straightLineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (degrees: number): number => (degrees * Math.PI) / 180;
  const halfLat = Math.sin(toRad(b.lat - a.lat) / 2);
  const halfLng = Math.sin(toRad(b.lng - a.lng) / 2);
  const h =
    halfLat * halfLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * halfLng * halfLng;
  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return Math.round(distance * 10) / 10;
}

/**
 * Una coordenada `numeric` de la base (llega como texto) como número.
 *
 * @param value - El texto de la columna.
 * @returns El número, o `null` si no vino o no es un número finito.
 */
export function coordinateOf(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
