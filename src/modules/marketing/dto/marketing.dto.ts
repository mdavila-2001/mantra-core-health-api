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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código del segmento, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['DYNAMIC', 'STATIC'] })
  @IsIn(['DYNAMIC', 'STATIC'])
  segmentType!: SegmentType;

  @ApiPropertyOptional({
    description: 'Definición ejecutable del segmento contra el read model',
  })
  @IsOptional()
  @IsObject()
  definitionJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Read model del que se deriva la membresía',
  })
  @IsOptional()
  @IsUUID()
  sourceReadModelId?: string;
}

export class SegmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Miembro que el worker de refresco entrega para el segmento (UC-50-02). */
export class SegmentMemberInputDto {
  @ApiProperty({ enum: MEMBER_TYPES })
  @IsIn(MEMBER_TYPES)
  memberType!: MemberType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberRefId!: string;

  @ApiPropertyOptional({
    description: 'Puntuación del miembro como cadena decimal',
  })
  @IsOptional()
  @IsNumberString()
  score?: string;
}

/** Cuerpo de `POST /marketing/segments/{id}/refresh` (UC-50-02). */
export class RefreshSegmentDto {
  @ApiProperty({
    type: [SegmentMemberInputDto],
    description: 'Membresía recomputada completa',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentMemberInputDto)
  members!: SegmentMemberInputDto[];
}

export class RefreshSegmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  segmentId!: string;

  @ApiProperty({ description: 'Miembros incorporados en este refresco' })
  added!: number;

  @ApiProperty({ description: 'Miembros dados de baja por salir del segmento' })
  removed!: number;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código de campaña, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['ONE_SHOT', 'RECURRING'] })
  @IsIn(['ONE_SHOT', 'RECURRING'])
  campaignType!: CampaignType;

  @ApiProperty({ enum: ['AWARENESS', 'CONVERSION', 'RETENTION'] })
  @IsIn(['AWARENESS', 'CONVERSION', 'RETENTION'])
  objective!: CampaignObjective;

  @ApiPropertyOptional({ enum: MARKETING_CHANNELS })
  @IsOptional()
  @IsIn(MARKETING_CHANNELS)
  channel?: MarketingChannel;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Segmento del que sale la audiencia',
  })
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @ApiPropertyOptional({ description: 'Presupuesto como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  budgetAmount?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Promoción asociada' })
  @IsOptional()
  @IsUUID()
  promotionId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Campaña de ads equivalente',
  })
  @IsOptional()
  @IsUUID()
  adCampaignRefId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endAt?: string;
}

export class CampaignResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /marketing/campaigns/{id}/members:materialize` (UC-50-04). */
export class MaterializeMembersDto {
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

export class MaterializeMembersResponseDto {
  @ApiProperty({ format: 'uuid' })
  campaignId!: string;

  @ApiProperty({
    description: 'Miembros añadidos a la audiencia en esta llamada',
  })
  materialized!: number;

  @ApiProperty({
    description:
      'Miembros omitidos por supresión o por estar ya materializados',
  })
  skipped!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-50-05 · Plantillas de contenido
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /marketing/content-templates/{code}/versions` (UC-50-05). */
export class PublishTemplateVersionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: MARKETING_CHANNELS })
  @IsIn(MARKETING_CHANNELS)
  channel!: MarketingChannel;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  languageConceptId?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  @ApiPropertyOptional({ description: 'Cuerpo con marcadores de variables' })
  @IsOptional()
  @IsString()
  bodyTemplate?: string;

  @ApiPropertyOptional({ description: 'Variables declaradas por la plantilla' })
  @IsOptional()
  @IsObject()
  variablesJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plantilla equivalente en messaging',
  })
  @IsOptional()
  @IsUUID()
  messagingTemplateId?: string;
}

export class TemplateVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ description: 'Versión publicada' })
  version!: number;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código del journey, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['SEGMENT', 'EVENT'] })
  @IsIn(['SEGMENT', 'EVENT'])
  entryTrigger!: JourneyTrigger;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Segmento de entrada; obligatorio si el disparador es SEGMENT',
  })
  @IsOptional()
  @IsUUID()
  entrySegmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  goalMetricConceptId?: string;

  @ApiPropertyOptional({
    description: 'Definición completa del grafo, informativa',
  })
  @IsOptional()
  @IsObject()
  definitionJson?: Record<string, unknown>;
}

export class JourneyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

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

export class JourneyStepDto {
  @ApiProperty({
    description: 'Identificador legible del paso dentro del journey',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  stepCode!: string;

  @ApiProperty({ enum: JOURNEY_STEP_TYPES })
  @IsIn(JOURNEY_STEP_TYPES)
  stepType!: JourneyStepType;

  @ApiPropertyOptional({ enum: MARKETING_CHANNELS })
  @IsOptional()
  @IsIn(MARKETING_CHANNELS)
  channel?: MarketingChannel;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plantilla publicada; obligatoria en los pasos SEND',
  })
  @IsOptional()
  @IsUUID()
  contentTemplateId?: string;

  @ApiPropertyOptional({
    description: 'Espera en minutos; obligatoria en los pasos WAIT',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  waitDurationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Condición de la rama; obligatoria en los pasos BRANCH',
  })
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /marketing/journeys/{id}/steps` (UC-50-06). */
export class AddJourneyStepsDto {
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

export class JourneyStepsResponseDto {
  @ApiProperty({ format: 'uuid' })
  journeyId!: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Pasos creados, en orden',
  })
  stepIds!: string[];
}

/** Miembro de la cohorte que entra al journey (UC-50-07). */
export class CohortMemberDto {
  @ApiProperty({ enum: MEMBER_TYPES })
  @IsIn(MEMBER_TYPES)
  memberType!: MemberType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberRefId!: string;
}

/** Cuerpo de `POST /marketing/journeys/{id}/activate` (UC-50-07). */
export class ActivateJourneyDto {
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

export class ActivateJourneyResponseDto {
  @ApiProperty({ format: 'uuid' })
  journeyId!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ description: 'Inscripciones creadas' })
  enrolled!: number;

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
  @ApiPropertyOptional({
    description:
      'Resultado de la condición cuando el paso actual es BRANCH: true toma la rama, false sigue el camino principal.',
  })
  @IsOptional()
  branchTaken?: boolean;
}

export class AdvanceEnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  enrollmentId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paso en el que queda; ausente si terminó',
  })
  currentStepId?: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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
  @ApiProperty({ enum: ['GOAL', 'UNSUBSCRIBE', 'BOUNCE'] })
  @IsIn(['GOAL', 'UNSUBSCRIBE', 'BOUNCE'])
  reason!: ExitReason;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Campaña cuyo miembro debe reflejar la salida (converted / unsubscribed / bounced)',
  })
  @IsOptional()
  @IsUUID()
  campaignId?: string;
}

export class ExitEnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  enrollmentId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  exitReasonConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-50-10 · Enlaces rastreables
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /marketing/tracked-links` (UC-50-10). */
export class CreateTrackedLinkDto {
  @ApiProperty({ description: 'Código corto, único global', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Destino de la redirección' })
  @IsUrl({ require_tld: false })
  targetUrl!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmSource?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmMedium?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmCampaign?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmContent?: string;
}

export class TrackedLinkResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  targetUrl!: string;
}

export class TrackedLinkClickResponseDto {
  @ApiProperty({ description: 'Destino al que redirigir' })
  targetUrl!: string;

  @ApiProperty({ description: 'Clicks acumulados tras registrar este' })
  clickCount!: string;

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
  @ApiProperty({ enum: MEMBER_TYPES })
  @IsIn(MEMBER_TYPES)
  memberType!: MemberType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberRefId!: string;

  @ApiProperty({ enum: TOUCH_TYPES })
  @IsIn(TOUCH_TYPES)
  touchType!: TouchType;

  @ApiProperty({ enum: MARKETING_CHANNELS })
  @IsIn(MARKETING_CHANNELS)
  channel!: MarketingChannel;

  @ApiPropertyOptional({ format: 'uuid', description: 'Campaña de origen' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Journey de origen' })
  @IsOptional()
  @IsUUID()
  journeyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  trackedLinkId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contentTemplateId?: string;

  @ApiPropertyOptional({ description: 'Metadatos del evento para analítica' })
  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió; por defecto, ahora',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

export class TouchpointResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  touchTypeConceptId!: string;

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
  @ApiProperty({ enum: CONVERSION_REF_TYPES })
  @IsIn(CONVERSION_REF_TYPES)
  conversionRefType!: ConversionRefType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  conversionRefId!: string;

  @ApiProperty({ enum: MEMBER_TYPES })
  @IsIn(MEMBER_TYPES)
  memberType!: MemberType;

  @ApiProperty({
    format: 'uuid',
    description: 'Miembro cuyo recorrido se atribuye',
  })
  @IsUUID()
  memberRefId!: string;

  @ApiProperty({ enum: ['LAST_TOUCH', 'FIRST_TOUCH', 'LINEAR'] })
  @IsIn(['LAST_TOUCH', 'FIRST_TOUCH', 'LINEAR'])
  model!: AttributionModel;

  @ApiProperty({
    format: 'date-time',
    description: 'Inicio de la ventana de atribución',
  })
  @IsISO8601()
  windowFrom!: string;

  @ApiProperty({ format: 'date-time', description: 'Momento de la conversión' })
  @IsISO8601()
  windowTo!: string;

  @ApiPropertyOptional({
    description: 'Valor de la conversión a repartir, como cadena decimal',
  })
  @IsOptional()
  @IsNumberString()
  conversionValue?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

export class AttributionTouchDto {
  @ApiProperty({ format: 'uuid' })
  touchpointId!: string;

  @ApiProperty({ description: 'Peso del touchpoint; la suma del reparto es 1' })
  weight!: string;

  @ApiPropertyOptional({ description: 'Valor atribuido a este touchpoint' })
  attributedValue?: string;

  @ApiProperty({ format: 'uuid' })
  positionConceptId!: string;
}

export class ComputeAttributionResponseDto {
  @ApiProperty()
  conversionRefType!: string;

  @ApiProperty({ format: 'uuid' })
  conversionRefId!: string;

  @ApiProperty({ format: 'uuid' })
  attributionModelConceptId!: string;

  @ApiProperty({
    description: 'Repartos previos del mismo modelo que se reemplazaron',
  })
  replaced!: number;

  @ApiProperty({ type: [AttributionTouchDto] })
  touches!: AttributionTouchDto[];
}
