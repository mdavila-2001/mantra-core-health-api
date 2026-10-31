import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common';
import { AUTHZ } from '../../../authz/authz.concepts';
import { IpAccessRules } from '../../../authz/entities';
import {
  evaluateNetworkRules,
  normalizeIp,
  type IpRuleFacts,
} from '../../../iam/domain/network-rules';
import type { NetworkPolicyPort } from '../../services/support-access-context.ports';

/**
 * Reglas de red de la organización (`authz.ip_access_rules`, las de TODA la
 * organización) evaluadas con la misma función pura que el login
 * (`iam/domain/network-rules.ts`): la condición `network` de un permiso no
 * duplica reglas, las reutiliza.
 */
@Injectable()
export class NetworkPolicyAdapter implements NetworkPolicyPort {
  async evaluate(
    em: EntityManager,
    tenantId: string,
    ip: string | undefined,
    now: Date,
  ): Promise<{ satisfiesOrgRules: boolean; orgHasAllowRules: boolean }> {
    const rows = await em.find(IpAccessRules, {
      tenantId,
      scopeConceptId: AUTHZ.SCOPE_TENANT,
      subjectRefId: null,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const rules: IpRuleFacts[] = [];
    for (const r of rows) {
      if (r.validFrom && r.validFrom > now) continue;
      if (r.validTo && r.validTo <= now) continue;
      if (r.ruleTypeConceptId === AUTHZ.IP_RULE_ALLOW) {
        rules.push({ type: 'ALLOW', cidr: r.cidr });
      } else if (r.ruleTypeConceptId === AUTHZ.IP_RULE_DENY) {
        rules.push({ type: 'DENY', cidr: r.cidr });
      }
    }
    const orgHasAllowRules = rules.some((r) => r.type === 'ALLOW');
    // Sin reglas «no hay restricción» en el login; aquí la condición exige redes
    // definidas (`orgHasAllowRules`) y el origen que no se puede determinar se niega.
    const verdict = evaluateNetworkRules(normalizeIp(ip), rules);
    return { satisfiesOrgRules: verdict === 'ALLOWED', orgHasAllowRules };
  }
}
