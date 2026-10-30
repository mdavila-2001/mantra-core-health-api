/**
 * Redacción del token de un enlace compartido de receta (S-6, D-6) en rutas,
 * mensajes y cabeceras. Sin dependencias: la usan el log de peticiones
 * (`pino-options.ts`), el filtro global de errores y las instrumentaciones de
 * OpenTelemetry, que se cargan antes que Nest (`telemetry.bootstrap.ts`) y no
 * pueden arrastrar ningún otro módulo.
 */

/**
 * Rutas cuyo segmento siguiente es el token en claro de un enlace compartido
 * de receta (S-6, D-6): la vista pública, la de la farmacia y la que dice si
 * el enlace es de la sesión. El token es la credencial del enlace: quien lo
 * lee en el agregador de logs abre la receta. `/clinical/prescription-shares/`
 * sin `by-token/` lleva un id de enlace, no un token, y queda como está.
 *
 * Sin distinguir mayúsculas, como el ruteo de Express:
 * `/PUBLIC/Prescription-Shares/<token>` también llega al handler. El segmento
 * termina en `/`, `?`, `#` o un espacio, así que también sirve dentro de un
 * texto como el `Cannot GET /…` del 404 de una ruta no declarada.
 */
const SHARE_TOKEN_IN_PATH =
  /(\/(?:public\/prescription-shares|pharmacy\/prescription-shares|clinical\/prescription-shares\/by-token)\/)[^/?#\s]+/gi;

/**
 * Las páginas del front que llevan el token en su ruta: `/rx/<token>` y la de
 * la farmacia que cuelga de ella (`…/rx/<token>`). `/verify/rx/<id>` lleva el
 * id de la receta, que no es una credencial, y queda como está. Llegan a la API
 * en el `Referer` de las peticiones que hace esa página.
 */
const SHARE_TOKEN_IN_WEB_PATH = /((?<!\/verify)\/rx\/)[^/?#\s]+/gi;

/** Lo que queda en el log en lugar del token. */
export const REDACTED_SHARE_TOKEN = '[token]';

/**
 * Reemplaza el token de un enlace compartido de receta en una URL o en un
 * texto que la contiene.
 *
 * @param url - URL, ruta de la petición (con o sin query) o mensaje.
 * @returns El mismo texto con el segmento del token cambiado por `[token]`.
 */
export function redactShareTokenInUrl(url: string): string {
  return url.replace(SHARE_TOKEN_IN_PATH, `$1${REDACTED_SHARE_TOKEN}`);
}

/**
 * Reemplaza el token en un `Referer`: el de las rutas de la API y el de las
 * páginas `/rx/<token>` del front.
 *
 * @param referer - Valor de la cabecera.
 * @returns El mismo valor con el token cambiado por `[token]`.
 */
export function redactShareTokenInReferer(referer: string): string {
  return redactShareTokenInUrl(referer).replace(
    SHARE_TOKEN_IN_WEB_PATH,
    `$1${REDACTED_SHARE_TOKEN}`,
  );
}
