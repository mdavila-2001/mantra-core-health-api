import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { isGrantLive } from '../domain';
import { DELEG } from '../delegated_access.concepts';
import {
  AccessAnomaliesRepository,
  GovernanceQueriesRepository,
} from '../repositories';
import { DelegationScopeService } from './delegation-scope.service';
import { GovernanceWorldLoader } from './governance-world.loader';

/** Panel «Mi equipo» del doctor. */
export interface GovernancePanel {
  readonly generatedAt: string;
  /** Personas que lo aceptaron a él, con cuántos permisos vivos tienen. */
  readonly team: ReadonlyArray<{
    readonly userId: string;
    readonly engagementId: string;
    readonly templateCode: string | null;
    readonly liveGrants: number;
  }>;
  /** Ítems de certificación que esperan su decisión. */
  readonly pendingReviews: number;
  /** Alertas abiertas de las personas de SU equipo (solo números y tipo). */
  readonly openAnomalies: ReadonlyArray<{
    readonly id: string;
    readonly userId: string;
    readonly kindConceptId: string;
    readonly windowStart: string;
    readonly observed: number;
    readonly threshold: number;
  }>;
}

/**
 * Panel «Mi equipo» del doctor (CONTRATO-GOBIERNO §6.6): solo la población que
 * lo aceptó a él — nunca la organización entera —, sus revisiones pendientes y
 * las alertas abiertas de esas personas. Las aprobaciones pendientes salen de
 * las rutas de cuatro ojos.
 */
@Injectable()
export class GovernancePanelService {
  /**
   * @param em - Contexto de persistencia.
   * @param loader - Hechos de gobierno de la organización.
   * @param queries - Bandeja de revisiones.
   * @param anomalies - Alertas abiertas.
   * @param scope - Política común de organización.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly loader: GovernanceWorldLoader,
    private readonly queries: GovernanceQueriesRepository,
    private readonly anomalies: AccessAnomaliesRepository,
    private readonly scope: DelegationScopeService,
  ) {}

  /**
   * Arma el panel del doctor que llama.
   *
   * @param actor - El doctor (su perfil viene del token, nunca del cliente).
   */
  async panel(actor: AuthenticatedUser): Promise<GovernancePanel> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const profile = actor.practitionerProfileId;
    const pendingReviews = (
      await this.queries.pendingItemIdsOfReviewer(tx, tenantId, actor.id)
    ).length;
    if (!profile) {
      return {
        generatedAt: now.toISOString(),
        team: [],
        pendingReviews,
        openAnomalies: [],
      };
    }
    const world = await this.loader.load(tx, tenantId, now);
    const team = world.engagements.filter(
      (e) =>
        e.state === 'ACTIVE' &&
        e.acceptedPractitionerProfileIds.includes(profile),
    );
    const users = new Set(team.map((e) => e.subjectUserId));
    const open = await this.anomalies.findByTenant(tx, tenantId, {
      statusConceptIds: [DELEG.ANOMALY_OPEN],
    });
    return {
      generatedAt: now.toISOString(),
      team: team.map((e) => ({
        userId: e.subjectUserId,
        engagementId: e.engagementId,
        templateCode: e.templateCode ?? null,
        liveGrants: e.grants.filter(
          (g) => g.effect !== 'DENY' && isGrantLive(g, now),
        ).length,
      })),
      pendingReviews,
      openAnomalies: open
        .filter((a) => users.has(a.userId))
        .map((a) => ({
          id: a.id,
          userId: a.userId,
          kindConceptId: a.kindConceptId,
          windowStart: a.windowStart.toISOString(),
          observed: Number(a.observedValue),
          threshold: Number(a.thresholdValue),
        })),
    };
  }
}
