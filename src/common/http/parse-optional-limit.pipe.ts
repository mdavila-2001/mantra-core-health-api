import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

/**
 * Valida y acota un query param `limit` opcional (`?limit=100`) antes de que
 * llegue a un `em.find(..., { limit })`: un valor no numérico se traduce hoy
 * en `NaN` como `LIMIT` crudo de SQL (falla la consulta con 500 en vez de
 * usar el batch por defecto) y no había techo para valores absurdos.
 */
@Injectable()
export class ParseOptionalLimitPipe implements PipeTransform<
  string | undefined,
  number | undefined
> {
  constructor(private readonly max = 500) {}

  transform(
    value: string | undefined,
    _metadata: ArgumentMetadata,
  ): number | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > this.max) {
      throw new BadRequestException(
        `limit debe ser un entero entre 1 y ${this.max}`,
      );
    }
    return parsed;
  }
}
