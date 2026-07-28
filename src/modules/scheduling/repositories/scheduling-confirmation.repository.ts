import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { LockMode } from '@mikro-orm/core';
import { createdBy } from '../../../common';
import { BookingConfirmationRules, type RuleCondition } from '../entities';

/**
 * Describe el contrato estructural de create confirmation rule data.
 */
export interface CreateConfirmationRuleData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a scope type concept.
   */
  scopeTypeConceptId: string;
  /**
   * Identificador asociado a scope.
   */
  scopeId?: string;
  /**
   * Valor de priority mantenido por la instancia.
   */
  priority: number;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Valor de effective to mantenido por la instancia.
   */
  effectiveTo?: Date;
  /**
   * Valor de condition json mantenido por la instancia.
   */
  conditionJson: RuleCondition;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos del motor de confirmación automática y del historial de transiciones. */
@Injectable()
export class SchedulingConfirmationRepository {
  /**
   * Crea create rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create rule conforme al contrato `BookingConfirmationRules`.
   */
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

  /**
   * Obtiene find rule by id for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find rule by id for update conforme al contrato `Promise<BookingConfirmationRules | null>`.
   */
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

  /**
   * Obtiene find rules by tenant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param onlyEnabled - Valor de only enabled requerido por la operación.
   * @returns Resultado de find rules by tenant conforme al contrato `Promise<BookingConfirmationRules[]>`.
   */
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
