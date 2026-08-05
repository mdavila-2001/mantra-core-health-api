import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Wallets, WalletLedgerEntries } from '../entities';
import { createdBy } from '../../../common';

/** Datos para localizar/crear una billetera del propietario en una moneda. */
export interface FindOrCreateWalletData {
  tenantId: string;
  ownerTypeConceptId: string;
  ownerRefId: string;
  walletTypeConceptId: string;
  currencyConceptId: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Datos de un asiento del ledger de billetera. */
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

/**
 * Acceso a `payments.wallets` y `payments.wallet_ledger_entries`. La billetera
 * pertenece al dominio de pagos: cualquier otro módulo que necesite acreditar
 * saldo (p. ej. el premio `wallet_credit` de referidos) debe pasar por el
 * `WalletsService`, no tocar estas tablas directamente (evita
 * `DIRECT_CROSS_DOMAIN_ACCESS` y preserva las invariantes de saldo).
 */
@Injectable()
export class PaymentsWalletsRepository {
  /**
   * Billetera del propietario en la moneda dada, tomada con `FOR UPDATE`: el
   * saldo es un contador compartido y toda mutación lo bloquea.
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

  /** Crea una billetera con saldos en cero. */
  createWallet(em: EntityManager, data: FindOrCreateWalletData): Wallets {
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

  /** La clave de idempotencia (UNIQUE) convierte un reintento en una lectura. */
  findWalletLedgerEntryByKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<WalletLedgerEntries | null> {
    return em.findOne(WalletLedgerEntries, { idempotencyKey });
  }

  /** Crea un asiento del ledger de billetera. */
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
}
