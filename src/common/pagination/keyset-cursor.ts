import { BadRequestException } from '@nestjs/common';

/**
 * Clave de ordenación de un cursor keyset. Sólo admite escalares porque el cursor
 * viaja por la URL y tiene que poder compararse en SQL contra columnas concretas:
 * un objeto anidado no tendría traducción a una cláusula `WHERE`.
 */
export type KeysetCursorKey = Readonly<Record<string, string | number | null>>;

/**
 * Codifica la clave de continuación de un listado.
 *
 * El resultado es **opaco a propósito**: se publica en `base64url` para que el
 * cliente no lo interprete ni lo fabrique. Si el cliente compusiera cursores a
 * mano quedaría atado a las columnas por las que hoy se ordena, y cambiarlas
 * dejaría de ser un detalle interno.
 *
 * @param key - Valores de la última fila devuelta, en las columnas de ordenación.
 * @returns Cursor listo para viajar en un query param.
 */
export function encodeKeysetCursor(key: KeysetCursorKey): string {
  return Buffer.from(JSON.stringify(key), 'utf8').toString('base64url');
}

/**
 * Decodifica un cursor emitido por {@link encodeKeysetCursor}.
 *
 * Un cursor corrupto es un error **del cliente**, no del servidor: se rechaza con
 * 400 en vez de dejar que un `JSON.parse` reviente más abajo y salga como 500.
 * Por lo mismo se rechazan los valores no escalares, que llegarían a la consulta
 * como comparaciones sin sentido.
 *
 * @param cursor - Valor recibido en el query param.
 * @returns Clave de continuación decodificada.
 * @throws BadRequestException si el cursor no es un objeto plano de escalares.
 */
export function decodeKeysetCursor(cursor: string): KeysetCursorKey {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new BadRequestException('El cursor de paginación no es válido');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed) ||
    !Object.values(parsed).every(
      (value) =>
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number',
    )
  ) {
    throw new BadRequestException('El cursor de paginación no es válido');
  }

  return parsed as KeysetCursorKey;
}
