import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { Matches, type ValidationOptions } from 'class-validator';

/**
 * Formato UUID genérico (8-4-4-4-12 hex), SIN exigir bits de versión/variante.
 *
 * Los ids del catálogo de estudios los acuñan cargadores con `md5(...)`
 * (`tools/study-catalogs`, `tools/terminology-import/lab-tests`) y no ponen esos
 * bits; `@IsUUID()` los rechazaba con 400. Se usa SOLO en campos que
 * referencian un concepto del catálogo; los ids de entidades de negocio
 * (paciente, tenant, informe…) siguen con `@IsUUID()` estricto.
 */
export const CONCEPT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida el formato de un id de concepto (con `{ each: true }` para arreglos). */
export function IsConceptId(options?: ValidationOptions): PropertyDecorator {
  return Matches(CONCEPT_ID_PATTERN, {
    message: (args) => `${args.property} must be a UUID-formatted concept id`,
    ...options,
  });
}

/**
 * `ParseUUIDPipe` para ids de concepto de parámetros de ruta: mismo formato
 * genérico que {@link IsConceptId}; 400 con basura.
 */
@Injectable()
export class ParseConceptIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !CONCEPT_ID_PATTERN.test(value)) {
      throw new BadRequestException(
        'Validation failed (UUID-formatted concept id is expected)',
      );
    }
    return value;
  }
}
