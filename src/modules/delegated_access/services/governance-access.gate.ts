import { Injectable, Optional } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  atomsOfGrant,
  isGrantLive,
  partitionByScope,
  type GrantTargetFacts,
  type SupportAtomCode,
} from '../domain';
import { DelegationScopeService } from './delegation-scope.service';
import { governanceError } from './governance-errors';
import { SupportAdminDirectory } from './support-admin-directory';
import { SupportPersonGrantsLoader } from './support-person-grants.loader';

/** Hasta dónde llega quien consulta: toda la organización o un alcance acotado. */
export type AdminView =
  | { readonly full: true }
  | {
      readonly full: false;
      readonly adminTargets: readonly GrantTargetFacts[];
    };

/**
 * Decide hasta dónde ve y opera quien llama a las rutas de gobierno que
 * comparten `SECURITY_ADMIN` con un administrador delegado («+ átomo» del
 * contrato §8.3): el administrador de seguridad de la organización ve todo; un
 * delegado necesita una concesión VIVA `ALLOW` con ese átomo y solo ve lo que
 * cae dentro de su alcance (`targetWithin`, la misma regla de `TeamAdminPolicy`).
 * Sin el átomo, 403 `ADMIN_SCOPE_EXCEEDED`.
 */
@Injectable()
export class GovernanceAccessGate {
  /**
   * @param loader - Concesiones de las personas de apoyo.
   * @param scope - Organización activa verificada.
   * @param admins - Función común de administración (vigencia del vínculo, `DENY` y reglas L1); opcional solo en suites anteriores al gobierno.
   */
  constructor(
    private readonly loader: SupportPersonGrantsLoader,
    private readonly scope: DelegationScopeService,
    @Optional() private readonly admins?: SupportAdminDirectory,
  ) {}

  /**
   * Alcance de quien consulta para un átomo.
   *
   * @param em - Contexto de lectura.
   * @param actor - Quien consulta.
   * @param atom - Átomo que exige la ruta.
   * @returns `full` para el administrador de seguridad; los objetivos del delegado si no.
   * @throws DomainException 403 `ADMIN_SCOPE_EXCEEDED` si no tiene el átomo.
   */
  async view(
    em: EntityManager,
    actor: AuthenticatedUser,
    atom: SupportAtomCode,
  ): Promise<AdminView> {
    const tenantId = this.scope.resolveTenant();
    if (roleAuthorizesInTenant(actor, 'SECURITY_ADMIN', tenantId)) {
      return { full: true };
    }
    const now = new Date();
    // La misma función que la administración delegada: vínculo vivo, sin
    // prohibiciones DENY y sin reglas L1 que le quiten el átomo (SEG A-A5).
    const adminTargets: readonly GrantTargetFacts[] = this.admins
      ? await this.admins.governanceTargets(em, actor.id, tenantId, atom, now)
      : (await this.loader.load(em, tenantId, { userId: actor.id }))
          .flatMap((p) => p.grants)
          .filter(
            (g) =>
              g.effect !== 'DENY' &&
              isGrantLive(g, now) &&
              atomsOfGrant(g).includes(atom),
          );
    if (adminTargets.length === 0) {
      throw governanceError(
        Reason.ADMIN_SCOPE_EXCEEDED,
        'No tiene permiso para consultar esto en su alcance.',
      );
    }
    return { full: false, adminTargets };
  }

  /**
   * ¿Cae la persona dentro del alcance de quien consulta? (alguna concesión suya
   * dentro del alcance).
   *
   * @param view - Alcance resuelto por {@link GovernanceAccessGate.view}.
   * @param personGrants - Concesiones de la persona consultada.
   * @returns `true` si la ve.
   */
  manages(view: AdminView, personGrants: readonly GrantTargetFacts[]): boolean {
    return (
      view.full ||
      partitionByScope(personGrants, view.adminTargets).administrable
    );
  }
}
