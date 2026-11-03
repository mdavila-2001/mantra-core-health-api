import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { INSIGHTS_CHANNELS } from './insights-query.dto';
import { InsightsMetaDto } from './insights-facts.response.dto';

/** Estados de una alerta que persisten (espejo de `InsightsAlertStatus` del front). */
export const INSIGHTS_ALERT_STATUSES = [
  'new',
  'in_progress',
  'resolved',
  'dismissed',
] as const;
export type InsightsAlertStatus = (typeof INSIGHTS_ALERT_STATUSES)[number];

export const INSIGHTS_ALERT_SEVERITIES = [
  'critical',
  'risk',
  'anomaly',
  'opportunity',
] as const;
export type InsightsAlertSeverity = (typeof INSIGHTS_ALERT_SEVERITIES)[number];

export const INSIGHTS_OWNER_TEAMS = [
  'marketing',
  'innovation',
  'product',
  'communication',
  'content',
  'systems',
  'direction',
] as const;
export type InsightsOwnerTeam = (typeof INSIGHTS_OWNER_TEAMS)[number];

export const INSIGHTS_RULE_CODES = [
  'cac',
  'ctrdrop',
  'ctrspike',
  'cvr',
  'neg',
  'onb',
  'feed',
] as const;
export type InsightsRuleCode = (typeof INSIGHTS_RULE_CODES)[number];

export const INSIGHTS_NOTIFICATION_CHANNELS = ['app', 'mail', 'slack'] as const;
export type InsightsNotificationChannel =
  (typeof INSIGHTS_NOTIFICATION_CHANNELS)[number];
export const INSIGHTS_NOTIFICATION_FREQUENCIES = [
  'immediate',
  'daily_digest',
] as const;
export const INSIGHTS_DENSITIES = ['comfortable', 'compact'] as const;
export const INSIGHTS_THEMES = ['system', 'light', 'dark'] as const;

/** Máximo de informes guardados por usuario: el 13.º expulsa el más viejo. */
export const INSIGHTS_REPORT_HISTORY_LIMIT = 12;
export const INSIGHTS_RULE_THRESHOLD_MIN = 1;
export const INSIGHTS_RULE_THRESHOLD_MAX = 500;

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const HOUR_MINUTE = /^([01]\d|2[0-3]):[0-5]\d$/;
const CODE = /^[A-Za-z0-9_.:-]+$/;

// ---------------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------------

/** Lo que el API necesita saber de una alerta la primera vez que alguien la toca. */
@ApiSchema({ name: 'MarketingInsightsAlertSnapshotDto' })
export class InsightsAlertSnapshotDto {
  @ApiProperty({ enum: INSIGHTS_ALERT_SEVERITIES })
  @IsIn(INSIGHTS_ALERT_SEVERITIES)
  severity!: InsightsAlertSeverity;

  @ApiProperty({ maxLength: 200 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ maxLength: 2000 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  whatText!: string;

  @ApiProperty({ example: '2026-10-29', description: 'Día de detección' })
  @Matches(DAY)
  detectedOn!: string;

  @ApiProperty({ example: 'campaigns', maxLength: 40 })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Matches(CODE)
  moduleCode!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  priority!: number;
}

/** Cuerpo de `PUT /marketing/insights/alert-workflow/:fingerprint`. */
@ApiSchema({ name: 'MarketingInsightsPutAlertWorkflowDto' })
export class PutAlertWorkflowDto {
  @ApiProperty({ enum: INSIGHTS_ALERT_STATUSES })
  @IsIn(INSIGHTS_ALERT_STATUSES)
  status!: InsightsAlertStatus;

  @ApiProperty({ enum: INSIGHTS_OWNER_TEAMS, nullable: true })
  @ValidateIf((_, value) => value !== null)
  @IsIn(INSIGHTS_OWNER_TEAMS)
  ownerTeam!: InsightsOwnerTeam | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiProperty({ type: InsightsAlertSnapshotDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => InsightsAlertSnapshotDto)
  snapshot!: InsightsAlertSnapshotDto;
}

/** Cuerpo de `PATCH /marketing/insights/alert-rules/:code`. */
@ApiSchema({ name: 'MarketingInsightsPatchAlertRuleDto' })
export class PatchAlertRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    minimum: INSIGHTS_RULE_THRESHOLD_MIN,
    maximum: INSIGHTS_RULE_THRESHOLD_MAX,
  })
  // El rango NO se valida acá: el `ValidationPipe` global responde 400 y el
  // contrato pide 422 con razón propia, que da el servicio.
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  threshold?: number;
}

// ---------------------------------------------------------------------------
// Preferencias, vistas e informes (del usuario autenticado)
// ---------------------------------------------------------------------------

const channelList = () => [
  IsArray(),
  ArrayUnique(),
  ArrayMaxSize(INSIGHTS_NOTIFICATION_CHANNELS.length),
  IsIn(INSIGHTS_NOTIFICATION_CHANNELS, { each: true }),
];
const applyAll =
  (decorators: PropertyDecorator[]): PropertyDecorator =>
  (target, key) => {
    for (const decorator of decorators) decorator(target, key);
  };

@ApiSchema({ name: 'MarketingInsightsNotificationMatrixDto' })
export class InsightsNotificationMatrixDto {
  @ApiProperty({ enum: INSIGHTS_NOTIFICATION_CHANNELS, isArray: true })
  @applyAll(channelList())
  critical!: InsightsNotificationChannel[];

  @ApiProperty({ enum: INSIGHTS_NOTIFICATION_CHANNELS, isArray: true })
  @applyAll(channelList())
  risk!: InsightsNotificationChannel[];

  @ApiProperty({ enum: INSIGHTS_NOTIFICATION_CHANNELS, isArray: true })
  @applyAll(channelList())
  anomaly!: InsightsNotificationChannel[];

  @ApiProperty({ enum: INSIGHTS_NOTIFICATION_CHANNELS, isArray: true })
  @applyAll(channelList())
  opportunity!: InsightsNotificationChannel[];
}

/** Cuerpo de `PUT /marketing/insights/notification-preferences`. */
@ApiSchema({ name: 'MarketingInsightsPutNotificationPreferencesDto' })
export class PutNotificationPreferencesDto {
  @ApiProperty({ type: InsightsNotificationMatrixDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => InsightsNotificationMatrixDto)
  matrix!: InsightsNotificationMatrixDto;

  @ApiProperty({ enum: INSIGHTS_NOTIFICATION_FREQUENCIES })
  @IsIn(INSIGHTS_NOTIFICATION_FREQUENCIES)
  frequency!: 'immediate' | 'daily_digest';

  @ApiProperty({ minimum: 0, maximum: 23 })
  @IsInt()
  @Min(0)
  @Max(23)
  digestHour!: number;

  @ApiProperty({ example: '22:00', nullable: true })
  @ValidateIf((_, value) => value !== null)
  @Matches(HOUR_MINUTE)
  quietFrom!: string | null;

  @ApiProperty({ example: '07:00', nullable: true })
  @ValidateIf((_, value) => value !== null)
  @Matches(HOUR_MINUTE)
  quietTo!: string | null;

  @ApiProperty()
  @IsBoolean()
  quietExemptCritical!: boolean;
}

/** Cuerpo de `PUT /marketing/insights/user-preferences`. */
@ApiSchema({ name: 'MarketingInsightsPutUserPreferencesDto' })
export class PutUserPreferencesDto {
  @ApiProperty({ enum: INSIGHTS_DENSITIES })
  @IsIn(INSIGHTS_DENSITIES)
  density!: 'comfortable' | 'compact';

  @ApiProperty({ enum: INSIGHTS_THEMES })
  @IsIn(INSIGHTS_THEMES)
  theme!: 'system' | 'light' | 'dark';

  @ApiProperty()
  @IsBoolean()
  navCollapsed!: boolean;

  @ApiProperty({ example: 'America/La_Paz', nullable: true })
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_+\-/]+$/)
  timezone!: string | null;
}

/** Cuerpo de `PUT /marketing/insights/saved-views/:id`. */
@ApiSchema({ name: 'MarketingInsightsPutSavedViewDto' })
export class PutSavedViewDto {
  @ApiProperty({ minLength: 1, maxLength: 60 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiProperty({ example: '/insights/campaigns?c=c1&p=30d' })
  @IsString()
  @MaxLength(500)
  @Matches(/^\/insights(?:\/[a-z0-9-]+)*(?:\?[^\s#]*)?$/)
  url!: string;
}

const codeItems = (max: number, length: number) => [
  IsArray(),
  ArrayMaxSize(max),
  IsString({ each: true }),
  MinLength(1, { each: true }),
  MaxLength(length, { each: true }),
];

/** Cuerpo de `PUT /marketing/insights/reports/:id`. */
@ApiSchema({ name: 'MarketingInsightsPutReportDto' })
export class PutReportDto {
  @ApiProperty({ maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ maxLength: 40 })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Matches(CODE)
  type!: string;

  @ApiProperty({ maxLength: 40 })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Matches(CODE)
  audience!: string;

  @ApiProperty({ example: '2026-10-01' })
  @Matches(DAY)
  periodFrom!: string;

  @ApiProperty({ example: '2026-10-29' })
  @Matches(DAY)
  periodTo!: string;

  @ApiProperty({ type: String, isArray: true })
  @applyAll(codeItems(20, 40))
  campaignIds!: string[];

  @ApiProperty({ enum: INSIGHTS_CHANNELS, isArray: true })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(INSIGHTS_CHANNELS.length)
  @IsIn(INSIGHTS_CHANNELS, { each: true })
  channels!: string[];

  @ApiProperty({ type: String, isArray: true })
  @applyAll(codeItems(32, 40))
  sections!: string[];
}

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

@ApiSchema({ name: 'MarketingInsightsAlertTransitionDto' })
export class InsightsAlertTransitionDto {
  @ApiProperty() at!: string;
  @ApiProperty({ enum: INSIGHTS_ALERT_STATUSES, nullable: true })
  fromStatus!: InsightsAlertStatus | null;
  @ApiProperty({ enum: INSIGHTS_ALERT_STATUSES })
  toStatus!: InsightsAlertStatus;
  @ApiProperty({ enum: INSIGHTS_OWNER_TEAMS, nullable: true })
  fromOwner!: InsightsOwnerTeam | null;
  @ApiProperty({ enum: INSIGHTS_OWNER_TEAMS, nullable: true })
  toOwner!: InsightsOwnerTeam | null;
  @ApiProperty({ nullable: true }) note!: string | null;
}

@ApiSchema({ name: 'MarketingInsightsAlertWorkflowDto' })
export class InsightsAlertWorkflowDto {
  @ApiProperty() fingerprint!: string;
  @ApiProperty({ enum: INSIGHTS_ALERT_STATUSES })
  status!: InsightsAlertStatus;
  @ApiProperty({ enum: INSIGHTS_OWNER_TEAMS, nullable: true })
  ownerTeam!: InsightsOwnerTeam | null;
  @ApiProperty({ description: 'Valor para `If-Match` de la siguiente edición' })
  rowVersion!: number;
  @ApiProperty() updatedAt!: string;
  @ApiProperty({ type: InsightsAlertTransitionDto, isArray: true })
  transitions!: InsightsAlertTransitionDto[];
}

@ApiSchema({ name: 'MarketingInsightsAlertRuleDto' })
export class InsightsAlertRuleDto {
  @ApiProperty({ enum: INSIGHTS_RULE_CODES }) code!: InsightsRuleCode;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ enum: INSIGHTS_ALERT_SEVERITIES })
  severity!: InsightsAlertSeverity;
  @ApiProperty() unit!: string;
  @ApiProperty() threshold!: number;
  @ApiProperty() defaultThreshold!: number;
  @ApiProperty({ enum: ['+', '-'] }) direction!: '+' | '-';
  @ApiProperty() enabled!: boolean;
  @ApiProperty() rowVersion!: number;
}

@ApiSchema({ name: 'MarketingInsightsNotificationPreferencesDto' })
export class InsightsNotificationPreferencesDto {
  @ApiProperty({ type: InsightsNotificationMatrixDto })
  matrix!: Record<InsightsAlertSeverity, InsightsNotificationChannel[]>;
  @ApiProperty({ enum: INSIGHTS_NOTIFICATION_FREQUENCIES })
  frequency!: 'immediate' | 'daily_digest';
  @ApiProperty() digestHour!: number;
  @ApiProperty({ nullable: true }) quietFrom!: string | null;
  @ApiProperty({ nullable: true }) quietTo!: string | null;
  @ApiProperty() quietExemptCritical!: boolean;
  @ApiProperty({ description: 'Siempre `true`: no se envía nada' })
  nothingIsSent!: true;
  @ApiProperty({ description: '`0` mientras la persona no haya guardado nada' })
  rowVersion!: number;
}

@ApiSchema({ name: 'MarketingInsightsUserPreferencesDto' })
export class InsightsUserPreferencesDto {
  @ApiProperty({ enum: INSIGHTS_DENSITIES }) density!: string;
  @ApiProperty({ enum: INSIGHTS_THEMES }) theme!: string;
  @ApiProperty() navCollapsed!: boolean;
  @ApiProperty({ nullable: true }) timezone!: string | null;
  @ApiProperty({ description: '`0` mientras la persona no haya guardado nada' })
  rowVersion!: number;
}

@ApiSchema({ name: 'MarketingInsightsSavedViewDto' })
export class InsightsSavedViewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() url!: string;
  @ApiProperty() rowVersion!: number;
}

@ApiSchema({ name: 'MarketingInsightsReportDto' })
export class InsightsReportDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() type!: string;
  @ApiProperty() audience!: string;
  @ApiProperty() periodFrom!: string;
  @ApiProperty() periodTo!: string;
  @ApiProperty({ type: String, isArray: true }) campaignIds!: string[];
  @ApiProperty({ type: String, isArray: true }) channels!: string[];
  @ApiProperty({ type: String, isArray: true }) sections!: string[];
  @ApiProperty() createdAt!: string;
  @ApiProperty() rowVersion!: number;
}

/** Envoltorio `{ data, meta }` común a las respuestas de Insights. */
export interface InsightsEnvelope<T> {
  data: T;
  meta: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsAlertWorkflowResponseDto' })
export class InsightsAlertWorkflowResponseDto {
  @ApiProperty({ type: InsightsAlertWorkflowDto })
  data!: InsightsAlertWorkflowDto;

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsAlertWorkflowListResponseDto' })
export class InsightsAlertWorkflowListResponseDto {
  @ApiProperty({ type: InsightsAlertWorkflowDto, isArray: true })
  data!: InsightsAlertWorkflowDto[];

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsAlertRuleResponseDto' })
export class InsightsAlertRuleResponseDto {
  @ApiProperty({ type: InsightsAlertRuleDto })
  data!: InsightsAlertRuleDto;

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsAlertRuleListResponseDto' })
export class InsightsAlertRuleListResponseDto {
  @ApiProperty({ type: InsightsAlertRuleDto, isArray: true })
  data!: InsightsAlertRuleDto[];

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsNotificationPreferencesResponseDto' })
export class InsightsNotificationPreferencesResponseDto {
  @ApiProperty({ type: InsightsNotificationPreferencesDto })
  data!: InsightsNotificationPreferencesDto;

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsUserPreferencesResponseDto' })
export class InsightsUserPreferencesResponseDto {
  @ApiProperty({ type: InsightsUserPreferencesDto })
  data!: InsightsUserPreferencesDto;

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsSavedViewResponseDto' })
export class InsightsSavedViewResponseDto {
  @ApiProperty({ type: InsightsSavedViewDto })
  data!: InsightsSavedViewDto;

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsSavedViewListResponseDto' })
export class InsightsSavedViewListResponseDto {
  @ApiProperty({ type: InsightsSavedViewDto, isArray: true })
  data!: InsightsSavedViewDto[];

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsReportResponseDto' })
export class InsightsReportResponseDto {
  @ApiProperty({ type: InsightsReportDto })
  data!: InsightsReportDto;

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}

@ApiSchema({ name: 'MarketingInsightsReportListResponseDto' })
export class InsightsReportListResponseDto {
  @ApiProperty({ type: InsightsReportDto, isArray: true })
  data!: InsightsReportDto[];

  @ApiProperty({ type: InsightsMetaDto })
  meta!: InsightsMetaDto;
}
