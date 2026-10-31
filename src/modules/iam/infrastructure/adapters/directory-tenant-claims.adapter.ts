import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common';
import {
  DIR,
  TENANT_TYPE_CODE_BY_CONCEPT_ID,
  type TenantTypeCode,
} from '../../../directory/directory.concepts';
import { TenantMemberships, Tenants } from '../../../directory/entities';
import { PracticeSettings, Practices } from '../../../practice/entities';
import {
  resolveAccountKind,
  type AccountKind,
} from '../../domain/session-policy';

/** Clave del interruptor por organización de la cuenta de organización. */
export const ORG_ACCOUNT_MODE_KEY = 'org_account_mode';
import type {
  TenantClaimsPort,
  TenantDisplay,
} from '../../application/ports/tenant-claims.port';

/**
 * Lectura cross-dominio de `directory` acotada al límite de autenticación: al
 * emitir el token se resuelven las membresías de tenant del sujeto.
 */
@Injectable()
export class DirectoryTenantClaimsAdapter implements TenantClaimsPort {
  async listActiveTenantIds(
    em: EntityManager,
    userId: string,
  ): Promise<string[]> {
    const memberships =
      (await em.find(TenantMemberships, {
        userId,
        statusConceptId: {
          $in: [DIR.MEMBERSHIP_ACTIVE, CONCEPTS.MEMBERSHIP_ACTIVE],
        },
      })) ?? [];
    return [...new Set(memberships.map((m) => m.tenantId))];
  }

  /**
   * Una sola consulta para los dos mapas: el tipo sale de la misma fila que ya
   * se lee para el nombre. Prefiere el nombre comercial sobre el legal; el
   * código queda de último recurso para que la lista nunca tenga una entrada en
   * blanco. Un `tenant_type_concept_id` que no esté en
   * {@link TENANT_TYPE_CODE_BY_CONCEPT_ID} no tiene entrada en `tenantTypes`.
   */
  async describeTenants(
    em: EntityManager,
    tenantIds: readonly string[],
  ): Promise<TenantDisplay> {
    if (tenantIds.length === 0) {
      return { tenantNames: {}, tenantTypes: {}, tenantAccountKinds: {} };
    }
    const rows = await em.find(Tenants, { id: { $in: [...tenantIds] } });
    const tenantNames = Object.fromEntries(
      rows.map((row) => [row.id, row.tradeName || row.legalName || row.code]),
    );
    const tenantTypes = Object.fromEntries(
      rows
        .map(
          (row) =>
            [
              row.id,
              TENANT_TYPE_CODE_BY_CONCEPT_ID[row.tenantTypeConceptId],
            ] as const,
        )
        .filter(
          (entry): entry is readonly [string, TenantTypeCode] =>
            entry[1] !== undefined,
        ),
    );
    return {
      tenantNames,
      tenantTypes,
      tenantAccountKinds: await this.accountKinds(em, tenantIds, tenantTypes),
    };
  }

  /**
   * Tipo de cuenta de cada tenant: el interruptor `org_account_mode` vive en
   * `practice.practice_settings` de las prácticas de la organización (no existe
   * una tabla de ajustes por tenant) y solo enciende hospitales, clínicas y
   * prestadores.
   */
  private async accountKinds(
    em: EntityManager,
    tenantIds: readonly string[],
    tenantTypes: Record<string, string>,
  ): Promise<Record<string, AccountKind>> {
    const practices = await em.find(Practices, {
      tenantId: { $in: [...tenantIds] },
    });
    const settings =
      practices.length === 0
        ? []
        : await em.find(PracticeSettings, {
            practiceId: { $in: practices.map((p) => p.id) },
            settingKey: ORG_ACCOUNT_MODE_KEY,
          });
    const tenantOfPractice = new Map(practices.map((p) => [p.id, p.tenantId]));
    return Object.fromEntries(
      tenantIds.map((tenantId) => [
        tenantId,
        resolveAccountKind(
          tenantTypes[tenantId],
          settings
            .filter((s) => tenantOfPractice.get(s.practiceId) === tenantId)
            .map((s) => s.valueJson),
        ),
      ]),
    );
  }
}
