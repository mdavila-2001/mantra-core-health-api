import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainException,
  ErrorCode,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import {
  atomsOfGrant,
  isEngagementLive,
  isGrantLive,
  liveAdminAtoms,
  partitionByScope,
  type GrantTargetFacts,
  type SupportAtomCode,
} from '../domain';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  GovernanceWorld,
  WorldEngagement,
  WorldGrant,
} from './governance-world';
import { GovernanceWorldLoader } from './governance-world.loader';

/** Quién consulta o administra y sobre qué población. */
export interface GovernanceActor {
  /** `SECURITY_ADMIN` (o plataforma): toda la organización. */
  readonly full: boolean;
  /** Si no es total, los objetivos de las concesiones del átomo exigido. */
  readonly adminTargets: readonly GrantTargetFacts[];
  /** Cuenta de quien consulta. */
  readonly userId: string;
  /**
   * De un delegado: TODOS los átomos de administración que tiene vivos hoy (no
   * solo el exigido por la ruta). Sirve para ceñir lo que una ruta le deja
   * hacer a lo que su perfil le concede (N-9). Ausente en quien ve todo.
   */
  readonly atoms?: ReadonlySet<string>;
}

/**
 * Autoriza las rutas de gobierno que aceptan `SECURITY_ADMIN` o a un
 * administrador delegado (`SUPPORT_STAFF` + átomo): el rol lo decide
 * `@Roles`; aquí se exige el átomo y se calcula la POBLACIÓN que ve (solo las
 * concesiones dentro de su alcance, `targetWithin`).
 */
@Injectable()
export class GovernanceAccessService {
  /**
   * @param loader - Hechos de gobierno de la organización.
   */
  constructor(private readonly loader: GovernanceWorldLoader) {}

  /**
   * ¿Quién es quien llama y qué población abarca? `SECURITY_ADMIN` (de la
   * organización) y `SUPERADMIN` ven todo; un administrador delegado necesita
   * el átomo exigido en una concesión viva y ve solo lo que ella cubre.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param actor - Quien llama.
   * @param tenantId - Organización activa (la del contexto verificado).
   * @param atom - Átomo exigido a un administrador delegado.
   * @returns El alcance del actor.
   * @throws DomainException 403 `ADMIN_CEILING_EXCEEDED` si no tiene el átomo.
   */
  async authorize(
    em: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    atom: SupportAtomCode,
  ): Promise<GovernanceActor> {
    if (
      roleAuthorizesInTenant(actor, 'SECURITY_ADMIN', tenantId) ||
      roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)
    ) {
      return { full: true, adminTargets: [], userId: actor.id };
    }
    const now = new Date();
    const world = await this.loader.load(em, tenantId, now);
    // UNA función decide qué átomos de administración tiene hoy (vigencia del
    // vínculo, prohibiciones DENY y reglas L1), sumando todos sus vínculos.
    const holding: WorldGrant[] = [];
    const heldAtoms = new Set<string>();
    for (const own of world.engagements.filter(
      (e) => e.subjectUserId === actor.id,
    )) {
      const held = liveAdminAtoms({
        engagementLive: isEngagementLive(
          {
            assignmentActive: own.state === 'ACTIVE',
            membershipActive: own.membershipLive !== false,
            ...(own.validTo ? { validTo: own.validTo } : {}),
            ...(own.nextRecertificationAt
              ? { nextRecertificationAt: own.nextRecertificationAt }
              : {}),
          },
          now,
        ),
        templateCode: own.templateCode,
        denyRules: world.denyRules,
        grants: own.grants.map((g) => ({
          ref: g,
          target: g,
          atoms: atomsOfGrant(g),
          effect: g.effect ?? 'ALLOW',
          live: isGrantLive(g, now),
        })),
      });
      for (const h of held) {
        for (const a of h.atoms) heldAtoms.add(a);
        if (h.atoms.includes(atom)) holding.push(h.ref);
      }
    }
    if (holding.length === 0) {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Su perfil no incluye este permiso de administración.',
        undefined,
        Reason.ADMIN_CEILING_EXCEEDED,
      );
    }
    return {
      full: false,
      adminTargets: holding,
      userId: actor.id,
      atoms: heldAtoms,
    };
  }

  /**
   * Restringe el mundo a la población del actor: un administrador delegado ve
   * solo los vínculos con alguna concesión dentro de su alcance y, de ellos,
   * solo esas concesiones. Quien ve todo recibe el mundo tal cual.
   *
   * @param world - Hechos de la organización.
   * @param actor - Alcance del actor.
   * @returns El mundo acotado.
   */
  restrict(world: GovernanceWorld, actor: GovernanceActor): GovernanceWorld {
    if (actor.full) return world;
    const engagements: WorldEngagement[] = [];
    for (const e of world.engagements) {
      if (e.subjectUserId === actor.userId) continue;
      const part = partitionByScope(e.grants, actor.adminTargets);
      if (!part.administrable) continue;
      const inScope = new Set(part.inScope);
      engagements.push({
        ...e,
        grants: e.grants.filter((g) => inScope.has(g)),
      });
    }
    return { ...world, engagements };
  }

  /**
   * Vínculo de una persona dentro de la población del actor; uno fuera de ella
   * responde como inexistente (404 uniforme lo lanza quien llama).
   *
   * @param world - Hechos ya acotados.
   * @param engagementId - Vínculo.
   * @returns El vínculo o `undefined`.
   */
  engagementIn(
    world: GovernanceWorld,
    engagementId: string,
  ): WorldEngagement | undefined {
    return world.engagements.find((e) => e.engagementId === engagementId);
  }
}
