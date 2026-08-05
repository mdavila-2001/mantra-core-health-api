import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Business manager a crear si no existe',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de business manager name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nombre del business manager cuando hay que crearlo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessManagerName?: string;

  /**
   * Valor de external business ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia externa del business manager',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalBusinessRef?: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de external account ref mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia de la cuenta en la plataforma, única',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalAccountRef!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  currencyConceptId!: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Valor de spend cap amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tope de gasto de la cuenta' })
  @IsOptional()
  @IsNumberString()
  spendCapAmount?: string;

  /**
   * Identificador asociado a funding payment method.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Método de pago que financia la cuenta',
  })
  @IsUUID()
  fundingPaymentMethodId!: string;

  /**
   * Identificador asociado a owner user.
   */
  @ApiProperty({ format: 'uuid', description: 'Propietario de la cuenta' })
  @IsUUID()
  ownerUserId!: string;
}

/**
 * Define el contrato validado para ad account response.
 */
export class AdAccountResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a business manager.
   */
  @ApiProperty({ format: 'uuid' })
  businessManagerId!: string;

  /**
   * Valor de external account ref mantenido por la instancia.
   */
  @ApiProperty()
  externalAccountRef!: string;

  /**
   * Identificador asociado a account status concept.
   */
  @ApiProperty({ format: 'uuid' })
  accountStatusConceptId!: string;

  /**
   * Identificador asociado a owner role.
   */
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
  /**
   * Valor de partner name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  partnerName!: string;

  /**
   * Valor de external partner ref mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia del socio en la plataforma',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalPartnerRef!: string;

  /**
   * Valor de partner type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['AGENCY', 'VENDOR'] })
  @IsIn(['AGENCY', 'VENDOR'])
  partnerType!: PartnerType;

  /**
   * Valor de relationship type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['MANAGE', 'SHARE'] })
  @IsIn(['MANAGE', 'SHARE'])
  relationshipType!: PartnerRelationship;

  /**
   * Valor de permissions json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Permisos concedidos' })
  @IsOptional()
  @IsObject()
  permissionsJson?: Record<string, unknown>;

  /**
   * Valor de shared asset scope json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Alcance de los assets compartidos' })
  @IsOptional()
  @IsObject()
  sharedAssetScopeJson?: Record<string, unknown>;

  /**
   * Identificador asociado a delegated ad account.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cuenta a la que dar acceso delegado al socio',
  })
  @IsOptional()
  @IsUUID()
  delegatedAdAccountId?: string;
}

/**
 * Define el contrato validado para partner link response.
 */
export class PartnerLinkResponseDto {
  /**
   * Identificador asociado a partner.
   */
  @ApiProperty({ format: 'uuid' })
  partnerId!: string;

  /**
   * Identificador asociado a relationship.
   */
  @ApiProperty({ format: 'uuid' })
  relationshipId!: string;

  /**
   * Identificador asociado a delegated access.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Acceso delegado creado, si se pidió',
  })
  delegatedAccessId?: string;

  /**
   * Valor de partner existed mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el socio ya existía y se reutilizó' })
  partnerExisted!: boolean;
}

// ---------------------------------------------------------------------------
// UC-43-03 · Conexión de plataforma
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para identity asset.
 */
export class IdentityAssetDto {
  /**
   * Valor de identity type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['PAGE', 'INSTAGRAM'] })
  @IsIn(['PAGE', 'INSTAGRAM'])
  identityType!: 'PAGE' | 'INSTAGRAM';

  /**
   * Identificador asociado a external identity.
   */
  @ApiProperty({
    description: 'Identificador de la identidad en la plataforma',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalIdentityId!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  displayName!: string;

  /**
   * Valor de username mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  /**
   * Valor de profile url mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileUrl?: string;
}

/** Cuerpo de `POST /ads/platform-connections` (UC-43-03). */
export class ConnectPlatformDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a business manager.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  businessManagerId!: string;

  /**
   * Identificador asociado a ad account.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adAccountId?: string;

  /**
   * Valor de platform mantenido por la instancia.
   */
  @ApiProperty({ enum: AD_PLATFORMS })
  @IsIn(AD_PLATFORMS)
  platform!: AdPlatform;

  /**
   * Valor de connection name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  connectionName!: string;

  /**
   * Identificador asociado a credential.
   */
  @ApiProperty({
    format: 'uuid',
    description:
      'Credencial guardada en el vault; el token nunca viaja en el cuerpo',
  })
  @IsUUID()
  credentialId!: string;

  /**
   * Valor de api version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  apiVersion?: string;

  /**
   * Identificador asociado a external business.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalBusinessId?: string;

  /**
   * Identificador asociado a external ad account.
   */
  @ApiProperty({
    description: 'Cuenta publicitaria en la plataforma',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalAdAccountId!: string;

  /**
   * Valor de identities mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [IdentityAssetDto],
    description: 'Identidades a importar',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentityAssetDto)
  identities?: IdentityAssetDto[];

  /**
   * Valor de checkpoint value mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Cursor de sincronización devuelto por la plataforma',
  })
  @IsOptional()
  @IsString()
  checkpointValue?: string;
}

/**
 * Define el contrato validado para platform connection response.
 */
export class PlatformConnectionResponseDto {
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
   * Valor de identities imported mantenido por la instancia.
   */
  @ApiProperty({ description: 'Identidades importadas por primera vez' })
  identitiesImported!: number;

  /**
   * Valor de identities updated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Identidades que ya existían y se actualizaron' })
  identitiesUpdated!: number;

  /**
   * Identificador asociado a sync run.
   */
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

/**
 * Define el contrato validado para placement.
 */
export class PlacementDto {
  /**
   * Valor de platform mantenido por la instancia.
   */
  @ApiProperty({ enum: AD_PLATFORMS })
  @IsIn(AD_PLATFORMS)
  platform!: AdPlatform;

  /**
   * Valor de position mantenido por la instancia.
   */
  @ApiProperty({ enum: PLACEMENT_POSITIONS })
  @IsIn(PLACEMENT_POSITIONS)
  position!: PlacementPosition;
}

/**
 * Define el contrato validado para creative asset.
 */
export class CreativeAssetDto {
  /**
   * Valor de asset type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['IMAGE', 'VIDEO'] })
  @IsIn(['IMAGE', 'VIDEO'])
  assetType!: 'IMAGE' | 'VIDEO';

  /**
   * Identificador asociado a file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  /**
   * Valor de hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Hash del archivo, para deduplicar' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  hash?: string;

  /**
   * Valor de width mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  /**
   * Valor de height mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;
}

/**
 * Define el contrato validado para launch creative.
 */
export class LaunchCreativeDto {
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de format mantenido por la instancia.
   */
  @ApiProperty({ enum: CREATIVE_FORMATS })
  @IsIn(CREATIVE_FORMATS)
  format!: CreativeFormat;

  /**
   * Valor de body mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  /**
   * Valor de link url mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  /**
   * Valor de object story json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Historia del creativo tal como la publica la plataforma',
  })
  @IsOptional()
  @IsObject()
  objectStoryJson?: Record<string, unknown>;

  /**
   * Identificador asociado a primary media file.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  primaryMediaFileId?: string;

  /**
   * Valor de assets mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [CreativeAssetDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreativeAssetDto)
  assets?: CreativeAssetDto[];
}

/**
 * Define el contrato validado para launch ad set.
 */
export class LaunchAdSetDto {
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de optimization goal mantenido por la instancia.
   */
  @ApiProperty({ enum: OPTIMIZATION_GOALS })
  @IsIn(OPTIMIZATION_GOALS)
  optimizationGoal!: OptimizationGoal;

  /**
   * Valor de billing event mantenido por la instancia.
   */
  @ApiProperty({ enum: AD_BILLING_EVENTS })
  @IsIn(AD_BILLING_EVENTS)
  billingEvent!: AdBillingEvent;

  /**
   * Valor de bid amount mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  bidAmount?: string;

  /**
   * Valor de daily budget mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  dailyBudget?: string;

  /**
   * Valor de lifetime budget mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  lifetimeBudget?: string;

  /**
   * Identificador asociado a targeting spec.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Segmentación ya guardada',
  })
  @IsOptional()
  @IsUUID()
  targetingSpecId?: string;

  /**
   * Valor de placements mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [PlacementDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlacementDto)
  placements?: PlacementDto[];

  /**
   * Valor de creative mantenido por la instancia.
   */
  @ApiProperty({ type: LaunchCreativeDto })
  @ValidateNested()
  @Type(() => LaunchCreativeDto)
  creative!: LaunchCreativeDto;

  /**
   * Valor de ad name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre del anuncio', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  adName!: string;
}

/** Cuerpo de `POST /ads/ad-accounts/{id}/campaigns/launch` (UC-43-04). */
export class LaunchCampaignDto {
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de objective mantenido por la instancia.
   */
  @ApiProperty({ enum: AD_OBJECTIVES })
  @IsIn(AD_OBJECTIVES)
  objective!: AdObjective;

  /**
   * Valor de buying type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['AUCTION', 'RESERVED'] })
  @IsIn(['AUCTION', 'RESERVED'])
  buyingType!: BuyingType;

  /**
   * Valor de bid strategy mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: BID_STRATEGIES })
  @IsOptional()
  @IsIn(BID_STRATEGIES)
  bidStrategy?: BidStrategy;

  /**
   * Valor de daily budget mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  dailyBudget?: string;

  /**
   * Valor de lifetime budget mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  lifetimeBudget?: string;

  /**
   * Valor de spend cap mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tope de gasto de la campaña' })
  @IsOptional()
  @IsNumberString()
  spendCap?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  /**
   * Valor de stop at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  stopAt?: string;

  /**
   * Valor de ad sets mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para launch campaign response.
 */
export class LaunchCampaignResponseDto {
  /**
   * Identificador asociado a campaign.
   */
  @ApiProperty({ format: 'uuid' })
  campaignId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid', description: 'La campaña nace pausada' })
  statusConceptId!: string;

  /**
   * Valor de ad set ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  adSetIds!: string[];

  /**
   * Valor de ad ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  adIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-43-05 · Segmentación e identidad
// ---------------------------------------------------------------------------

/** Origen de una audiencia personalizada. */
export type AudienceSource = 'PIXEL' | 'CUSTOMER_LIST' | 'ENGAGEMENT';
const AUDIENCE_SOURCES = ['PIXEL', 'CUSTOMER_LIST', 'ENGAGEMENT'] as const;

/**
 * Define el contrato validado para create custom audience.
 */
export class CreateCustomAudienceDto {
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @ApiProperty({ enum: AUDIENCE_SOURCES })
  @IsIn(AUDIENCE_SOURCES)
  source!: AudienceSource;

  /**
   * Valor de rule json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Regla que define la audiencia' })
  @IsOptional()
  @IsObject()
  ruleJson?: Record<string, unknown>;

  /**
   * Identificador asociado a data source pixel.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Pixel del que se alimenta',
  })
  @IsOptional()
  @IsUUID()
  dataSourcePixelId?: string;

  /**
   * Valor de lookalike ratio percent mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Porcentaje de similitud para derivar una audiencia lookalike',
  })
  @IsOptional()
  @IsNumberString()
  lookalikeRatioPercent?: string;

  /**
   * Identificador asociado a lookalike country concept.
   */
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
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  /**
   * Valor de geo locations json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Zonas geográficas incluidas' })
  @IsOptional()
  @IsObject()
  geoLocationsJson?: Record<string, unknown>;

  /**
   * Valor de excluded geo locations json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Zonas geográficas excluidas' })
  @IsOptional()
  @IsObject()
  excludedGeoLocationsJson?: Record<string, unknown>;

  /**
   * Valor de age min mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 13, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  ageMin?: number;

  /**
   * Valor de age max mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 13, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  ageMax?: number;

  /**
   * Valor de interests json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Intereses; nunca condiciones de salud' })
  @IsOptional()
  @IsObject()
  interestsJson?: Record<string, unknown>;

  /**
   * Valor de custom audience ids json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Audiencias personalizadas incluidas' })
  @IsOptional()
  @IsObject()
  customAudienceIdsJson?: Record<string, unknown>;

  /**
   * Valor de custom audience mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Audiencia personalizada a crear junto con la segmentación',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomAudienceDto)
  customAudience?: CreateCustomAudienceDto;
}

/**
 * Define el contrato validado para targeting response.
 */
export class TargetingResponseDto {
  /**
   * Identificador asociado a targeting spec.
   */
  @ApiProperty({ format: 'uuid' })
  targetingSpecId!: string;

  /**
   * Identificador asociado a custom audience.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  customAudienceId?: string;

  /**
   * Identificador asociado a lookalike spec.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  lookalikeSpecId?: string;
}

/** Cuerpo de `POST /ads/ad-sets/{id}/identity` (UC-43-05). */
export class AssignIdentityDto {
  /**
   * Identificador asociado a ad identity asset.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  adIdentityAssetId!: string;

  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['PRIMARY', 'SECONDARY'], default: 'PRIMARY' })
  @IsOptional()
  @IsIn(['PRIMARY', 'SECONDARY'])
  role?: 'PRIMARY' | 'SECONDARY';
}

/**
 * Define el contrato validado para assign identity response.
 */
export class AssignIdentityResponseDto {
  /**
   * Identificador asociado a assignment.
   */
  @ApiProperty({ format: 'uuid' })
  assignmentId!: string;

  /**
   * Identificador asociado a ad set.
   */
  @ApiProperty({ format: 'uuid' })
  adSetId!: string;

  /**
   * Identificador asociado a superseded assignment.
   */
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

/**
 * Define el contrato validado para field rule.
 */
export class FieldRuleDto {
  /**
   * Valor de event name pattern mantenido por la instancia.
   */
  @ApiProperty({ description: 'Patrón del nombre del evento', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  eventNamePattern!: string;

  /**
   * Valor de field path mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Ruta del campo dentro del evento',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  fieldPath!: string;

  /**
   * Valor de action mantenido por la instancia.
   */
  @ApiProperty({ enum: FIELD_ACTIONS })
  @IsIn(FIELD_ACTIONS)
  action!: FieldAction;

  /**
   * Valor de transformation mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['SHA256', 'TRUNCATE'] })
  @IsOptional()
  @IsIn(['SHA256', 'TRUNCATE'])
  transformation?: 'SHA256' | 'TRUNCATE';

  /**
   * Valor de rationale mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Por qué existe la regla' })
  @IsOptional()
  @IsString()
  rationale?: string;
}

/** Cuerpo de `POST /ads/event-data-policies` (UC-43-06). */
export class CreateEventPolicyDto {
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
    description: 'Código de la política, único por tenant',
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
   * Valor de jurisdiction mantenido por la instancia.
   */
  @ApiProperty({ enum: ['BO', 'EU', 'US'] })
  @IsIn(['BO', 'EU', 'US'])
  jurisdiction!: Jurisdiction;

  /**
   * Valor de purpose of use mantenido por la instancia.
   */
  @ApiProperty({ enum: ['MARKETING', 'ANALYTICS'] })
  @IsIn(['MARKETING', 'ANALYTICS'])
  purposeOfUse!: AdPurpose;

  /**
   * Valor de requires consent mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresConsent?: boolean;

  /**
   * Valor de default action mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['ALLOW', 'BLOCK'],
    description: 'Qué hacer con un campo que ninguna regla contempla',
  })
  @IsIn(['ALLOW', 'BLOCK'])
  defaultAction!: 'ALLOW' | 'BLOCK';

  /**
   * Valor de prohibited data classes json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Clases de dato prohibidas (p. ej. datos de salud)',
  })
  @IsOptional()
  @IsObject()
  prohibitedDataClassesJson?: Record<string, unknown>;

  /**
   * Valor de field rules mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para event policy response.
 */
export class EventPolicyResponseDto {
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

  /**
   * Valor de field rule ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  fieldRuleIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-43-07 · Ingesta de entrega
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para insight row.
 */
export class InsightRowDto {
  /**
   * Valor de entity type mantenido por la instancia.
   */
  @ApiProperty({ enum: AD_ENTITY_TYPES })
  @IsIn(AD_ENTITY_TYPES)
  entityType!: AdEntityType;

  /**
   * Identificador asociado a entity ref.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Entidad local a la que corresponde la fila',
  })
  @IsUUID()
  entityRefId!: string;

  /**
   * Identificador asociado a external object.
   */
  @ApiProperty({
    description: 'Identificador del objeto en la plataforma',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalObjectId!: string;

  /**
   * Valor de stat date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date', description: 'Día de la métrica' })
  @IsISO8601()
  statDate!: string;

  /**
   * Valor de impressions mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  impressions?: string;

  /**
   * Valor de clicks mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  clicks?: string;

  /**
   * Valor de spend mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  spend?: string;

  /**
   * Valor de conversions mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  conversions?: string;

  /**
   * Valor de conversion value mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  conversionValue?: string;
}

/** Cuerpo de `POST /ads/ingest/insights` (UC-43-07). */
export class IngestInsightsDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a ad account.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  adAccountId!: string;

  /**
   * Identificador asociado a platform connection.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  platformConnectionId!: string;

  /**
   * Valor de date start mantenido por la instancia.
   */
  @ApiProperty({ format: 'date' })
  @IsISO8601()
  dateStart!: string;

  /**
   * Valor de date end mantenido por la instancia.
   */
  @ApiProperty({ format: 'date' })
  @IsISO8601()
  dateEnd!: string;

  /**
   * Valor de rows mantenido por la instancia.
   */
  @ApiProperty({
    type: [InsightRowDto],
    description: 'Filas de métricas del lote',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InsightRowDto)
  rows!: InsightRowDto[];

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Moneda de los importes',
  })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de record billing event mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Registrar el gasto también como evento de facturación',
  })
  @IsOptional()
  @IsBoolean()
  recordBillingEvent?: boolean;
}

/**
 * Define el contrato validado para ingest insights response.
 */
export class IngestInsightsResponseDto {
  /**
   * Identificador asociado a insight query run.
   */
  @ApiProperty({ format: 'uuid' })
  insightQueryRunId!: string;

  /**
   * Valor de fact rows mantenido por la instancia.
   */
  @ApiProperty({ description: 'Filas de hecho insertadas' })
  factRows!: number;

  /**
   * Valor de rollups created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Rollups diarios creados' })
  rollupsCreated!: number;

  /**
   * Valor de rollups updated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Rollups diarios reescritos' })
  rollupsUpdated!: number;

  /**
   * Valor de amount spent mantenido por la instancia.
   */
  @ApiProperty({ description: 'Gasto acumulado de la cuenta tras el lote' })
  amountSpent!: string;

  /**
   * Valor de spend cap reached mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el gasto alcanzó el tope de la cuenta' })
  spendCapReached!: boolean;
}

// ---------------------------------------------------------------------------
// UC-43-08 · Conversión server-side
// ---------------------------------------------------------------------------

/** Dónde ocurrió la conversión. */
export type ActionSource = 'WEBSITE' | 'APP' | 'SERVER' | 'OFFLINE';
const ACTION_SOURCES = ['WEBSITE', 'APP', 'SERVER', 'OFFLINE'] as const;

/**
 * Define el contrato validado para conversion user data.
 */
export class ConversionUserDataDto {
  /**
   * Valor de external user id hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Identificador de usuario ya hasheado (SHA-256)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalUserIdHash?: string;

  /**
   * Identificador asociado a click.
   */
  @ApiPropertyOptional({
    description: 'Identificador del click de la plataforma',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  clickId?: string;

  /**
   * Identificador asociado a browser.
   */
  @ApiPropertyOptional({ description: 'Identificador del navegador' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  browserId?: string;

  /**
   * Valor de client ip address mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'IP del cliente; se persiste cifrada' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientIpAddress?: string;

  /**
   * Valor de client user agent mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'User-agent del cliente; se persiste cifrado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clientUserAgent?: string;
}

/**
 * Define el contrato validado para conversion custom data.
 */
export class ConversionCustomDataDto {
  /**
   * Valor de currency code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  /**
   * Valor de value amount mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  valueAmount?: string;

  /**
   * Valor de content ids json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Productos implicados' })
  @IsOptional()
  @IsObject()
  contentIdsJson?: Record<string, unknown>;

  /**
   * Valor de num items mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  numItems?: number;

  /**
   * Identificador asociado a order.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  orderId?: string;
}

/** Cuerpo de `POST /ads/datasets/{id}/events` (UC-43-08). */
export class SendConversionDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre del evento', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  eventName!: string;

  /**
   * Identificador asociado a event.
   */
  @ApiProperty({
    description:
      'Identificador del evento; con él se deduplica navegador contra servidor',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  eventId!: string;

  /**
   * Valor de event time mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  eventTime!: string;

  /**
   * Valor de action source mantenido por la instancia.
   */
  @ApiProperty({ enum: ACTION_SOURCES })
  @IsIn(ACTION_SOURCES)
  actionSource!: ActionSource;

  /**
   * Valor de event source url mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventSourceUrl?: string;

  /**
   * Identificador asociado a consent directive.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Directiva de consentimiento aplicable',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  /**
   * Identificador asociado a payment transaction.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  paymentTransactionId?: string;

  /**
   * Valor de user data mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: ConversionUserDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConversionUserDataDto)
  userData?: ConversionUserDataDto;

  /**
   * Valor de custom data mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: ConversionCustomDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConversionCustomDataDto)
  customData?: ConversionCustomDataDto;

  /**
   * Identificador asociado a platform connection.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Conexión a la que encolar la entrega del evento',
  })
  @IsOptional()
  @IsUUID()
  platformConnectionId?: string;
}

/**
 * Define el contrato validado para send conversion response.
 */
export class SendConversionResponseDto {
  /**
   * Identificador asociado a event.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ausente si el evento era duplicado',
  })
  eventId?: string;

  /**
   * Identificador asociado a processing status concept.
   */
  @ApiProperty({ format: 'uuid' })
  processingStatusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el evento ya se había recibido' })
  duplicate!: boolean;

  /**
   * Valor de blocked mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si la política de datos bloqueó el evento',
  })
  blocked!: boolean;

  /**
   * Valor de transformed fields mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    description: 'Campos que la política obligó a hashear o quitar',
  })
  transformedFields!: string[];
}

// ---------------------------------------------------------------------------
// UC-43-09 · Conversiones offline
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para offline event.
 */
export class OfflineEventDto {
  /**
   * Valor de event name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  eventName!: string;

  /**
   * Valor de event time mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  eventTime?: string;

  /**
   * Valor de match keys hash json mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Claves de coincidencia YA hasheadas; nunca datos en claro',
  })
  @IsObject()
  matchKeysHashJson!: Record<string, unknown>;

  /**
   * Valor de value amount mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  valueAmount?: string;

  /**
   * Valor de order ref mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  orderRef?: string;

  /**
   * Identificador asociado a attributed campaign ref.
   */
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
  /**
   * Identificador asociado a ad account.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  adAccountId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de upload source mantenido por la instancia.
   */
  @ApiProperty({ enum: ['FILE', 'API'] })
  @IsIn(['FILE', 'API'])
  uploadSource!: 'FILE' | 'API';

  /**
   * Identificador asociado a file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de events mantenido por la instancia.
   */
  @ApiProperty({ type: [OfflineEventDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OfflineEventDto)
  events!: OfflineEventDto[];
}

/**
 * Define el contrato validado para offline upload response.
 */
export class OfflineUploadResponseDto {
  /**
   * Identificador asociado a offline conversion set.
   */
  @ApiProperty({ format: 'uuid' })
  offlineConversionSetId!: string;

  /**
   * Valor de total events mantenido por la instancia.
   */
  @ApiProperty()
  totalEvents!: number;

  /**
   * Valor de matched events mantenido por la instancia.
   */
  @ApiProperty()
  matchedEvents!: number;

  /**
   * Valor de match rate mantenido por la instancia.
   */
  @ApiProperty({ description: 'Proporción de eventos emparejados' })
  matchRate!: string;

  /**
   * Valor de attributed value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor atribuido a los eventos emparejados' })
  attributedValue!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-43-10 · Experimentos
// ---------------------------------------------------------------------------

/** Métrica que decide el experimento. */
export type ObjectiveMetric = 'CPA' | 'ROAS' | 'CTR';
const OBJECTIVE_METRICS = ['CPA', 'ROAS', 'CTR'] as const;

/**
 * Define el contrato validado para experiment variant.
 */
export class ExperimentVariantDto {
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de variant ref type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['CAMPAIGN', 'AD_SET'] })
  @IsIn(['CAMPAIGN', 'AD_SET'])
  variantRefType!: 'CAMPAIGN' | 'AD_SET';

  /**
   * Identificador asociado a variant ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  variantRefId!: string;

  /**
   * Valor de traffic split percent mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Porcentaje de tráfico; la suma de las variantes debe dar 100',
  })
  @IsNumberString()
  trafficSplitPercent!: string;

  /**
   * Valor de is control mantenido por la instancia.
   */
  @ApiProperty({ description: 'Exactamente una variante es el control' })
  @IsBoolean()
  isControl!: boolean;
}

/** Cuerpo de `POST /ads/ad-accounts/{id}/experiments` (UC-43-10). */
export class CreateExperimentDto {
  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de experiment type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['AB_SPLIT', 'CBO'] })
  @IsIn(['AB_SPLIT', 'CBO'])
  experimentType!: 'AB_SPLIT' | 'CBO';

  /**
   * Valor de objective metric mantenido por la instancia.
   */
  @ApiProperty({ enum: OBJECTIVE_METRICS })
  @IsIn(OBJECTIVE_METRICS)
  objectiveMetric!: ObjectiveMetric;

  /**
   * Valor de hypothesis mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hypothesis?: string;

  /**
   * Valor de holdout percent mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Porcentaje reservado como grupo de control ciego',
  })
  @IsOptional()
  @IsNumberString()
  holdoutPercent?: string;

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

  /**
   * Valor de variants mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para experiment response.
 */
export class ExperimentResponseDto {
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
   * Valor de variant ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  variantIds!: string[];

  /**
   * Valor de entities activated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entidades que pasaron de pausadas a activas' })
  entitiesActivated!: number;
}

// ---------------------------------------------------------------------------
// UC-43-11 · Reglas automatizadas
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ads/automated-rules/{id}/evaluate` (UC-43-11). */
@ApiSchema({ name: 'AdsEvaluateRuleDto' })
export class EvaluateRuleDto {
  /**
   * Valor de matched entity ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'Entidades que el evaluador determinó que cumplen la condición',
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  matchedEntityIds!: string[];

  /**
   * Valor de new daily budget mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Nuevo presupuesto diario cuando la acción es ajustar presupuesto',
  })
  @IsOptional()
  @IsNumberString()
  newDailyBudget?: string;

  /**
   * Valor de new bid amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nueva puja cuando la acción es ajustar puja',
  })
  @IsOptional()
  @IsNumberString()
  newBidAmount?: string;
}

/**
 * Define el contrato validado para evaluate rule response.
 */
export class EvaluateRuleResponseDto {
  /**
   * Identificador asociado a rule execution.
   */
  @ApiProperty({ format: 'uuid' })
  ruleExecutionId!: string;

  /**
   * Valor de entities evaluated mantenido por la instancia.
   */
  @ApiProperty()
  entitiesEvaluated!: number;

  /**
   * Valor de entities affected mantenido por la instancia.
   */
  @ApiProperty()
  entitiesAffected!: number;

  /**
   * Identificador asociado a status concept.
   */
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
  /**
   * Valor de review event type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['INITIAL', 'RE_REVIEW', 'APPEAL_DECISION'] })
  @IsIn(['INITIAL', 'RE_REVIEW', 'APPEAL_DECISION'])
  reviewEventType!: 'INITIAL' | 'RE_REVIEW' | 'APPEAL_DECISION';

  /**
   * Valor de review status mantenido por la instancia.
   */
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'DISAPPROVED'] })
  @IsIn(['PENDING', 'APPROVED', 'DISAPPROVED'])
  reviewStatus!: 'PENDING' | 'APPROVED' | 'DISAPPROVED';

  /**
   * Identificador asociado a external review.
   */
  @ApiPropertyOptional({
    description:
      'Identificador de la revisión en la plataforma; hace idempotente el webhook',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalReviewId?: string;

  /**
   * Valor de reasons json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivos que devuelve la plataforma' })
  @IsOptional()
  @IsObject()
  reasonsJson?: Record<string, unknown>;

  /**
   * Valor de source payload hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del payload recibido, para trazabilidad',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sourcePayloadHash?: string;

  /**
   * Valor de policy code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código de la política incumplida',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyCode?: string;

  /**
   * Valor de policy category mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: POLICY_CATEGORIES })
  @IsOptional()
  @IsIn(POLICY_CATEGORIES)
  policyCategory?: PolicyCategory;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';

  /**
   * Valor de explanation mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;
}

/**
 * Define el contrato validado para review event response.
 */
export class ReviewEventResponseDto {
  /**
   * Identificador asociado a review event.
   */
  @ApiProperty({ format: 'uuid' })
  reviewEventId!: string;

  /**
   * Identificador asociado a violation.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Infracción abierta, si el anuncio se rechazó',
  })
  violationId?: string;

  /**
   * Identificador asociado a effective status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado efectivo en el que queda el anuncio',
  })
  effectiveStatusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el evento ya se había recibido' })
  duplicate!: boolean;
}

/** Cuerpo de `POST /ads/policy-violations/{id}/appeals` (UC-43-12). */
export class SubmitAppealDto {
  /**
   * Valor de appeal reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Argumento de la apelación' })
  @IsString()
  appealReason!: string;

  /**
   * Identificador asociado a evidence file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Evidencia adjunta en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;
}

/**
 * Define el contrato validado para appeal response.
 */
export class AppealResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a ad policy violation.
   */
  @ApiProperty({ format: 'uuid' })
  adPolicyViolationId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-43-13 · Catálogo
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para feed item.
 */
export class FeedItemDto {
  /**
   * Identificador asociado a retailer product.
   */
  @ApiProperty({
    description: 'Identificador del producto en el comercio',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  retailerProductId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Valor de availability mantenido por la instancia.
   */
  @ApiProperty({ enum: ['IN_STOCK', 'OUT_OF_STOCK'] })
  @IsIn(['IN_STOCK', 'OUT_OF_STOCK'])
  availability!: 'IN_STOCK' | 'OUT_OF_STOCK';

  /**
   * Valor de condition mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['NEW', 'REFURBISHED'], default: 'NEW' })
  @IsOptional()
  @IsIn(['NEW', 'REFURBISHED'])
  condition?: 'NEW' | 'REFURBISHED';

  /**
   * Valor de price mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  price?: string;

  /**
   * Valor de brand mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  brand?: string;

  /**
   * Valor de image url mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  /**
   * Valor de link url mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  /**
   * Valor de inventory count mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryCount?: number;
}

/** Cuerpo de `POST /ads/catalogs/{id}/feeds/{feedId}/run` (UC-43-13). */
export class RunFeedDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [FeedItemDto], description: 'Ítems leídos del feed' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeedItemDto)
  items!: FeedItemDto[];

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/**
 * Define el contrato validado para feed run response.
 */
export class FeedRunResponseDto {
  /**
   * Identificador asociado a feed run log.
   */
  @ApiProperty({ format: 'uuid' })
  feedRunLogId!: string;

  /**
   * Valor de items read mantenido por la instancia.
   */
  @ApiProperty()
  itemsRead!: number;

  /**
   * Valor de items created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Productos creados' })
  itemsCreated!: number;

  /**
   * Valor de items updated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Productos actualizados' })
  itemsUpdated!: number;

  /**
   * Valor de set memberships added mantenido por la instancia.
   */
  @ApiProperty({ description: 'Miembros añadidos a conjuntos dinámicos' })
  setMembershipsAdded!: number;

  /**
   * Valor de catalog item count mantenido por la instancia.
   */
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
  /**
   * Valor de invoice number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de factura, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  invoiceNumber!: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @ApiProperty({ format: 'date' })
  @IsISO8601()
  periodStart!: string;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @ApiProperty({ format: 'date' })
  @IsISO8601()
  periodEnd!: string;

  /**
   * Valor de tax percentage mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Porcentaje de impuesto sobre el subtotal',
    default: '0',
  })
  @IsOptional()
  @IsNumberString()
  taxPercentage?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/**
 * Define el contrato validado para ad invoice response.
 */
export class AdInvoiceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de invoice number mantenido por la instancia.
   */
  @ApiProperty()
  invoiceNumber!: string;

  /**
   * Valor de subtotal mantenido por la instancia.
   */
  @ApiProperty({ description: 'Suma de las líneas' })
  subtotal!: string;

  /**
   * Valor de tax total mantenido por la instancia.
   */
  @ApiProperty()
  taxTotal!: string;

  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty()
  total!: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({ description: 'Líneas emitidas, una por campaña con gasto' })
  lines!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-43-15 · Leads
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para lead answer.
 */
export class LeadAnswerDto {
  /**
   * Valor de question key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave de la pregunta del formulario',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  questionKey!: string;

  /**
   * Valor de answer mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Respuesta; se persiste cifrada' })
  @IsOptional()
  @IsString()
  answer?: string;
}

/** Cuerpo de `POST /ads/lead-forms/{id}/submissions` (UC-43-15). */
export class SubmitLeadDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a external lead.
   */
  @ApiProperty({
    description:
      'Identificador del lead en la plataforma; hace idempotente el webhook',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  externalLeadId!: string;

  /**
   * Identificador asociado a ad.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adId?: string;

  /**
   * Identificador asociado a ad set.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adSetId?: string;

  /**
   * Identificador asociado a campaign.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  /**
   * Identificador asociado a consent directive.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Consentimiento capturado con el lead',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  /**
   * Valor de raw payload hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Hash del payload recibido' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  rawPayloadHash?: string;

  /**
   * Valor de source ip mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'IP de origen; se guarda hasheada' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceIp?: string;

  /**
   * Valor de answers mantenido por la instancia.
   */
  @ApiProperty({ type: [LeadAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeadAnswerDto)
  answers!: LeadAnswerDto[];
}

/**
 * Define el contrato validado para lead submission response.
 */
export class LeadSubmissionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a processing status concept.
   */
  @ApiProperty({ format: 'uuid' })
  processingStatusConceptId!: string;

  /**
   * Valor de answers stored mantenido por la instancia.
   */
  @ApiProperty({ description: 'Respuestas registradas' })
  answersStored!: number;

  /**
   * Valor de answers ignored mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Respuestas descartadas por no corresponder a ninguna pregunta',
  })
  answersIgnored!: number;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el lead ya se había recibido' })
  duplicate!: boolean;

  /**
   * Identificador asociado a delivery event.
   */
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
  /**
   * Valor de budget type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['DAILY', 'LIFETIME'] })
  @IsIn(['DAILY', 'LIFETIME'])
  budgetType!: 'DAILY' | 'LIFETIME';

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe del tramo' })
  @IsNumberString()
  amount!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  currencyConceptId!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  validFrom!: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Sin fin, el tramo queda abierto',
  })
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  /**
   * Valor de bid amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nueva puja a aplicar junto con el presupuesto',
  })
  @IsOptional()
  @IsNumberString()
  bidAmount?: string;

  /**
   * Valor de click window days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Ventana de atribución por click, en días',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  clickWindowDays?: number;

  /**
   * Valor de view window days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Ventana de atribución por impresión, en días',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  viewWindowDays?: number;
}

/**
 * Define el contrato validado para budget schedule response.
 */
export class BudgetScheduleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a ad set.
   */
  @ApiProperty({ format: 'uuid' })
  adSetId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty()
  amount!: string;

  /**
   * Valor de learning reset mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si el cambio reinició la fase de aprendizaje del conjunto',
  })
  learningReset!: boolean;

  /**
   * Identificador asociado a learning snapshot.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  learningSnapshotId?: string;
}
