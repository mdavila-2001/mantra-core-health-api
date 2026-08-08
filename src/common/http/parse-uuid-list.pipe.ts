import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

/** Formato canónico de UUID; el mismo que valida `ParseUUIDPipe` de Nest. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valida un query param con una lista de UUIDs separados por coma
 * (`?ids=a,b,c`) antes de que llegue a un `$in` de la consulta.
 *
 * Existe por el mismo motivo que `ParseOptionalLimitPipe`: sin validar, un
 * valor cualquiera entra al `WHERE` como literal y Postgres corta la petición
 * con un error de tipo que sale como 500, cuando es un error del cliente. Y
 * sin tope, un cliente puede pedir una lista arbitrariamente larga y convertir
 * una resolución de etiquetas en un escaneo de la tabla más consultada del
 * catálogo.
 *
 * Devuelve `undefined` cuando el parámetro no viene —el llamador distingue
 * "no filtres por ids" de "filtra por esta lista"— y una lista vacía nunca:
 * `?ids=` con valor vacío es un error del cliente, no un "dame todo".
 */
@Injectable()
export class ParseUuidListPipe implements PipeTransform<
  string | undefined,
  string[] | undefined
> {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param max - Tope de ids admitidos en una sola petición.
   */
  constructor(private readonly max = 200) {}

  /**
   * Convierte el query param en una lista de UUIDs validada.
   *
   * @param value - Valor crudo del query param.
   * @param _metadata - Metadatos del argumento; no se usan.
   * @returns Lista de UUIDs, o `undefined` si el parámetro no vino.
   * @throws BadRequestException si algún elemento no es UUID o se supera el tope.
   */
  transform(
    value: string | undefined,
    _metadata: ArgumentMetadata,
  ): string[] | undefined {
    if (value === undefined) return undefined;

    const parts = value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length === 0) {
      throw new BadRequestException(
        'ids no puede venir vacío: omita el parámetro para no filtrar por id',
      );
    }
    if (parts.length > this.max) {
      throw new BadRequestException(
        `ids admite como máximo ${this.max} identificadores por petición`,
      );
    }
    const invalid = parts.filter((part) => !UUID_PATTERN.test(part));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `ids debe ser una lista de UUID separados por coma; no lo son: ${invalid
          .slice(0, 5)
          .join(', ')}`,
      );
    }
    // Duplicados: el cliente suele armar la lista recorriendo una tabla, donde
    // el mismo estado se repite en muchas filas. Deduplicar aquí evita mandar
    // ese ruido a la consulta.
    return [...new Set(parts)];
  }
}
