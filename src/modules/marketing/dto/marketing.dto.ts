import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Tipo de miembro de un segmento, campaña o journey (referencia polimórfica). */
export type MemberType = 'CONTACT' | 'PATIENT';
const MEMBER_TYPES = ['CONTACT', 'PATIENT'] as const;

/** Canal de entrega de marketing. */
export type MarketingChannel = 'EMAIL' | 'SMS' | 'PUSH';
const MARKETING_CHANNELS = ['EMAIL', 'SMS', 'PUSH'] as const;

// ---------------------------------------------------------------------------
// UC-50-01 · Segmentos
// ---------------------------------------------------------------------------

/** Tipo de segmento: dinámico se recalcula, estático se mantiene a mano. */
export type SegmentType = 'DYNAMIC' | 'STATIC';

/** Cuerpo de `POST /marketing/segments` (UC-50-01). */
export class CreateSegmentDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código del segmento, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de segment type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['DYNAMIC', 'STATIC'] })
  @IsIn(['DYNAMIC', 'STATIC'])
  segmentType!: SegmentType;

  /**
   * Valor de definition json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Definición ejecutable del segmento contra el read model',
  })
  @IsOptional()
  @IsObject()
  definitionJson?: Record<string, unknown>;

  /**
   * Identificador asociado a source read model.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Read model del que se deriva la membresía',
  })
  @IsOptional()
  @IsUUID()
  sourceReadModelId?: string;
}

/**
 * Define el contrato validado para segment response.
 */
export class SegmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Miembro que el worker de refresco entrega para el segmento (UC-50-02). */
export class SegmentMemberInputDto {
  /**
   * Valor de member type mantenido por la instancia.
   */
  @ApiProperty({ enum: MEMBER_TYPES })
  @IsIn(MEMBER_TYPES)
  memberType!: MemberType;

  /**
   * Identificador asociado a member ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberRefId!: string;

  /**
   * Valor de score mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Puntuación del miembro como cadena decimal',
  })
  @IsOptional()
  @IsNumberString()
  score?: string;
}

/** Cuerpo de `POST /marketing/segments/{id}/refresh` (UC-50-02). */
export class RefreshSegmentDto {
  /**
   * Valor de members mantenido por la instancia.
   */
  @ApiProperty({
    type: [SegmentMemberInputDto],
    description: 'Membresía recomputada completa',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentMemberInputDto)
  members!: SegmentMemberInputDto[];
}

/**
 * Define el contrato validado para refresh segment response.
 */
export class RefreshSegmentResponseDto {
  /**
   * Identificador asociado a segment.
   */
  @ApiProperty({ format: 'uuid' })
  segmentId!: string;

  /**
   * Valor de added mantenido por la instancia.
   */
  @ApiProperty({ description: 'Miembros incorporados en este refresco' })
  added!: number;

  /**
   * Valor de removed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Miembros dados de baja por salir del segmento' })
  removed!: number;

  /**
   * Valor de estimated size mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tamaño derivado del segmento tras el refresco' })
  estimatedSize!: number;
}

// ---------------------------------------------------------------------------
// UC-50-03 / UC-50-04 · Campañas
// ---------------------------------------------------------------------------

/** Tipo de campaña. */
export type CampaignType = 'ONE_SHOT' | 'RECURRING';

/** Objetivo de la campaña. */
export type CampaignObjective = 'AWARENESS' | 'CONVERSION' | 'RETENTION';

/** Cuerpo de `POST /marketing/campaigns` (UC-50-03). */
export class CreateCampaignDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código de campaña, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de campaign type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['ONE_SHOT', 'RECURRING'] })
  @IsIn(['ONE_SHOT', 'RECURRING'])
  campaignType!: CampaignType;

  /**
   * Valor de objective mantenido por la instancia.
   */
  @ApiProperty({ enum: ['AWARENESS', 'CONVERSION', 'RETENTION'] })
  @IsIn(['AWARENESS', 'CONVERSION', 'RETENTION'])
  objective!: CampaignObjective;

  /**
   * Valor de channel mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: MARKETING_CHANNELS })
  @IsOptional()
  @IsIn(MARKETING_CHANNELS)
  channel?: MarketingChannel;

  /**
   * Identificador asociado a segment.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Segmento del que sale la audiencia',
  })
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  /**
   * Valor de budget amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Presupuesto como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  budgetAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Identificador asociado a promotion.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Promoción asociada' })
  @IsOptional()
  @IsUUID()
  promotionId?: string;

  /**
   * Identificador asociado a ad campaign ref.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Campaña de ads equivalente',
  })
  @IsOptional()
  @IsUUID()
  adCampaignRefId?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endAt?: string;
}

/**
 * Define el contrato validado para campaign response.
 */
export class CampaignResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /marketing/campaigns/{id}/members:materialize` (UC-50-04). */
export class MaterializeMembersDto {
  /**
   * Valor de suppressed member ref ids mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Miembros a suprimir (do-not-contact o preferencia de mensajería). Se excluyen de la audiencia.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  suppressedMemberRefIds?: string[];
}

/**
 * Define el contrato validado para materialize members response.
 */
export class MaterializeMembersResponseDto {
  /**
   * Identificador asociado a campaign.
   */
  @ApiProperty({ format: 'uuid' })
  campaignId!: string;

  /**
   * Valor de materialized mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Miembros añadidos a la audiencia en esta llamada',
  })
  materialized!: number;

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Miembros omitidos por supresión o por estar ya materializados',
  })
  skipped!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-50-05 · Plantillas de contenido
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /marketing/content-templates/{code}/versions` (UC-50-05). */
export class PublishTemplateVersionDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de channel mantenido por la instancia.
   */
  @ApiProperty({ enum: MARKETING_CHANNELS })
  @IsIn(MARKETING_CHANNELS)
  channel!: MarketingChannel;

  /**
   * Identificador asociado a language concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  languageConceptId?: string;

  /**
   * Valor de subject mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  /**
   * Valor de body template mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cuerpo con marcadores de variables' })
  @IsOptional()
  @IsString()
  bodyTemplate?: string;

  /**
   * Valor de variables json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Variables declaradas por la plantilla' })
  @IsOptional()
  @IsObject()
  variablesJson?: Record<string, unknown>;

  /**
   * Identificador asociado a messaging template.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plantilla equivalente en messaging',
  })
  @IsOptional()
  @IsUUID()
  messagingTemplateId?: string;
}

/**
 * Define el contrato validado para template version response.
 */
export class TemplateVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión publicada' })
  version!: number;

  /**
   * Identificador asociado a archived version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión archivada al publicar esta',
  })
  archivedVersionId?: string;
}

// ---------------------------------------------------------------------------
// UC-50-06 / UC-50-07 · Journeys
// ---------------------------------------------------------------------------

/** Disparador de entrada al journey. */
export type JourneyTrigger = 'SEGMENT' | 'EVENT';

/** Cuerpo de `POST /marketing/journeys` (UC-50-06). */
export class CreateJourneyDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código del journey, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de entry trigger mantenido por la instancia.
   */
  @ApiProperty({ enum: ['SEGMENT', 'EVENT'] })
  @IsIn(['SEGMENT', 'EVENT'])
  entryTrigger!: JourneyTrigger;

  /**
   * Identificador asociado a entry segment.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Segmento de entrada; obligatorio si el disparador es SEGMENT',
  })
  @IsOptional()
  @IsUUID()
  entrySegmentId?: string;

  /**
   * Identificador asociado a goal metric concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  goalMetricConceptId?: string;

  /**
   * Valor de definition json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Definición completa del grafo, informativa',
  })
  @IsOptional()
  @IsObject()
  definitionJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para journey response.
 */
export class JourneyResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Tipo de paso del journey. */
export type JourneyStepType =
  'SEND' | 'WAIT' | 'BRANCH' | 'GOAL' | 'UPDATE' | 'EXIT' | 'WEBHOOK';
const JOURNEY_STEP_TYPES = [
  'SEND',
  'WAIT',
  'BRANCH',
  'GOAL',
  'UPDATE',
  'EXIT',
  'WEBHOOK',
] as const;

/**
 * Define el contrato validado para journey step.
 */
export class JourneyStepDto {
  /**
   * Valor de step code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Identificador legible del paso dentro del journey',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  stepCode!: string;

  /**
   * Valor de step type mantenido por la instancia.
   */
  @ApiProperty({ enum: JOURNEY_STEP_TYPES })
  @IsIn(JOURNEY_STEP_TYPES)
  stepType!: JourneyStepType;

  /**
   * Valor de channel mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: MARKETING_CHANNELS })
  @IsOptional()
  @IsIn(MARKETING_CHANNELS)
  channel?: MarketingChannel;

  /**
   * Identificador asociado a content template.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plantilla publicada; obligatoria en los pasos SEND',
  })
  @IsOptional()
  @IsUUID()
  contentTemplateId?: string;

  /**
   * Valor de wait duration minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Espera en minutos; obligatoria en los pasos WAIT',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  waitDurationMinutes?: number;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Condición de la rama; obligatoria en los pasos BRANCH',
  })
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /marketing/journeys/{id}/steps` (UC-50-06). */
export class AddJourneyStepsDto {
  /**
   * Valor de steps mantenido por la instancia.
   */
  @ApiProperty({
    type: [JourneyStepDto],
    description: 'Pasos en orden de ejecución',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JourneyStepDto)
  steps!: JourneyStepDto[];
}

/**
 * Define el contrato validado para journey steps response.
 */
export class JourneyStepsResponseDto {
  /**
   * Identificador asociado a journey.
   */
  @ApiProperty({ format: 'uuid' })
  journeyId!: string;

  /**
   * Valor de step ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Pasos creados, en orden',
  })
  stepIds!: string[];
}

/** Miembro de la cohorte que entra al journey (UC-50-07). */
export class CohortMemberDto {
  /**
   * Valor de member type mantenido por la instancia.
   */
  @ApiProperty({ enum: MEMBER_TYPES })
  @IsIn(MEMBER_TYPES)
  memberType!: MemberType;

  /**
   * Identificador asociado a member ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberRefId!: string;
}

/** Cuerpo de `POST /marketing/journeys/{id}/activate` (UC-50-07). */
export class ActivateJourneyDto {
  /**
   * Valor de cohort mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [CohortMemberDto],
    description:
      'Cohorte inicial. Sin ella el journey se activa sin inscribir a nadie.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CohortMemberDto)
  cohort?: CohortMemberDto[];
}

/**
 * Define el contrato validado para activate journey response.
 */
export class ActivateJourneyResponseDto {
  /**
   * Identificador asociado a journey.
   */
  @ApiProperty({ format: 'uuid' })
  journeyId!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Valor de enrolled mantenido por la instancia.
   */
  @ApiProperty({ description: 'Inscripciones creadas' })
  enrolled!: number;

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Miembros omitidos por tener ya una inscripción activa',
  })
  skipped!: number;
}

// ---------------------------------------------------------------------------
// UC-50-08 / UC-50-09 · Inscripciones
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /marketing/enrollments/{id}/advance` (UC-50-08). */
export class AdvanceEnrollmentDto {
  /**
   * Valor de branch taken mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Resultado de la condición cuando el paso actual es BRANCH: true toma la rama, false sigue el camino principal.',
  })
  @IsOptional()
  branchTaken?: boolean;
}

/**
 * Define el contrato validado para advance enrollment response.
 */
export class AdvanceEnrollmentResponseDto {
  /**
   * Identificador asociado a enrollment.
   */
  @ApiProperty({ format: 'uuid' })
  enrollmentId!: string;

  /**
   * Identificador asociado a current step.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paso en el que queda; ausente si terminó',
  })
  currentStepId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a touchpoint.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Touchpoint registrado cuando el paso ejecutado era SEND',
  })
  touchpointId?: string;
}

/** Motivo de salida de la inscripción. */
export type ExitReason = 'GOAL' | 'UNSUBSCRIBE' | 'BOUNCE';

/** Cuerpo de `POST /marketing/enrollments/{id}/exit` (UC-50-09). */
export class ExitEnrollmentDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ enum: ['GOAL', 'UNSUBSCRIBE', 'BOUNCE'] })
  @IsIn(['GOAL', 'UNSUBSCRIBE', 'BOUNCE'])
  reason!: ExitReason;

  /**
   * Identificador asociado a campaign.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Campaña cuyo miembro debe reflejar la salida (converted / unsubscribed / bounced)',
  })
  @IsOptional()
  @IsUUID()
  campaignId?: string;
}

/**
 * Define el contrato validado para exit enrollment response.
 */
export class ExitEnrollmentResponseDto {
  /**
   * Identificador asociado a enrollment.
   */
  @ApiProperty({ format: 'uuid' })
  enrollmentId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a exit reason concept.
   */
  @ApiProperty({ format: 'uuid' })
  exitReasonConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-50-10 · Enlaces rastreables
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /marketing/tracked-links` (UC-50-10). */
export class CreateTrackedLinkDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código corto, único global', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de target url mantenido por la instancia.
   */
  @ApiProperty({ description: 'Destino de la redirección' })
  @IsUrl({ require_tld: false })
  targetUrl!: string;

  /**
   * Identificador asociado a campaign.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  /**
   * Valor de utm source mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmSource?: string;

  /**
   * Valor de utm medium mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmMedium?: string;

  /**
   * Valor de utm campaign mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmCampaign?: string;

  /**
   * Valor de utm content mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmContent?: string;
}

/**
 * Define el contrato validado para tracked link response.
 */
export class TrackedLinkResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de target url mantenido por la instancia.
   */
  @ApiProperty()
  targetUrl!: string;
}

/**
 * Define el contrato validado para tracked link click response.
 */
export class TrackedLinkClickResponseDto {
  /**
   * Valor de target url mantenido por la instancia.
   */
  @ApiProperty({ description: 'Destino al que redirigir' })
  targetUrl!: string;

  /**
   * Valor de click count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Clicks acumulados tras registrar este' })
  clickCount!: string;

  /**
   * Identificador asociado a touchpoint.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Touchpoint del click; ausente si no se identificó al miembro',
  })
  touchpointId?: string;
}

// ---------------------------------------------------------------------------
// UC-50-11 · Touchpoints
// ---------------------------------------------------------------------------

/** Tipo de contacto registrado. */
export type TouchType =
  'IMPRESSION' | 'OPEN' | 'CLICK' | 'VISIT' | 'CONVERSION' | 'REPLY';
const TOUCH_TYPES = [
  'IMPRESSION',
  'OPEN',
  'CLICK',
  'VISIT',
  'CONVERSION',
  'REPLY',
] as const;

/** Cuerpo de `POST /marketing/touchpoints` (UC-50-11). */
export class RecordTouchpointDto {
  /**
   * Valor de member type mantenido por la instancia.
   */
  @ApiProperty({ enum: MEMBER_TYPES })
  @IsIn(MEMBER_TYPES)
  memberType!: MemberType;

  /**
   * Identificador asociado a member ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberRefId!: string;

  /**
   * Valor de touch type mantenido por la instancia.
   */
  @ApiProperty({ enum: TOUCH_TYPES })
  @IsIn(TOUCH_TYPES)
  touchType!: TouchType;

  /**
   * Valor de channel mantenido por la instancia.
   */
  @ApiProperty({ enum: MARKETING_CHANNELS })
  @IsIn(MARKETING_CHANNELS)
  channel!: MarketingChannel;

  /**
   * Identificador asociado a campaign.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Campaña de origen' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  /**
   * Identificador asociado a journey.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Journey de origen' })
  @IsOptional()
  @IsUUID()
  journeyId?: string;

  /**
   * Identificador asociado a tracked link.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  trackedLinkId?: string;

  /**
   * Identificador asociado a content template.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contentTemplateId?: string;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Metadatos del evento para analítica' })
  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

/**
 * Define el contrato validado para touchpoint response.
 */
export class TouchpointResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a touch type concept.
   */
  @ApiProperty({ format: 'uuid' })
  touchTypeConceptId!: string;

  /**
   * Identificador asociado a member status concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Estado al que pasó el miembro de campaña, si había campaña',
  })
  memberStatusConceptId?: string;
}

// ---------------------------------------------------------------------------
// UC-50-12 · Atribución
// ---------------------------------------------------------------------------

/** Entidad convertida a la que se atribuye el valor. */
export type ConversionRefType =
  | 'opportunity'
  | 'enrollment'
  | 'payment_intent'
  | 'appointment_booking'
  | 'order';
const CONVERSION_REF_TYPES = [
  'opportunity',
  'enrollment',
  'payment_intent',
  'appointment_booking',
  'order',
] as const;

/** Modelo de atribución multi-touch. */
export type AttributionModel = 'LAST_TOUCH' | 'FIRST_TOUCH' | 'LINEAR';

/** Cuerpo de `POST /marketing/attribution:compute` (UC-50-12). */
export class ComputeAttributionDto {
  /**
   * Valor de conversion ref type mantenido por la instancia.
   */
  @ApiProperty({ enum: CONVERSION_REF_TYPES })
  @IsIn(CONVERSION_REF_TYPES)
  conversionRefType!: ConversionRefType;

  /**
   * Identificador asociado a conversion ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  conversionRefId!: string;

  /**
   * Valor de member type mantenido por la instancia.
   */
  @ApiProperty({ enum: MEMBER_TYPES })
  @IsIn(MEMBER_TYPES)
  memberType!: MemberType;

  /**
   * Identificador asociado a member ref.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Miembro cuyo recorrido se atribuye',
  })
  @IsUUID()
  memberRefId!: string;

  /**
   * Valor de model mantenido por la instancia.
   */
  @ApiProperty({ enum: ['LAST_TOUCH', 'FIRST_TOUCH', 'LINEAR'] })
  @IsIn(['LAST_TOUCH', 'FIRST_TOUCH', 'LINEAR'])
  model!: AttributionModel;

  /**
   * Valor de window from mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Inicio de la ventana de atribución',
  })
  @IsISO8601()
  windowFrom!: string;

  /**
   * Valor de window to mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time', description: 'Momento de la conversión' })
  @IsISO8601()
  windowTo!: string;

  /**
   * Valor de conversion value mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valor de la conversión a repartir, como cadena decimal',
  })
  @IsOptional()
  @IsNumberString()
  conversionValue?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/**
 * Define el contrato validado para attribution touch.
 */
export class AttributionTouchDto {
  /**
   * Identificador asociado a touchpoint.
   */
  @ApiProperty({ format: 'uuid' })
  touchpointId!: string;

  /**
   * Valor de weight mantenido por la instancia.
   */
  @ApiProperty({ description: 'Peso del touchpoint; la suma del reparto es 1' })
  weight!: string;

  /**
   * Valor de attributed value mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor atribuido a este touchpoint' })
  attributedValue?: string;

  /**
   * Identificador asociado a position concept.
   */
  @ApiProperty({ format: 'uuid' })
  positionConceptId!: string;
}

/**
 * Define el contrato validado para compute attribution response.
 */
export class ComputeAttributionResponseDto {
  /**
   * Valor de conversion ref type mantenido por la instancia.
   */
  @ApiProperty()
  conversionRefType!: string;

  /**
   * Identificador asociado a conversion ref.
   */
  @ApiProperty({ format: 'uuid' })
  conversionRefId!: string;

  /**
   * Identificador asociado a attribution model concept.
   */
  @ApiProperty({ format: 'uuid' })
  attributionModelConceptId!: string;

  /**
   * Valor de replaced mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Repartos previos del mismo modelo que se reemplazaron',
  })
  replaced!: number;

  /**
   * Valor de touches mantenido por la instancia.
   */
  @ApiProperty({ type: [AttributionTouchDto] })
  touches!: AttributionTouchDto[];
}
