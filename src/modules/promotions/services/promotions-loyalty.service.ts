import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PromotionsLoyaltyRepository } from '../repositories';
import { WalletsService } from '../../payments/services';
import {
  LoyaltyTiers,
  LoyaltyMemberships,
  PointsLedgerEntries,
} from '../entities';
import {
  CreateLoyaltyProgramDto,
  LoyaltyProgramResponseDto,
  EnrollMemberDto,
  MembershipResponseDto,
  EarnPointsDto,
  RedeemPointsDto,
  PointsLedgerResponseDto,
  RecomputeBalanceResponseDto,
  ExpirePointsDto,
  ExpirePointsResponseDto,
  ListActiveLoyaltyProgramsResponseDto,
  CreateReferralDto,
  ReferralResponseDto,
  QualifyReferralDto,
  QualifyReferralResponseDto,
  type LoyaltyProgramType,
  type ExpiryPolicy,
  type RewardMemberType,
  type AwardType,
  type AppEvent,
  type CapPeriod,
  type QualifyingEvent,
} from '../dto';

const PROGRAM_TYPE_CONCEPT: Readonly<Record<LoyaltyProgramType, string>> = {
  POINTS: CONCEPTS.LOYALTY_TYPE_POINTS,
  TIERED: CONCEPTS.LOYALTY_TYPE_TIERED,
};

const EXPIRY_POLICY_CONCEPT: Readonly<Record<ExpiryPolicy, string>> = {
  NEVER: CONCEPTS.EXPIRY_NEVER,
  ROLLING: CONCEPTS.EXPIRY_ROLLING,
};

export const REWARD_MEMBER_CONCEPT: Readonly<Record<RewardMemberType, string>> =
  {
    USER: CONCEPTS.REWARD_MEMBER_USER,
    PATIENT: CONCEPTS.REWARD_MEMBER_PATIENT,
  };

const AWARD_TYPE_CONCEPT: Readonly<Record<AwardType, string>> = {
  POINTS: CONCEPTS.AWARD_POINTS,
  WALLET_CREDIT: CONCEPTS.AWARD_WALLET_CREDIT,
};

const APP_EVENT_CONCEPT: Readonly<Record<AppEvent, string>> = {
  BOOKING_COMPLETED: CONCEPTS.APP_EVENT_BOOKING_COMPLETED,
  COURSE_COMPLETED: CONCEPTS.APP_EVENT_COURSE_COMPLETED,
  REVIEW_POSTED: CONCEPTS.APP_EVENT_REVIEW_POSTED,
  STREAK: CONCEPTS.APP_EVENT_STREAK,
};

const CAP_PERIOD_CONCEPT: Readonly<Record<CapPeriod, string>> = {
  DAY: CONCEPTS.CAP_PERIOD_DAY,
  WEEK: CONCEPTS.CAP_PERIOD_WEEK,
  MONTH: CONCEPTS.CAP_PERIOD_MONTH,
};

const CAP_PERIOD_DAYS: Readonly<Record<CapPeriod, number>> = {
  DAY: 1,
  WEEK: 7,
  MONTH: 30,
};

const QUALIFYING_EVENT_CONCEPT: Readonly<Record<QualifyingEvent, string>> = {
  SIGNUP: CONCEPTS.QUALIFY_SIGNUP,
  FIRST_BOOKING: CONCEPTS.QUALIFY_FIRST_BOOKING,
  FIRST_PAYMENT: CONCEPTS.QUALIFY_FIRST_PAYMENT,
};

const DEFAULT_SWEEP_BATCH = 100;
const REFERRAL_CODE_BYTES = 6;

/**
 * Propietario polimórfico de la billetera según el tipo de miembro de lealtad:
 * el premio `wallet_credit` de un referido se acredita a la billetera del usuario
 * (o paciente) recompensado.
 */
const WALLET_OWNER_CONCEPT: Readonly<Record<string, string>> = {
  [CONCEPTS.REWARD_MEMBER_USER]: CONCEPTS.OWNER_USER,
  [CONCEPTS.REWARD_MEMBER_PATIENT]: CONCEPTS.OWNER_PATIENT,
};

// Conceptos de la billetera de crédito promocional. No existe un catálogo de
// tipos/estados de billetera propio, así que se reutilizan conceptos vigentes:
// - tipo/entrada: `AWARD_WALLET_CREDIT` ("Wallet credit award") clasifica tanto la
//   billetera de crédito promocional como el asiento que la abona.
// - estado: `STATE_ACTIVE` (activa).
// - dirección: `PAYMENT_DIRECTION_IN` (fondos entrantes = abono/crédito).
const WALLET_TYPE_CONCEPT = CONCEPTS.AWARD_WALLET_CREDIT;
const WALLET_STATUS_ACTIVE = CONCEPTS.STATE_ACTIVE;
const WALLET_CREDIT_DIRECTION = CONCEPTS.PAYMENT_DIRECTION_IN;
const WALLET_CREDIT_ENTRY_TYPE = CONCEPTS.AWARD_WALLET_CREDIT;

/**
 * Programas de lealtad, membresías, ledger de puntos y referidos
 * (UC-51-01 … 06, UC-51-12, UC-51-13).
 */
@Injectable()
export class PromotionsLoyaltyService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param loyaltyRepo - Valor de loyalty repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly loyaltyRepo: PromotionsLoyaltyRepository,
    private readonly walletsService: WalletsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PromotionsLoyaltyService.name);
  }

  /** UC-51-01: crear el programa con sus niveles y reglas de acumulación. */
  async createProgram(
    dto: CreateLoyaltyProgramDto,
    actor: AuthenticatedUser,
  ): Promise<LoyaltyProgramResponseDto> {
    this.logger.info(
      {
        operation: 'promotions.loyalty.program.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Creating loyalty program',
    );

    const duplicate = await this.loyaltyRepo.findProgramByCode(
      this.em,
      dto.tenantId,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un programa con ese código', {
        tenantId: dto.tenantId,
        code: dto.code,
      });
    }

    const expiryPolicy = dto.expiryPolicy ?? 'NEVER';
    if (expiryPolicy === 'ROLLING' && !dto.pointsExpiryDays) {
      throw new PreconditionFailedException(
        'Una política de vencimiento ROLLING necesita días de vigencia',
        { code: dto.code },
      );
    }
    for (const rule of dto.earningRules ?? []) {
      this.assertRuleAward(
        rule.awardType,
        rule.pointsAmount,
        rule.creditAmount,
        rule.code,
      );
    }

    return this.em.transactional(async (tx) => {
      const program = this.loyaltyRepo.createProgram(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        programTypeConceptId: PROGRAM_TYPE_CONCEPT[dto.programType],
        pointsCurrencyName: dto.pointsCurrencyName,
        pointToCurrencyRate: dto.pointToCurrencyRate,
        currencyConceptId: dto.currencyConceptId,
        expiryPolicyConceptId: EXPIRY_POLICY_CONCEPT[expiryPolicy],
        pointsExpiryDays: dto.pointsExpiryDays,
        // El programa nace en borrador: publicarlo es un acto deliberado, y
        // permitir inscripciones antes dejaría miembros en un programa sin reglas.
        stateConceptId: CONCEPTS.LOYALTY_DRAFT,
        actorUserId: actor.id,
      });

      // Los niveles se ordenan por umbral, no por el orden en que llegaron: el
      // ordinal debe reflejar la escalera real del programa.
      const sortedTiers = [...dto.tiers].sort(
        (a, b) => Number(a.minPoints) - Number(b.minPoints),
      );
      const tierIds = sortedTiers.map(
        (tier, index) =>
          this.loyaltyRepo.createTier(tx, {
            loyaltyProgramId: program.id,
            code: tier.code,
            name: tier.name,
            minPoints: tier.minPoints,
            multiplier: tier.multiplier,
            benefitsJson: tier.benefitsJson,
            ordinal: index + 1,
            actorUserId: actor.id,
          }).id,
      );

      const earningRuleIds = (dto.earningRules ?? []).map(
        (rule) =>
          this.loyaltyRepo.createEarningRule(tx, {
            loyaltyProgramId: program.id,
            code: rule.code,
            name: rule.name,
            eventTypeConceptId: APP_EVENT_CONCEPT[rule.eventType],
            awardTypeConceptId: AWARD_TYPE_CONCEPT[rule.awardType],
            pointsAmount: rule.pointsAmount,
            creditAmount: rule.creditAmount,
            currencyConceptId: rule.currencyConceptId,
            conditionJson: rule.conditionJson,
            capPerPeriod: rule.capPerPeriod,
            periodConceptId: rule.capPeriod
              ? CAP_PERIOD_CONCEPT[rule.capPeriod]
              : undefined,
            validFrom: rule.validFrom ? new Date(rule.validFrom) : undefined,
            validTo: rule.validTo ? new Date(rule.validTo) : undefined,
            isActive: true,
            actorUserId: actor.id,
          }).id,
      );

      return {
        id: program.id,
        code: dto.code,
        stateConceptId: CONCEPTS.LOYALTY_DRAFT,
        tierIds,
        earningRuleIds,
      };
    });
  }

  /**
   * UC-51-02: inscribir al miembro. Es idempotente: repetir la llamada devuelve
   * la membresía existente en vez de duplicarla ni volver a dar el bono.
   */
  async enrollMember(
    programId: string,
    dto: EnrollMemberDto,
    actor: AuthenticatedUser,
  ): Promise<MembershipResponseDto> {
    this.logger.info(
      { operation: 'promotions.loyalty.membership.enroll', programId },
      'Enrolling loyalty member',
    );

    return this.em.transactional(async (tx) => {
      const program = await this.loyaltyRepo.findProgramById(tx, programId);
      if (!program) {
        throw new ResourceNotFoundException(
          'Programa de lealtad no encontrado',
          { programId },
        );
      }
      if (program.stateConceptId !== CONCEPTS.LOYALTY_ACTIVE) {
        throw new PreconditionFailedException('El programa no está activo', {
          programId,
          stateConceptId: program.stateConceptId,
        });
      }

      const memberTypeConceptId = REWARD_MEMBER_CONCEPT[dto.memberType];
      const existing = await this.loyaltyRepo.findMembershipByMember(
        tx,
        programId,
        memberTypeConceptId,
        dto.memberRefId,
      );
      if (existing) {
        return {
          id: existing.id,
          currentTierId: existing.currentTierId,
          pointsBalance: existing.pointsBalance ?? '0',
          lifetimePoints: existing.lifetimePoints ?? '0',
          alreadyEnrolled: true,
        };
      }

      const tiers = await this.loyaltyRepo.findTiersByProgram(tx, programId);
      if (tiers.length === 0) {
        throw new PreconditionFailedException(
          'El programa no tiene niveles definidos',
          {
            programId,
          },
        );
      }

      const membership = this.loyaltyRepo.createMembership(tx, {
        loyaltyProgramId: programId,
        memberTypeConceptId,
        memberRefId: dto.memberRefId,
        currentTierId: tiers[0].id,
        statusConceptId: CONCEPTS.MEMBERSHIP_ACTIVE,
        actorUserId: actor.id,
      });

      if (dto.signupBonusPoints && Number(dto.signupBonusPoints) > 0) {
        this.loyaltyRepo.createLedgerEntry(tx, {
          loyaltyMembershipId: membership.id,
          directionConceptId: CONCEPTS.POINTS_EARN,
          points: dto.signupBonusPoints,
          reasonConceptId: CONCEPTS.REASON_SIGNUP,
          balanceAfter: dto.signupBonusPoints,
          // La clave sale de la propia membresía: el bono de bienvenida es único
          // por definición, así que no hace falta que el cliente la aporte.
          idempotencyKey: `signup:${membership.id}`,
          recordedByUserId: actor.id,
        });
        membership.pointsBalance = dto.signupBonusPoints;
        membership.lifetimePoints = dto.signupBonusPoints;
        membership.currentTierId = this.tierFor(
          tiers,
          dto.signupBonusPoints,
        )?.id;
      }

      return {
        id: membership.id,
        currentTierId: membership.currentTierId,
        pointsBalance: membership.pointsBalance ?? '0',
        lifetimePoints: membership.lifetimePoints ?? '0',
        alreadyEnrolled: false,
      };
    });
  }

  /** UC-51-03: acumular puntos por un evento de la aplicación. */
  async earnPoints(
    membershipId: string,
    dto: EarnPointsDto,
    actor: AuthenticatedUser,
  ): Promise<PointsLedgerResponseDto> {
    this.logger.info(
      {
        operation: 'promotions.loyalty.points.earn',
        membershipId,
        earningRuleId: dto.earningRuleId,
      },
      'Earning loyalty points',
    );

    return this.em.transactional(async (tx) => {
      // El reintento se resuelve antes de tocar nada: devolver el resultado
      // anterior es lo que hace segura la reentrega de un evento.
      const previous = await this.loyaltyRepo.findLedgerEntryByKey(
        tx,
        dto.idempotencyKey,
      );
      if (previous) {
        const membership = await this.loyaltyRepo.findMembershipForUpdate(
          tx,
          previous.loyaltyMembershipId,
        );
        return this.ledgerResponse(previous, membership, true);
      }

      const membership = await this.loyaltyRepo.findMembershipForUpdate(
        tx,
        membershipId,
      );
      if (!membership) {
        throw new ResourceNotFoundException('Membresía no encontrada', {
          membershipId,
        });
      }
      if (membership.statusConceptId !== CONCEPTS.MEMBERSHIP_ACTIVE) {
        throw new PreconditionFailedException('La membresía no está activa', {
          membershipId,
        });
      }

      const rule = await this.loyaltyRepo.findEarningRuleById(
        tx,
        dto.earningRuleId,
      );
      if (!rule) {
        throw new ResourceNotFoundException(
          'Regla de acumulación no encontrada',
          {
            earningRuleId: dto.earningRuleId,
          },
        );
      }
      if (rule.loyaltyProgramId !== membership.loyaltyProgramId) {
        throw new PreconditionFailedException(
          'La regla pertenece a otro programa',
          {
            earningRuleId: dto.earningRuleId,
          },
        );
      }
      const now = new Date();
      if (!rule.isActive) {
        throw new PreconditionFailedException(
          'La regla de acumulación no está activa',
          {
            earningRuleId: dto.earningRuleId,
          },
        );
      }
      if (
        (rule.validFrom && rule.validFrom > now) ||
        (rule.validTo && rule.validTo < now)
      ) {
        throw new PreconditionFailedException(
          'La regla de acumulación está fuera de vigencia',
          {
            earningRuleId: dto.earningRuleId,
          },
        );
      }
      if (!rule.pointsAmount || Number(rule.pointsAmount) <= 0) {
        throw new PreconditionFailedException('La regla no otorga puntos', {
          earningRuleId: dto.earningRuleId,
        });
      }

      await this.assertUnderCap(
        tx,
        membership.id,
        rule.id,
        rule.capPerPeriod,
        rule.periodConceptId,
      );

      const program = await this.loyaltyRepo.findProgramById(
        tx,
        membership.loyaltyProgramId,
      );
      const tiers = await this.loyaltyRepo.findTiersByProgram(
        tx,
        membership.loyaltyProgramId,
      );
      // El multiplicador del nivel actual es el privilegio que se compra
      // ascendiendo: se aplica sobre lo que la regla otorga.
      const multiplier =
        tiers.find((t) => t.id === membership.currentTierId)?.multiplier ?? '1';
      const points = this.round(Number(rule.pointsAmount) * Number(multiplier));

      const balanceAfter = this.round(
        Number(membership.pointsBalance ?? '0') + Number(points),
      );
      const lifetimePoints = this.round(
        Number(membership.lifetimePoints ?? '0') + Number(points),
      );

      const entry = this.loyaltyRepo.createLedgerEntry(tx, {
        loyaltyMembershipId: membership.id,
        directionConceptId: CONCEPTS.POINTS_EARN,
        points,
        reasonConceptId: CONCEPTS.REASON_EVENT,
        balanceAfter,
        sourceType: dto.sourceType,
        sourceRefId: dto.sourceRefId,
        earningRuleId: rule.id,
        expiresAt: this.expiryFor(
          program?.expiryPolicyConceptId,
          program?.pointsExpiryDays,
          now,
        ),
        idempotencyKey: dto.idempotencyKey,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        recordedByUserId: actor.id,
      });

      membership.pointsBalance = balanceAfter;
      membership.lifetimePoints = lifetimePoints;
      membership.currentTierId =
        this.tierFor(tiers, lifetimePoints)?.id ?? membership.currentTierId;
      touch(membership, actor.id);

      return this.ledgerResponse(entry, membership, false);
    });
  }

  /** UC-51-04: canjear puntos. El saldo nunca queda negativo. */
  async redeemPoints(
    membershipId: string,
    dto: RedeemPointsDto,
    actor: AuthenticatedUser,
  ): Promise<PointsLedgerResponseDto> {
    this.logger.info(
      { operation: 'promotions.loyalty.points.redeem', membershipId },
      'Redeeming loyalty points',
    );

    if (Number(dto.points) <= 0) {
      throw new PreconditionFailedException(
        'El canje debe ser de puntos positivos',
        {
          points: dto.points,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const previous = await this.loyaltyRepo.findLedgerEntryByKey(
        tx,
        dto.idempotencyKey,
      );
      if (previous) {
        const membership = await this.loyaltyRepo.findMembershipForUpdate(
          tx,
          previous.loyaltyMembershipId,
        );
        return this.ledgerResponse(previous, membership, true);
      }

      const membership = await this.loyaltyRepo.findMembershipForUpdate(
        tx,
        membershipId,
      );
      if (!membership) {
        throw new ResourceNotFoundException('Membresía no encontrada', {
          membershipId,
        });
      }
      if (membership.statusConceptId !== CONCEPTS.MEMBERSHIP_ACTIVE) {
        throw new PreconditionFailedException('La membresía no está activa', {
          membershipId,
        });
      }

      const balance = Number(membership.pointsBalance ?? '0');
      if (balance < Number(dto.points)) {
        throw new PreconditionFailedException('Saldo de puntos insuficiente', {
          membershipId,
          pointsBalance: membership.pointsBalance,
          requested: dto.points,
        });
      }

      const balanceAfter = this.round(balance - Number(dto.points));
      const entry = this.loyaltyRepo.createLedgerEntry(tx, {
        loyaltyMembershipId: membership.id,
        directionConceptId: CONCEPTS.POINTS_REDEEM,
        points: dto.points,
        reasonConceptId: CONCEPTS.REASON_REDEMPTION,
        balanceAfter,
        idempotencyKey: dto.idempotencyKey,
        recordedByUserId: actor.id,
      });

      // El canje no descuenta puntos de por vida: el nivel refleja lealtad
      // acumulada, no saldo disponible, así que gastar no hace descender.
      membership.pointsBalance = balanceAfter;
      touch(membership, actor.id);

      return this.ledgerResponse(entry, membership, false);
    });
  }

  /** UC-51-05: reproyectar saldo y nivel desde el ledger, que es la fuente de verdad. */
  async recomputeBalance(
    membershipId: string,
    actor: AuthenticatedUser,
  ): Promise<RecomputeBalanceResponseDto> {
    this.logger.info(
      { operation: 'promotions.loyalty.membership.recompute', membershipId },
      'Recomputing membership balance',
    );

    return this.em.transactional(async (tx) => {
      const membership = await this.loyaltyRepo.findMembershipForUpdate(
        tx,
        membershipId,
      );
      if (!membership) {
        throw new ResourceNotFoundException('Membresía no encontrada', {
          membershipId,
        });
      }

      const ledger = await this.loyaltyRepo.findLedgerByMembership(
        tx,
        membershipId,
      );
      const totals = this.projectLedger(ledger);
      const tiers = await this.loyaltyRepo.findTiersByProgram(
        tx,
        membership.loyaltyProgramId,
      );
      const tier = this.tierFor(tiers, totals.lifetimePoints);

      const tierChanged = (tier?.id ?? undefined) !== membership.currentTierId;
      membership.pointsBalance = totals.pointsBalance;
      membership.lifetimePoints = totals.lifetimePoints;
      membership.currentTierId = tier?.id;
      touch(membership, actor.id);

      return {
        membershipId,
        pointsBalance: totals.pointsBalance,
        lifetimePoints: totals.lifetimePoints,
        currentTierId: tier?.id,
        tierChanged,
      };
    });
  }

  /**
   * UC-51-06 (descubrimiento del worker): programas activos que el barrido de
   * puntos debe recorrer. `expirePoints` exige un `loyaltyProgramId` puntual y
   * no había forma de listar qué programas están vigentes.
   */
  async listActivePrograms(
    limit = DEFAULT_SWEEP_BATCH,
    tenantId?: string,
  ): Promise<ListActiveLoyaltyProgramsResponseDto> {
    const programs = await this.loyaltyRepo.findActivePrograms(
      this.em,
      CONCEPTS.LOYALTY_ACTIVE,
      limit,
      tenantId,
    );
    return {
      programs: programs.map((program) => ({
        id: program.id,
        code: program.code,
        name: program.name,
      })),
    };
  }

  /**
   * UC-51-06: barrido de expiración. Cada expiración lleva una clave derivada
   * de la entrada vencida, de modo que dos pasadas del worker no expiran dos
   * veces los mismos puntos.
   */
  async expirePoints(
    dto: ExpirePointsDto,
    actor: AuthenticatedUser,
  ): Promise<ExpirePointsResponseDto> {
    this.logger.info(
      {
        operation: 'promotions.loyalty.points.expire',
        loyaltyProgramId: dto.loyaltyProgramId,
      },
      'Sweeping expired points',
    );

    return this.em.transactional(async (tx) => {
      const memberships = await this.loyaltyRepo.findMembershipsForSweep(
        tx,
        dto.loyaltyProgramId,
        CONCEPTS.MEMBERSHIP_ACTIVE,
        dto.batchSize ?? DEFAULT_SWEEP_BATCH,
      );

      const now = new Date();
      let affected = 0;
      let pointsExpired = 0;

      for (const membership of memberships) {
        const expirable = await this.loyaltyRepo.findExpirableEntries(
          tx,
          membership.id,
          CONCEPTS.POINTS_EARN,
          now,
        );

        let membershipExpired = 0;
        let balance = Number(membership.pointsBalance ?? '0');
        for (const entry of expirable) {
          if (balance <= 0) break;
          const key = `expire:${entry.id}`;
          if (await this.loyaltyRepo.findLedgerEntryByKey(tx, key)) continue;

          // No se expira más de lo que queda: si el miembro ya gastó esos puntos
          // no hay nada que retirar, y descontarlos igual dejaría saldo negativo.
          const amount = Math.min(Number(entry.points), balance);
          if (amount <= 0) continue;

          balance = Number(this.round(balance - amount));
          this.loyaltyRepo.createLedgerEntry(tx, {
            loyaltyMembershipId: membership.id,
            directionConceptId: CONCEPTS.POINTS_EXPIRE,
            points: this.round(amount),
            reasonConceptId: CONCEPTS.REASON_EXPIRY,
            balanceAfter: this.round(balance),
            sourceType: 'points_ledger_entry',
            sourceRefId: entry.id,
            idempotencyKey: key,
            recordedByUserId: actor.id,
          });
          membershipExpired += amount;
        }

        if (membershipExpired > 0) {
          membership.pointsBalance = this.round(balance);
          affected += 1;
          pointsExpired += membershipExpired;
        }
        // Se marca aunque no haya expirado nada: `findMembershipsForSweep`
        // ordena por `updatedAt` ascendente, así que esto es lo que rota el
        // lote — sin tocar TODAS las revisadas, las mismas primeras `limit`
        // membresías volverían a salir siempre y las demás nunca se barrerían.
        touch(membership, actor.id);
      }

      return {
        scanned: memberships.length,
        affected,
        pointsExpired: this.round(pointsExpired),
      };
    });
  }

  /** UC-51-12: generar el código de referido del miembro. */
  async createReferral(
    referralProgramId: string,
    dto: CreateReferralDto,
    actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    this.logger.info(
      { operation: 'promotions.referral.create', referralProgramId },
      'Creating member referral',
    );

    return this.em.transactional(async (tx) => {
      const program = await this.loyaltyRepo.findReferralProgramById(
        tx,
        referralProgramId,
      );
      if (!program) {
        throw new ResourceNotFoundException(
          'Programa de referidos no encontrado',
          {
            referralProgramId,
          },
        );
      }
      if (program.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'El programa de referidos no está activo',
          {
            referralProgramId,
          },
        );
      }
      const now = new Date();
      if (
        (program.validFrom && program.validFrom > now) ||
        (program.validTo && program.validTo < now)
      ) {
        throw new PreconditionFailedException(
          'El programa de referidos está fuera de vigencia',
          {
            referralProgramId,
          },
        );
      }

      if (program.maxReferralsPerUser) {
        const issued = await this.loyaltyRepo.findReferralsByReferrer(
          tx,
          referralProgramId,
          actor.id,
        );
        if (issued.length >= program.maxReferralsPerUser) {
          throw new PreconditionFailedException(
            'El usuario alcanzó su máximo de referidos en el programa',
            {
              referralProgramId,
              maxReferralsPerUser: program.maxReferralsPerUser,
            },
          );
        }
      }

      const referralCode = await this.generateReferralCode(tx);
      const referral = this.loyaltyRepo.createReferral(tx, {
        referralProgramId,
        referrerUserId: actor.id,
        referralCode,
        refereeContact: dto.refereeContact,
        statusConceptId: CONCEPTS.REFERRAL_PENDING,
        actorUserId: actor.id,
      });

      return {
        id: referral.id,
        referralCode,
        statusConceptId: CONCEPTS.REFERRAL_PENDING,
      };
    });
  }

  /**
   * UC-51-13: calificar el referido y premiar a ambas partes. Las dos entradas
   * del ledger llevan una clave derivada del referido, así que reentregar el
   * evento no duplica la recompensa.
   */
  async qualifyReferral(
    referralId: string,
    dto: QualifyReferralDto,
    actor: AuthenticatedUser,
  ): Promise<QualifyReferralResponseDto> {
    this.logger.info(
      {
        operation: 'promotions.referral.qualify',
        referralId,
        event: dto.qualifyingEvent,
      },
      'Qualifying member referral',
    );

    return this.em.transactional(async (tx) => {
      const referral = await this.loyaltyRepo.findReferralForUpdate(
        tx,
        referralId,
      );
      if (!referral) {
        throw new ResourceNotFoundException('Referido no encontrado', {
          referralId,
        });
      }
      if (referral.statusConceptId !== CONCEPTS.REFERRAL_PENDING) {
        throw new ConflictException('El referido ya fue calificado', {
          referralId,
          statusConceptId: referral.statusConceptId,
        });
      }
      // Auto-referirse convertiría el programa en una fuente de puntos gratis.
      if (referral.referrerUserId === dto.refereeUserId) {
        throw new PreconditionFailedException(
          'Un usuario no puede referirse a sí mismo',
          {
            referralId,
          },
        );
      }

      const program = await this.loyaltyRepo.findReferralProgramById(
        tx,
        referral.referralProgramId,
      );
      if (!program) {
        throw new ResourceNotFoundException(
          'Programa de referidos no encontrado',
          {
            referralProgramId: referral.referralProgramId,
          },
        );
      }
      const eventConceptId = QUALIFYING_EVENT_CONCEPT[dto.qualifyingEvent];
      if (
        program.qualifyingEventConceptId &&
        program.qualifyingEventConceptId !== eventConceptId
      ) {
        throw new PreconditionFailedException(
          'El evento recibido no es el que califica en este programa',
          { referralId, qualifyingEvent: dto.qualifyingEvent },
        );
      }

      const referrerLedgerEntryId = await this.awardReferral(
        tx,
        dto.referrerMembershipId,
        program.referrerAwardTypeConceptId,
        program.referrerAwardAmount,
        `referral:${referralId}:referrer`,
        referralId,
        actor,
        program.tenantId,
        program.currencyConceptId,
      );
      const refereeLedgerEntryId = await this.awardReferral(
        tx,
        dto.refereeMembershipId,
        program.refereeAwardTypeConceptId,
        program.refereeAwardAmount,
        `referral:${referralId}:referee`,
        referralId,
        actor,
        program.tenantId,
        program.currencyConceptId,
      );

      referral.statusConceptId = CONCEPTS.REFERRAL_QUALIFIED;
      referral.refereeUserId = dto.refereeUserId;
      referral.qualifiedAt = new Date();
      touch(referral, actor.id);

      return {
        referralId,
        statusConceptId: CONCEPTS.REFERRAL_QUALIFIED,
        referrerLedgerEntryId,
        refereeLedgerEntryId,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Acredita el premio de un referido en la membresía indicada. Según el tipo de
   * premio del programa, deriva a puntos (ledger de lealtad) o a crédito de
   * billetera (ledger de pagos). Ambos caminos son idempotentes por la clave del
   * referido: reentregar el evento no vuelve a pagar.
   */
  private async awardReferral(
    tx: EntityManager,
    membershipId: string,
    awardTypeConceptId: string,
    awardAmount: string | undefined,
    idempotencyKey: string,
    referralId: string,
    actor: AuthenticatedUser,
    tenantId: string,
    currencyConceptId: string | undefined,
  ): Promise<string | undefined> {
    if (!awardAmount || Number(awardAmount) <= 0) return undefined;

    if (awardTypeConceptId === CONCEPTS.AWARD_POINTS) {
      return this.awardReferralPoints(
        tx,
        membershipId,
        awardAmount,
        idempotencyKey,
        referralId,
        actor,
      );
    }
    if (awardTypeConceptId === CONCEPTS.AWARD_WALLET_CREDIT) {
      return this.awardReferralWalletCredit(
        tx,
        membershipId,
        awardAmount,
        idempotencyKey,
        referralId,
        actor,
        tenantId,
        currencyConceptId,
      );
    }
    return undefined;
  }

  /** Acredita puntos de lealtad y recalcula el nivel de la membresía. */
  private async awardReferralPoints(
    tx: EntityManager,
    membershipId: string,
    awardAmount: string,
    idempotencyKey: string,
    referralId: string,
    actor: AuthenticatedUser,
  ): Promise<string | undefined> {
    const existing = await this.loyaltyRepo.findLedgerEntryByKey(
      tx,
      idempotencyKey,
    );
    if (existing) return existing.id;

    const membership = await this.loyaltyRepo.findMembershipForUpdate(
      tx,
      membershipId,
    );
    if (!membership) {
      throw new ResourceNotFoundException(
        'Membresía de la recompensa no encontrada',
        {
          membershipId,
        },
      );
    }

    const balanceAfter = this.round(
      Number(membership.pointsBalance ?? '0') + Number(awardAmount),
    );
    const lifetimePoints = this.round(
      Number(membership.lifetimePoints ?? '0') + Number(awardAmount),
    );

    const entry = this.loyaltyRepo.createLedgerEntry(tx, {
      loyaltyMembershipId: membershipId,
      directionConceptId: CONCEPTS.POINTS_EARN,
      points: awardAmount,
      reasonConceptId: CONCEPTS.REASON_REFERRAL,
      balanceAfter,
      sourceType: 'member_referral',
      sourceRefId: referralId,
      idempotencyKey,
      recordedByUserId: actor.id,
    });

    const tiers = await this.loyaltyRepo.findTiersByProgram(
      tx,
      membership.loyaltyProgramId,
    );
    membership.pointsBalance = balanceAfter;
    membership.lifetimePoints = lifetimePoints;
    membership.currentTierId =
      this.tierFor(tiers, lifetimePoints)?.id ?? membership.currentTierId;
    touch(membership, actor.id);

    return entry.id;
  }

  /**
   * Acredita crédito de billetera: localiza (o crea) la billetera del miembro
   * recompensado en la moneda del programa, la bloquea (FOR UPDATE) y suma el
   * abono en su ledger, todo dentro de la misma transacción. Mismo patrón de
   * bloqueo read-modify-write que earn/redeem sobre la membresía.
   */
  private async awardReferralWalletCredit(
    tx: EntityManager,
    membershipId: string,
    awardAmount: string,
    idempotencyKey: string,
    referralId: string,
    actor: AuthenticatedUser,
    tenantId: string,
    currencyConceptId: string | undefined,
  ): Promise<string | undefined> {
    // Sin moneda no se puede liquidar el crédito: fail-closed.
    if (!currencyConceptId) {
      throw new PreconditionFailedException(
        'El programa de referidos no define moneda para el crédito de billetera',
        { referralId },
      );
    }

    const membership = await this.loyaltyRepo.findMembershipForUpdate(
      tx,
      membershipId,
    );
    if (!membership) {
      throw new ResourceNotFoundException(
        'Membresía de la recompensa no encontrada',
        {
          membershipId,
        },
      );
    }

    const ownerTypeConceptId =
      WALLET_OWNER_CONCEPT[membership.memberTypeConceptId] ??
      CONCEPTS.OWNER_USER;

    // La billetera es del dominio de pagos: se acredita por su servicio, que
    // resuelve idempotencia (clave UNIQUE), find-or-create y saldo dentro de ESTA
    // transacción. Antes este servicio escribía las tablas de pagos directamente.
    const result = await this.walletsService.creditWallet(
      tx,
      {
        tenantId,
        ownerTypeConceptId,
        ownerRefId: membership.memberRefId,
        walletTypeConceptId: WALLET_TYPE_CONCEPT,
        currencyConceptId,
        walletStatusConceptId: WALLET_STATUS_ACTIVE,
        amount: awardAmount,
        directionConceptId: WALLET_CREDIT_DIRECTION,
        entryTypeConceptId: WALLET_CREDIT_ENTRY_TYPE,
        idempotencyKey,
        sourceType: 'member_referral',
        sourceRefId: referralId,
      },
      actor,
    );

    return result.entryId;
  }

  /** Verifica que la regla no haya superado su tope dentro del periodo. */
  private async assertUnderCap(
    tx: EntityManager,
    membershipId: string,
    earningRuleId: string,
    capPerPeriod: number | undefined,
    periodConceptId: string | undefined,
  ): Promise<void> {
    if (!capPerPeriod || !periodConceptId) return;

    const days = this.periodDays(periodConceptId);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const entries = await this.loyaltyRepo.findEarnEntriesInPeriod(
      tx,
      membershipId,
      earningRuleId,
      since,
    );
    if (entries.length >= capPerPeriod) {
      throw new PreconditionFailedException(
        'La regla alcanzó su tope en el periodo',
        {
          earningRuleId,
          capPerPeriod,
        },
      );
    }
  }

  /**
   * Ejecuta la operación period days.
   *
   * @param periodConceptId - Identificador de period concept.
   * @returns Resultado de period days conforme al contrato `number`.
   */
  private periodDays(periodConceptId: string): number {
    const entry = (Object.keys(CAP_PERIOD_CONCEPT) as CapPeriod[]).find(
      (p) => CAP_PERIOD_CONCEPT[p] === periodConceptId,
    );
    return entry ? CAP_PERIOD_DAYS[entry] : CAP_PERIOD_DAYS.MONTH;
  }

  /** Reproyecta saldo y puntos de por vida recorriendo el ledger completo. */
  private projectLedger(ledger: PointsLedgerEntries[]): {
    /**
     * Valor de points balance mantenido por la instancia.
     */
    pointsBalance: string;
    /**
     * Valor de lifetime points mantenido por la instancia.
     */
    lifetimePoints: string;
  } {
    let balance = 0;
    let lifetime = 0;
    for (const entry of ledger) {
      const points = Number(entry.points);
      if (entry.directionConceptId === CONCEPTS.POINTS_EARN) {
        balance += points;
        lifetime += points;
      } else if (
        entry.directionConceptId === CONCEPTS.POINTS_REDEEM ||
        entry.directionConceptId === CONCEPTS.POINTS_EXPIRE
      ) {
        balance -= points;
      } else {
        // Los ajustes van con signo en `points`: compensan sin borrar historia.
        balance += points;
      }
    }
    return {
      pointsBalance: this.round(Math.max(balance, 0)),
      lifetimePoints: this.round(lifetime),
    };
  }

  /** Nivel que corresponde a unos puntos de por vida: el mayor umbral alcanzado. */
  private tierFor(
    tiers: LoyaltyTiers[],
    lifetimePoints: string | number,
  ): LoyaltyTiers | undefined {
    const value = Number(lifetimePoints);
    let match: LoyaltyTiers | undefined;
    for (const tier of tiers) {
      if (Number(tier.minPoints) <= value) match = tier;
    }
    return match ?? tiers[0];
  }

  /**
   * Ejecuta la operación expiry for.
   *
   * @param expiryPolicyConceptId - Identificador de expiry policy concept.
   * @param pointsExpiryDays - Valor de points expiry days requerido por la operación.
   * @param from - Valor de from requerido por la operación.
   * @returns Resultado de expiry for conforme al contrato `Date | undefined`.
   */
  private expiryFor(
    expiryPolicyConceptId: string | undefined,
    pointsExpiryDays: number | undefined,
    from: Date,
  ): Date | undefined {
    if (expiryPolicyConceptId !== CONCEPTS.EXPIRY_ROLLING || !pointsExpiryDays)
      return undefined;
    return new Date(from.getTime() + pointsExpiryDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Valida assert rule award.
   *
   * @param awardType - Valor de award type requerido por la operación.
   * @param pointsAmount - Valor de points amount requerido por la operación.
   * @param creditAmount - Valor de credit amount requerido por la operación.
   * @param ruleCode - Valor de rule code requerido por la operación.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private assertRuleAward(
    awardType: AwardType,
    pointsAmount: string | undefined,
    creditAmount: string | undefined,
    ruleCode: string,
  ): void {
    if (awardType === 'POINTS' && !pointsAmount) {
      throw new PreconditionFailedException(
        'Una regla de puntos necesita pointsAmount',
        {
          ruleCode,
        },
      );
    }
    if (awardType === 'WALLET_CREDIT' && !creditAmount) {
      throw new PreconditionFailedException(
        'Una regla de crédito necesita creditAmount',
        {
          ruleCode,
        },
      );
    }
  }

  /**
   * Ejecuta la operación ledger response.
   *
   * @param entry - Valor de entry requerido por la operación.
   * @param membership - Valor de membership requerido por la operación.
   * @param duplicate - Valor de duplicate requerido por la operación.
   * @returns Resultado de ledger response conforme al contrato `PointsLedgerResponseDto`.
   */
  private ledgerResponse(
    entry: PointsLedgerEntries,
    membership: LoyaltyMemberships | null,
    duplicate: boolean,
  ): PointsLedgerResponseDto {
    return {
      ledgerEntryId: entry.id,
      membershipId: entry.loyaltyMembershipId,
      points: entry.points,
      balanceAfter: entry.balanceAfter ?? '0',
      lifetimePoints: membership?.lifetimePoints ?? '0',
      currentTierId: membership?.currentTierId,
      duplicate,
    };
  }

  /** Los puntos se transportan como cadena decimal con 2 decimales. */
  private round(value: number): string {
    return value.toFixed(2);
  }

  /** Código corto legible; se reintenta hasta encontrar uno libre. */
  private async generateReferralCode(tx: EntityManager): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = randomBytes(REFERRAL_CODE_BYTES)
        .toString('base64url')
        .toUpperCase();
      if (!(await this.loyaltyRepo.findReferralByCode(tx, code))) return code;
    }
    throw new ConflictException(
      'No se pudo generar un código de referido libre',
      {},
    );
  }
}
