import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy, touch } from '../../../../common';
import { AUTHZ } from '../../../authz/authz.concepts';
import { IpAccessRules } from '../../../authz/entities';
import type {
  IpAccessRulesPort,
  NetworkRuleRecord,
  NewNetworkRule,
} from '../../application/ports/ip-access-rules.port';
import type { IpRuleType } from '../../domain/network-rules';

const TYPE_BY_CONCEPT: Readonly<Record<string, IpRuleType>> = {
  [AUTHZ.IP_RULE_ALLOW]: 'ALLOW',
  [AUTHZ.IP_RULE_DENY]: 'DENY',
};
const CONCEPT_BY_TYPE: Readonly<Record<IpRuleType, string>> = {
  ALLOW: AUTHZ.IP_RULE_ALLOW,
  DENY: AUTHZ.IP_RULE_DENY,
};

/**
 * Lectura y escritura cross-dominio de `authz.ip_access_rules` acotada a las
 * reglas de toda la organización. Una fila con un tipo de regla que este módulo
 * no conoce no se evalúa (ni permite ni niega).
 */
@Injectable()
export class AuthzIpAccessRulesAdapter implements IpAccessRulesPort {
  async listEffective(
    em: EntityManager,
    tenantIds: readonly string[],
    now: Date,
  ): Promise<NetworkRuleRecord[]> {
    if (tenantIds.length === 0) return [];
    const rows = await em.find(IpAccessRules, {
      tenantId: { $in: [...tenantIds] },
      scopeConceptId: AUTHZ.SCOPE_TENANT,
      subjectRefId: null,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    return rows
      .filter(
        (r) =>
          (!r.validFrom || r.validFrom <= now) &&
          (!r.validTo || r.validTo > now),
      )
      .flatMap((r) => toRecord(r));
  }

  async listActive(
    em: EntityManager,
    tenantId: string,
  ): Promise<NetworkRuleRecord[]> {
    const rows = await em.find(
      IpAccessRules,
      {
        tenantId,
        scopeConceptId: AUTHZ.SCOPE_TENANT,
        subjectRefId: null,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      },
      { orderBy: { priority: 'asc', createdAt: 'asc', id: 'asc' } },
    );
    return rows.flatMap((r) => toRecord(r));
  }

  async countActive(em: EntityManager): Promise<number> {
    // Lectura de arranque, sin organización: con RLS encendido la política
    // oculta las filas, así que se abre el contexto de sistema SOLO durante
    // esta transacción (solo cuenta; no lee contenido de ninguna regla).
    return em.transactional(async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      return tx.count(IpAccessRules, {
        scopeConceptId: AUTHZ.SCOPE_TENANT,
        subjectRefId: null,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
    });
  }

  async replace(
    em: EntityManager,
    tenantId: string,
    rules: readonly NewNetworkRule[],
    actorUserId: string,
  ): Promise<void> {
    const current = await em.find(IpAccessRules, {
      tenantId,
      scopeConceptId: AUTHZ.SCOPE_TENANT,
      subjectRefId: null,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    for (const row of current) {
      row.statusConceptId = CONCEPTS.STATE_REVOKED;
      touch(row, actorUserId);
    }
    rules.forEach((rule, index) => {
      em.create(
        IpAccessRules,
        {
          tenantId,
          scopeConceptId: AUTHZ.SCOPE_TENANT,
          ruleTypeConceptId: CONCEPT_BY_TYPE[rule.type],
          cidr: rule.cidr,
          description: rule.description,
          priority: index + 1,
          validFrom: rule.validFrom,
          validTo: rule.validTo,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          ...createdBy(actorUserId),
        },
        { partial: true },
      );
    });
  }
}

/** Fila a registro; `[]` si el tipo de regla no es uno que este módulo evalúe. */
function toRecord(row: IpAccessRules): NetworkRuleRecord[] {
  const type = TYPE_BY_CONCEPT[row.ruleTypeConceptId];
  if (!type) return [];
  return [
    {
      id: row.id,
      tenantId: row.tenantId,
      type,
      cidr: row.cidr,
      description: row.description ?? undefined,
      validFrom: row.validFrom ?? undefined,
      validTo: row.validTo ?? undefined,
    },
  ];
}
