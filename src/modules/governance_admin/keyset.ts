import { decodeKeysetCursor } from '../../common/pagination/keyset-cursor';
import { badRequestWithReason } from '../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../common/errors/system-error-reasons';

export interface Keyset {
  c: string;
  i: string;
}

/** Decodifica el cursor de una lista de este módulo; un cursor de otra forma es un 400, no un 500. */
export function readKeyset(cursor: string | undefined): Keyset | undefined {
  if (!cursor) return undefined;
  const k = decodeKeysetCursor(cursor);
  if (typeof k['c'] !== 'string' || typeof k['i'] !== 'string') {
    throw badRequestWithReason(
      'El cursor de paginación no es válido',
      SystemErrorReason.INVALID_CURSOR,
      { parameter: 'cursor' },
    );
  }
  return { c: k['c'], i: k['i'] };
}
