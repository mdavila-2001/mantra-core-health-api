import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Una brecha candidata a recomputar (UC-18-09). */
export class CareGapInputDto {
  /**
   * Identificador asociado a gap type concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Tipo de brecha (concept id)' })
  @IsUUID()
  gapTypeConceptId!: string;

  /**
   * Identificador asociado a measure concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Medida de calidad / vacuna (concept id)',
  })
  @IsOptional()
  @IsUUID()
  measureConceptId?: string;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}

/** Cuerpo de `POST /care-gaps/recompute` (UC-18-09). */
export class RecomputeCareGapsDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Valor de gaps mantenido por la instancia.
   */
  @ApiProperty({ type: [CareGapInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CareGapInputDto)
  gaps!: CareGapInputDto[];
}

/** Cuerpo de `PATCH /care-gaps/{id}/close` (UC-18-10). */
export class CloseCareGapDto {
  /**
   * Valor de closed by resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tipo de recurso que cierra la brecha' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  closedByResourceType?: string;

  /**
   * Identificador asociado a closed by resource.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Id del recurso que cierra la brecha',
  })
  @IsOptional()
  @IsUUID()
  closedByResourceId?: string;
}

/** Cuerpo de `POST /patients/{id}/immunization-plan/project` (UC-18-11). */
export class ProjectImmunizationPlanDto {
  /**
   * Valor de birth date mantenido por la instancia.
   */
  @ApiProperty({
    type: String,
    format: 'date',
    description: 'Fecha de nacimiento del paciente',
  })
  @IsISO8601()
  birthDate!: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Jurisdicción del calendario (concept id)',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Tenant del calendario' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/** Cuerpo de `POST /immunization-schedules` (dato de referencia; alimenta UC-18-11). */
export class CreateImmunizationScheduleDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a vaccine concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Vacuna (concept id)' })
  @IsUUID()
  vaccineConceptId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de recommended age days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Edad recomendada en días desde el nacimiento',
  })
  @IsOptional()
  @IsInt()
  recommendedAgeDays?: number;

  /**
   * Valor de dose number mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  doseNumber?: number;

  /**
   * Valor de interval days mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  intervalDays?: number;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}

/** Respuesta de una brecha de cuidado. */
export class CareGapResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado de la brecha (concept id)',
  })
  statusConceptId!: string;
}

/** Respuesta de recomputo de brechas (UC-18-09). */
export class RecomputeCareGapsResponseDto {
  /**
   * Valor de opened mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de brechas abiertas nuevas' })
  opened!: number;

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nº de brechas ya abiertas que se dejaron intactas',
  })
  skipped!: number;

  /**
   * Valor de opened ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    description: 'Ids de las brechas abiertas en esta corrida',
  })
  openedIds!: string[];
}

/** Respuesta de proyección del plan de inmunización (UC-18-11). */
export class ImmunizationPlanResponseDto {
  /**
   * Valor de gaps opened mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de brechas de dosis abiertas' })
  gapsOpened!: number;

  /**
   * Valor de doses evaluated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de dosis del calendario evaluadas' })
  dosesEvaluated!: number;

  /**
   * Valor de opened ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String] })
  openedIds!: string[];
}
