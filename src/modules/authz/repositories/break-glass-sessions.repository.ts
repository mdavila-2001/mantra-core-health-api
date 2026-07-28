import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BreakGlassSessions } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de una sesión break-the-glass (anulación de emergencia). */
export interface CreateBreakGlassSessionData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a patient ref.
   */
  patientRefId: string;
  /**
   * Identificador asociado a patient ref type concept.
   */
  patientRefTypeConceptId: string;
  /**
   * Valor de justification mantenido por la instancia.
   */
  justification: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId: string;
  /**
   * Identificador asociado a granted by policy.
   */
  grantedByPolicyId?: string;
  /**
   * Valor de activated at mantenido por la instancia.
   */
  activatedAt: Date;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `authz.break_glass_sessions`. */
@Injectable()
export class BreakGlassSessionsRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `BreakGlassSessions`.
   */
  create(
    em: EntityManager,
    data: CreateBreakGlassSessionData,
  ): BreakGlassSessions {
    return em.create(
      BreakGlassSessions,
      {
        tenantId: data.tenantId,
        userId: data.userId,
        patientRefId: data.patientRefId,
        patientRefTypeConceptId: data.patientRefTypeConceptId,
        justification: data.justification,
        reasonConceptId: data.reasonConceptId,
        grantedByPolicyId: data.grantedByPolicyId,
        activatedAt: data.activatedAt,
        expiresAt: data.expiresAt,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
