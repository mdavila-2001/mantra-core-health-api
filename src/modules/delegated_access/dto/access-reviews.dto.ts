import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EXPORT_REASON_CODES } from './governance-reports.dto';

const REVIEW_KINDS = [
  'PERIODIC',
  'RECERTIFICATION',
  'MOVER',
  'TARGETED',
  'REMEDIATION',
] as const;
const SCOPE_KINDS = [
  'ORGANIZATION',
  'PRACTITIONER',
  'SERVICE',
  'LOCATION',
  'TEMPLATE',
] as const;
const UNCERTIFIED = ['UNCERTIFIED_REVOKE', 'UNCERTIFIED_ESCALATE'] as const;
const DECISIONS = ['CERTIFY', 'REVOKE', 'ADJUST'] as const;

/** Alcance de una campaña (`scope_json`). */
export class CampaignScopeDto {
  /** Tipo de alcance. */
  @ApiProperty({ enum: SCOPE_KINDS })
  @IsIn(SCOPE_KINDS)
  kind!: (typeof SCOPE_KINDS)[number];

  /** Doctores (asignaciones de rol), con `kind = PRACTITIONER`. */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  practitionerRoleAssignmentIds?: string[];

  /** Servicios, con `kind = SERVICE`. */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  healthcareServiceIds?: string[];

  /** Espacios, con `kind = LOCATION`. */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  careSpaceIds?: string[];

  /** Sedes, con `kind = LOCATION`. */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  practiceSiteIds?: string[];

  /** Plantillas, con `kind = TEMPLATE`. */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  templateCodes?: string[];
}

/** Filtros de una campaña (`filters_json`; todo opcional y se cruzan). */
export class CampaignFiltersDto {
  /** Sensibilidad mínima (`BAJA|MEDIA|ALTA|CRITICA`). */
  @ApiPropertyOptional({ example: 'ALTA' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  minSensitivity?: string;

  /** Solo permisos sin uso en estos días. */
  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  unusedDays?: number;

  /** Solo lo que está sobre el techo de su plantilla. */
  @ApiPropertyOptional()
  @IsOptional()
  onlyAboveCeiling?: boolean;

  /** Solo lo que participa de un conflicto de segregación. */
  @ApiPropertyOptional()
  @IsOptional()
  onlySodFindings?: boolean;

  /** Incluir vínculos suspendidos. */
  @ApiPropertyOptional()
  @IsOptional()
  includeSuspended?: boolean;
}

/** Cuerpo de `POST /org/access-reviews/campaigns/preview` y base de la creación. */
export class CampaignDraftDto {
  /** Nombre visible de la campaña. */
  @ApiProperty({ minLength: 3, maxLength: 120 })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  /** Tipo de campaña. */
  @ApiProperty({ enum: REVIEW_KINDS })
  @IsIn(REVIEW_KINDS)
  kind!: (typeof REVIEW_KINDS)[number];

  /** Alcance. */
  @ApiProperty({ type: CampaignScopeDto })
  @ValidateNested()
  @Type(() => CampaignScopeDto)
  scope!: CampaignScopeDto;

  /** Filtros. */
  @ApiPropertyOptional({ type: CampaignFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignFiltersDto)
  filters?: CampaignFiltersDto;

  /** Fecha límite de decisión. */
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  dueAt!: string;

  /** Días de gracia tras el vencimiento (0-30; 7 por defecto). */
  @ApiPropertyOptional({ minimum: 0, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  graceDays?: number;

  /** Recordatorios, en días antes del vencimiento (`[7,3,1]` por defecto). */
  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(60, { each: true })
  reminderDaysBefore?: number[];

  /** Días tras el vencimiento para escalar (1-30; 3 por defecto). */
  @ApiPropertyOptional({ minimum: 1, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  escalateAfterDays?: number;

  /** Qué pasa con lo no certificado (revocar por defecto; las de cambio de rol solo escalan). */
  @ApiPropertyOptional({ enum: UNCERTIFIED })
  @IsOptional()
  @IsIn(UNCERTIFIED)
  uncertifiedAction?: (typeof UNCERTIFIED)[number];
}

/** Cuerpo de `POST /org/access-reviews/campaigns`. */
export class CreateCampaignDto extends CampaignDraftDto {}

/** Cuerpo de `PATCH /org/access-reviews/campaigns/:id` (solo en borrador). */
export class UpdateCampaignDto extends PartialType(CampaignDraftDto) {}

/** Cuerpo de `POST /org/access-reviews/campaigns/:id/cancel`. */
export class CancelCampaignDto {
  /** Por qué se cancela (no revoca nada). */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Ajuste que solo reduce, sobre una concesión. */
export class ReviewAdjustmentDto {
  /** Átomos que se conservan (quitar). */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  atoms?: string[];

  /** Nuevo fin de vigencia (acortar). */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  /** Condición ABAC agregada o endurecida. */
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;
}

/** Cuerpo de `POST /me/access-reviews/items/:id/decision`. */
export class DecideReviewItemDto {
  /** Decisión. */
  @ApiProperty({ enum: DECISIONS })
  @IsIn(DECISIONS)
  decision!: (typeof DECISIONS)[number];

  /** Comentario (≥ 10 caracteres si se revoca, se ajusta o la concesión es de riesgo o sin uso). */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  /** Ajuste, con `decision = ADJUST`. */
  @ApiPropertyOptional({ type: ReviewAdjustmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReviewAdjustmentDto)
  adjustment?: ReviewAdjustmentDto;
}

/** Cuerpo de `POST /me/access-reviews/items/bulk-decision`. */
export class BulkReviewDecisionDto {
  /** Ítems; todo o nada. */
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  itemIds!: string[];

  /** Solo `CERTIFY` (de bajo riesgo y con uso reciente). */
  @ApiProperty({ enum: DECISIONS })
  @IsIn(DECISIONS)
  decision!: (typeof DECISIONS)[number];

  /** Comentario común, opcional. */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

/** Consulta de `GET /me/access-reviews/items`. */
export class MyReviewsQueryDto {
  /** Estado de los ítems (pendientes por defecto). */
  @ApiPropertyOptional({
    enum: ['PENDING', 'DECIDED', 'ALL'],
    default: 'PENDING',
  })
  @IsOptional()
  @IsIn(['PENDING', 'DECIDED', 'ALL'])
  status?: 'PENDING' | 'DECIDED' | 'ALL';
}

/** Consulta de `GET /org/access-reviews/campaigns/:id/export`. */
export class CampaignExportQueryDto {
  /** Formato del archivo. */
  @ApiPropertyOptional({ enum: ['csv', 'json'], default: 'json' })
  @IsOptional()
  @IsIn(['csv', 'json'])
  format?: 'csv' | 'json';

  /**
   * Para qué se exporta: un CÓDIGO (la ruta es un GET; el texto libre quedaría en los registros del
   * servidor). Obligatorio: sin él, 422 `EXPORT_REASON_REQUIRED`. Además exige el paso extra reciente.
   */
  @ApiPropertyOptional({
    enum: EXPORT_REASON_CODES,
    description:
      'Obligatorio en la práctica: sin motivo la exportación responde 422 EXPORT_REASON_REQUIRED.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  reasonCode?: string;
}

/** Un ítem tal como lo ve quien administra o revisa. */
export class ReviewItemViewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) campaignId!: string;
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  @ApiPropertyOptional({ format: 'uuid' }) grantId?: string;
  @ApiProperty({ format: 'uuid' }) subjectUserId!: string;
  @ApiPropertyOptional() subjectName?: string;
  @ApiProperty({
    enum: ['DOCTOR_OWNER', 'SERVICE_HEAD', 'SUPERVISOR', 'ADMIN'],
  })
  reviewerKind!: string;
  @ApiProperty({
    enum: [
      'PENDING',
      'CERTIFIED',
      'REVOKED',
      'ADJUSTED',
      'AUTO_REVOKED',
      'SKIPPED',
    ],
  })
  state!: string;
  @ApiProperty({ format: 'date-time' }) dueAt!: string;
  @ApiPropertyOptional({ format: 'date-time' }) decidedAt?: string;
  @ApiPropertyOptional() comment?: string;
  @ApiProperty() escalated!: boolean;
  @ApiProperty({ minimum: 0 }) reminderCount!: number;
  @ApiPropertyOptional() maxSensitivity?: string;
  @ApiPropertyOptional() campaignName?: string;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  evidence?: Record<string, unknown>;
  @ApiPropertyOptional() evidenceHash?: string;
}

/** Una campaña con sus conteos. */
export class CampaignViewDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: REVIEW_KINDS }) kind!: string;
  @ApiProperty({ enum: ['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'] })
  status!: string;
  @ApiProperty({ type: 'object', additionalProperties: true })
  scope!: Record<string, unknown>;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  filters?: Record<string, unknown>;
  @ApiProperty({ format: 'date-time' }) dueAt!: string;
  @ApiProperty() graceDays!: number;
  @ApiProperty({ type: [Number] }) reminderDaysBefore!: number[];
  @ApiProperty() escalateAfterDays!: number;
  @ApiProperty({ enum: UNCERTIFIED }) uncertifiedAction!: string;
  @ApiPropertyOptional({ format: 'uuid' }) ownerUserId?: string;
  @ApiPropertyOptional({ format: 'date-time' }) launchedAt?: string;
  @ApiPropertyOptional({ format: 'date-time' }) closedAt?: string;
  @ApiPropertyOptional({ format: 'date-time' }) cancelledAt?: string;
}

/** Lista de campañas. */
export class CampaignListDto {
  @ApiProperty({ type: [CampaignViewDto] }) items!: CampaignViewDto[];
  @ApiProperty() count!: number;
}

/** Lista de ítems. */
export class ReviewItemListDto {
  @ApiProperty({ type: [ReviewItemViewDto] }) items!: ReviewItemViewDto[];
  @ApiProperty() count!: number;
}

/** Un ítem que se crearía (vista previa). */
export class CampaignPreviewItemDto {
  @ApiProperty({ format: 'uuid' }) engagementId!: string;
  @ApiProperty({ format: 'uuid' }) subjectUserId!: string;
  @ApiPropertyOptional({ format: 'uuid' }) grantId?: string;
  @ApiProperty() reviewerKind!: string;
  @ApiProperty({ type: [String], format: 'uuid' }) reviewerUserIds!: string[];
  @ApiPropertyOptional() maxSensitivity?: string;
  @ApiProperty() suggestRevoke!: boolean;
}

/** Vista previa de una campaña: cuántos ítems y quién revisa, sin crear nada. */
export class CampaignPreviewDto {
  @ApiProperty() total!: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byReviewerKind!: Record<string, number>;
  @ApiProperty({ description: 'Ítems sin revisor elegible (SOD-GOV-02).' })
  withoutReviewer!: number;
  @ApiProperty({ type: [CampaignPreviewItemDto] })
  items!: CampaignPreviewItemDto[];
}

/** Resultado de lanzar una campaña. */
export class LaunchCampaignResultDto {
  @ApiProperty() ok!: boolean;
  @ApiProperty() items!: number;
  @ApiProperty() withoutReviewer!: number;
}

/** Resultado de cerrar una campaña. */
export class CloseCampaignResultDto {
  @ApiProperty() ok!: boolean;
  @ApiProperty() autoRevoked!: number;
  @ApiProperty() skipped!: number;
}

/** Resultado de decidir un ítem. */
export class ReviewDecisionResultDto {
  @ApiProperty() ok!: boolean;
  @ApiProperty() state!: string;
}

/** Resultado de una decisión en lote. */
export class BulkReviewResultDto {
  @ApiProperty() ok!: boolean;
  @ApiProperty() decided!: number;
}

/** Resultados de una campaña. */
export class CampaignResultsDto {
  @ApiProperty() total!: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byDecision!: Record<string, number>;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byReviewerKind!: Record<string, number>;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  bySensitivity!: Record<string, number>;
  @ApiProperty() pending!: number;
  @ApiProperty() coveragePercent!: number;
  @ApiPropertyOptional({ nullable: true }) meanResponseHours!: number | null;
  @ApiProperty({ type: [String], format: 'uuid' })
  autoRevokedItemIds!: string[];
}

/** Archivo exportado, con su huella. */
export class ExportedFileDto {
  @ApiProperty({ enum: ['csv', 'json'] }) format!: string;
  @ApiProperty() kind!: string;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ format: 'uuid' }) generatedBy!: string;
  @ApiProperty({ type: 'object', additionalProperties: true })
  filters!: Record<string, unknown>;
  @ApiProperty() rowCount!: number;
  @ApiProperty({ description: 'SHA-256 (64 hex) del contenido.' })
  sha256!: string;
  @ApiProperty({ description: 'El archivo, como texto.' }) content!: string;
}
