import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsUUID, ValidateIf } from 'class-validator';

/**
 * Cuerpo parcial de `PATCH /profiles/practitioners/me/specialties/:specialtyId`.
 *
 * Corrige lo que el titular declaró: cuál es la especialidad y si está
 * certificada por junta. **No existe `isPrimary`**: cuál es la principal tiene
 * su propia ruta (`…/:specialtyId/primary`) porque baja a la anterior en la
 * misma transacción, y con la lista blanca estricta mandarlo acá da 400.
 */
export class UpdateOwnSpecialtyDto {
  /** Concepto de `VS_MEDICAL_SPECIALTY`. Uno ajeno al catálogo responde 422. */
  @ApiPropertyOptional({
    description: 'Concept id de la especialidad (VS_MEDICAL_SPECIALTY)',
    format: 'uuid',
  })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsUUID()
  specialtyConceptId?: string;

  /** Certificada por junta. */
  @ApiPropertyOptional({ description: 'Certificada por junta' })
  @ValidateIf((_dto, value: unknown) => value !== undefined)
  @IsBoolean()
  boardCertified?: boolean;
}
