import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

/**
 * Valida un query param con un instante ISO 8601 (`?from=2026-08-07T00:00:00Z`)
 * antes de que llegue a una comparación de la consulta.
 *
 * Sin validar, `new Date('cualquier cosa')` produce un `Invalid Date` que no
 * lanza: viaja hasta el `WHERE`, donde Postgres lo rechaza y sale como 500 —o,
 * peor, la comparación queda siempre falsa y la ventana devuelve cero filas sin
 * que nadie se entere de que el parámetro estaba mal escrito. Es el mismo
 * motivo por el que existe `ParseOptionalLimitPipe`.
 */
@Injectable()
export class ParseOptionalDatePipe implements PipeTransform<
  string | undefined,
  Date | undefined
> {
  /**
   * Convierte el query param en un `Date` validado.
   *
   * @param value - Valor crudo del query param.
   * @param metadata - Metadatos del argumento; se usa el nombre en el mensaje.
   * @returns El instante, o `undefined` si el parámetro no vino.
   * @throws BadRequestException si el valor no es una fecha ISO 8601 válida.
   */
  transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): Date | undefined {
    if (value === undefined || value === '') return undefined;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(
        `${metadata.data ?? 'el parámetro'} debe ser una fecha ISO 8601 (p. ej. 2026-08-07T00:00:00Z)`,
      );
    }
    return parsed;
  }
}
