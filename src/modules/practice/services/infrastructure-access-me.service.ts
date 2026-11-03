import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import type { InfraRole } from '../domain/ops/infra-scope';
import type {
  InfraAccessMeDto,
  InfraAccessSiteDto,
} from '../dto/infrastructure-access-me.dto';
import type { PracticeSites } from '../entities';
import { InfrastructureAccessService } from './infrastructure-access.service';

/** Prefijos de acciones que la UI de infraestructura refleja. */
const PREFIXES = ['f2.', 'f3.', 'f4.', 'f5'];
/** Tope de sedes por tenant (lectura acotada). */
const MAX_SITES = 200;

/**
 * `GET /practice/infrastructure-access/me` (pedido de la web W-F2F3, decisión
 * del orquestador): las sedes del tenant activo donde el actor tiene algún rol
 * de §0.3, con roles de nivel sede, asignaciones de unidad/espacio y acciones
 * permitidas, **del mismo evaluador** que decide cada endpoint. Es lo que la
 * UI refleja (S1); no autoriza nada.
 */
@Injectable()
export class InfrastructureAccessMeService {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
  ) {}

  /**
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async me(
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<InfraAccessMeDto> {
    const em = this.em.fork();
    const rows = await em.execute<
      {
        id: string;
        practice_id: string;
        branch_id: string | null;
        code: string;
        name: string;
        time_zone: string | null;
      }[]
    >(
      `SELECT s.id, s.practice_id, s.branch_id, s.code, s.name,
              coalesce(s.time_zone, p.time_zone) AS time_zone
         FROM practice.practice_sites s
         JOIN practice.practices p ON p.id = s.practice_id
        WHERE p.tenant_id = ?
        ORDER BY s.name, s.id
        LIMIT ${MAX_SITES}`,
      [tenantId],
      'all',
    );
    const sites: InfraAccessSiteDto[] = [];
    for (const r of rows) {
      const site = {
        id: r.id,
        practiceId: r.practice_id,
        tenantId,
        branchId: r.branch_id ?? undefined,
      } as unknown as PracticeSites;
      const scope = await this.access.actorScope(em, actor, site);
      const siteRoles = this.access.siteLevelRoles(scope, {
        id: r.id,
        practiceId: r.practice_id,
      });
      const local = scope.grants.filter(
        (g) => (g.scope === 'UNIT' || g.scope === 'SPACE') && g.siteId === r.id,
      );
      if (siteRoles.size === 0 && scope.globals.length === 0 && !local.length)
        continue;
      sites.push({
        siteId: r.id,
        practiceId: r.practice_id,
        code: r.code,
        name: r.name,
        timeZone: r.time_zone,
        roles: [...siteRoles].sort(),
        globalRoles: [...new Set(scope.globals)].sort(),
        actions: this.access.allowedActions(siteRoles, false, scope, PREFIXES),
        grants: local.map((g) => ({
          scope: g.scope as 'UNIT' | 'SPACE',
          role: g.role,
          clinicalUnitId: g.unitId ?? null,
          careSpaceId: g.spaceId ?? null,
          actions: this.access.allowedActions(
            new Set<InfraRole>([g.role]),
            false,
            { ...scope, globals: [] },
            PREFIXES,
          ),
        })),
      });
    }
    return { userId: actor.id, tenantId, sites };
  }
}
