import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DISPOSITIONS, type Disposition } from '../report';

// ---------------------------------------------------------------------------
// UC-53-12 · PACU
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /procedure-cases/{id}/pacu-stays` (UC-53-12). */
export class AdmitToPacuDto {
  /**
   * Identificador asociado a care space.
   */
  @ApiProperty({ format: 'uuid', description: 'Espacio de recuperación' })
  @IsUUID()
  careSpaceId!: string;

  /**
   * Identificador asociado a admitted by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  admittedByProfileId?: string;
}

/**
 * Define el contrato validado para pacu stay response.
 */
export class PacuStayResponseDto {
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
   * Identificador asociado a location.
   */
  @ApiProperty({ format: 'uuid', description: 'Ubicación del caso creada' })
  locationId!: string;
}

/** Cuerpo de `POST /pacu-stays/{id}/assessments` (UC-53-12). */
export class RecordPacuAssessmentDto {
  /**
   * Identificador asociado a assessed by profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessedByProfileId!: string;

  /**
   * Valor de aldrete score mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Puntuación de Aldrete',
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  aldreteScore?: number;

  /**
   * Valor de pain score mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Escala de dolor' })
  @IsOptional()
  @IsNumberString()
  painScore?: string;

  /**
   * Valor de nausea score mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Escala de náusea' })
  @IsOptional()
  @IsNumberString()
  nauseaScore?: string;

  /**
   * Valor de airway status mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['PATENT', 'SUPPORTED'] })
  @IsOptional()
  @IsIn(['PATENT', 'SUPPORTED'])
  airwayStatus?: 'PATENT' | 'SUPPORTED';

  /**
   * Valor de observations json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Observaciones registradas' })
  @IsOptional()
  @IsObject()
  observationsJson?: Record<string, unknown>;

  /**
   * Valor de criteria json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Criterios de alta evaluados' })
  @IsOptional()
  @IsObject()
  criteriaJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para pacu assessment response.
 */
export class PacuAssessmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a pacu stay.
   */
  @ApiProperty({ format: 'uuid' })
  pacuStayId!: string;

  /**
   * Valor de meets discharge criteria mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si la valoración cumple el criterio de alta',
  })
  meetsDischargeCriteria!: boolean;
}

/**
 * Define el contrato validado para postoperative order.
 */
export class PostoperativeOrderDto {
  /**
   * Identificador asociado a service request.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  serviceRequestId!: string;

  /**
   * Valor de order role mantenido por la instancia.
   */
  @ApiProperty({ enum: ['LAB', 'IMAGING', 'CONSULT', 'MEDICATION'] })
  @IsIn(['LAB', 'IMAGING', 'CONSULT', 'MEDICATION'])
  orderRole!: 'LAB' | 'IMAGING' | 'CONSULT' | 'MEDICATION';
}

/**
 * Define el contrato validado para postoperative followup.
 */
export class PostoperativeFollowupDto {
  /**
   * Valor de followup type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['WOUND_CHECK', 'VISIT'] })
  @IsIn(['WOUND_CHECK', 'VISIT'])
  followupType!: 'WOUND_CHECK' | 'VISIT';

  /**
   * Identificador asociado a appointment.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  /**
   * Valor de instructions text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructionsText?: string;
}

/** Cuerpo de `POST /pacu-stays/{id}/discharge` (UC-53-12). */
export class DischargePacuDto {
  /**
   * Valor de destination mantenido por la instancia.
   */
  @ApiProperty({ enum: DISPOSITIONS })
  @IsIn(DISPOSITIONS)
  destination!: Disposition;

  /**
   * Identificador asociado a discharged by profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  dischargedByProfileId?: string;

  /**
   * Valor de orders mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [PostoperativeOrderDto],
    description: 'Órdenes postoperatorias',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostoperativeOrderDto)
  orders?: PostoperativeOrderDto[];

  /**
   * Valor de followups mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [PostoperativeFollowupDto],
    description: 'Seguimientos a agendar',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostoperativeFollowupDto)
  followups?: PostoperativeFollowupDto[];
}

/**
 * Define el contrato validado para discharge pacu response.
 */
export class DischargePacuResponseDto {
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
   * Valor de orders created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Órdenes postoperatorias creadas' })
  ordersCreated!: number;

  /**
   * Valor de followups created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Seguimientos agendados' })
  followupsCreated!: number;
}
