import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy } from '../../../common';
import { GovernanceRules } from '../entities';

/** Datos para crear una regla de gobierno de la organización (L1). */
export interface CreateGovernanceRuleData {
  /** Organización (la del contexto verificado, no la del cuerpo). */
  readonly tenantId: string;
  /** Concepto del tipo de regla (`delegated_access:GOV_RULE_*`). */
  readonly ruleKindConceptId: string;
  /** Plantilla a la que aplica; ausente = todas (obligatorio en `CEILING`). */
  readonly roleTemplateCode?: string;
  /** Átomo o `prefijo.*`. */
  readonly permissionPattern: string;
  /** Cuerpo de la regla según su tipo. */
  readonly ruleJson?: unknown;
  /** Versión del esquema de `rule_json`. */
  readonly ruleSchemaVersion?: number;
  /** Texto para el usuario cuando la regla niega. */
  readonly messageText?: string;
  /** Inicio de vigencia. */
  readonly validFrom?: Date;
  /** Fin de vigencia. */
  readonly validTo?: Date;
  /** Quien la crea. */
  readonly actorUserId?: string;
}

/** Filtro de la lista de reglas de una organización. */
export interface GovernanceRulesFilter {
  /** Solo este tipo de regla. */
  readonly kindConceptId?: string;
  /** Solo este estado. */
  readonly statusConceptId?: string;
}

/** Acceso a datos de `delegated_access.governance_rules` (reglas L1 de la organización). */
@Injectable()
export class GovernanceRulesRepository {
  /**
   * Reglas VIGENTES de una organización: activas y dentro de su ventana.
   * Es lo que lee la política en cada decisión (con caché por organización).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param now - Instante de evaluación.
   * @returns Las reglas en orden estable.
   */
  findActiveForTenant(
    em: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<GovernanceRules[]> {
    return em.find(
      GovernanceRules,
      {
        tenantId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        $and: [
          { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
          { $or: [{ validTo: null }, { validTo: { $gt: now } }] },
        ],
      },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Reglas de una organización (cualquier estado), con filtro opcional.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param filter - Tipo y estado opcionales.
   * @returns Las reglas en orden estable.
   */
  findByTenant(
    em: EntityManager,
    tenantId: string,
    filter: GovernanceRulesFilter = {},
  ): Promise<GovernanceRules[]> {
    return em.find(
      GovernanceRules,
      {
        tenantId,
        ...(filter.kindConceptId
          ? { ruleKindConceptId: filter.kindConceptId }
          : {}),
        ...(filter.statusConceptId
          ? { statusConceptId: filter.statusConceptId }
          : {}),
      },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Regla por id, acotada a la organización (una ajena responde igual que una inexistente).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param id - Id de la regla.
   * @returns La regla o `null`.
   */
  findById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<GovernanceRules | null> {
    return em.findOne(GovernanceRules, { tenantId, id });
  }

  /**
   * Crea una regla activa.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la regla.
   * @returns La regla creada (aún sin flush).
   */
  create(em: EntityManager, data: CreateGovernanceRuleData): GovernanceRules {
    return em.create(
      GovernanceRules,
      {
        tenantId: data.tenantId,
        ruleKindConceptId: data.ruleKindConceptId,
        roleTemplateCode: data.roleTemplateCode,
        permissionPattern: data.permissionPattern,
        ruleJson: data.ruleJson,
        ruleSchemaVersion: data.ruleSchemaVersion,
        messageText: data.messageText,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Retira una regla: nunca se borra, queda revocada con `valid_to` = ahora.
   *
   * @param row - Regla a retirar.
   * @param actorUserId - Quien la retira.
   * @param now - Instante del retiro.
   */
  retire(
    row: GovernanceRules,
    actorUserId: string | undefined,
    now: Date,
  ): void {
    row.statusConceptId = CONCEPTS.STATE_REVOKED;
    row.validTo = now;
    row.updatedAt = now;
    row.updatedByUserId = actorUserId;
  }
}
