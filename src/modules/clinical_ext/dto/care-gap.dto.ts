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
  @ApiProperty({ format: 'uuid', description: 'Tipo de brecha (concept id)' })
  @IsUUID()
  gapTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Medida de calidad / vacuna (concept id)' })
  @IsOptional()
  @IsUUID()
  measureConceptId?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}

/** Cuerpo de `POST /care-gaps/recompute` (UC-18-09). */
export class RecomputeCareGapsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ type: [CareGapInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CareGapInputDto)
  gaps!: CareGapInputDto[];
}

/** Cuerpo de `PATCH /care-gaps/{id}/close` (UC-18-10). */
export class CloseCareGapDto {
  @ApiPropertyOptional({ description: 'Tipo de recurso que cierra la brecha' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  closedByResourceType?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Id del recurso que cierra la brecha' })
  @IsOptional()
  @IsUUID()
  closedByResourceId?: string;
}

/** Cuerpo de `POST /patients/{id}/immunization-plan/project` (UC-18-11). */
export class ProjectImmunizationPlanDto {
  @ApiProperty({ type: String, format: 'date', description: 'Fecha de nacimiento del paciente' })
  @IsISO8601()
  birthDate!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Jurisdicción del calendario (concept id)' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Tenant del calendario' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/** Cuerpo de `POST /immunization-schedules` (dato de referencia; alimenta UC-18-11). */
export class CreateImmunizationScheduleDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ format: 'uuid', description: 'Vacuna (concept id)' })
  @IsUUID()
  vaccineConceptId!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Edad recomendada en días desde el nacimiento' })
  @IsOptional()
  @IsInt()
  recommendedAgeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  doseNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  intervalDays?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}

/** Respuesta de una brecha de cuidado. */
export class CareGapResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid', description: 'Estado de la brecha (concept id)' })
  statusConceptId!: string;
}

/** Respuesta de recomputo de brechas (UC-18-09). */
export class RecomputeCareGapsResponseDto {
  @ApiProperty({ description: 'Nº de brechas abiertas nuevas' })
  opened!: number;

  @ApiProperty({ description: 'Nº de brechas ya abiertas que se dejaron intactas' })
  skipped!: number;

  @ApiProperty({ type: [String], description: 'Ids de las brechas abiertas en esta corrida' })
  openedIds!: string[];
}

/** Respuesta de proyección del plan de inmunización (UC-18-11). */
export class ImmunizationPlanResponseDto {
  @ApiProperty({ description: 'Nº de brechas de dosis abiertas' })
  gapsOpened!: number;

  @ApiProperty({ description: 'Nº de dosis del calendario evaluadas' })
  dosesEvaluated!: number;

  @ApiProperty({ type: [String] })
  openedIds!: string[];
}
