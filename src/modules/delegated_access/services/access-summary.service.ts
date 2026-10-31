import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  ATOM_CATEGORIES,
  LEGACY_BUNDLES,
  LEGACY_PRIMARY,
  PERMISSION_ATOMS,
  PERMISSION_ATOM_BY_CODE,
  SUPPORT_ACTIONS,
  atomsOfAction,
  atomsOfGrant,
  describeGrant,
  isGrantLive,
  type SupportGrantFacts,
} from '../domain';
import type {
  EngagementEffectiveResponseDto,
  EngagementSummaryResponseDto,
  PermissionCatalogResponseDto,
} from '../dto';
import { SupportAccessRepository } from '../repositories';
import { DelegationScopeService } from './delegation-scope.service';
import { governanceError } from './governance-errors';
import { GovernanceAccessGate } from './governance-access.gate';
import { SupportPersonGrantsLoader } from './support-person-grants.loader';

/**
 * Lecturas de apoyo a las pantallas de permisos (CONTRATO-GOBIERNO §8.3 A): el
 * catálogo de 73 permisos con sus metadatos y los 15 alias, el resumen en
 * lenguaje simple de un vínculo (lo arma el servidor: el front no replica la
 * semántica de las condiciones) y los permisos efectivos con su origen.
 *
 * Quien consulta es `SECURITY_ADMIN` (toda la organización) o un delegado con
 * `team.members.view` sobre personas de su alcance; un vínculo ajeno o fuera de
 * alcance responde 404 uniforme. Solo lectura.
 */
@Injectable()
export class AccessSummaryService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Vínculos.
   * @param people - Concesiones de las personas de apoyo.
   * @param gate - Alcance de quien consulta.
   * @param scope - Organización activa verificada.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: SupportAccessRepository,
    private readonly people: SupportPersonGrantsLoader,
    private readonly gate: GovernanceAccessGate,
    private readonly scope: DelegationScopeService,
  ) {}

  /**
   * Catálogo de permisos (`GET /org/permission-catalog`).
   *
   * @param actor - Quien consulta.
   * @returns Los 73 permisos, las 7 categorías y los 15 alias heredados.
   */
  async catalog(
    actor: AuthenticatedUser,
  ): Promise<PermissionCatalogResponseDto> {
    await this.gate.view(
      this.em.fork({ keepTransactionContext: true }),
      actor,
      'team.members.view',
    );
    return {
      atoms: PERMISSION_ATOMS.map((a) => ({
        code: a.code,
        name: a.name,
        category: a.categoryCode,
        sensitivity: a.sensitivity,
        requiresReason: a.requiresReason,
        requiresStepUp: a.requiresStepUp,
        approvalMode: a.approvalMode,
        purposeOfUse: a.purposeOfUse,
        legalBasis: a.legalBasis,
        touchesClinicalData: a.touchesClinicalData,
        isFieldLevel: a.isFieldLevel,
        supportAssignable: a.supportAssignable,
        isDangerous: a.isDangerous,
      })),
      categories: ATOM_CATEGORIES.map((c) => ({ code: c.code, name: c.name })),
      aliases: SUPPORT_ACTIONS.map((code) => ({
        code,
        atoms: [...LEGACY_BUNDLES[code]],
        primary: LEGACY_PRIMARY[code],
      })),
    };
  }

  /**
   * Resumen en lenguaje simple de un vínculo (`GET …/support-engagements/:id/summary`).
   *
   * @param engagementId - Vínculo.
   * @param actor - Quien consulta.
   * @returns Una frase por permiso.
   */
  async summary(
    engagementId: string,
    actor: AuthenticatedUser,
  ): Promise<EngagementSummaryResponseDto> {
    const grants = await this.grantsOf(engagementId, actor);
    const items = grants.map((g) => ({
      grantId: g.grantId,
      effect: g.effect ?? 'ALLOW',
      targetKind: g.targetKind,
      atoms: atomsOfGrant(g),
      summary: describeGrant({
        atoms: g.actions,
        effect: g.effect,
        condition: g.condition ?? undefined,
      }),
    }));
    return { engagementId, grants: items, plain: items.map((i) => i.summary) };
  }

  /**
   * Permisos efectivos de un vínculo con su origen (`GET …/support-engagements/:id/effective`).
   *
   * @param engagementId - Vínculo.
   * @param actor - Quien consulta.
   * @returns Los átomos vivos (alias expandidos) y las prohibiciones expresas.
   */
  async effective(
    engagementId: string,
    actor: AuthenticatedUser,
  ): Promise<EngagementEffectiveResponseDto> {
    const grants = await this.grantsOf(engagementId, actor);
    const now = new Date();
    const byAtom = new Map<
      string,
      {
        legacy: boolean;
        atom: boolean;
        grantIds: Set<string>;
        conditional: boolean;
      }
    >();
    const denied: { atom: string; grantId: string }[] = [];
    for (const g of grants) {
      if (!isGrantLive(g, now)) continue;
      if (g.effect === 'DENY') {
        for (const atom of atomsOfGrant(g))
          denied.push({ atom, grantId: g.grantId });
        continue;
      }
      for (const action of g.actions) {
        for (const { atom, origin } of atomsOfAction(action)) {
          const entry = byAtom.get(atom) ?? {
            legacy: false,
            atom: false,
            grantIds: new Set<string>(),
            conditional: false,
          };
          if (origin === 'LEGACY') entry.legacy = true;
          else entry.atom = true;
          entry.grantIds.add(g.grantId);
          if (
            g.condition ||
            (g.atomGrants ?? []).some((a) => a.atom === atom && a.condition)
          ) {
            entry.conditional = true;
          }
          byAtom.set(atom, entry);
        }
      }
    }
    return {
      engagementId,
      atoms: [...byAtom.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([atom, e]) => ({
          atom,
          name: PERMISSION_ATOM_BY_CODE.get(atom as never)?.name ?? atom,
          sensitivity:
            PERMISSION_ATOM_BY_CODE.get(atom as never)?.sensitivity ?? 'LOW',
          origin: e.legacy && e.atom ? 'BOTH' : e.legacy ? 'LEGACY' : 'ATOM',
          grantIds: [...e.grantIds].sort(),
          conditional: e.conditional,
        })),
      denied: denied.sort((a, b) => a.atom.localeCompare(b.atom)),
    };
  }

  /** Concesiones del vínculo; ajeno o fuera del alcance de quien consulta es 404 uniforme. */
  private async grantsOf(
    engagementId: string,
    actor: AuthenticatedUser,
  ): Promise<readonly SupportGrantFacts[]> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const view = await this.gate.view(tx, actor, 'team.members.view');
    const records = await this.access.findEngagements(tx, {
      tenantId,
      ids: [engagementId],
    });
    if (!records[0] || records[0].tenantId !== tenantId) throw this.notFound();
    const [person] = await this.people.load(tx, tenantId, {
      engagementIds: [engagementId],
    });
    if (!person || !this.gate.manages(view, person.grants))
      throw this.notFound();
    return person.grants;
  }

  private notFound(): Error {
    return governanceError(
      Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
      'Vínculo de apoyo no encontrado.',
    );
  }
}
