import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { touch, type AuthenticatedUser } from '../../../common';
import { PaymentsWalletsRepository } from '../repositories';

/** Petición de acreditar saldo a una billetera (contrato entre dominios). */
export interface CreditWalletInput {
  tenantId: string;
  ownerTypeConceptId: string;
  ownerRefId: string;
  walletTypeConceptId: string;
  currencyConceptId: string;
  walletStatusConceptId: string;
  amount: string;
  directionConceptId: string;
  entryTypeConceptId: string;
  idempotencyKey: string;
  sourceType?: string;
  sourceRefId?: string;
}

/** Resultado de un abono a billetera. */
export interface CreditWalletResult {
  walletId: string;
  entryId: string;
  balanceAfter: string;
  /** `true` si la clave de idempotencia ya existía y no se volvió a abonar. */
  duplicate: boolean;
}

/**
 * Servicio propietario de la billetera de pagos. Es el ÚNICO punto por el que
 * otros dominios (p. ej. el premio `wallet_credit` de referidos en promotions)
 * acreditan saldo, en la transacción del llamador. Mantiene la invariante de
 * saldo y la idempotencia dentro del dominio de pagos, en vez de que un
 * repositorio ajeno escriba las tablas de pagos directamente.
 */
@Injectable()
export class WalletsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param walletsRepo - Repositorio de billeteras y su ledger.
   */
  constructor(private readonly walletsRepo: PaymentsWalletsRepository) {}

  /** Redondeo monetario a 2 decimales para el saldo. */
  private round(value: number): string {
    return (Math.round(value * 100) / 100).toFixed(2);
  }

  /**
   * Acredita `amount` a la billetera del propietario en la moneda dada, dentro de
   * la transacción `tx` del llamador. Idempotente por `idempotencyKey` (UNIQUE en
   * el ledger): un reintento devuelve el asiento existente sin re-abonar. Crea la
   * billetera si no existe y la bloquea (`FOR UPDATE`) para el read-modify-write.
   */
  async creditWallet(
    tx: EntityManager,
    input: CreditWalletInput,
    actor: AuthenticatedUser,
  ): Promise<CreditWalletResult> {
    const existing = await this.walletsRepo.findWalletLedgerEntryByKey(
      tx,
      input.idempotencyKey,
    );
    if (existing) {
      return {
        walletId: existing.walletId,
        entryId: existing.id,
        balanceAfter: existing.balanceAfter ?? '0',
        duplicate: true,
      };
    }

    let wallet = await this.walletsRepo.findWalletForUpdate(tx, {
      tenantId: input.tenantId,
      ownerTypeConceptId: input.ownerTypeConceptId,
      ownerRefId: input.ownerRefId,
      currencyConceptId: input.currencyConceptId,
    });
    if (!wallet) {
      wallet = this.walletsRepo.createWallet(tx, {
        tenantId: input.tenantId,
        ownerTypeConceptId: input.ownerTypeConceptId,
        ownerRefId: input.ownerRefId,
        walletTypeConceptId: input.walletTypeConceptId,
        currencyConceptId: input.currencyConceptId,
        statusConceptId: input.walletStatusConceptId,
        actorUserId: actor.id,
      });
    }

    const balanceAfter = this.round(
      Number(wallet.availableBalance ?? '0') + Number(input.amount),
    );
    const entry = this.walletsRepo.createWalletLedgerEntry(tx, {
      walletId: wallet.id,
      directionConceptId: input.directionConceptId,
      amount: input.amount,
      currencyConceptId: input.currencyConceptId,
      entryTypeConceptId: input.entryTypeConceptId,
      balanceAfter,
      idempotencyKey: input.idempotencyKey,
      sourceType: input.sourceType,
      sourceRefId: input.sourceRefId,
      recordedByUserId: actor.id,
    });
    wallet.availableBalance = balanceAfter;
    touch(wallet, actor.id);

    return {
      walletId: wallet.id,
      entryId: entry.id,
      balanceAfter,
      duplicate: false,
    };
  }
}
