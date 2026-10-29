import { PreconditionFailedException } from '../../../common';
import { IfMatchRequiredException } from '../http/row-version';
import { FloorPlanReason } from './floor-plan.error-reasons';

/**
 * Lee el `layoutVersion` de un `If-Match` (CONTRATO-PLANO §3.4).
 *
 * Acepta el número pelado (`12`, `"12"`, `W/"12"`) y también el `ETag` completo
 * que devolvió `GET /floor-plans/:id/layout` (`W/"fp:<id>:v12:<hash>"`): el
 * editor puede reenviar el que ya tiene sin recortarlo. Otra cosa es un 400, y
 * `*` no sirve (no dice contra qué versión se edita).
 *
 * @param header - Valor de la cabecera `If-Match`.
 * @param planId - Lienzo de la ruta: un ETag de otro lienzo se rechaza.
 * @returns La versión como entero.
 * @throws IfMatchRequiredException (428) si falta.
 * @throws PreconditionFailedException (422) si no se entiende o es de otro lienzo.
 */
export function parseLayoutIfMatch(
  header: string | string[] | undefined,
  planId: string,
): number {
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw === undefined || raw.trim() === '') throw new IfMatchRequiredException();
  const value = raw.trim().replace(/^W\//, '').replace(/^"|"$/g, '');
  const plain = /^(\d{1,9})$/.exec(value);
  if (plain) return Number(plain[1]);
  const etag = /^fp:([0-9a-f-]{36}):v(\d{1,9})(?::[0-9a-f]+)?$/.exec(value);
  if (etag && etag[1] === planId) return Number(etag[2]);
  throw new PreconditionFailedException(
    'If-Match debe ser el layoutVersion del lienzo o el ETag de su layout',
    undefined,
    FloorPlanReason.PLAN_VERSION_MISMATCH,
  );
}

/**
 * ¿El `If-None-Match` del cliente coincide con el `ETag` actual? Compara de
 * forma débil (RFC 9110 §8.8.3.2) y admite una lista y `*`.
 *
 * @param header - Valor de `If-None-Match`.
 * @param etag - ETag vigente.
 * @returns `true` si corresponde responder 304.
 */
export function etagMatches(
  header: string | string[] | undefined,
  etag: string,
): boolean {
  const raw = Array.isArray(header) ? header.join(',') : header;
  if (!raw) return false;
  const strip = (tag: string): string => tag.trim().replace(/^W\//, '');
  const current = strip(etag);
  return raw
    .split(',')
    .map(strip)
    .some((tag) => tag === '*' || tag === current);
}
