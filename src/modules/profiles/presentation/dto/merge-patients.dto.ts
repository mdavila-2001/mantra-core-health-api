import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/** Tope de una página de eventos de fusión. */
const MERGE_EVENTS_MAX_LIMIT = 200;
const MERGE_EVENTS_DEFAULT_LIMIT = 50;

/**
 * Query de `GET /profiles/patients/merge-events` (UC-05-09·L).
 *
 * Sin filtro devuelve los últimos eventos del tenant. Con `patientProfileId`
 * devuelve los de esa persona **esté de cualquiera de los dos lados**: quien
 * revisa un registro sospechoso no sabe si el que mira sobrevivió o fue el
 * absorbido, y obligarlo a adivinar sería devolverle una lista vacía que se lee
 * como «esta persona nunca se fusionó».
 */
export class ListMergeEventsQueryDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente involucrado, de cualquiera de los dos lados',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: MERGE_EVENTS_DEFAULT_LIMIT, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MERGE_EVENTS_MAX_LIMIT)
  limit?: number;
}

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

/** Respuesta de `GET /profiles/patients/merge-events`. */
export class ListMergeEventsResponseDto {
  /**
   * Eventos de esta página, del más reciente al más antiguo.
   */
  @ApiProperty({ type: [MergeEventResponseDto] })
  items!: MergeEventResponseDto[];

  /**
   * Cantidad devuelta.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado.
   */
  @ApiProperty()
  limit!: number;
}

export { MERGE_EVENTS_DEFAULT_LIMIT, MERGE_EVENTS_MAX_LIMIT };
