import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BreakGlassSessions } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de una sesión break-the-glass (anulación de emergencia). */
export interface CreateBreakGlassSessionData {
  tenantId: string;
  userId: string;
  patientRefId: string;
  patientRefTypeConceptId: string;
  justification: string;
  reasonConceptId: string;
  grantedByPolicyId?: string;
  activatedAt: Date;
  expiresAt: Date;
  actorUserId?: string;
}

/** Acceso a datos de `authz.break_glass_sessions`. */
@Injectable()
export class BreakGlassSessionsRepository {
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
