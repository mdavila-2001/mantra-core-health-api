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

/** Tipo de miembro que participa en un programa de recompensas. */
export type RewardMemberType = 'USER' | 'PATIENT';
const REWARD_MEMBER_TYPES = ['USER', 'PATIENT'] as const;

/** Naturaleza de la recompensa. */
export type AwardType = 'POINTS' | 'WALLET_CREDIT';
const AWARD_TYPES = ['POINTS', 'WALLET_CREDIT'] as const;

// ---------------------------------------------------------------------------
// UC-51-01 · Programa de lealtad
// ---------------------------------------------------------------------------

/** Tipo de programa de lealtad. */
export type LoyaltyProgramType = 'POINTS' | 'TIERED';

/** Política de vencimiento de los puntos. */
export type ExpiryPolicy = 'NEVER' | 'ROLLING';

/**
 * Define el contrato validado para loyalty tier.
 */
export class LoyaltyTierDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
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
   * Valor de min points mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Puntos de por vida a partir de los cuales aplica el nivel',
  })
  @IsNumberString()
  minPoints!: string;

  /**
   * Valor de multiplier mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Multiplicador de acumulación del nivel',
  })
  @IsOptional()
  @IsNumberString()
  multiplier?: string;

  /**
   * Valor de benefits json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Beneficios del nivel' })
  @IsOptional()
  @IsObject()
  benefitsJson?: Record<string, unknown>;
}

/** Evento de la aplicación que dispara una acumulación. */
export type AppEvent =
  'BOOKING_COMPLETED' | 'COURSE_COMPLETED' | 'REVIEW_POSTED' | 'STREAK';
const APP_EVENTS = [
  'BOOKING_COMPLETED',
  'COURSE_COMPLETED',
  'REVIEW_POSTED',
  'STREAK',
] as const;

/** Periodo sobre el que se cuenta el tope de una regla. */
export type CapPeriod = 'DAY' | 'WEEK' | 'MONTH';
const CAP_PERIODS = ['DAY', 'WEEK', 'MONTH'] as const;

/**
 * Define el contrato validado para earning rule.
 */
export class EarningRuleDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
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
   * Valor de event type mantenido por la instancia.
   */
  @ApiProperty({ enum: APP_EVENTS })
  @IsIn(APP_EVENTS)
  eventType!: AppEvent;

  /**
   * Valor de award type mantenido por la instancia.
   */
  @ApiProperty({ enum: AWARD_TYPES })
  @IsIn(AWARD_TYPES)
  awardType!: AwardType;

  /**
   * Valor de points amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Puntos que otorga; obligatorio si el premio es POINTS',
  })
  @IsOptional()
  @IsNumberString()
  pointsAmount?: string;

  /**
   * Valor de credit amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Crédito que otorga; obligatorio si el premio es WALLET_CREDIT',
  })
  @IsOptional()
  @IsNumberString()
  creditAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Condición adicional evaluada por el worker',
  })
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;

  /**
   * Valor de cap per period mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Máximo de acumulaciones por periodo' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capPerPeriod?: number;

  /**
   * Valor de cap period mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: CAP_PERIODS })
  @IsOptional()
  @IsIn(CAP_PERIODS)
  capPeriod?: CapPeriod;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

/** Cuerpo de `POST /loyalty/programs` (UC-51-01). */
export class CreateLoyaltyProgramDto {
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
    description: 'Código del programa, único por tenant',
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
   * Valor de program type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['POINTS', 'TIERED'] })
  @IsIn(['POINTS', 'TIERED'])
  programType!: LoyaltyProgramType;

  /**
   * Valor de points currency name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nombre de la moneda de puntos ("Estrellas")',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pointsCurrencyName?: string;

  /**
   * Valor de point to currency rate mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Cuánto vale un punto en moneda, como cadena decimal',
  })
  @IsOptional()
  @IsNumberString()
  pointToCurrencyRate?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de expiry policy mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ['NEVER', 'ROLLING'], default: 'NEVER' })
  @IsOptional()
  @IsIn(['NEVER', 'ROLLING'])
  expiryPolicy?: ExpiryPolicy;

  /**
   * Valor de points expiry days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Días de vigencia de los puntos; obligatorio si la política es ROLLING',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  pointsExpiryDays?: number;

  /**
   * Valor de tiers mantenido por la instancia.
   */
  @ApiProperty({
    type: [LoyaltyTierDto],
    description: 'Niveles del programa, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LoyaltyTierDto)
  tiers!: LoyaltyTierDto[];

  /**
   * Valor de earning rules mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [EarningRuleDto],
    description: 'Reglas de acumulación',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EarningRuleDto)
  earningRules?: EarningRuleDto[];
}

/**
 * Define el contrato validado para loyalty program response.
 */
export class LoyaltyProgramResponseDto {
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
   * Valor de tier ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Niveles creados, de menor a mayor umbral',
  })
  tierIds!: string[];

  /**
   * Valor de earning rule ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  earningRuleIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-51-02 · Inscripción
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /loyalty/programs/{id}/memberships` (UC-51-02). */
export class EnrollMemberDto {
  /**
   * Valor de member type mantenido por la instancia.
   */
  @ApiProperty({ enum: REWARD_MEMBER_TYPES })
  @IsIn(REWARD_MEMBER_TYPES)
  memberType!: RewardMemberType;

  /**
   * Identificador asociado a member ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberRefId!: string;

  /**
   * Valor de signup bonus points mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Puntos de bienvenida a acreditar con el alta',
  })
  @IsOptional()
  @IsNumberString()
  signupBonusPoints?: string;
}

/**
 * Define el contrato validado para membership response.
 */
export class MembershipResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a current tier.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  currentTierId?: string;

  /**
   * Valor de points balance mantenido por la instancia.
   */
  @ApiProperty({ description: 'Saldo de puntos' })
  pointsBalance!: string;

  /**
   * Valor de lifetime points mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntos acumulados de por vida' })
  lifetimePoints!: string;

  /**
   * Valor de already enrolled mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si ya estaba inscrito: la inscripción es idempotente',
  })
  alreadyEnrolled!: boolean;
}

// ---------------------------------------------------------------------------
// UC-51-03 / UC-51-04 · Ledger de puntos
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /loyalty/memberships/{id}/points:earn` (UC-51-03). */
export class EarnPointsDto {
  /**
   * Identificador asociado a earning rule.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Regla que justifica la acumulación',
  })
  @IsUUID()
  earningRuleId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Clave de idempotencia; un reintento con la misma clave no acumula dos veces',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  /**
   * Valor de source type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo del origen del evento',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceType?: string;

  /**
   * Identificador asociado a source ref.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Identificador del evento de origen',
  })
  @IsOptional()
  @IsUUID()
  sourceRefId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo ocurrió el evento',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

/** Cuerpo de `POST /loyalty/memberships/{id}/points:redeem` (UC-51-04). */
export class RedeemPointsDto {
  /**
   * Valor de points mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntos a canjear' })
  @IsNumberString()
  points!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave de idempotencia del canje',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  /**
   * Valor de award type mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: AWARD_TYPES, default: 'POINTS' })
  @IsOptional()
  @IsIn(AWARD_TYPES)
  awardType?: AwardType;
}

/**
 * Define el contrato validado para points ledger response.
 */
export class PointsLedgerResponseDto {
  /**
   * Identificador asociado a ledger entry.
   */
  @ApiProperty({ format: 'uuid', description: 'Entrada del ledger' })
  ledgerEntryId!: string;

  /**
   * Identificador asociado a membership.
   */
  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  /**
   * Valor de points mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntos del movimiento' })
  points!: string;

  /**
   * Valor de balance after mantenido por la instancia.
   */
  @ApiProperty({ description: 'Saldo tras el movimiento' })
  balanceAfter!: string;

  /**
   * Valor de lifetime points mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntos de por vida tras el movimiento' })
  lifetimePoints!: string;

  /**
   * Identificador asociado a current tier.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Nivel actual tras recalcular',
  })
  currentTierId?: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si la clave de idempotencia ya se había usado',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-51-05 · Recomputo
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para recompute balance response.
 */
export class RecomputeBalanceResponseDto {
  /**
   * Identificador asociado a membership.
   */
  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  /**
   * Valor de points balance mantenido por la instancia.
   */
  @ApiProperty({ description: 'Saldo reproyectado desde el ledger' })
  pointsBalance!: string;

  /**
   * Valor de lifetime points mantenido por la instancia.
   */
  @ApiProperty()
  lifetimePoints!: string;

  /**
   * Identificador asociado a current tier.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  currentTierId?: string;

  /**
   * Valor de tier changed mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el nivel cambió al recalcular' })
  tierChanged!: boolean;
}

// ---------------------------------------------------------------------------
// UC-51-06 · Expiración
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /loyalty/jobs/expire-points` (UC-51-06). */
export class ExpirePointsDto {
  /**
   * Identificador asociado a loyalty program.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Programa cuyas membresías se barren',
  })
  @IsUUID()
  loyaltyProgramId!: string;

  /**
   * Valor de batch size mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tamaño del lote', default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  batchSize?: number;
}

/**
 * Define el contrato validado para expire points response.
 */
export class ExpirePointsResponseDto {
  /**
   * Valor de scanned mantenido por la instancia.
   */
  @ApiProperty({ description: 'Membresías revisadas en este lote' })
  scanned!: number;

  /**
   * Valor de affected mantenido por la instancia.
   */
  @ApiProperty({ description: 'Membresías a las que se les expiraron puntos' })
  affected!: number;

  /**
   * Valor de points expired mantenido por la instancia.
   */
  @ApiProperty({ description: 'Total de puntos expirados' })
  pointsExpired!: string;
}

/** Query de `GET /loyalty/programs` (descubrimiento de programas activos). */
export class ListActiveLoyaltyProgramsQueryDto {
  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tamaño máximo del lote', default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}

/**
 * Resumen de un programa activo para el descubrimiento del worker de
 * UC-51-06: `expire-points` exige un `loyaltyProgramId` puntual y no existía
 * una consulta para listar qué programas barrer.
 */
export class ActiveLoyaltyProgramSummaryDto {
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
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;
}

/** Respuesta de `GET /loyalty/programs` filtrado por estado activo. */
export class ListActiveLoyaltyProgramsResponseDto {
  /**
   * Valor de programs mantenido por la instancia.
   */
  @ApiProperty({ type: [ActiveLoyaltyProgramSummaryDto] })
  programs!: ActiveLoyaltyProgramSummaryDto[];
}

// ---------------------------------------------------------------------------
// UC-51-07 · Promoción
// ---------------------------------------------------------------------------

/** Tipo de promoción: automática o condicionada a cupón. */
export type PromotionType = 'AUTOMATIC' | 'COUPON';

/** Forma del descuento. */
export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'BOGO';
const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED', 'BOGO'] as const;

/** Sobre qué se aplica el descuento. */
export type DiscountTarget = 'ORDER' | 'ITEM' | 'CATEGORY';
const DISCOUNT_TARGETS = ['ORDER', 'ITEM', 'CATEGORY'] as const;

/**
 * Define el contrato validado para discount rule.
 */
export class DiscountRuleDto {
  /**
   * Valor de discount type mantenido por la instancia.
   */
  @ApiProperty({ enum: DISCOUNT_TYPES })
  @IsIn(DISCOUNT_TYPES)
  discountType!: DiscountType;

  /**
   * Valor de percentage mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Porcentaje 0-100; obligatorio si el tipo es PERCENTAGE',
  })
  @IsOptional()
  @IsNumberString()
  percentage?: string;

  /**
   * Valor de fixed amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Importe fijo; obligatorio si el tipo es FIXED',
  })
  @IsOptional()
  @IsNumberString()
  fixedAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de max discount amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tope del descuento resultante' })
  @IsOptional()
  @IsNumberString()
  maxDiscountAmount?: string;

  /**
   * Valor de min purchase amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Compra mínima para que la regla aplique',
  })
  @IsOptional()
  @IsNumberString()
  minPurchaseAmount?: string;

  /**
   * Valor de applies to mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: DISCOUNT_TARGETS })
  @IsOptional()
  @IsIn(DISCOUNT_TARGETS)
  appliesTo?: DiscountTarget;

  /**
   * Valor de target filter json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Filtro de los ítems alcanzados' })
  @IsOptional()
  @IsObject()
  targetFilterJson?: Record<string, unknown>;

  /**
   * Valor de buy quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Unidades a comprar; obligatorio si el tipo es BOGO',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  buyQuantity?: number;

  /**
   * Valor de get quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Unidades bonificadas; obligatorio si el tipo es BOGO',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  getQuantity?: number;
}

/** Cuerpo de `POST /promotions` (UC-51-07). */
export class CreatePromotionDto {
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
    description: 'Código de la promoción, único por tenant',
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
   * Valor de promotion type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['AUTOMATIC', 'COUPON'] })
  @IsIn(['AUTOMATIC', 'COUPON'])
  promotionType!: PromotionType;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Identificador asociado a campaign ref.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Campaña de marketing asociada',
  })
  @IsOptional()
  @IsUUID()
  campaignRefId?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Prioridad frente a promociones que se solapan',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  /**
   * Valor de stackable mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: '¿Puede combinarse con otras promociones?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  /**
   * Valor de budget amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Presupuesto total de descuento' })
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
   * Valor de total redemption limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Redenciones totales permitidas' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalRedemptionLimit?: number;

  /**
   * Valor de per user limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Redenciones permitidas por usuario' })
  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  validFrom!: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  validTo!: string;

  /**
   * Valor de rules mantenido por la instancia.
   */
  @ApiProperty({
    type: [DiscountRuleDto],
    description: 'Reglas de descuento, al menos una',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DiscountRuleDto)
  rules!: DiscountRuleDto[];
}

/**
 * Define el contrato validado para promotion response.
 */
export class PromotionResponseDto {
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

  /**
   * Valor de rule ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  ruleIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-51-08 · Cupones
// ---------------------------------------------------------------------------

/** Naturaleza del cupón. */
export type CouponType = 'PUBLIC' | 'SINGLE_USE' | 'PERSONAL' | 'BATCH';
const COUPON_TYPES = ['PUBLIC', 'SINGLE_USE', 'PERSONAL', 'BATCH'] as const;

/** Cuerpo de `POST /promotions/{id}/coupons:batch` (UC-51-08). */
export class IssueCouponsDto {
  /**
   * Valor de coupon type mantenido por la instancia.
   */
  @ApiProperty({ enum: COUPON_TYPES })
  @IsIn(COUPON_TYPES)
  couponType!: CouponType;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cupones a emitir', minimum: 1, maximum: 1000 })
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;

  /**
   * Valor de code prefix mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Prefijo del código generado',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codePrefix?: string;

  /**
   * Valor de max redemptions mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Redenciones permitidas por cupón',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  /**
   * Valor de assigned member type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: REWARD_MEMBER_TYPES,
    description: 'Sólo para cupones PERSONAL',
  })
  @IsOptional()
  @IsIn(REWARD_MEMBER_TYPES)
  assignedMemberType?: RewardMemberType;

  /**
   * Identificador asociado a assigned member ref.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sólo para cupones PERSONAL',
  })
  @IsOptional()
  @IsUUID()
  assignedMemberRefId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

/**
 * Define el contrato validado para issue coupons response.
 */
export class IssueCouponsResponseDto {
  /**
   * Identificador asociado a promotion.
   */
  @ApiProperty({ format: 'uuid' })
  promotionId!: string;

  /**
   * Valor de issued mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cupones emitidos' })
  issued!: number;

  /**
   * Valor de codes mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Códigos generados' })
  codes!: string[];
}

// ---------------------------------------------------------------------------
// UC-51-09 · Validación y redención
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /coupons:validate` (UC-51-09). */
export class ValidateCouponDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del cupón', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de order amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Importe de la orden, como cadena decimal' })
  @IsNumberString()
  orderAmount!: string;

  /**
   * Valor de redeemer type mantenido por la instancia.
   */
  @ApiProperty({ enum: REWARD_MEMBER_TYPES })
  @IsIn(REWARD_MEMBER_TYPES)
  redeemerType!: RewardMemberType;

  /**
   * Identificador asociado a redeemer ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  redeemerRefId!: string;
}

/**
 * Define el contrato validado para validate coupon response.
 */
export class ValidateCouponResponseDto {
  /**
   * Valor de valid mantenido por la instancia.
   */
  @ApiProperty({ description: '¿El cupón puede usarse en esta orden?' })
  valid!: boolean;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Motivo del rechazo cuando no es válido',
  })
  reason?: string;

  /**
   * Identificador asociado a promotion.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  promotionId?: string;

  /**
   * Identificador asociado a discount rule.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Regla que da el mejor descuento',
  })
  discountRuleId?: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Descuento que se aplicaría' })
  discountAmount?: string;
}

/** Cuerpo de `POST /redemptions` (UC-51-09). */
export class CreateRedemptionDto extends ValidateCouponDto {
  /**
   * Valor de order ref type mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tipo de la orden', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderRefType?: string;

  /**
   * Identificador asociado a order ref.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  orderRefId?: string;

  /**
   * Identificador asociado a payment intent.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  paymentIntentId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/**
 * Define el contrato validado para redemption response.
 */
export class RedemptionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a promotion.
   */
  @ApiProperty({ format: 'uuid' })
  promotionId!: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Descuento aplicado' })
  discountAmount!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-51-10 · Descuento en checkout
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /checkout/{orderId}/apply-discount` (UC-51-10). */
export class ApplyDiscountDto {
  /**
   * Identificador asociado a payment intent.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Intento de pago sobre el que se descuenta',
  })
  @IsUUID()
  paymentIntentId!: string;

  /**
   * Valor de order amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe bruto del intento, como cadena decimal',
  })
  @IsNumberString()
  orderAmount!: string;

  /**
   * Valor de redeemer type mantenido por la instancia.
   */
  @ApiProperty({ enum: REWARD_MEMBER_TYPES })
  @IsIn(REWARD_MEMBER_TYPES)
  redeemerType!: RewardMemberType;

  /**
   * Identificador asociado a redeemer ref.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  redeemerRefId!: string;

  /**
   * Valor de coupon code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código del cupón cuando el descuento lo exige',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  couponCode?: string;

  /**
   * Identificador asociado a promotion.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Promoción automática a aplicar',
  })
  @IsOptional()
  @IsUUID()
  promotionId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

/**
 * Define el contrato validado para apply discount response.
 */
export class ApplyDiscountResponseDto {
  /**
   * Identificador asociado a redemption.
   */
  @ApiProperty({ format: 'uuid' })
  redemptionId!: string;

  /**
   * Identificador asociado a payment intent.
   */
  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Descuento aplicado' })
  discountAmount!: string;

  /**
   * Valor de net amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe neto resultante para el intento de pago',
  })
  netAmount!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el descuento ya estaba aplicado a este intento',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-51-11 · Reversa
// ---------------------------------------------------------------------------

/** Motivo por el que se revierte una redención. */
export type ReverseReason = 'REFUND' | 'CANCEL';

/** Cuerpo de `POST /redemptions/{id}:reverse` (UC-51-11). */
export class ReverseRedemptionDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ enum: ['REFUND', 'CANCEL'] })
  @IsIn(['REFUND', 'CANCEL'])
  reason!: ReverseReason;

  /**
   * Identificador asociado a membership.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Membresía a la que devolver los puntos, si la redención fue por puntos',
  })
  @IsOptional()
  @IsUUID()
  membershipId?: string;

  /**
   * Valor de restore points mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Puntos a restituir' })
  @IsOptional()
  @IsNumberString()
  restorePoints?: string;
}

/**
 * Define el contrato validado para reverse redemption response.
 */
export class ReverseRedemptionResponseDto {
  /**
   * Identificador asociado a redemption.
   */
  @ApiProperty({ format: 'uuid' })
  redemptionId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a ledger entry.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Entrada de compensación en el ledger',
  })
  ledgerEntryId?: string;
}

// ---------------------------------------------------------------------------
// UC-51-12 / UC-51-13 · Referidos
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /referral-programs/{id}/referrals` (UC-51-12). */
@ApiSchema({ name: 'PromotionsCreateReferralDto' })
export class CreateReferralDto {
  /**
   * Valor de referee contact mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Contacto del referido (email o teléfono)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  refereeContact?: string;
}

/**
 * Define el contrato validado para referral response.
 */
export class ReferralResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de referral code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código a compartir' })
  referralCode!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Evento que califica un referido. */
export type QualifyingEvent = 'SIGNUP' | 'FIRST_BOOKING' | 'FIRST_PAYMENT';

/** Cuerpo de `POST /referrals/{id}:qualify` (UC-51-13). */
export class QualifyReferralDto {
  /**
   * Identificador asociado a referee user.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Usuario referido que cumplió el evento',
  })
  @IsUUID()
  refereeUserId!: string;

  /**
   * Valor de qualifying event mantenido por la instancia.
   */
  @ApiProperty({ enum: ['SIGNUP', 'FIRST_BOOKING', 'FIRST_PAYMENT'] })
  @IsIn(['SIGNUP', 'FIRST_BOOKING', 'FIRST_PAYMENT'])
  qualifyingEvent!: QualifyingEvent;

  /**
   * Identificador asociado a referrer membership.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Membresía de lealtad del referidor',
  })
  @IsUUID()
  referrerMembershipId!: string;

  /**
   * Identificador asociado a referee membership.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Membresía de lealtad del referido',
  })
  @IsUUID()
  refereeMembershipId!: string;
}

/**
 * Define el contrato validado para qualify referral response.
 */
export class QualifyReferralResponseDto {
  /**
   * Identificador asociado a referral.
   */
  @ApiProperty({ format: 'uuid' })
  referralId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a referrer ledger entry.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Entrada del ledger del referidor',
  })
  referrerLedgerEntryId?: string;

  /**
   * Identificador asociado a referee ledger entry.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Entrada del ledger del referido',
  })
  refereeLedgerEntryId?: string;
}

/* ─── Autoservicio del paciente (R-T-E6B1) ──────────────────────────────── */

/**
 * El nivel de la membresía, tal como lo ve su titular.
 *
 * Se publica el nombre y el multiplicador porque son lo que la pantalla dice;
 * el id del nivel no le sirve a nadie del otro lado.
 */
export class MyLoyaltyTierDto {
  @ApiProperty({ description: 'Código del nivel' })
  code!: string;

  @ApiProperty({ description: 'Nombre del nivel' })
  name!: string;

  @ApiPropertyOptional({ description: 'Cuánto multiplica la acumulación' })
  multiplier?: string;

  @ApiProperty({ description: 'Puntos de por vida desde los que se alcanza' })
  minPoints!: string;
}

/** La membresía del titular: lo que hace falta para pintar saldo y nivel. */
export class MyLoyaltyMembershipDto {
  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  @ApiProperty({ description: 'Nombre del programa' })
  programName!: string;

  @ApiPropertyOptional({
    description: 'Cómo se llaman las unidades del programa («puntos»)',
  })
  pointsCurrencyName?: string;

  @ApiProperty({ description: 'Saldo disponible, como texto exacto' })
  pointsBalance!: string;

  @ApiProperty({ description: 'Acumulado de por vida, como texto exacto' })
  lifetimePoints!: string;

  @ApiPropertyOptional({ type: MyLoyaltyTierDto })
  tier?: MyLoyaltyTierDto;

  @ApiPropertyOptional({ description: 'Cuándo se inscribió' })
  enrolledAt?: Date;

  @ApiProperty({
    description:
      'Si la membresía está activa. Se publica el hecho y no el concepto: el uuid de terminología es interno.',
  })
  active!: boolean;
}

/**
 * Respuesta de `GET loyalty/me`.
 *
 * No estar inscrito **no es un error**: es un estado normal del portal, así que
 * se responde 200 con `enrolled: false` en vez de un 404 que la pantalla
 * tendría que interpretar. Mismo criterio que `alreadyEnrolled` del alta.
 */
export class MyLoyaltyResponseDto {
  @ApiProperty({ description: 'Si el titular tiene membresía en el programa' })
  enrolled!: boolean;

  @ApiPropertyOptional({ type: MyLoyaltyMembershipDto })
  membership?: MyLoyaltyMembershipDto;
}

/** Un movimiento del ledger, ya legible para su titular. */
export class MyPointsLedgerEntryDto {
  @ApiProperty({ format: 'uuid' })
  entryId!: string;

  @ApiPropertyOptional({
    description:
      'Hacia dónde mueve los puntos, como código del catálogo (POINTS_EARN, POINTS_REDEEM, POINTS_EXPIRE, POINTS_ADJUST). Se omite si el concepto no pertenece a ese catálogo: antes que publicar un uuid interno, no se dice.',
  })
  direction?: string;

  @ApiProperty({
    description: 'Siempre positivo; el signo lo dice la dirección',
  })
  points!: string;

  @ApiPropertyOptional({
    description:
      'Por qué se movieron, como código del catálogo (REASON_*). Se omite con el mismo criterio que `direction`.',
  })
  reason?: string;

  @ApiPropertyOptional({ description: 'Saldo que quedó después' })
  balanceAfter?: string;

  @ApiPropertyOptional({ description: 'Cuándo vencen estos puntos' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Cuándo ocurrió el movimiento' })
  occurredAt!: Date;
}

/** Query de `GET loyalty/me/points`: cursor opaco y tope de página. */
export class MyPointsLedgerQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Movimientos por página (1..100, por defecto 20)',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Una página del ledger del titular.
 *
 * Por cursor y nunca por número de página: es la regla del M34 y lo que ya
 * hacen el resto de los listados del producto.
 */
export class MyPointsLedgerPageResponseDto {
  @ApiProperty({ type: [MyPointsLedgerEntryDto] })
  entries!: MyPointsLedgerEntryDto[];

  @ApiPropertyOptional({
    description: 'Cursor de la página siguiente; ausente si no hay más',
  })
  nextCursor?: string;
}
