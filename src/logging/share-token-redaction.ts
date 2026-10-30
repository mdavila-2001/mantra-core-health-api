/**
 * Redacción del token de un enlace compartido de receta (S-6, D-6) en rutas,
 * mensajes y cabeceras. Sin dependencias: la usan el log de peticiones
 * (`pino-options.ts`), el filtro global de errores y las instrumentaciones de
 * OpenTelemetry, que se cargan antes que Nest (`telemetry.bootstrap.ts`) y no
 * pueden arrastrar ningún otro módulo.
 */

/** Lo que queda en el log en lugar del token. */
export const REDACTED_SHARE_TOKEN = '[token]';

/**
 * Rutas de la API cuyo segmento siguiente es el token en claro de un enlace
 * compartido de receta: la vista pública, la de la farmacia y la que dice si
 * el enlace es de la sesión. El token es la credencial del enlace: quien lo
 * lee en el agregador de logs abre la receta. `/clinical/prescription-shares/`
 * sin `by-token` lleva un id de enlace, no un token, y queda como está.
 */
const API_TOKEN_PREFIXES: readonly (readonly string[])[] = [
  ['public', 'prescription-shares'],
  ['pharmacy', 'prescription-shares'],
  ['clinical', 'prescription-shares', 'by-token'],
];

/**
 * Las páginas del front que llevan el token en su ruta: `/rx/<token>` y la de
 * la farmacia que cuelga de ella (`…/rx/<token>`). Llegan a la API en el
 * `Referer`. `/verify/rx/<id>` lleva el id de la receta, que no es una
 * credencial, y queda como está.
 */
const WEB_TOKEN_PREFIXES: readonly (readonly string[])[] = [['rx']];
const WEB_PREFIX_EXCLUDED_AFTER = 'verify';

/**
 * Separador de segmentos tal como lo puede escribir un cliente: `/` o `%2F`
 * (en cualquier caja). Se captura para volver a unir la ruta igual que llegó.
 */
const SEGMENT_SEPARATOR = /(\/|%2f)/i;

/** Largo del token emitido (32 bytes en base64url). */
const TOKEN_LENGTH = 43;

/** Una corrida de base64url del largo de un token, o más. */
const TOKEN_LIKE_RUN = new RegExp(`[A-Za-z0-9_-]{${TOKEN_LENGTH},}`, 'g');

/**
 * Un segmento como lo compara el ruteo: sin códigos `%XX` (también dobles,
 * `%252D`) y en minúsculas, como Express, que no distingue mayúsculas.
 */
function normalizedSegment(raw: string): string {
  let value = raw;
  for (let pass = 0; pass < 3 && value.includes('%'); pass += 1) {
    try {
      value = decodeURIComponent(value);
    } catch {
      break;
    }
  }
  return value.toLowerCase();
}

/**
 * Redacta el token en una ruta sin query. Se toleran las formas no canónicas
 * que un cliente puede mandar y que terminan en un 404 que se loguea:
 * separadores repetidos (`//`) o codificados (`%2F`), letras o guiones
 * codificados (`prescription%2Dshares`) y mayúsculas.
 *
 * Dos pasadas:
 * 1. por segmentos normalizados: el segmento que sigue a un prefijo conocido
 *    se cambia entero por `[token]` (cubre un token con caracteres
 *    codificados adentro);
 * 2. si la ruta nombra un prefijo conocido, cualquier corrida base64url del
 *    largo de un token que quede (por ejemplo, con el prefijo codificado dos
 *    veces). Un UUID tiene 36 caracteres y no la alcanza.
 */
function redactPath(
  path: string,
  prefixes: readonly (readonly string[])[],
  excludedAfter?: string,
): string {
  const parts = path.split(SEGMENT_SEPARATOR);
  // Con el separador capturado, los segmentos quedan en las posiciones pares.
  const segments: number[] = [];
  for (let index = 0; index < parts.length; index += 2) {
    if (parts[index] !== '') segments.push(index);
  }
  const normalized = segments.map((index) => normalizedSegment(parts[index]));

  let named = false;
  for (let k = 0; k < segments.length; k += 1) {
    for (const prefix of prefixes) {
      const matches = prefix.every((part, j) => normalized[k + j] === part);
      if (!matches) continue;
      if (excludedAfter !== undefined && normalized[k - 1] === excludedAfter) {
        continue;
      }
      named = true;
      const tokenSegment = segments[k + prefix.length];
      if (tokenSegment !== undefined) {
        parts[tokenSegment] = REDACTED_SHARE_TOKEN;
      }
    }
  }
  if (!named) {
    // Segmentos enteros sobre la ruta decodificada y sin barras repetidas:
    // `rx` no se confunde con `proxy` ni con `rxnorm`.
    const flat = `/${normalizedSegment(path)}/`.replace(/\/+/g, '/');
    named = prefixes.some((prefix) => flat.includes(`/${prefix.join('/')}/`));
  }
  const redacted = parts.join('');
  return named
    ? redacted.replace(TOKEN_LIKE_RUN, REDACTED_SHARE_TOKEN)
    : redacted;
}

/**
 * Aplica `redactPath` a cada tramo sin espacios de un texto (una URL, una
 * ruta, o el `Cannot GET /…` del 404 de una ruta no declarada), solo sobre la
 * parte anterior a `?` o `#`.
 */
function redactText(
  text: string,
  prefixes: readonly (readonly string[])[],
  excludedAfter?: string,
): string {
  return text.replace(/\S+/g, (chunk) => {
    const cut = chunk.search(/[?#]/);
    const path = cut === -1 ? chunk : chunk.slice(0, cut);
    const rest = cut === -1 ? '' : chunk.slice(cut);
    const redacted = redactPath(path, prefixes, excludedAfter);
    return redacted === path ? chunk : redacted + rest;
  });
}

/**
 * Reemplaza el token de un enlace compartido de receta en una URL o en un
 * texto que la contiene.
 *
 * @param url - URL, ruta de la petición (con o sin query) o mensaje.
 * @returns El mismo texto con el token cambiado por `[token]`.
 */
export function redactShareTokenInUrl(url: string): string {
  return redactText(url, API_TOKEN_PREFIXES);
}

/**
 * Reemplaza el token en un `Referer`: el de las rutas de la API y el de las
 * páginas `/rx/<token>` del front.
 *
 * @param referer - Valor de la cabecera.
 * @returns El mismo valor con el token cambiado por `[token]`.
 */
export function redactShareTokenInReferer(referer: string): string {
  return redactText(
    redactShareTokenInUrl(referer),
    WEB_TOKEN_PREFIXES,
    WEB_PREFIX_EXCLUDED_AFTER,
  );
}
