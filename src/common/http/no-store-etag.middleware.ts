import type { NextFunction, Request, Response } from 'express';

/**
 * ¿El `Cache-Control` ya puesto en la respuesta prohíbe guardarla?
 *
 * Compara por directiva y no por subcadena, así `no-store` se reconoce sola,
 * en `private, no-store` o en mayúsculas, sin confundirse con una extensión
 * que sólo la contenga.
 *
 * @param res - Respuesta en curso.
 * @returns `true` si alguna directiva de `Cache-Control` es `no-store`.
 */
function forbidsStorage(res: Response): boolean {
  const header = res.getHeader('Cache-Control');
  if (header === undefined) return false;
  const values = Array.isArray(header) ? header : [String(header)];
  return values
    .flatMap((value) => value.split(','))
    .some((directive) => directive.trim().toLowerCase() === 'no-store');
}

/**
 * Quita el `ETag` de toda respuesta cuyo `Cache-Control` contiene `no-store`
 * (api#1242).
 *
 * ## Por qué hace falta
 *
 * Express 5 genera un `ETag` débil en cada `res.send` (`app.set('etag')` está
 * activo por defecto). Una respuesta `no-store` —el verify de receta, sus
 * 404— no se guarda en ninguna caché, así que no tiene nada que revalidar: el
 * validador sólo invita a mandar `If-None-Match` y abre la puerta a un 304
 * sobre algo que debía leerse siempre fresco.
 *
 * ## Por qué no se apaga el `ETag` en toda la app
 *
 * Las rutas públicas cacheables (`PublicCacheInterceptor`) viven de él: sin
 * `ETag` no hay 304. `app.set('etag', fn)` tampoco sirve para distinguir,
 * porque la función recibe sólo el cuerpo y la codificación, nunca la
 * respuesta con sus cabeceras.
 *
 * ## Cómo lo hace, y por qué en dos puntos
 *
 * - **`setHeader`**: si ya hay `no-store`, un `ETag` que se intente poner se
 *   descarta. Es el caso normal —el handler o el filtro de excepciones fijan
 *   `Cache-Control` antes de `res.send`, que es donde Express calcula el
 *   `ETag`—, y descartarlo ahí además impide que Express conteste 304: su
 *   chequeo de frescura (`req.fresh`) mira el `ETag` de la respuesta, que ya
 *   no existe.
 * - **`writeHead`**: red final, para el orden inverso (un `ETag` puesto antes
 *   que el `no-store`). Antes de escribir las cabeceras se borra el `ETag` si
 *   el `Cache-Control` que sale es `no-store`. `res.end()` sin cabeceras
 *   previas también pasa por acá: Node llama a `this.writeHead` al emitir las
 *   implícitas.
 *
 * Se envuelve la respuesta de cada petición, no el prototipo de Express: no
 * cambia nada fuera de las respuestas que atraviesan este middleware.
 *
 * @param _req - Petición (no se usa).
 * @param res - Respuesta a vigilar.
 * @param next - Continuación de la cadena.
 */
export function stripEtagOnNoStore(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const setHeader = res.setHeader.bind(res);
  res.setHeader = ((
    name: string,
    value: number | string | readonly string[],
  ) => {
    if (name.toLowerCase() === 'etag' && forbidsStorage(res)) return res;
    return setHeader(name, value);
  }) as Response['setHeader'];

  const writeHead = res.writeHead.bind(res) as (...args: unknown[]) => Response;
  res.writeHead = ((...args: unknown[]) => {
    if (forbidsStorage(res)) res.removeHeader('ETag');
    return writeHead(...args);
  }) as Response['writeHead'];

  next();
}
