import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Una actividad inicial del plan de cuidado (UC-15-10). */
export class CarePlanActivityInputDto {
  /**
   * Identificador asociado a activity concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id del tipo de actividad',
  })
  @IsOptional()
  @IsUUID()
  activityConceptId?: string;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Momento programado',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  /**
   * Valor de detail text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  detailText?: string;
}

/** Cuerpo de `POST /charts/care-plans` (UC-15-10). */
export class CreateCarePlanDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil de paciente (profiles.patient_profiles)',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a condition.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Condición clínica asociada',
  })
  @IsOptional()
  @IsUUID()
  conditionId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Encuentro clínico asociado',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a intent concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de la intención del plan',
  })
  @IsOptional()
  @IsUUID()
  intentConceptId?: string;

  /**
   * Identificador asociado a author profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Perfil del clínico autor',
  })
  @IsOptional()
  @IsUUID()
  authorProfileId?: string;

  /**
   * Valor de goal text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Meta clínica del plan' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  goalText?: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Fecha de inicio (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Fecha de fin (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * Valor de activities mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [CarePlanActivityInputDto],
    description: 'Actividades iniciales (0..n)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarePlanActivityInputDto)
  activities?: CarePlanActivityInputDto[];
}

/** Nuevos estados admitidos al actualizar una actividad (UC-15-11). */
export type ActivityStatus =
  'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/** Cuerpo de `PATCH /charts/care-plans/{planId}/activities/{activityId}` (UC-15-11). */
export class UpdateActivityDto {
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    description: 'Nuevo estado de la actividad',
  })
  @IsOptional()
  @IsIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: ActivityStatus;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  /**
   * Valor de detail text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  detailText?: string;
}

/** Respuesta de `POST /charts/care-plans` (UC-15-10). */
export class CarePlanResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    description: 'Concept id del estado del plan',
    format: 'uuid',
  })
  statusConceptId!: string;

  /**
   * Valor de activity count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de actividades creadas' })
  activityCount!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta de `PATCH .../activities/{activityId}` (UC-15-11). */
export class ActivityResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    description: 'Concept id del estado de la actividad',
    format: 'uuid',
  })
  statusConceptId!: string;

  /**
   * Identificador asociado a plan status concept.
   */
  @ApiProperty({
    description: 'Concept id del estado del plan tras la actualización',
    format: 'uuid',
  })
  planStatusConceptId!: string;
}
