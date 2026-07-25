import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AccessPolicies } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de alta de una política de acceso ABAC (por tenant). */
export interface CreateAccessPolicyData {
  tenantId: string;
  name: string;
  effectConceptId: string;
  targetResource?: string;
  conditionJson?: unknown;
  priority?: number;
  actorUserId?: string;
}

/** Acceso a datos de `authz.access_policies`. */
@Injectable()
export class AccessPoliciesRepository {
  /** Política activa en la misma prioridad para un mismo target (desempate único). */
  findByTenantTargetPriority(
    em: EntityManager,
    tenantId: string,
    targetResource: string | undefined,
    priority: number | undefined,
  ): Promise<AccessPolicies | null> {
    return em.findOne(AccessPolicies, {
      tenantId,
      targetResource: targetResource ?? null,
      priority: priority ?? null,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Políticas activas de un tenant para un recurso, ordenadas por prioridad. */
  findActiveForTarget(
    em: EntityManager,
    tenantId: string,
    targetResource: string,
  ): Promise<AccessPolicies[]> {
    return em.find(
      AccessPolicies,
      {
        tenantId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        $or: [{ targetResource }, { targetResource: null }],
      },
      { orderBy: { priority: 'asc' } },
    );
  }

  create(em: EntityManager, data: CreateAccessPolicyData): AccessPolicies {
    return em.create(
      AccessPolicies,
      {
        tenantId: data.tenantId,
        name: data.name,
        effectConceptId: data.effectConceptId,
        targetResource: data.targetResource,
        conditionJson: data.conditionJson,
        priority: data.priority,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
