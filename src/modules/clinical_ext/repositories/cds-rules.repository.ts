import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CdsRules } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una regla CDS en borrador. */
export interface CreateCdsRuleData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a rule type concept.
   */
  ruleTypeConceptId: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId: string;
  /**
   * Valor de logic json mantenido por la instancia.
   */
  logicJson?: unknown;
  /**
   * Valor de message template mantenido por la instancia.
   */
  messageTemplate?: string;
  /**
   * Valor de is active mantenido por la instancia.
   */
  isActive: boolean;
  /**
   * Valor de version mantenido por la instancia.
   */
  version?: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.cds_rules`. */
@Injectable()
export class CdsRulesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<CdsRules | null>`.
   */
  findById(em: EntityManager, id: string): Promise<CdsRules | null> {
    return em.findOne(CdsRules, { id });
  }

  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<CdsRules | null>`.
   */
  findByCode(em: EntityManager, code: string): Promise<CdsRules | null> {
    return em.findOne(CdsRules, { code });
  }

  /** Reglas activas de un tenant (o globales) para una pasada de evaluación. */
  findActive(
    em: EntityManager,
    statusConceptId: string,
    tenantId?: string,
  ): Promise<CdsRules[]> {
    return em.find(CdsRules, {
      isActive: true,
      statusConceptId,
      ...(tenantId ? { tenantId } : {}),
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `CdsRules`.
   */
  create(em: EntityManager, data: CreateCdsRuleData): CdsRules {
    return em.create(
      CdsRules,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        ruleTypeConceptId: data.ruleTypeConceptId,
        severityConceptId: data.severityConceptId,
        logicJson: data.logicJson,
        messageTemplate: data.messageTemplate,
        isActive: data.isActive,
        version: data.version ?? 1,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
