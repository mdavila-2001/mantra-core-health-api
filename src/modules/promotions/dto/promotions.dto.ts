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

export class LoyaltyTierDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Puntos de por vida a partir de los cuales aplica el nivel',
  })
  @IsNumberString()
  minPoints!: string;

  @ApiPropertyOptional({
    description: 'Multiplicador de acumulación del nivel',
  })
  @IsOptional()
  @IsNumberString()
  multiplier?: string;

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

export class EarningRuleDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: APP_EVENTS })
  @IsIn(APP_EVENTS)
  eventType!: AppEvent;

  @ApiProperty({ enum: AWARD_TYPES })
  @IsIn(AWARD_TYPES)
  awardType!: AwardType;

  @ApiPropertyOptional({
    description: 'Puntos que otorga; obligatorio si el premio es POINTS',
  })
  @IsOptional()
  @IsNumberString()
  pointsAmount?: string;

  @ApiPropertyOptional({
    description:
      'Crédito que otorga; obligatorio si el premio es WALLET_CREDIT',
  })
  @IsOptional()
  @IsNumberString()
  creditAmount?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({
    description: 'Condición adicional evaluada por el worker',
  })
  @IsOptional()
  @IsObject()
  conditionJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Máximo de acumulaciones por periodo' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capPerPeriod?: number;

  @ApiPropertyOptional({ enum: CAP_PERIODS })
  @IsOptional()
  @IsIn(CAP_PERIODS)
  capPeriod?: CapPeriod;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

/** Cuerpo de `POST /loyalty/programs` (UC-51-01). */
export class CreateLoyaltyProgramDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código del programa, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['POINTS', 'TIERED'] })
  @IsIn(['POINTS', 'TIERED'])
  programType!: LoyaltyProgramType;

  @ApiPropertyOptional({
    description: 'Nombre de la moneda de puntos ("Estrellas")',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pointsCurrencyName?: string;

  @ApiPropertyOptional({
    description: 'Cuánto vale un punto en moneda, como cadena decimal',
  })
  @IsOptional()
  @IsNumberString()
  pointToCurrencyRate?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ enum: ['NEVER', 'ROLLING'], default: 'NEVER' })
  @IsOptional()
  @IsIn(['NEVER', 'ROLLING'])
  expiryPolicy?: ExpiryPolicy;

  @ApiPropertyOptional({
    description:
      'Días de vigencia de los puntos; obligatorio si la política es ROLLING',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  pointsExpiryDays?: number;

  @ApiProperty({
    type: [LoyaltyTierDto],
    description: 'Niveles del programa, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LoyaltyTierDto)
  tiers!: LoyaltyTierDto[];

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

export class LoyaltyProgramResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Niveles creados, de menor a mayor umbral',
  })
  tierIds!: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  earningRuleIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-51-02 · Inscripción
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /loyalty/programs/{id}/memberships` (UC-51-02). */
export class EnrollMemberDto {
  @ApiProperty({ enum: REWARD_MEMBER_TYPES })
  @IsIn(REWARD_MEMBER_TYPES)
  memberType!: RewardMemberType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberRefId!: string;

  @ApiPropertyOptional({
    description: 'Puntos de bienvenida a acreditar con el alta',
  })
  @IsOptional()
  @IsNumberString()
  signupBonusPoints?: string;
}

export class MembershipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  currentTierId?: string;

  @ApiProperty({ description: 'Saldo de puntos' })
  pointsBalance!: string;

  @ApiProperty({ description: 'Puntos acumulados de por vida' })
  lifetimePoints!: string;

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
  @ApiProperty({
    format: 'uuid',
    description: 'Regla que justifica la acumulación',
  })
  @IsUUID()
  earningRuleId!: string;

  @ApiProperty({
    description:
      'Clave de idempotencia; un reintento con la misma clave no acumula dos veces',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  @ApiPropertyOptional({
    description: 'Tipo del origen del evento',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceType?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Identificador del evento de origen',
  })
  @IsOptional()
  @IsUUID()
  sourceRefId?: string;

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
  @ApiProperty({ description: 'Puntos a canjear' })
  @IsNumberString()
  points!: string;

  @ApiProperty({
    description: 'Clave de idempotencia del canje',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  @ApiPropertyOptional({ enum: AWARD_TYPES, default: 'POINTS' })
  @IsOptional()
  @IsIn(AWARD_TYPES)
  awardType?: AwardType;
}

export class PointsLedgerResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Entrada del ledger' })
  ledgerEntryId!: string;

  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  @ApiProperty({ description: 'Puntos del movimiento' })
  points!: string;

  @ApiProperty({ description: 'Saldo tras el movimiento' })
  balanceAfter!: string;

  @ApiProperty({ description: 'Puntos de por vida tras el movimiento' })
  lifetimePoints!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Nivel actual tras recalcular',
  })
  currentTierId?: string;

  @ApiProperty({
    description: 'true si la clave de idempotencia ya se había usado',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-51-05 · Recomputo
// ---------------------------------------------------------------------------

export class RecomputeBalanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  @ApiProperty({ description: 'Saldo reproyectado desde el ledger' })
  pointsBalance!: string;

  @ApiProperty()
  lifetimePoints!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  currentTierId?: string;

  @ApiProperty({ description: 'true si el nivel cambió al recalcular' })
  tierChanged!: boolean;
}

// ---------------------------------------------------------------------------
// UC-51-06 · Expiración
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /loyalty/jobs/expire-points` (UC-51-06). */
export class ExpirePointsDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Programa cuyas membresías se barren',
  })
  @IsUUID()
  loyaltyProgramId!: string;

  @ApiPropertyOptional({ description: 'Tamaño del lote', default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  batchSize?: number;
}

export class ExpirePointsResponseDto {
  @ApiProperty({ description: 'Membresías revisadas en este lote' })
  scanned!: number;

  @ApiProperty({ description: 'Membresías a las que se les expiraron puntos' })
  affected!: number;

  @ApiProperty({ description: 'Total de puntos expirados' })
  pointsExpired!: string;
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

export class DiscountRuleDto {
  @ApiProperty({ enum: DISCOUNT_TYPES })
  @IsIn(DISCOUNT_TYPES)
  discountType!: DiscountType;

  @ApiPropertyOptional({
    description: 'Porcentaje 0-100; obligatorio si el tipo es PERCENTAGE',
  })
  @IsOptional()
  @IsNumberString()
  percentage?: string;

  @ApiPropertyOptional({
    description: 'Importe fijo; obligatorio si el tipo es FIXED',
  })
  @IsOptional()
  @IsNumberString()
  fixedAmount?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ description: 'Tope del descuento resultante' })
  @IsOptional()
  @IsNumberString()
  maxDiscountAmount?: string;

  @ApiPropertyOptional({
    description: 'Compra mínima para que la regla aplique',
  })
  @IsOptional()
  @IsNumberString()
  minPurchaseAmount?: string;

  @ApiPropertyOptional({ enum: DISCOUNT_TARGETS })
  @IsOptional()
  @IsIn(DISCOUNT_TARGETS)
  appliesTo?: DiscountTarget;

  @ApiPropertyOptional({ description: 'Filtro de los ítems alcanzados' })
  @IsOptional()
  @IsObject()
  targetFilterJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Unidades a comprar; obligatorio si el tipo es BOGO',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  buyQuantity?: number;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código de la promoción, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['AUTOMATIC', 'COUPON'] })
  @IsIn(['AUTOMATIC', 'COUPON'])
  promotionType!: PromotionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Campaña de marketing asociada',
  })
  @IsOptional()
  @IsUUID()
  campaignRefId?: string;

  @ApiPropertyOptional({
    description: 'Prioridad frente a promociones que se solapan',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({
    description: '¿Puede combinarse con otras promociones?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @ApiPropertyOptional({ description: 'Presupuesto total de descuento' })
  @IsOptional()
  @IsNumberString()
  budgetAmount?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ description: 'Redenciones totales permitidas' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalRedemptionLimit?: number;

  @ApiPropertyOptional({ description: 'Redenciones permitidas por usuario' })
  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  validFrom!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  validTo!: string;

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

export class PromotionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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
  @ApiProperty({ enum: COUPON_TYPES })
  @IsIn(COUPON_TYPES)
  couponType!: CouponType;

  @ApiProperty({ description: 'Cupones a emitir', minimum: 1, maximum: 1000 })
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Prefijo del código generado',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codePrefix?: string;

  @ApiPropertyOptional({
    description: 'Redenciones permitidas por cupón',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({
    enum: REWARD_MEMBER_TYPES,
    description: 'Sólo para cupones PERSONAL',
  })
  @IsOptional()
  @IsIn(REWARD_MEMBER_TYPES)
  assignedMemberType?: RewardMemberType;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Sólo para cupones PERSONAL',
  })
  @IsOptional()
  @IsUUID()
  assignedMemberRefId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

export class IssueCouponsResponseDto {
  @ApiProperty({ format: 'uuid' })
  promotionId!: string;

  @ApiProperty({ description: 'Cupones emitidos' })
  issued!: number;

  @ApiProperty({ type: [String], description: 'Códigos generados' })
  codes!: string[];
}

// ---------------------------------------------------------------------------
// UC-51-09 · Validación y redención
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /coupons:validate` (UC-51-09). */
export class ValidateCouponDto {
  @ApiProperty({ description: 'Código del cupón', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Importe de la orden, como cadena decimal' })
  @IsNumberString()
  orderAmount!: string;

  @ApiProperty({ enum: REWARD_MEMBER_TYPES })
  @IsIn(REWARD_MEMBER_TYPES)
  redeemerType!: RewardMemberType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  redeemerRefId!: string;
}

export class ValidateCouponResponseDto {
  @ApiProperty({ description: '¿El cupón puede usarse en esta orden?' })
  valid!: boolean;

  @ApiPropertyOptional({
    description: 'Motivo del rechazo cuando no es válido',
  })
  reason?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  promotionId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Regla que da el mejor descuento',
  })
  discountRuleId?: string;

  @ApiPropertyOptional({ description: 'Descuento que se aplicaría' })
  discountAmount?: string;
}

/** Cuerpo de `POST /redemptions` (UC-51-09). */
export class CreateRedemptionDto extends ValidateCouponDto {
  @ApiPropertyOptional({ description: 'Tipo de la orden', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderRefType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  orderRefId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  paymentIntentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

export class RedemptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  promotionId!: string;

  @ApiProperty({ description: 'Descuento aplicado' })
  discountAmount!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-51-10 · Descuento en checkout
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /checkout/{orderId}/apply-discount` (UC-51-10). */
export class ApplyDiscountDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Intento de pago sobre el que se descuenta',
  })
  @IsUUID()
  paymentIntentId!: string;

  @ApiProperty({
    description: 'Importe bruto del intento, como cadena decimal',
  })
  @IsNumberString()
  orderAmount!: string;

  @ApiProperty({ enum: REWARD_MEMBER_TYPES })
  @IsIn(REWARD_MEMBER_TYPES)
  redeemerType!: RewardMemberType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  redeemerRefId!: string;

  @ApiPropertyOptional({
    description: 'Código del cupón cuando el descuento lo exige',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  couponCode?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Promoción automática a aplicar',
  })
  @IsOptional()
  @IsUUID()
  promotionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;
}

export class ApplyDiscountResponseDto {
  @ApiProperty({ format: 'uuid' })
  redemptionId!: string;

  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  @ApiProperty({ description: 'Descuento aplicado' })
  discountAmount!: string;

  @ApiProperty({
    description: 'Importe neto resultante para el intento de pago',
  })
  netAmount!: string;

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
  @ApiProperty({ enum: ['REFUND', 'CANCEL'] })
  @IsIn(['REFUND', 'CANCEL'])
  reason!: ReverseReason;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Membresía a la que devolver los puntos, si la redención fue por puntos',
  })
  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @ApiPropertyOptional({ description: 'Puntos a restituir' })
  @IsOptional()
  @IsNumberString()
  restorePoints?: string;
}

export class ReverseRedemptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  redemptionId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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
export class CreateReferralDto {
  @ApiPropertyOptional({
    description: 'Contacto del referido (email o teléfono)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  refereeContact?: string;
}

export class ReferralResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Código a compartir' })
  referralCode!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Evento que califica un referido. */
export type QualifyingEvent = 'SIGNUP' | 'FIRST_BOOKING' | 'FIRST_PAYMENT';

/** Cuerpo de `POST /referrals/{id}:qualify` (UC-51-13). */
export class QualifyReferralDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Usuario referido que cumplió el evento',
  })
  @IsUUID()
  refereeUserId!: string;

  @ApiProperty({ enum: ['SIGNUP', 'FIRST_BOOKING', 'FIRST_PAYMENT'] })
  @IsIn(['SIGNUP', 'FIRST_BOOKING', 'FIRST_PAYMENT'])
  qualifyingEvent!: QualifyingEvent;

  @ApiProperty({
    format: 'uuid',
    description: 'Membresía de lealtad del referidor',
  })
  @IsUUID()
  referrerMembershipId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Membresía de lealtad del referido',
  })
  @IsUUID()
  refereeMembershipId!: string;
}

export class QualifyReferralResponseDto {
  @ApiProperty({ format: 'uuid' })
  referralId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Entrada del ledger del referidor',
  })
  referrerLedgerEntryId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Entrada del ledger del referido',
  })
  refereeLedgerEntryId?: string;
}
