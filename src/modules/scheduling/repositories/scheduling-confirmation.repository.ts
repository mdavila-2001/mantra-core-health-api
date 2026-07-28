import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { LockMode } from '@mikro-orm/core';
import { createdBy } from '../../../common';
import {
  BookingConfirmationRules,
  type RuleCondition,
} from '../entities';

export interface CreateConfirmationRuleData {
  tenantId: string;
  scopeTypeConceptId: string;
  scopeId?: string;
  priority: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  conditionJson: RuleCondition;
  decisionConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos del motor de confirmación automática y del historial de transiciones. */
@Injectable()
export class SchedulingConfirmationRepository {
  createRule(
    em: EntityManager,
    data: CreateConfirmationRuleData,
  ): BookingConfirmationRules {
    return em.create(
      BookingConfirmationRules,
      {
        tenantId: data.tenantId,
        scopeTypeConceptId: data.scopeTypeConceptId,
        scopeId: data.scopeId,
        priority: data.priority,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        conditionJson: data.conditionJson,
        decisionConceptId: data.decisionConceptId,
        enabled: true,
        version: 1,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findRuleByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<BookingConfirmationRules | null> {
    return em.findOne(
      BookingConfirmationRules,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findRulesByTenant(
    em: EntityManager,
    tenantId: string,
    onlyEnabled: boolean,
  ): Promise<BookingConfirmationRules[]> {
    return em.find(
      BookingConfirmationRules,
      onlyEnabled ? { tenantId, enabled: true } : { tenantId },
      { orderBy: { priority: 'ASC', createdAt: 'ASC' } },
    );
  }

  /**
   * Reglas activas y vigentes de un tenant en un instante: `enabled=true`,
   * `effective_from <= now` y (`effective_to` nula o futura). El filtro de alcance
   * y el desempate por especificidad/prioridad los aplica el servicio en memoria.
   */
  findActiveRules(
    em: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<BookingConfirmationRules[]> {
    return em.find(
      BookingConfirmationRules,
      {
        tenantId,
        enabled: true,
        effectiveFrom: { $lte: now },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gt: now } }],
      },
      { orderBy: { priority: 'ASC', createdAt: 'ASC' } },
    );
  }
}
