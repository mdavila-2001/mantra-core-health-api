/**
 * La URL de una petición, apta para un log o para el cuerpo de un error.
 *
 * La query string de este backend lleva datos de personas: `q` con un nombre
 * o un correo, `nationalId` con un documento de identidad, y lo mismo pasa con
 * cualquier búsqueda futura que alguien escriba como `GET ?campo=`. Lo que se
 * escribe en el log termina en el agregador, con otra retención y otro control
 * de acceso que la base, así que el valor no se escribe nunca: se conserva el
 * **nombre** del parámetro —dice qué filtro se usó, que es lo que sirve para
 * depurar— y el valor se sustituye.
 *
 * Funciones puras y sin dependencias a propósito: las usan `pino-options.ts`
 * (antes de que Nest exista) y el filtro global de errores, y ninguno de los
 * dos puede cargar el barril de `common` sin arrastrar el grafo entero.
 */

/** Lo que reemplaza a cada valor de la query string. */
export const REDACTED_QUERY_VALUE = '[REDACTED]';

/**
 * La ruta sin la query string: `/profiles/patients?q=Ana` → `/profiles/patients`.
 *
 * Es lo que viaja en el `path` del cuerpo de error. El cliente ya conoce su
 * propia query; devolvérsela sólo sirve para que termine en otro log más (el
 * del proxy que registra respuestas, el de la consola del navegador).
 *
 * @param url - URL de la petición tal como la entrega Express (`req.url`).
 * @returns La ruta sola; `''` si no había URL.
 */
export function pathWithoutQuery(url: string | undefined): string {
  if (!url) return '';
  const cut = url.indexOf('?');
  return cut === -1 ? url : url.slice(0, cut);
}

/**
 * La URL con los nombres de la query intactos y cada valor redactado:
 * `/p?q=Ana&limit=5` → `/p?q=[REDACTED]&limit=[REDACTED]`.
 *
 * Se redacta **todo** valor, también `limit` o `cursor`, en vez de mantener una
 * lista de parámetros sensibles: una lista así se queda vieja el día que
 * alguien agrega un filtro nuevo, y el costo de no ver el `limit` en el log es
 * nulo. Un parámetro sin `=` (`?flag`) queda como está: no tiene valor.
 *
 * @param url - URL de la petición tal como la entrega Express (`req.url`).
 * @returns La URL redactada, o la misma si no traía query.
 */
export function redactUrlQuery(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  const cut = url.indexOf('?');
  if (cut === -1) return url;
  const query = url.slice(cut + 1);
  if (query === '') return url.slice(0, cut);
  const redacted = query
    .split('&')
    .filter((pair) => pair !== '')
    .map((pair) => {
      const eq = pair.indexOf('=');
      return eq === -1 ? pair : `${pair.slice(0, eq)}=${REDACTED_QUERY_VALUE}`;
    })
    .join('&');
  return `${url.slice(0, cut)}?${redacted}`;
}

/**
 * El objeto `req.query` ya parseado, con las mismas claves y cada valor
 * redactado. Un valor anidado (`?a[b]=1` con el parser extendido) o repetido
 * (`?q=1&q=2`) se redacta entero: lo que importa es que no quede ninguno.
 *
 * @param query - `req.query` de Express, o lo que el serializador haya dejado.
 * @returns Un objeto nuevo con los valores redactados; la entrada si no era un objeto.
 */
export function redactQueryObject(query: unknown): unknown {
  if (typeof query !== 'object' || query === null) return query;
  return Object.fromEntries(
    Object.keys(query).map((key) => [key, REDACTED_QUERY_VALUE]),
  );
}
