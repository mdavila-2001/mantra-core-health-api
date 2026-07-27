import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AccountLockouts } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Alta de un bloqueo de cuenta ACTIVO. */
export interface CreateLockoutData {
  userId: string;
  reasonConceptId: string;
  failedAttempts?: number;
  sourceIp?: string;
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
