import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common';
import {
  DIR,
  TENANT_TYPE_CODE_BY_CONCEPT_ID,
  type TenantTypeCode,
} from '../../../directory/directory.concepts';
import { TenantMemberships, Tenants } from '../../../directory/entities';
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
    if (tenantIds.length === 0) return { tenantNames: {}, tenantTypes: {} };
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
    return { tenantNames, tenantTypes };
  }
}
