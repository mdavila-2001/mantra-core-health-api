import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CdsRules } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una regla CDS en borrador. */
export interface CreateCdsRuleData {
  tenantId?: string;
  code: string;
  name: string;
  ruleTypeConceptId: string;
  severityConceptId: string;
  logicJson?: unknown;
  messageTemplate?: string;
  isActive: boolean;
  version?: number;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.cds_rules`. */
@Injectable()
export class CdsRulesRepository {
  findById(em: EntityManager, id: string): Promise<CdsRules | null> {
    return em.findOne(CdsRules, { id });
  }

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
