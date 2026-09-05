import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Decisión del paciente sobre una solicitud de relación asistencial. */
export const CARE_RELATIONSHIP_DECISIONS = ['ACCEPT', 'REJECT'] as const;
/** Define el tipo de dominio care relationship decision. */
export type CareRelationshipDecision =
  (typeof CARE_RELATIONSHIP_DECISIONS)[number];

/**
 * Cuerpo de `POST /authz/care-relationships/:id/respond` (FT-07-R05/R06).
 *
 * Solo el paciente titular de la solicitud puede responderla. `ACCEPT` exige
 * que el paciente indique qué áreas/especialidades autoriza —aunque sea vacío,
 * lo declara a propósito—; `REJECT` las ignora.
 */
export class RespondCareRelationshipDto {
  /** Decisión del paciente. */
  @ApiProperty({
    description: 'Decisión sobre la solicitud',
    enum: CARE_RELATIONSHIP_DECISIONS,
  })
  @IsIn(CARE_RELATIONSHIP_DECISIONS)
  decision!: CareRelationshipDecision;

  /**
   * Especialidades/áreas que el paciente autoriza a ver a este profesional.
   * Solo se usa cuando `decision` es `ACCEPT`; el servicio lo valida.
   */
  @ApiPropertyOptional({
    description:
      'Concept ids de especialidad/área que el paciente autoriza (solo con ACCEPT)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  authorizedSpecialtyConceptIds?: string[];
}
