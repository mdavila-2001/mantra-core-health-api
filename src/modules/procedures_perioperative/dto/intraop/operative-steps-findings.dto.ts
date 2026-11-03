import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  CLINICAL_SEVERITIES,
  type ClinicalSeverity,
  LATERALITIES,
  type Laterality,
} from '../common';

// ---------------------------------------------------------------------------
// UC-53-08 · Pasos y hallazgos
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /procedure-cases/{id}/operative-steps` (UC-53-08). */
export class CreateOperativeStepDto {
  /**
   * Identificador asociado a step code concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Código del paso operatorio' })
  @IsUUID()
  stepCodeConceptId!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiProperty({ description: 'Qué se hizo' })
  @IsString()
  description!: string;

  /**
   * Identificador asociado a procedure.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  /**
   * Identificador asociado a performed by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performedByProfileId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sitio anatómico intervenido',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Valor de laterality mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: LATERALITIES })
  @IsOptional()
  @IsIn(LATERALITIES)
  laterality?: Laterality;
}

/**
 * Define el contrato validado para operative step response.
 */
export class OperativeStepResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de step number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número del paso dentro del caso' })
  stepNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/**
 * Un paso operatorio dentro de CaseDetailDto.operativeSteps (CL-55).
 */
export class OperativeStepItemDto {
  /** Identificador del paso. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Orden dentro de la intervención. */
  @ApiProperty()
  stepNumber!: number;

  /** Código del paso. */
  @ApiProperty({ format: 'uuid' })
  stepCodeConceptId!: string;

  /** Descripción escrita por quien lo registró. */
  @ApiProperty()
  description!: string;

  /** Profesional que lo ejecutó, si se registró. */
  @ApiPropertyOptional({ format: 'uuid' })
  performedByProfileId?: string;

  /** Sitio anatómico, si se registró. */
  @ApiPropertyOptional({ format: 'uuid' })
  bodySiteConceptId?: string;

  /** Lateralidad, si aplica. */
  @ApiPropertyOptional({ format: 'uuid' })
  lateralityConceptId?: string;

  /** Estado del paso. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Cuándo empezó, si se cronometró. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  startedAt?: Date;

  /** Cuándo terminó, si se cronometró. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endedAt?: Date;
}

/** Cuerpo de `POST /procedure-cases/{id}/findings` (UC-53-08). */
export class RecordFindingDto {
  /**
   * Identificador asociado a finding code concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Código del hallazgo' })
  @IsUUID()
  findingCodeConceptId!: string;

  /**
   * Valor de finding text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Qué se encontró' })
  @IsString()
  findingText!: string;

  /**
   * Identificador asociado a operative step.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paso en el que se observó',
  })
  @IsOptional()
  @IsUUID()
  operativeStepId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Valor de laterality mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: LATERALITIES })
  @IsOptional()
  @IsIn(LATERALITIES)
  laterality?: Laterality;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: CLINICAL_SEVERITIES })
  @IsOptional()
  @IsIn(CLINICAL_SEVERITIES)
  severity?: ClinicalSeverity;

  /**
   * Identificador asociado a observation.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  observationId?: string;

  /**
   * Identificador asociado a recorded by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  recordedByProfileId?: string;
}

/**
 * Define el contrato validado para finding response.
 */
export class FindingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a procedure case.
   */
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  /**
   * Valor de body site recorded mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el sitio anatómico se registró en el procedimiento',
  })
  bodySiteRecorded!: boolean;
}
