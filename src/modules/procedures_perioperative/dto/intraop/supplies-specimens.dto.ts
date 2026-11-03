import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

// ---------------------------------------------------------------------------
// UC-53-10 · Insumos y muestras
// ---------------------------------------------------------------------------

/** Para qué se usó el medicamento en la intervención. */
export type MedicationUseRole = 'ANESTHESIA' | 'ANTIBIOTIC' | 'ANALGESIA';
export const MEDICATION_USE_ROLES = [
  'ANESTHESIA',
  'ANTIBIOTIC',
  'ANALGESIA',
] as const;

/** Naturaleza de la muestra tomada. */
export type SpecimenRole = 'BIOPSY' | 'RESECTION' | 'CULTURE';
export const SPECIMEN_ROLES = ['BIOPSY', 'RESECTION', 'CULTURE'] as const;

/** Cuerpo de `POST /procedure-cases/{id}/medication-uses` (UC-53-10). */
export class RecordMedicationUseDto {
  /**
   * Identificador asociado a medication administration.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Administración registrada en farmacia',
  })
  @IsUUID()
  medicationAdministrationId!: string;

  /**
   * Valor de use role mantenido por la instancia.
   */
  @ApiProperty({ enum: MEDICATION_USE_ROLES })
  @IsIn(MEDICATION_USE_ROLES)
  useRole!: MedicationUseRole;

  /**
   * Identificador asociado a procedure.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  procedureId?: string;

  /**
   * Identificador asociado a operative step.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paso durante el que se administró',
  })
  @IsOptional()
  @IsUUID()
  operativeStepId?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/specimens` (UC-53-10). */
export class RecordSpecimenDto {
  /**
   * Identificador asociado a procedure.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  procedureId!: string;

  /**
   * Identificador asociado a specimen.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Muestra registrada en laboratorio',
  })
  @IsUUID()
  specimenId!: string;

  /**
   * Valor de specimen role mantenido por la instancia.
   */
  @ApiProperty({ enum: SPECIMEN_ROLES })
  @IsIn(SPECIMEN_ROLES)
  specimenRole!: SpecimenRole;

  /**
   * Identificador asociado a operative step.
   */
  @ApiPropertyOptional({ format: 'uuid' })
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
   * Valor de orientation text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Orientación de la pieza para el patólogo',
  })
  @IsOptional()
  @IsString()
  orientationText?: string;

  /**
   * Valor de surgeon comment mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surgeonComment?: string;
}

/**
 * Define el contrato validado para supplies response.
 */
export class SuppliesResponseDto {
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
}
