import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Plataforma publicitaria externa. */
export type AdPlatform = 'META' | 'GOOGLE' | 'TIKTOK';
const AD_PLATFORMS = ['META', 'GOOGLE', 'TIKTOK'] as const;

/** Nivel de la jerarquía sobre el que se mide o se actúa. */
export type AdEntityType = 'ACCOUNT' | 'CAMPAIGN' | 'AD_SET' | 'AD';
const AD_ENTITY_TYPES = ['ACCOUNT', 'CAMPAIGN', 'AD_SET', 'AD'] as const;

// ---------------------------------------------------------------------------
// UC-43-01 · Provisión de cuenta
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ads/business-managers/{bmId}/ad-accounts` (UC-43-01). */
export class ProvisionAdAccountDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Business manager a crear si no existe',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Nombre del business manager cuando hay que crearlo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessManagerName?: string;

  @ApiPropertyOptional({
    description: 'Referencia externa del business manager',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalBusinessRef?: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Referencia de la cuenta en la plataforma, única',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalAccountRef!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  currencyConceptId!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional({ description: 'Tope de gasto de la cuenta' })
  @IsOptional()
  @IsNumberString()
  spendCapAmount?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Método de pago que financia la cuenta',
  })
  @IsUUID()
  fundingPaymentMethodId!: string;

  @ApiProperty({ format: 'uuid', description: 'Propietario de la cuenta' })
  @IsUUID()
  ownerUserId!: string;
}

export class AdAccountResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  businessManagerId!: string;

  @ApiProperty()
  externalAccountRef!: string;

  @ApiProperty({ format: 'uuid' })
  accountStatusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Rol de administrador creado para el propietario',
  })
  ownerRoleId!: string;
}

// ---------------------------------------------------------------------------
// UC-43-02 · Socios
// ---------------------------------------------------------------------------

/** Naturaleza del socio. */
export type PartnerType = 'AGENCY' | 'VENDOR';

/** Qué se le concede al socio. */
export type PartnerRelationship = 'MANAGE' | 'SHARE';

/** Cuerpo de `POST /ads/business-managers/{bmId}/partners` (UC-43-02). */
export class LinkPartnerDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  partnerName!: string;

  @ApiProperty({
    description: 'Referencia del socio en la plataforma',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalPartnerRef!: string;

  @ApiProperty({ enum: ['AGENCY', 'VENDOR'] })
  @IsIn(['AGENCY', 'VENDOR'])
  partnerType!: PartnerType;

  @ApiProperty({ enum: ['MANAGE', 'SHARE'] })
  @IsIn(['MANAGE', 'SHARE'])
  relationshipType!: PartnerRelationship;

  @ApiPropertyOptional({ description: 'Permisos concedidos' })
  @IsOptional()
  @IsObject()
  permissionsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Alcance de los assets compartidos' })
  @IsOptional()
  @IsObject()
  sharedAssetScopeJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cuenta a la que dar acceso delegado al socio',
  })
  @IsOptional()
  @IsUUID()
  delegatedAdAccountId?: string;
}

export class PartnerLinkResponseDto {
  @ApiProperty({ format: 'uuid' })
  partnerId!: string;

  @ApiProperty({ format: 'uuid' })
  relationshipId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Acceso delegado creado, si se pidió',
  })
  delegatedAccessId?: string;

  @ApiProperty({ description: 'true si el socio ya existía y se reutilizó' })
  partnerExisted!: boolean;
}

// ---------------------------------------------------------------------------
// UC-43-03 · Conexión de plataforma
// ---------------------------------------------------------------------------

export class IdentityAssetDto {
  @ApiProperty({ enum: ['PAGE', 'INSTAGRAM'] })
  @IsIn(['PAGE', 'INSTAGRAM'])
  identityType!: 'PAGE' | 'INSTAGRAM';

  @ApiProperty({
    description: 'Identificador de la identidad en la plataforma',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalIdentityId!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  displayName!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileUrl?: string;
}

/** Cuerpo de `POST /ads/platform-connections` (UC-43-03). */
export class ConnectPlatformDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  businessManagerId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adAccountId?: string;

  @ApiProperty({ enum: AD_PLATFORMS })
  @IsIn(AD_PLATFORMS)
  platform!: AdPlatform;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  connectionName!: string;

  @ApiProperty({
    format: 'uuid',
    description:
      'Credencial guardada en el vault; el token nunca viaja en el cuerpo',
  })
  @IsUUID()
  credentialId!: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  apiVersion?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalBusinessId?: string;

  @ApiProperty({
    description: 'Cuenta publicitaria en la plataforma',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalAdAccountId!: string;

  @ApiPropertyOptional({
    type: [IdentityAssetDto],
    description: 'Identidades a importar',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentityAssetDto)
  identities?: IdentityAssetDto[];

  @ApiPropertyOptional({
    description: 'Cursor de sincronización devuelto por la plataforma',
  })
  @IsOptional()
  @IsString()
  checkpointValue?: string;
}

export class PlatformConnectionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Identidades importadas por primera vez' })
  identitiesImported!: number;

  @ApiProperty({ description: 'Identidades que ya existían y se actualizaron' })
  identitiesUpdated!: number;

  @ApiProperty({ format: 'uuid', description: 'Registro de la sincronización' })
  syncRunId!: string;
}

// ---------------------------------------------------------------------------
// UC-43-04 · Lanzamiento de campaña
// ---------------------------------------------------------------------------

/** Objetivo de la campaña. */
export type AdObjective = 'AWARENESS' | 'TRAFFIC' | 'CONVERSIONS' | 'LEADS';
const AD_OBJECTIVES = ['AWARENESS', 'TRAFFIC', 'CONVERSIONS', 'LEADS'] as const;

/** Modalidad de compra. */
export type BuyingType = 'AUCTION' | 'RESERVED';

/** Estrategia de puja. */
export type BidStrategy = 'LOWEST_COST' | 'COST_CAP' | 'BID_CAP';
const BID_STRATEGIES = ['LOWEST_COST', 'COST_CAP', 'BID_CAP'] as const;

/** Objetivo de optimización del conjunto. */
export type OptimizationGoal = 'LINK_CLICKS' | 'IMPRESSIONS' | 'CONVERSIONS';
const OPTIMIZATION_GOALS = [
  'LINK_CLICKS',
  'IMPRESSIONS',
  'CONVERSIONS',
] as const;

/** Evento que se factura. */
export type AdBillingEvent = 'IMPRESSIONS' | 'CLICKS';
const AD_BILLING_EVENTS = ['IMPRESSIONS', 'CLICKS'] as const;

/** Ubicación del anuncio. */
export type PlacementPosition = 'FEED' | 'STORY' | 'REELS';
const PLACEMENT_POSITIONS = ['FEED', 'STORY', 'REELS'] as const;

/** Formato del creativo. */
export type CreativeFormat = 'SINGLE_IMAGE' | 'VIDEO' | 'CAROUSEL';
const CREATIVE_FORMATS = ['SINGLE_IMAGE', 'VIDEO', 'CAROUSEL'] as const;

export class PlacementDto {
  @ApiProperty({ enum: AD_PLATFORMS })
  @IsIn(AD_PLATFORMS)
  platform!: AdPlatform;

  @ApiProperty({ enum: PLACEMENT_POSITIONS })
  @IsIn(PLACEMENT_POSITIONS)
  position!: PlacementPosition;
}

export class CreativeAssetDto {
  @ApiProperty({ enum: ['IMAGE', 'VIDEO'] })
  @IsIn(['IMAGE', 'VIDEO'])
  assetType!: 'IMAGE' | 'VIDEO';

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @ApiPropertyOptional({ description: 'Hash del archivo, para deduplicar' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  hash?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;
}

export class LaunchCreativeDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: CREATIVE_FORMATS })
  @IsIn(CREATIVE_FORMATS)
  format!: CreativeFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({
    description: 'Historia del creativo tal como la publica la plataforma',
  })
  @IsOptional()
  @IsObject()
  objectStoryJson?: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  primaryMediaFileId?: string;

  @ApiPropertyOptional({ type: [CreativeAssetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreativeAssetDto)
  assets?: CreativeAssetDto[];
}

export class LaunchAdSetDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: OPTIMIZATION_GOALS })
  @IsIn(OPTIMIZATION_GOALS)
  optimizationGoal!: OptimizationGoal;

  @ApiProperty({ enum: AD_BILLING_EVENTS })
  @IsIn(AD_BILLING_EVENTS)
  billingEvent!: AdBillingEvent;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  bidAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  dailyBudget?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  lifetimeBudget?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Segmentación ya guardada',
  })
  @IsOptional()
  @IsUUID()
  targetingSpecId?: string;

  @ApiPropertyOptional({ type: [PlacementDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlacementDto)
  placements?: PlacementDto[];

  @ApiProperty({ type: LaunchCreativeDto })
  @ValidateNested()
  @Type(() => LaunchCreativeDto)
  creative!: LaunchCreativeDto;

  @ApiProperty({ description: 'Nombre del anuncio', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  adName!: string;
}

/** Cuerpo de `POST /ads/ad-accounts/{id}/campaigns/launch` (UC-43-04). */
export class LaunchCampaignDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: AD_OBJECTIVES })
  @IsIn(AD_OBJECTIVES)
  objective!: AdObjective;

  @ApiProperty({ enum: ['AUCTION', 'RESERVED'] })
  @IsIn(['AUCTION', 'RESERVED'])
  buyingType!: BuyingType;

  @ApiPropertyOptional({ enum: BID_STRATEGIES })
  @IsOptional()
  @IsIn(BID_STRATEGIES)
  bidStrategy?: BidStrategy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  dailyBudget?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  lifetimeBudget?: string;

  @ApiPropertyOptional({ description: 'Tope de gasto de la campaña' })
  @IsOptional()
  @IsNumberString()
  spendCap?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  stopAt?: string;

  @ApiProperty({
    type: [LaunchAdSetDto],
    description: 'Conjuntos de anuncios, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LaunchAdSetDto)
  adSets!: LaunchAdSetDto[];
}

export class LaunchCampaignResponseDto {
  @ApiProperty({ format: 'uuid' })
  campaignId!: string;

  @ApiProperty({ format: 'uuid', description: 'La campaña nace pausada' })
  statusConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  adSetIds!: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  adIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-43-05 · Segmentación e identidad
// ---------------------------------------------------------------------------

/** Origen de una audiencia personalizada. */
export type AudienceSource = 'PIXEL' | 'CUSTOMER_LIST' | 'ENGAGEMENT';
const AUDIENCE_SOURCES = ['PIXEL', 'CUSTOMER_LIST', 'ENGAGEMENT'] as const;

export class CreateCustomAudienceDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: AUDIENCE_SOURCES })
  @IsIn(AUDIENCE_SOURCES)
  source!: AudienceSource;

  @ApiPropertyOptional({ description: 'Regla que define la audiencia' })
  @IsOptional()
  @IsObject()
  ruleJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Pixel del que se alimenta',
  })
  @IsOptional()
  @IsUUID()
  dataSourcePixelId?: string;

  @ApiPropertyOptional({
    description: 'Porcentaje de similitud para derivar una audiencia lookalike',
  })
  @IsOptional()
  @IsNumberString()
  lookalikeRatioPercent?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'País de la lookalike' })
  @IsOptional()
  @IsUUID()
  lookalikeCountryConceptId?: string;
}

/**
 * Cuerpo de `POST /ads/ad-accounts/{id}/targeting` (UC-43-05).
 *
 * Va después de `CreateCustomAudienceDto` a propósito: `@Type(() => ...)` es
 * perezoso, pero los metadatos de tipo que emite TypeScript no lo son, y
 * declararla antes rompería en tiempo de carga.
 */
export class CreateTargetingDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Zonas geográficas incluidas' })
  @IsOptional()
  @IsObject()
  geoLocationsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Zonas geográficas excluidas' })
  @IsOptional()
  @IsObject()
  excludedGeoLocationsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ minimum: 13, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  ageMin?: number;

  @ApiPropertyOptional({ minimum: 13, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  ageMax?: number;

  @ApiPropertyOptional({ description: 'Intereses; nunca condiciones de salud' })
  @IsOptional()
  @IsObject()
  interestsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Audiencias personalizadas incluidas' })
  @IsOptional()
  @IsObject()
  customAudienceIdsJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Audiencia personalizada a crear junto con la segmentación',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomAudienceDto)
  customAudience?: CreateCustomAudienceDto;
}

export class TargetingResponseDto {
  @ApiProperty({ format: 'uuid' })
  targetingSpecId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  customAudienceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  lookalikeSpecId?: string;
}

/** Cuerpo de `POST /ads/ad-sets/{id}/identity` (UC-43-05). */
export class AssignIdentityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  adIdentityAssetId!: string;

  @ApiPropertyOptional({ enum: ['PRIMARY', 'SECONDARY'], default: 'PRIMARY' })
  @IsOptional()
  @IsIn(['PRIMARY', 'SECONDARY'])
  role?: 'PRIMARY' | 'SECONDARY';
}

export class AssignIdentityResponseDto {
  @ApiProperty({ format: 'uuid' })
  assignmentId!: string;

  @ApiProperty({ format: 'uuid' })
  adSetId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Asignación anterior cerrada, si la había',
  })
  supersededAssignmentId?: string;
}

// ---------------------------------------------------------------------------
// UC-43-06 · Política de datos
// ---------------------------------------------------------------------------

/** Jurisdicción que gobierna la política. */
export type Jurisdiction = 'BO' | 'EU' | 'US';

/** Para qué se usan los datos. */
export type AdPurpose = 'MARKETING' | 'ANALYTICS';

/** Qué hacer con un campo. */
export type FieldAction = 'ALLOW' | 'BLOCK' | 'HASH' | 'DROP';
const FIELD_ACTIONS = ['ALLOW', 'BLOCK', 'HASH', 'DROP'] as const;

export class FieldRuleDto {
  @ApiProperty({ description: 'Patrón del nombre del evento', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  eventNamePattern!: string;

  @ApiProperty({
    description: 'Ruta del campo dentro del evento',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  fieldPath!: string;

  @ApiProperty({ enum: FIELD_ACTIONS })
  @IsIn(FIELD_ACTIONS)
  action!: FieldAction;

  @ApiPropertyOptional({ enum: ['SHA256', 'TRUNCATE'] })
  @IsOptional()
  @IsIn(['SHA256', 'TRUNCATE'])
  transformation?: 'SHA256' | 'TRUNCATE';

  @ApiPropertyOptional({ description: 'Por qué existe la regla' })
  @IsOptional()
  @IsString()
  rationale?: string;
}

/** Cuerpo de `POST /ads/event-data-policies` (UC-43-06). */
export class CreateEventPolicyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código de la política, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['BO', 'EU', 'US'] })
  @IsIn(['BO', 'EU', 'US'])
  jurisdiction!: Jurisdiction;

  @ApiProperty({ enum: ['MARKETING', 'ANALYTICS'] })
  @IsIn(['MARKETING', 'ANALYTICS'])
  purposeOfUse!: AdPurpose;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresConsent?: boolean;

  @ApiProperty({
    enum: ['ALLOW', 'BLOCK'],
    description: 'Qué hacer con un campo que ninguna regla contempla',
  })
  @IsIn(['ALLOW', 'BLOCK'])
  defaultAction!: 'ALLOW' | 'BLOCK';

  @ApiPropertyOptional({
    description: 'Clases de dato prohibidas (p. ej. datos de salud)',
  })
  @IsOptional()
  @IsObject()
  prohibitedDataClassesJson?: Record<string, unknown>;

  @ApiProperty({
    type: [FieldRuleDto],
    description: 'Reglas de campo, al menos una',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FieldRuleDto)
  fieldRules!: FieldRuleDto[];
}

export class EventPolicyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  fieldRuleIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-43-07 · Ingesta de entrega
// ---------------------------------------------------------------------------

export class InsightRowDto {
  @ApiProperty({ enum: AD_ENTITY_TYPES })
  @IsIn(AD_ENTITY_TYPES)
  entityType!: AdEntityType;

  @ApiProperty({
    format: 'uuid',
    description: 'Entidad local a la que corresponde la fila',
  })
  @IsUUID()
  entityRefId!: string;

  @ApiProperty({
    description: 'Identificador del objeto en la plataforma',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalObjectId!: string;

  @ApiProperty({ format: 'date', description: 'Día de la métrica' })
  @IsISO8601()
  statDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  impressions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  clicks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  spend?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  conversions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  conversionValue?: string;
}

/** Cuerpo de `POST /ads/ingest/insights` (UC-43-07). */
export class IngestInsightsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  adAccountId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  platformConnectionId!: string;

  @ApiProperty({ format: 'date' })
  @IsISO8601()
  dateStart!: string;

  @ApiProperty({ format: 'date' })
  @IsISO8601()
  dateEnd!: string;

  @ApiProperty({
    type: [InsightRowDto],
    description: 'Filas de métricas del lote',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InsightRowDto)
  rows!: InsightRowDto[];

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Moneda de los importes',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({
    description: 'Registrar el gasto también como evento de facturación',
  })
  @IsOptional()
  @IsBoolean()
  recordBillingEvent?: boolean;
}

export class IngestInsightsResponseDto {
  @ApiProperty({ format: 'uuid' })
  insightQueryRunId!: string;

  @ApiProperty({ description: 'Filas de hecho insertadas' })
  factRows!: number;

  @ApiProperty({ description: 'Rollups diarios creados' })
  rollupsCreated!: number;

  @ApiProperty({ description: 'Rollups diarios reescritos' })
  rollupsUpdated!: number;

  @ApiProperty({ description: 'Gasto acumulado de la cuenta tras el lote' })
  amountSpent!: string;

  @ApiProperty({ description: 'true si el gasto alcanzó el tope de la cuenta' })
  spendCapReached!: boolean;
}

// ---------------------------------------------------------------------------
// UC-43-08 · Conversión server-side
// ---------------------------------------------------------------------------

/** Dónde ocurrió la conversión. */
export type ActionSource = 'WEBSITE' | 'APP' | 'SERVER' | 'OFFLINE';
const ACTION_SOURCES = ['WEBSITE', 'APP', 'SERVER', 'OFFLINE'] as const;

export class ConversionUserDataDto {
  @ApiPropertyOptional({
    description: 'Identificador de usuario ya hasheado (SHA-256)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalUserIdHash?: string;

  @ApiPropertyOptional({
    description: 'Identificador del click de la plataforma',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  clickId?: string;

  @ApiPropertyOptional({ description: 'Identificador del navegador' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  browserId?: string;

  @ApiPropertyOptional({ description: 'IP del cliente; se persiste cifrada' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientIpAddress?: string;

  @ApiPropertyOptional({
    description: 'User-agent del cliente; se persiste cifrado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clientUserAgent?: string;
}

export class ConversionCustomDataDto {
  @ApiPropertyOptional({ maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  valueAmount?: string;

  @ApiPropertyOptional({ description: 'Productos implicados' })
  @IsOptional()
  @IsObject()
  contentIdsJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  numItems?: number;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  orderId?: string;
}

/** Cuerpo de `POST /ads/datasets/{id}/events` (UC-43-08). */
export class SendConversionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Nombre del evento', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  eventName!: string;

  @ApiProperty({
    description:
      'Identificador del evento; con él se deduplica navegador contra servidor',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  eventId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  eventTime!: string;

  @ApiProperty({ enum: ACTION_SOURCES })
  @IsIn(ACTION_SOURCES)
  actionSource!: ActionSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventSourceUrl?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Directiva de consentimiento aplicable',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  paymentTransactionId?: string;

  @ApiPropertyOptional({ type: ConversionUserDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConversionUserDataDto)
  userData?: ConversionUserDataDto;

  @ApiPropertyOptional({ type: ConversionCustomDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConversionCustomDataDto)
  customData?: ConversionCustomDataDto;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Conexión a la que encolar la entrega del evento',
  })
  @IsOptional()
  @IsUUID()
  platformConnectionId?: string;
}

export class SendConversionResponseDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ausente si el evento era duplicado',
  })
  eventId?: string;

  @ApiProperty({ format: 'uuid' })
  processingStatusConceptId!: string;

  @ApiProperty({ description: 'true si el evento ya se había recibido' })
  duplicate!: boolean;

  @ApiProperty({
    description: 'true si la política de datos bloqueó el evento',
  })
  blocked!: boolean;

  @ApiProperty({
    type: [String],
    description: 'Campos que la política obligó a hashear o quitar',
  })
  transformedFields!: string[];
}

// ---------------------------------------------------------------------------
// UC-43-09 · Conversiones offline
// ---------------------------------------------------------------------------

export class OfflineEventDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  eventName!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  eventTime?: string;

  @ApiProperty({
    description: 'Claves de coincidencia YA hasheadas; nunca datos en claro',
  })
  @IsObject()
  matchKeysHashJson!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  valueAmount?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  orderRef?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Campaña a la que se atribuye; su presencia marca el evento como emparejado',
  })
  @IsOptional()
  @IsUUID()
  attributedCampaignRefId?: string;
}

/** Cuerpo de `POST /ads/offline-conversion-sets/{id}/upload` (UC-43-09). */
export class UploadOfflineConversionsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  adAccountId!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['FILE', 'API'] })
  @IsIn(['FILE', 'API'])
  uploadSource!: 'FILE' | 'API';

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiProperty({ type: [OfflineEventDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OfflineEventDto)
  events!: OfflineEventDto[];
}

export class OfflineUploadResponseDto {
  @ApiProperty({ format: 'uuid' })
  offlineConversionSetId!: string;

  @ApiProperty()
  totalEvents!: number;

  @ApiProperty()
  matchedEvents!: number;

  @ApiProperty({ description: 'Proporción de eventos emparejados' })
  matchRate!: string;

  @ApiProperty({ description: 'Valor atribuido a los eventos emparejados' })
  attributedValue!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-43-10 · Experimentos
// ---------------------------------------------------------------------------

/** Métrica que decide el experimento. */
export type ObjectiveMetric = 'CPA' | 'ROAS' | 'CTR';
const OBJECTIVE_METRICS = ['CPA', 'ROAS', 'CTR'] as const;

export class ExperimentVariantDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['CAMPAIGN', 'AD_SET'] })
  @IsIn(['CAMPAIGN', 'AD_SET'])
  variantRefType!: 'CAMPAIGN' | 'AD_SET';

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  variantRefId!: string;

  @ApiProperty({
    description: 'Porcentaje de tráfico; la suma de las variantes debe dar 100',
  })
  @IsNumberString()
  trafficSplitPercent!: string;

  @ApiProperty({ description: 'Exactamente una variante es el control' })
  @IsBoolean()
  isControl!: boolean;
}

/** Cuerpo de `POST /ads/ad-accounts/{id}/experiments` (UC-43-10). */
export class CreateExperimentDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['AB_SPLIT', 'CBO'] })
  @IsIn(['AB_SPLIT', 'CBO'])
  experimentType!: 'AB_SPLIT' | 'CBO';

  @ApiProperty({ enum: OBJECTIVE_METRICS })
  @IsIn(OBJECTIVE_METRICS)
  objectiveMetric!: ObjectiveMetric;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hypothesis?: string;

  @ApiPropertyOptional({
    description: 'Porcentaje reservado como grupo de control ciego',
  })
  @IsOptional()
  @IsNumberString()
  holdoutPercent?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endAt?: string;

  @ApiProperty({
    type: [ExperimentVariantDto],
    description: 'Al menos dos variantes',
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => ExperimentVariantDto)
  variants!: ExperimentVariantDto[];
}

export class ExperimentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  variantIds!: string[];

  @ApiProperty({ description: 'Entidades que pasaron de pausadas a activas' })
  entitiesActivated!: number;
}

// ---------------------------------------------------------------------------
// UC-43-11 · Reglas automatizadas
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ads/automated-rules/{id}/evaluate` (UC-43-11). */
export class EvaluateRuleDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'Entidades que el evaluador determinó que cumplen la condición',
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  matchedEntityIds!: string[];

  @ApiPropertyOptional({
    description:
      'Nuevo presupuesto diario cuando la acción es ajustar presupuesto',
  })
  @IsOptional()
  @IsNumberString()
  newDailyBudget?: string;

  @ApiPropertyOptional({
    description: 'Nueva puja cuando la acción es ajustar puja',
  })
  @IsOptional()
  @IsNumberString()
  newBidAmount?: string;
}

export class EvaluateRuleResponseDto {
  @ApiProperty({ format: 'uuid' })
  ruleExecutionId!: string;

  @ApiProperty()
  entitiesEvaluated!: number;

  @ApiProperty()
  entitiesAffected!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-43-12 · Moderación
// ---------------------------------------------------------------------------

/** Categoría de la política incumplida. */
export type PolicyCategory = 'HEALTH' | 'MISLEADING' | 'PROHIBITED';
const POLICY_CATEGORIES = ['HEALTH', 'MISLEADING', 'PROHIBITED'] as const;

/** Cuerpo de `POST /ads/ads/{id}/review-events` (UC-43-12). */
export class RecordReviewEventDto {
  @ApiProperty({ enum: ['INITIAL', 'RE_REVIEW', 'APPEAL_DECISION'] })
  @IsIn(['INITIAL', 'RE_REVIEW', 'APPEAL_DECISION'])
  reviewEventType!: 'INITIAL' | 'RE_REVIEW' | 'APPEAL_DECISION';

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'DISAPPROVED'] })
  @IsIn(['PENDING', 'APPROVED', 'DISAPPROVED'])
  reviewStatus!: 'PENDING' | 'APPROVED' | 'DISAPPROVED';

  @ApiPropertyOptional({
    description:
      'Identificador de la revisión en la plataforma; hace idempotente el webhook',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalReviewId?: string;

  @ApiPropertyOptional({ description: 'Motivos que devuelve la plataforma' })
  @IsOptional()
  @IsObject()
  reasonsJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Hash del payload recibido, para trazabilidad',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sourcePayloadHash?: string;

  @ApiPropertyOptional({
    description: 'Código de la política incumplida',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyCode?: string;

  @ApiPropertyOptional({ enum: POLICY_CATEGORIES })
  @IsOptional()
  @IsIn(POLICY_CATEGORIES)
  policyCategory?: PolicyCategory;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class ReviewEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  reviewEventId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Infracción abierta, si el anuncio se rechazó',
  })
  violationId?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado efectivo en el que queda el anuncio',
  })
  effectiveStatusConceptId!: string;

  @ApiProperty({ description: 'true si el evento ya se había recibido' })
  duplicate!: boolean;
}

/** Cuerpo de `POST /ads/policy-violations/{id}/appeals` (UC-43-12). */
export class SubmitAppealDto {
  @ApiProperty({ description: 'Argumento de la apelación' })
  @IsString()
  appealReason!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evidencia adjunta en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;
}

export class AppealResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  adPolicyViolationId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-43-13 · Catálogo
// ---------------------------------------------------------------------------

export class FeedItemDto {
  @ApiProperty({
    description: 'Identificador del producto en el comercio',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  retailerProductId!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['IN_STOCK', 'OUT_OF_STOCK'] })
  @IsIn(['IN_STOCK', 'OUT_OF_STOCK'])
  availability!: 'IN_STOCK' | 'OUT_OF_STOCK';

  @ApiPropertyOptional({ enum: ['NEW', 'REFURBISHED'], default: 'NEW' })
  @IsOptional()
  @IsIn(['NEW', 'REFURBISHED'])
  condition?: 'NEW' | 'REFURBISHED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  price?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryCount?: number;
}

/** Cuerpo de `POST /ads/catalogs/{id}/feeds/{feedId}/run` (UC-43-13). */
export class RunFeedDto {
  @ApiProperty({ type: [FeedItemDto], description: 'Ítems leídos del feed' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeedItemDto)
  items!: FeedItemDto[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

export class FeedRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  feedRunLogId!: string;

  @ApiProperty()
  itemsRead!: number;

  @ApiProperty({ description: 'Productos creados' })
  itemsCreated!: number;

  @ApiProperty({ description: 'Productos actualizados' })
  itemsUpdated!: number;

  @ApiProperty({ description: 'Miembros añadidos a conjuntos dinámicos' })
  setMembershipsAdded!: number;

  @ApiProperty({
    description: 'Total de productos del catálogo tras la corrida',
  })
  catalogItemCount!: number;
}

// ---------------------------------------------------------------------------
// UC-43-14 · Facturación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ads/ad-accounts/{id}/invoices/issue` (UC-43-14). */
export class IssueAdInvoiceDto {
  @ApiProperty({ description: 'Número de factura, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  invoiceNumber!: string;

  @ApiProperty({ format: 'date' })
  @IsISO8601()
  periodStart!: string;

  @ApiProperty({ format: 'date' })
  @IsISO8601()
  periodEnd!: string;

  @ApiPropertyOptional({
    description: 'Porcentaje de impuesto sobre el subtotal',
    default: '0',
  })
  @IsOptional()
  @IsNumberString()
  taxPercentage?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

export class AdInvoiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiProperty({ description: 'Suma de las líneas' })
  subtotal!: string;

  @ApiProperty()
  taxTotal!: string;

  @ApiProperty()
  total!: string;

  @ApiProperty({ description: 'Líneas emitidas, una por campaña con gasto' })
  lines!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-43-15 · Leads
// ---------------------------------------------------------------------------

export class LeadAnswerDto {
  @ApiProperty({
    description: 'Clave de la pregunta del formulario',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  questionKey!: string;

  @ApiPropertyOptional({ description: 'Respuesta; se persiste cifrada' })
  @IsOptional()
  @IsString()
  answer?: string;
}

/** Cuerpo de `POST /ads/lead-forms/{id}/submissions` (UC-43-15). */
export class SubmitLeadDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description:
      'Identificador del lead en la plataforma; hace idempotente el webhook',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalLeadId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adSetId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Consentimiento capturado con el lead',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  @ApiPropertyOptional({ description: 'Hash del payload recibido' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  rawPayloadHash?: string;

  @ApiPropertyOptional({ description: 'IP de origen; se guarda hasheada' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceIp?: string;

  @ApiProperty({ type: [LeadAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeadAnswerDto)
  answers!: LeadAnswerDto[];
}

export class LeadSubmissionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  processingStatusConceptId!: string;

  @ApiProperty({ description: 'Respuestas registradas' })
  answersStored!: number;

  @ApiProperty({
    description:
      'Respuestas descartadas por no corresponder a ninguna pregunta',
  })
  answersIgnored!: number;

  @ApiProperty({ description: 'true si el lead ya se había recibido' })
  duplicate!: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Intento de entrega al CRM',
  })
  deliveryEventId?: string;
}

// ---------------------------------------------------------------------------
// UC-43-16 · Presupuesto y aprendizaje
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ads/ad-sets/{id}/budget-schedules` (UC-43-16). */
export class CreateBudgetScheduleDto {
  @ApiProperty({ enum: ['DAILY', 'LIFETIME'] })
  @IsIn(['DAILY', 'LIFETIME'])
  budgetType!: 'DAILY' | 'LIFETIME';

  @ApiProperty({ description: 'Importe del tramo' })
  @IsNumberString()
  amount!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  currencyConceptId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  validFrom!: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Sin fin, el tramo queda abierto',
  })
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @ApiPropertyOptional({
    description: 'Nueva puja a aplicar junto con el presupuesto',
  })
  @IsOptional()
  @IsNumberString()
  bidAmount?: string;

  @ApiPropertyOptional({
    description: 'Ventana de atribución por click, en días',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  clickWindowDays?: number;

  @ApiPropertyOptional({
    description: 'Ventana de atribución por impresión, en días',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  viewWindowDays?: number;
}

export class BudgetScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  adSetId!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty({
    description:
      'true si el cambio reinició la fase de aprendizaje del conjunto',
  })
  learningReset!: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  learningSnapshotId?: string;
}
