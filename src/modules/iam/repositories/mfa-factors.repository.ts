import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MfaFactors } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Alta de un factor MFA en estado PENDING. */
export interface CreateMfaFactorData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a factor type concept.
   */
  factorTypeConceptId: string;
  /**
   * Valor de label mantenido por la instancia.
   */
  label?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `iam.mfa_factors`. */
@Injectable()
export class MfaFactorsRepository {
  /** Crea un factor MFA PENDING (sin flush). */
  create(em: EntityManager, data: CreateMfaFactorData): MfaFactors {
    return em.create(
      MfaFactors,
      {
        userId: data.userId,
        factorTypeConceptId: data.factorTypeConceptId,
        label: data.label,
        stateConceptId: CONCEPTS.STATE_PENDING,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Factor por id que pertenece al usuario indicado. */
  findByIdAndUser(
    em: EntityManager,
    id: string,
    userId: string,
  ): Promise<MfaFactors | null> {
    return em.findOne(MfaFactors, { id, userId });
  }
  /** Factores de MFA dados de alta por el usuario. */
  findByUser(em: EntityManager, userId: string): Promise<MfaFactors[]> {
    return em.find(MfaFactors, { userId }, { orderBy: { createdAt: 'DESC' } });
  }
}
