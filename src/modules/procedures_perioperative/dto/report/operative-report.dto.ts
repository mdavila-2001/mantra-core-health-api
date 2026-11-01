import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CLINICAL_SEVERITIES, type ClinicalSeverity } from '../common';

// ---------------------------------------------------------------------------
// UC-53-11 · Reporte operatorio
// ---------------------------------------------------------------------------

/** Destino del paciente al salir del quirófano. */
export type Disposition = 'PACU' | 'ICU' | 'WARD' | 'HOME';
export const DISPOSITIONS = ['PACU', 'ICU', 'WARD', 'HOME'] as const;

/** Relación de la complicación con lo hecho. */
export type Relatedness = 'PROCEDURE' | 'ANESTHESIA' | 'UNRELATED';
export const RELATEDNESS = ['PROCEDURE', 'ANESTHESIA', 'UNRELATED'] as const;

/**
 * Define el contrato validado para complication.
 */
export class ComplicationDto {
  /**
   * Identificador asociado a complication code concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  complicationCodeConceptId!: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiProperty({ enum: CLINICAL_SEVERITIES })
  @IsIn(CLINICAL_SEVERITIES)
  severity!: ClinicalSeverity;

  /**
   * Valor de relatedness mantenido por la instancia.
   */
  @ApiProperty({ enum: RELATEDNESS })
  @IsIn(RELATEDNESS)
  relatedness!: Relatedness;

  /**
   * Identificador asociado a condition.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  conditionId?: string;

  /**
   * Valor de management text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cómo se manejó' })
  @IsOptional()
  @IsString()
  managementText?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/operative-reports` (UC-53-11). */
export class DraftOperativeReportDto {
  /**
   * Identificador asociado a procedure.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Procedimiento ya registrado en la historia clínica',
  })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  /**
   * Código del procedimiento, cuando todavía no está en la historia.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Código del procedimiento a registrar si aún no existe',
  })
  @IsOptional()
  @IsUUID()
  procedureCodeConceptId?: string;

  /**
   * Identificador asociado a author profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Autor del reporte' })
  @IsUUID()
  authorProfileId!: string;

  /**
   * Valor de preoperative diagnosis text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preoperativeDiagnosisText?: string;

  /**
   * Valor de postoperative diagnosis text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postoperativeDiagnosisText?: string;

  /**
   * Valor de procedure description mantenido por la instancia.
   */
  @ApiProperty({ description: 'Descripción de lo realizado' })
  @IsString()
  procedureDescription!: string;

  /**
   * Valor de findings text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findingsText?: string;

  /**
   * Valor de estimated blood loss ml mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Sangrado estimado en mililitros' })
  @IsOptional()
  @IsNumberString()
  estimatedBloodLossMl?: string;

  /**
   * Valor de drains text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  drainsText?: string;

  /**
   * Valor de complications text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complicationsText?: string;

  /**
   * Valor de disposition mantenido por la instancia.
   */
  @ApiProperty({ enum: DISPOSITIONS })
  @IsIn(DISPOSITIONS)
  disposition!: Disposition;

  /**
   * Valor de complications mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ComplicationDto],
    description: 'Complicaciones a registrar',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComplicationDto)
  complications?: ComplicationDto[];
}

/**
 * Define el contrato validado para operative report response.
 */
export class OperativeReportResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de report version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión del reporte' })
  reportVersion!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de complication ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  complicationIds!: string[];
}

/** Cuerpo de `POST /procedure-cases/{id}/operative-reports/{rid}/sign` (UC-53-11). */
export class SignReportDto {
  /**
   * Identificador asociado a signature.
   */
  @ApiProperty({ format: 'uuid', description: 'Firma electrónica aplicada' })
  @IsUUID()
  signatureId!: string;

  /**
   * Identificador asociado a file.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Documento firmado' })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}

/**
 * Define el contrato validado para sign report response.
 */
export class SignReportResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a case status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el caso',
  })
  caseStatusConceptId!: string;
}
