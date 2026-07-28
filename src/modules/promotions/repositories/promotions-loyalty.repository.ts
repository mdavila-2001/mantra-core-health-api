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
// La billetera vive en el módulo de pagos; el crédito de un referido con premio
// `wallet_credit` la acredita reutilizando esas entidades (MikroORM las descubre
// globalmente, así que el `em` opera sobre ellas sin acoplarse al servicio 42B).
import { Wallets, WalletLedgerEntries } from '../../payments/entities';
import { createdBy } from '../../../common';

export interface CreateLoyaltyProgramData {
  tenantId: string;
  code: string;
  name: string;
  programTypeConceptId: string;
  pointsCurrencyName?: string;
  pointToCurrencyRate?: string;
  currencyConceptId?: string;
  expiryPolicyConceptId?: string;
  pointsExpiryDays?: number;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateTierData {
  loyaltyProgramId: string;
  code: string;
  name: string;
  minPoints: string;
  multiplier?: string;
  benefitsJson?: unknown;
  ordinal: number;
  actorUserId?: string;
}

export interface CreateEarningRuleData {
  loyaltyProgramId: string;
  code: string;
  name: string;
  eventTypeConceptId: string;
  awardTypeConceptId: string;
  pointsAmount?: string;
  creditAmount?: string;
  currencyConceptId?: string;
  conditionJson?: unknown;
  capPerPeriod?: number;
  periodConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  isActive: boolean;
  actorUserId?: string;
}

export interface CreateMembershipData {
  loyaltyProgramId: string;
  memberTypeConceptId: string;
  memberRefId: string;
  currentTierId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateLedgerEntryData {
  loyaltyMembershipId: string;
  directionConceptId: string;
  points: string;
  reasonConceptId: string;
  balanceAfter: string;
  sourceType?: string;
  sourceRefId?: string;
  earningRuleId?: string;
  expiresAt?: Date;
  idempotencyKey: string;
  occurredAt?: Date;
  recordedByUserId?: string;
}

export interface CreateWalletData {
  tenantId: string;
  ownerTypeConceptId: string;
  ownerRefId: string;
  walletTypeConceptId: string;
  currencyConceptId: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateWalletLedgerEntryData {
  walletId: string;
  directionConceptId: string;
  amount: string;
  currencyConceptId: string;
  entryTypeConceptId: string;
  balanceAfter: string;
  idempotencyKey: string;
  sourceType?: string;
  sourceRefId?: string;
  recordedByUserId?: string;
}

export interface CreateReferralData {
  referralProgramId: string;
  referrerUserId: string;
  referralCode: string;
  refereeContact?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a la parte de lealtad de `promotions.*`: programas, niveles, reglas de
 * acumulación, membresías, ledger de puntos y referidos. Sin reglas de negocio.
 */
@Injectable()
export class PromotionsLoyaltyRepository {
  // --- Programas, niveles y reglas (UC-51-01) ---

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

  findProgramById(
    em: EntityManager,
    id: string,
  ): Promise<LoyaltyPrograms | null> {
    return em.findOne(LoyaltyPrograms, { id });
  }

  findProgramByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<LoyaltyPrograms | null> {
    return em.findOne(LoyaltyPrograms, { tenantId, code });
  }

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

  findEarningRuleById(
    em: EntityManager,
    id: string,
  ): Promise<EarningRules | null> {
    return em.findOne(EarningRules, { id });
  }

  // --- Membresías (UC-51-02, UC-51-05) ---

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

  // --- Billetera del referido (UC-51-13, premio wallet_credit) ---

  /**
   * Billetera del propietario en la moneda del premio, tomada con `FOR UPDATE`:
   * el saldo es un contador compartido, mismo patrón de bloqueo que la membresía
   * en earn/redeem.
   */
  findWalletForUpdate(
    em: EntityManager,
    data: {
      tenantId: string;
      ownerTypeConceptId: string;
      ownerRefId: string;
      currencyConceptId: string;
    },
  ): Promise<Wallets | null> {
    return em.findOne(
      Wallets,
      {
        tenantId: data.tenantId,
        ownerTypeConceptId: data.ownerTypeConceptId,
        ownerRefId: data.ownerRefId,
        currencyConceptId: data.currencyConceptId,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createWallet(em: EntityManager, data: CreateWalletData): Wallets {
    return em.create(
      Wallets,
      {
        tenantId: data.tenantId,
        ownerTypeConceptId: data.ownerTypeConceptId,
        ownerRefId: data.ownerRefId,
        walletTypeConceptId: data.walletTypeConceptId,
        currencyConceptId: data.currencyConceptId,
        availableBalance: '0',
        pendingBalance: '0',
        reservedBalance: '0',
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** La clave de idempotencia (UNIQUE) convierte un reintento del referido en lectura. */
  findWalletLedgerEntryByKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<WalletLedgerEntries | null> {
    return em.findOne(WalletLedgerEntries, { idempotencyKey });
  }

  createWalletLedgerEntry(
    em: EntityManager,
    data: CreateWalletLedgerEntryData,
  ): WalletLedgerEntries {
    return em.create(
      WalletLedgerEntries,
      {
        walletId: data.walletId,
        directionConceptId: data.directionConceptId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        entryTypeConceptId: data.entryTypeConceptId,
        balanceAfter: data.balanceAfter,
        sourceType: data.sourceType,
        sourceRefId: data.sourceRefId,
        idempotencyKey: data.idempotencyKey,
        occurredAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  // --- Referidos (UC-51-12, UC-51-13) ---

  findReferralProgramById(
    em: EntityManager,
    id: string,
  ): Promise<ReferralPrograms | null> {
    return em.findOne(ReferralPrograms, { id });
  }

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

  findReferralByCode(
    em: EntityManager,
    referralCode: string,
  ): Promise<MemberReferrals | null> {
    return em.findOne(MemberReferrals, { referralCode });
  }

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
