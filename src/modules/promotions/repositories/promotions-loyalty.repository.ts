import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  LoyaltyPrograms,
  LoyaltyTiers,
  EarningRules,
  LoyaltyMemberships,
  PointsLedgerEntries,
  ReferralPrograms,
  MemberReferrals,
} from '../entities';
// La billetera pertenece al dominio de pagos: el crédito de un referido con
// premio `wallet_credit` se acredita a través de `payments.WalletsService`, no
// tocando sus tablas desde aquí (evita DIRECT_CROSS_DOMAIN_ACCESS).
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create loyalty program data.
 */
export interface CreateLoyaltyProgramData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a program type concept.
   */
  programTypeConceptId: string;
  /**
   * Valor de points currency name mantenido por la instancia.
   */
  pointsCurrencyName?: string;
  /**
   * Valor de point to currency rate mantenido por la instancia.
   */
  pointToCurrencyRate?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a expiry policy concept.
   */
  expiryPolicyConceptId?: string;
  /**
   * Valor de points expiry days mantenido por la instancia.
   */
  pointsExpiryDays?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create tier data.
 */
export interface CreateTierData {
  /**
   * Identificador asociado a loyalty program.
   */
  loyaltyProgramId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de min points mantenido por la instancia.
   */
  minPoints: string;
  /**
   * Valor de multiplier mantenido por la instancia.
   */
  multiplier?: string;
  /**
   * Valor de benefits json mantenido por la instancia.
   */
  benefitsJson?: unknown;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create earning rule data.
 */
export interface CreateEarningRuleData {
  /**
   * Identificador asociado a loyalty program.
   */
  loyaltyProgramId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a event type concept.
   */
  eventTypeConceptId: string;
  /**
   * Identificador asociado a award type concept.
   */
  awardTypeConceptId: string;
  /**
   * Valor de points amount mantenido por la instancia.
   */
  pointsAmount?: string;
  /**
   * Valor de credit amount mantenido por la instancia.
   */
  creditAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de condition json mantenido por la instancia.
   */
  conditionJson?: unknown;
  /**
   * Valor de cap per period mantenido por la instancia.
   */
  capPerPeriod?: number;
  /**
   * Identificador asociado a period concept.
   */
  periodConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Valor de is active mantenido por la instancia.
   */
  isActive: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create membership data.
 */
export interface CreateMembershipData {
  /**
   * Identificador asociado a loyalty program.
   */
  loyaltyProgramId: string;
  /**
   * Identificador asociado a member type concept.
   */
  memberTypeConceptId: string;
  /**
   * Identificador asociado a member ref.
   */
  memberRefId: string;
  /**
   * Identificador asociado a current tier.
   */
  currentTierId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create ledger entry data.
 */
export interface CreateLedgerEntryData {
  /**
   * Identificador asociado a loyalty membership.
   */
  loyaltyMembershipId: string;
  /**
   * Identificador asociado a direction concept.
   */
  directionConceptId: string;
  /**
   * Valor de points mantenido por la instancia.
   */
  points: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId: string;
  /**
   * Valor de balance after mantenido por la instancia.
   */
  balanceAfter: string;
  /**
   * Valor de source type mantenido por la instancia.
   */
  sourceType?: string;
  /**
   * Identificador asociado a source ref.
   */
  sourceRefId?: string;
  /**
   * Identificador asociado a earning rule.
   */
  earningRuleId?: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey: string;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt?: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Describe el contrato estructural de create referral data.
 */
export interface CreateReferralData {
  /**
   * Identificador asociado a referral program.
   */
  referralProgramId: string;
  /**
   * Identificador asociado a referrer user.
   */
  referrerUserId: string;
  /**
   * Valor de referral code mantenido por la instancia.
   */
  referralCode: string;
  /**
   * Valor de referee contact mantenido por la instancia.
   */
  refereeContact?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a la parte de lealtad de `promotions.*`: programas, niveles, reglas de
 * acumulación, membresías, ledger de puntos y referidos. Sin reglas de negocio.
 */
@Injectable()
export class PromotionsLoyaltyRepository {
  // --- Programas, niveles y reglas (UC-51-01) ---

  /**
   * Crea create program.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create program conforme al contrato `LoyaltyPrograms`.
   */
  createProgram(
    em: EntityManager,
    data: CreateLoyaltyProgramData,
  ): LoyaltyPrograms {
    return em.create(
      LoyaltyPrograms,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        programTypeConceptId: data.programTypeConceptId,
        pointsCurrencyName: data.pointsCurrencyName,
        pointToCurrencyRate: data.pointToCurrencyRate,
        currencyConceptId: data.currencyConceptId,
        expiryPolicyConceptId: data.expiryPolicyConceptId,
        pointsExpiryDays: data.pointsExpiryDays,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find program by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find program by id conforme al contrato `Promise<LoyaltyPrograms | null>`.
   */
  findProgramById(
    em: EntityManager,
    id: string,
  ): Promise<LoyaltyPrograms | null> {
    return em.findOne(LoyaltyPrograms, { id });
  }

  /**
   * Obtiene find program by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find program by code conforme al contrato `Promise<LoyaltyPrograms | null>`.
   */
  findProgramByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<LoyaltyPrograms | null> {
    return em.findOne(LoyaltyPrograms, { tenantId, code });
  }

  /**
   * Programas activos, para el descubrimiento del worker de UC-51-06:
   * `expire-points` exige un `loyaltyProgramId` puntual y no había forma de
   * listar qué programas barrer.
   *
   * `tenantId` es opcional únicamente para el barrido `SYSTEM` (recorre todos
   * los tenants); cualquier otro llamador debe acotarlo, igual que el resto
   * de métodos de este repositorio.
   */
  findActivePrograms(
    em: EntityManager,
    activeStateConceptId: string,
    limit: number,
    tenantId?: string,
  ): Promise<LoyaltyPrograms[]> {
    return em.find(
      LoyaltyPrograms,
      {
        stateConceptId: activeStateConceptId,
        ...(tenantId ? { tenantId } : {}),
      },
      { orderBy: { createdAt: 'ASC' }, limit },
    );
  }

  /**
   * Crea create tier.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create tier conforme al contrato `LoyaltyTiers`.
   */
  createTier(em: EntityManager, data: CreateTierData): LoyaltyTiers {
    return em.create(
      LoyaltyTiers,
      {
        loyaltyProgramId: data.loyaltyProgramId,
        code: data.code,
        name: data.name,
        minPoints: data.minPoints,
        multiplier: data.multiplier,
        benefitsJson: data.benefitsJson,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Niveles de menor a mayor umbral: el ascenso busca el último que se alcanza. */
  findTiersByProgram(
    em: EntityManager,
    loyaltyProgramId: string,
  ): Promise<LoyaltyTiers[]> {
    return em.find(
      LoyaltyTiers,
      { loyaltyProgramId },
      { orderBy: { minPoints: 'ASC' } },
    );
  }

  /**
   * Crea create earning rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create earning rule conforme al contrato `EarningRules`.
   */
  createEarningRule(
    em: EntityManager,
    data: CreateEarningRuleData,
  ): EarningRules {
    return em.create(
      EarningRules,
      {
        loyaltyProgramId: data.loyaltyProgramId,
        code: data.code,
        name: data.name,
        eventTypeConceptId: data.eventTypeConceptId,
        awardTypeConceptId: data.awardTypeConceptId,
        pointsAmount: data.pointsAmount,
        creditAmount: data.creditAmount,
        currencyConceptId: data.currencyConceptId,
        conditionJson: data.conditionJson,
        capPerPeriod: data.capPerPeriod,
        periodConceptId: data.periodConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        isActive: data.isActive,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find earning rule by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find earning rule by id conforme al contrato `Promise<EarningRules | null>`.
   */
  findEarningRuleById(
    em: EntityManager,
    id: string,
  ): Promise<EarningRules | null> {
    return em.findOne(EarningRules, { id });
  }

  // --- Membresías (UC-51-02, UC-51-05) ---

  /**
   * Crea create membership.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create membership conforme al contrato `LoyaltyMemberships`.
   */
  createMembership(
    em: EntityManager,
    data: CreateMembershipData,
  ): LoyaltyMemberships {
    return em.create(
      LoyaltyMemberships,
      {
        loyaltyProgramId: data.loyaltyProgramId,
        memberTypeConceptId: data.memberTypeConceptId,
        memberRefId: data.memberRefId,
        currentTierId: data.currentTierId,
        pointsBalance: '0',
        lifetimePoints: '0',
        enrolledAt: new Date(),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Membresía del miembro en el programa; refleja la UNIQUE que impide inscribirse dos veces. */
  findMembershipByMember(
    em: EntityManager,
    loyaltyProgramId: string,
    memberTypeConceptId: string,
    memberRefId: string,
  ): Promise<LoyaltyMemberships | null> {
    return em.findOne(LoyaltyMemberships, {
      loyaltyProgramId,
      memberTypeConceptId,
      memberRefId,
    });
  }

  /** Toda mutación de saldo bloquea la membresía: el balance es un contador compartido. */
  findMembershipForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<LoyaltyMemberships | null> {
    return em.findOne(
      LoyaltyMemberships,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Membresías activas del programa, tomadas con `FOR UPDATE SKIP LOCKED`: el
   * barrido de expiración procesa por lotes y no debe esperar a otra pasada.
   */
  findMembershipsForSweep(
    em: EntityManager,
    loyaltyProgramId: string,
    activeStatusConceptId: string,
    limit: number,
  ): Promise<LoyaltyMemberships[]> {
    return em.find(
      LoyaltyMemberships,
      { loyaltyProgramId, statusConceptId: activeStatusConceptId },
      { limit, lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE },
    );
  }

  // --- Ledger de puntos (UC-51-03, 04, 06, 11, 13) ---

  /**
   * Crea create ledger entry.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create ledger entry conforme al contrato `PointsLedgerEntries`.
   */
  createLedgerEntry(
    em: EntityManager,
    data: CreateLedgerEntryData,
  ): PointsLedgerEntries {
    return em.create(
      PointsLedgerEntries,
      {
        loyaltyMembershipId: data.loyaltyMembershipId,
        directionConceptId: data.directionConceptId,
        points: data.points,
        reasonConceptId: data.reasonConceptId,
        balanceAfter: data.balanceAfter,
        sourceType: data.sourceType,
        sourceRefId: data.sourceRefId,
        earningRuleId: data.earningRuleId,
        expiresAt: data.expiresAt,
        idempotencyKey: data.idempotencyKey,
        occurredAt: data.occurredAt ?? new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /** La clave de idempotencia es lo que convierte un reintento en una lectura. */
  findLedgerEntryByKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<PointsLedgerEntries | null> {
    return em.findOne(PointsLedgerEntries, { idempotencyKey });
  }

  /** Ledger completo de la membresía: es la fuente de verdad del saldo (REC 3.3). */
  findLedgerByMembership(
    em: EntityManager,
    loyaltyMembershipId: string,
  ): Promise<PointsLedgerEntries[]> {
    return em.find(
      PointsLedgerEntries,
      { loyaltyMembershipId },
      { orderBy: { recordedAt: 'ASC' } },
    );
  }

  /** Acumulaciones de una regla dentro del periodo, para verificar su tope. */
  findEarnEntriesInPeriod(
    em: EntityManager,
    loyaltyMembershipId: string,
    earningRuleId: string,
    since: Date,
  ): Promise<PointsLedgerEntries[]> {
    return em.find(PointsLedgerEntries, {
      loyaltyMembershipId,
      earningRuleId,
      recordedAt: { $gte: since },
    });
  }

  /** Acumulaciones vencidas y aún no compensadas por una entrada de expiración. */
  findExpirableEntries(
    em: EntityManager,
    loyaltyMembershipId: string,
    earnDirectionConceptId: string,
    now: Date,
  ): Promise<PointsLedgerEntries[]> {
    return em.find(
      PointsLedgerEntries,
      {
        loyaltyMembershipId,
        directionConceptId: earnDirectionConceptId,
        expiresAt: { $ne: null, $lte: now },
      },
      { orderBy: { recordedAt: 'ASC' } },
    );
  }

  // --- Referidos (UC-51-12, UC-51-13) ---

  /**
   * Obtiene find referral program by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find referral program by id conforme al contrato `Promise<ReferralPrograms | null>`.
   */
  findReferralProgramById(
    em: EntityManager,
    id: string,
  ): Promise<ReferralPrograms | null> {
    return em.findOne(ReferralPrograms, { id });
  }

  /**
   * Crea create referral.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create referral conforme al contrato `MemberReferrals`.
   */
  createReferral(em: EntityManager, data: CreateReferralData): MemberReferrals {
    return em.create(
      MemberReferrals,
      {
        referralProgramId: data.referralProgramId,
        referrerUserId: data.referrerUserId,
        referralCode: data.referralCode,
        refereeContact: data.refereeContact,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find referral by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param referralCode - Valor de referral code requerido por la operación.
   * @returns Resultado de find referral by code conforme al contrato `Promise<MemberReferrals | null>`.
   */
  findReferralByCode(
    em: EntityManager,
    referralCode: string,
  ): Promise<MemberReferrals | null> {
    return em.findOne(MemberReferrals, { referralCode });
  }

  /**
   * Obtiene find referral for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find referral for update conforme al contrato `Promise<MemberReferrals | null>`.
   */
  findReferralForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<MemberReferrals | null> {
    return em.findOne(
      MemberReferrals,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Referidos ya emitidos por el usuario, para contrastar `max_referrals_per_user`. */
  findReferralsByReferrer(
    em: EntityManager,
    referralProgramId: string,
    referrerUserId: string,
  ): Promise<MemberReferrals[]> {
    return em.find(MemberReferrals, { referralProgramId, referrerUserId });
  }
}
