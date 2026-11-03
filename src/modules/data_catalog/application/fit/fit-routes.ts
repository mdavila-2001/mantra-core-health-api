import { createHash } from 'node:crypto';
import { normalizeTemplate } from '../../../../observability/route-index/route-index.service';
import { FINGERPRINT_LENGTH } from './fit.constants';

/**
 * Clave comparable de una ruta: verbo en mayúsculas y plantilla con los parámetros anónimos.
 * `{id}` (OpenAPI) y `:id` (Express) son lo mismo, y el nombre del parámetro no cambia qué ruta es:
 * lo que importa para el catálogo es la forma.
 */
export function routeKey(method: string, template: string): string {
  const forma = normalizeTemplate(template).replace(/:[A-Za-z0-9_]+/g, ':p');
  return `${method.toUpperCase()} ${forma}`;
}

/** Huella de un conjunto de claves de ruta, independiente del orden y de los duplicados. */
export function routesFingerprint(keys: Iterable<string>): string {
  const ordenadas = [...new Set(keys)].sort();
  return createHash('sha256')
    .update(ordenadas.join('\n'))
    .digest('hex')
    .slice(0, FINGERPRINT_LENGTH);
}

/** Verbos que son una ruta real; `ALL` y `DESCONOCIDO` no lo son. */
const REAL_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const isRealMethod = (method: string): boolean =>
  REAL_METHODS.has(method.toUpperCase());
