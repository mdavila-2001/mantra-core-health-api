import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /profiles/patients/merge` (UC-05-08). */
export class MergePatientsDto {
  /**
   * Identificador asociado a surviving patient profile.
   */
  @ApiProperty({
    description: 'Perfil de paciente que sobrevive',
    format: 'uuid',
  })
  @IsUUID()
  survivingPatientProfileId!: string;

  /**
   * Identificador asociado a merged patient profile.
   */
  @ApiProperty({
    description: 'Perfil de paciente que se fusiona (perdedor)',
    format: 'uuid',
  })
  @IsUUID()
  mergedPatientProfileId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la razón de fusión',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;
}

/** Cuerpo de `POST /profiles/patients/merge/{eventId}/reverse` (UC-05-09). */
export class ReverseMergeDto {
  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la razón de reversión',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;
}

/** Respuesta de un evento de fusión / reversión. */
export class MergeEventResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a surviving patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  survivingPatientProfileId!: string;

  /**
   * Identificador asociado a merged patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  mergedPatientProfileId!: string;

  /**
   * Valor de decision status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de la decisión',
    format: 'uuid',
  })
  decisionStatus!: string;

  /**
   * Identificador asociado a reversal of event.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evento original revertido (si aplica)',
  })
  reversalOfEventId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}
