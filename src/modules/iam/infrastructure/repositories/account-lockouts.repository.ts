import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AccountLockouts } from '../../entities';
import {
  CONCEPTS,
  createdBy,
  touch,
  withSystemWrite,
} from '../../../../common';

/** Alta de un bloqueo de cuenta ACTIVO. */
export interface CreateLockoutData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId: string;
  /**
   * Valor de failed attempts mantenido por la instancia.
   */
  failedAttempts?: number;
  /**
   * Valor de source ip mantenido por la instancia.
   */
  sourceIp?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `iam.account_lockouts`. */
@Injectable()
export class AccountLockoutsRepository {
  /** Crea un bloqueo ACTIVO (sin flush). */
  create(em: EntityManager, data: CreateLockoutData): AccountLockouts {
    return em.create(
      AccountLockouts,
      {
        userId: data.userId,
        reasonConceptId: data.reasonConceptId,
        statusConceptId: CONCEPTS.LOCKOUT_ACTIVE,
        failedAttempts: data.failedAttempts,
        lockedAt: new Date(),
        sourceIp: data.sourceIp,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Escribe el bloqueo ACTIVO de una cuenta por fallos repetidos: si ya hay uno,
   * actualiza el conteo; si no, lo abre.
   *
   * `iam.account_lockouts` lleva `tenant_id` nulo (el bloqueo es de la cuenta, no
   * de una organización) y, con RLS y el rol `mantra_app`, la política lo rechaza
   * salvo con contexto de sistema. El permiso se abre solo para esta escritura
   * (`withSystemWrite`): lo pendiente del llamador se vuelca antes, la búsqueda y
   * el alta/actualización filtran por `data.userId` y el contexto se restaura en
   * un `finally`. Sin RLS es un alta/actualización normal.
   *
   * @param tx - Transacción activa del login fallido.
   * @param data - Cuenta, razón, conteo e IP de origen.
   */
  async lockForFailedAttempts(
    tx: EntityManager,
    data: CreateLockoutData,
  ): Promise<void> {
    await withSystemWrite(tx, async (db) => {
      const existing = await this.findActiveForUser(db, data.userId);
      if (existing) {
        existing.failedAttempts = data.failedAttempts;
        touch(existing, data.userId);
        return;
      }
      this.create(db, data);
    });
  }

  /**
   * Escribe el bloqueo ACTIVO manual que dicta una persona administradora.
   * Mismo permiso acotado que {@link lockForFailedAttempts}: solo esta fila, solo
   * para `data.userId`.
   *
   * @param tx - Transacción activa de la acción administrativa.
   * @param data - Cuenta, razón y quien bloquea.
   */
  async lockManually(
    tx: EntityManager,
    data: CreateLockoutData,
  ): Promise<void> {
    await withSystemWrite(tx, async (db) => {
      this.create(db, data);
    });
  }

  /** Bloqueo ACTIVO del usuario, si existe. */
  findActiveForUser(
    em: EntityManager,
    userId: string,
  ): Promise<AccountLockouts | null> {
    return em.findOne(AccountLockouts, {
      userId,
      statusConceptId: CONCEPTS.LOCKOUT_ACTIVE,
    });
  }
}
