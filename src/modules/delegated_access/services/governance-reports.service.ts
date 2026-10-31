import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import {
  assessInactivity,
  atomsOfGrant,
  isGrantLive,
  isGrantUnused,
  maxSensitivityOf,
  ownerlessReasons,
  sensitivityRank,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type { AccessMatrixQueryDto } from '../dto/governance-reports.dto';
import {
  AccessAnomaliesRepository,
  AccessReviewRepository,
  GovernanceQueriesRepository,
  SupportActivityRepository,
} from '../repositories';
import { DelegationScopeService } from './delegation-scope.service';
import { GovernanceCampaignSettings } from './governance-campaign-settings';
import { LifecycleService } from './lifecycle.service';
import { creepOfEngagement } from './governance-creep';
import {
  GovernanceMatrixService,
  flattenMatrix,
} from './governance-matrix.service';
import {
  GovernanceAccessService,
  type GovernanceActor,
} from './governance-access.service';
import {
  allGrants,
  type GovernanceWorld,
  type WorldEngagement,
} from './governance-world';
import { GovernanceWorldLoader } from './governance-world.loader';

/** Átomo que exige ver los tableros a un administrador delegado. */
export const REPORTS_VIEW_ATOM = 'audit.reports.governance.view';
const DAY_MS = 86_400_000;
const FOUR_EYES_PENDING_HOURS = 24;
const BREAK_GLASS_REVIEW_HOURS = 72;
const EXPIRING_GRANT_DAYS = 14;

type Row = Record<string, unknown>;

const iso = (d: Date | null | undefined): string | null =>
  d ? d.toISOString() : null;

/**
 * Informes y tableros de gobierno (CONTRATO-GOBIERNO §6.6), calculados en el
 * servidor con las mismas funciones puras que la política: resumen de 10
 * mosaicos, matrices «quién tiene qué» y «quién puede actuar sobre…»,
 * acumulación de privilegios, accesos sin uso, cuentas sin dueño y excepciones.
 * `SECURITY_ADMIN` ve todo; un administrador delegado con
 * `audit.reports.governance.view`, solo su población. Solo identificadores y
 * números: nunca datos de pacientes.
 */
@Injectable()
export class GovernanceReportsService {
  /**
   * @param em - Contexto de persistencia.
   * @param loader - Hechos de gobierno de la organización.
   * @param access - Autorización y población del administrador.
   * @param matrix - Matrices de acceso.
   * @param queries - Cuatro ojos, emergencias, actividad.
   * @param anomalies - Anomalías abiertas.
   * @param reviews - Campañas e ítems.
   * @param settings - Ajustes de gobierno.
   * @param activity - Nombres de las personas.
   * @param scope - Política común de organización.
   * @param lifecycle - Ciclo de vida: cuentas sin dueño elegible (`listOwnerless`).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly loader: GovernanceWorldLoader,
    private readonly access: GovernanceAccessService,
    private readonly matrix: GovernanceMatrixService,
    private readonly queries: GovernanceQueriesRepository,
    private readonly anomalies: AccessAnomaliesRepository,
    private readonly reviews: AccessReviewRepository,
    private readonly settings: GovernanceCampaignSettings,
    private readonly activity: SupportActivityRepository,
    private readonly scope: DelegationScopeService,
    @Optional() private readonly lifecycle?: LifecycleService,
  ) {}

  /** Los 10 mosaicos del tablero. */
  async summary(actor: AuthenticatedUser): Promise<Row> {
    const { tx, tenantId, world } = await this.open(actor);
    return this.summaryOf(tx, tenantId, world);
  }

  /** Matriz «quién tiene qué» o «quién puede actuar sobre…». */
  async accessMatrix(
    actor: AuthenticatedUser,
    query: Pick<AccessMatrixQueryDto, 'by' | 'group' | 'id'>,
  ): Promise<Row> {
    const { tx, tenantId, world } = await this.open(actor, query.by);
    return this.matrixOf(tx, tenantId, world, query);
  }

  /** Quién acumuló de más. */
  async privilegeCreep(actor: AuthenticatedUser): Promise<Row> {
    const { tx, tenantId, world } = await this.open(actor);
    return this.creepOf(tx, tenantId, world);
  }

  /** Concesiones vivas sin `PERMIT` en `days`. */
  async unusedAccess(actor: AuthenticatedUser, days?: number): Promise<Row> {
    const { tx, tenantId, world } = await this.open(actor);
    return this.unusedOf(tx, tenantId, world, days);
  }

  /** Cuentas activas sin dueño. */
  async ownerless(actor: AuthenticatedUser): Promise<Row> {
    const { tx, world } = await this.open(actor);
    return this.ownerlessOf(tx, world);
  }

  /** Lo que está «fuera de regla»: excepciones SoD, aprobaciones sin ejecutar, accesos temporales, permisos por vencer. */
  async exceptions(actor: AuthenticatedUser): Promise<Row> {
    const { tx, tenantId, world } = await this.open(actor);
    return this.exceptionsOf(tx, tenantId, world);
  }

  /**
   * Filas planas de un informe, para exportar. La autorización la hizo quien
   * llama (con otro átomo); aquí solo se acota la población.
   */
  async rowsOf(
    tx: EntityManager,
    tenantId: string,
    authority: GovernanceActor,
    kind: string,
    filters: Record<string, unknown>,
  ): Promise<Row[] | undefined> {
    const world = this.access.restrict(
      await this.loader.load(tx, tenantId, new Date()),
      authority,
    );
    switch (kind) {
      case 'summary': {
        const s = await this.summaryOf(tx, tenantId, world);
        return Object.entries(s.tiles as Row).map(([tile, value]) => ({
          tile,
          value,
        }));
      }
      case 'access-matrix': {
        const m = await this.matrixOf(tx, tenantId, world, {
          by: (filters.by as 'person') ?? 'person',
          group: (filters.group as 'category') ?? 'category',
          id: filters.id as string | undefined,
        });
        return flattenMatrix(m);
      }
      case 'privilege-creep':
        return (await this.creepOf(tx, tenantId, world)).items;
      case 'unused-access':
        return (
          await this.unusedOf(
            tx,
            tenantId,
            world,
            typeof filters.days === 'number' ? filters.days : undefined,
          )
        ).items;
      case 'ownerless':
        return (await this.ownerlessOf(tx, world)).items;
      case 'exceptions': {
        const e = await this.exceptionsOf(tx, tenantId, world);
        return [
          ...(e.sodExceptions as Row[]).map((r) => ({ type: 'SOD', ...r })),
          ...(e.approvalsNotExecuted as Row[]).map((r) => ({
            type: 'FOUR_EYES',
            ...r,
          })),
          ...(e.temporaryClinicalAccess as Row[]).map((r) => ({
            type: 'CLINICAL_ACCESS',
            ...r,
          })),
          ...(e.expiringGrants as Row[]).map((r) => ({
            type: 'EXPIRING_GRANT',
            ...r,
          })),
        ];
      }
      default:
        return undefined;
    }
  }

  private async open(
    actor: AuthenticatedUser,
    by?: string,
  ): Promise<{
    tx: EntityManager;
    tenantId: string;
    world: GovernanceWorld;
  }> {
    if (
      by !== undefined &&
      !['person', 'doctor', 'service', 'location'].includes(by)
    ) {
      throw this.invalidDimension();
    }
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const authority = await this.access.authorize(
      tx,
      actor,
      tenantId,
      REPORTS_VIEW_ATOM,
    );
    const world = this.access.restrict(
      await this.loader.load(tx, tenantId, new Date()),
      authority,
    );
    return { tx, tenantId, world };
  }

  private async summaryOf(
    tx: EntityManager,
    tenantId: string,
    world: GovernanceWorld,
  ): Promise<Row> {
    const settings = await this.settings.read(tx, tenantId);
    const active = world.engagements.filter((e) => e.state === 'ACTIVE');
    const live = (e: WorldEngagement) =>
      e.grants.filter((g) => g.effect !== 'DENY' && isGrantLive(g, world.now));
    const userIds = active.map((e) => e.subjectUserId);
    const [permits, logins, anomalies, fourEyes, breakGlass, overdue] =
      await Promise.all([
        this.queries.lastPermitByUser(tx, tenantId, userIds),
        this.queries.lastLoginByUser(tx, userIds),
        this.anomalies.findByTenant(tx, tenantId, {
          statusConceptIds: [DELEG.ANOMALY_OPEN],
        }),
        this.queries.countFourEyesPendingBefore(
          tx,
          tenantId,
          new Date(world.now.getTime() - FOUR_EYES_PENDING_HOURS * 3_600_000),
        ),
        this.queries.countBreakGlassUnreviewed(
          tx,
          tenantId,
          new Date(world.now.getTime() - BREAK_GLASS_REVIEW_HOURS * 3_600_000),
        ),
        this.overdueItems(tx, tenantId, world),
      ]);
    const inScope = new Set(userIds);
    const inactive = active.filter(
      (e) =>
        live(e).length > 0 &&
        assessInactivity({
          now: world.now,
          referenceStart: e.createdAt,
          lastPermitAt: permits.get(e.subjectUserId),
          lastLoginAt: logins.get(e.subjectUserId),
          inactivityDays: settings.inactivityDays,
        }).inactive,
    );
    return {
      generatedAt: world.now.toISOString(),
      tiles: {
        peopleWithLiveAccess: active.filter((e) => live(e).length > 0).length,
        highRiskGrants: active.reduce(
          (n, e) =>
            n +
            live(e).filter((g) => {
              const top = maxSensitivityOf(atomsOfGrant(g));
              return (
                top !== null && sensitivityRank(top) >= sensitivityRank('HIGH')
              );
            }).length,
          0,
        ),
        overdueCertifications: overdue,
        ownerlessAccounts: active.filter((e) => !e.supervisorUserId).length,
        inactiveAccounts: inactive.length,
        activeSodExceptions: new Set(
          world.engagements.flatMap((e) =>
            e.sodFindings
              .filter((f) => f.exceptionId)
              .map((f) => f.exceptionId),
          ),
        ).size,
        pendingApprovalsOver24h: fourEyes,
        openAnomalies: anomalies.filter((a) => inScope.has(a.userId)).length,
        grantsAboveCeiling: active.reduce(
          (n, e) => n + live(e).filter((g) => g.aboveCeiling === true).length,
          0,
        ),
        breakGlassUnreviewed: breakGlass,
      },
    };
  }

  /** Ítems pendientes ya vencidos de las campañas abiertas, dentro de la población. */
  private async overdueItems(
    tx: EntityManager,
    tenantId: string,
    world: GovernanceWorld,
  ): Promise<number> {
    const inScope = new Set(world.engagements.map((e) => e.engagementId));
    let n = 0;
    for (const c of await this.reviews.findCampaigns(tx, tenantId, [
      DELEG.REVIEW_CAMPAIGN_OPEN,
    ])) {
      for (const i of await this.reviews.findItemsByCampaign(tx, c.id)) {
        if (
          i.decisionConceptId === DELEG.REVIEW_ITEM_PENDING &&
          i.dueAt.getTime() < world.now.getTime() &&
          inScope.has(i.organizationUserAssignmentId)
        ) {
          n += 1;
        }
      }
    }
    return n;
  }

  private async matrixOf(
    tx: EntityManager,
    tenantId: string,
    world: GovernanceWorld,
    q: Pick<AccessMatrixQueryDto, 'by' | 'group' | 'id'>,
  ): Promise<Row> {
    if (q.by === 'person')
      return this.matrix.personMatrix(tx, world, q.group ?? 'category');
    if (!q.id) throw this.invalidDimension();
    return this.matrix.targetMatrix(tx, tenantId, world, q.by, q.id);
  }

  private async creepOf(
    tx: EntityManager,
    tenantId: string,
    world: GovernanceWorld,
  ): Promise<{ generatedAt: string; threshold: number; items: Row[] }> {
    const settings = await this.settings.read(tx, tenantId);
    const names = await this.activity.userNames(
      tx,
      world.engagements.map((e) => e.subjectUserId),
    );
    const items = world.engagements
      .filter((e) => e.state === 'ACTIVE')
      .map((e) => {
        const c = creepOfEngagement(e, world.now, settings.creepThreshold);
        return {
          userId: e.subjectUserId,
          ...(names.get(e.subjectUserId)
            ? { name: names.get(e.subjectUserId) }
            : {}),
          engagementId: e.engagementId,
          templateCode: e.templateCode,
          score: c.score,
          baseline: c.baseline,
          drift: c.drift,
          flagged: c.flagged,
          reasons: [...c.reasons],
          grantsSinceCertification: c.grantsSinceCertification,
        };
      });
    return {
      generatedAt: world.now.toISOString(),
      threshold: settings.creepThreshold,
      items,
    };
  }

  private async unusedOf(
    tx: EntityManager,
    tenantId: string,
    world: GovernanceWorld,
    days?: number,
  ): Promise<{ generatedAt: string; days: number; items: Row[] }> {
    const settings = await this.settings.read(tx, tenantId);
    const window = days ?? settings.unusedDays;
    const items = allGrants(world)
      .filter(
        ({ engagement: e, grant: g }) =>
          e.state === 'ACTIVE' &&
          g.effect !== 'DENY' &&
          isGrantLive(g, world.now) &&
          isGrantUnused({
            lastUsedAt: g.lastUsedAt,
            createdAt: g.createdAt,
            now: world.now,
            unusedDays: window,
          }),
      )
      .map(({ engagement: e, grant: g }) => ({
        userId: e.subjectUserId,
        engagementId: e.engagementId,
        grantId: g.grantId,
        atoms: atomsOfGrant(g),
        lastUsedAt: iso(g.lastUsedAt),
        daysSinceUse: g.lastUsedAt
          ? Math.floor((world.now.getTime() - g.lastUsedAt.getTime()) / DAY_MS)
          : null,
      }));
    return { generatedAt: world.now.toISOString(), days: window, items };
  }

  /**
   * Cuentas vivas sin dueño o cuyo dueño ya no es elegible (D-07). Une lo que se
   * ve en el mundo cargado (sin dueño, doctores sin asignación) con
   * `LifecycleService.listOwnerless` (dueño que ya no es elegible: baja, suspensión,
   * rol), para que el tablero y la acción «Asignar dueño» cuenten lo mismo.
   */
  private async ownerlessOf(
    tx: EntityManager,
    world: GovernanceWorld,
  ): Promise<{ generatedAt: string; items: Row[] }> {
    const fromLifecycle = this.lifecycle
      ? await this.lifecycle.listOwnerless(tx, world.tenantId, world.now)
      : [];
    const extra = new Map(fromLifecycle.map((o) => [o.engagementId, o]));
    const items = world.engagements
      .filter((e) => e.state === 'ACTIVE')
      .flatMap((e) => {
        const base = ownerlessReasons({
          supervisorUserId: e.supervisorUserId,
          onlyDoctorsWithoutAssignment:
            e.grants.length > 0 && e.grants.every((g) => g.doctorGone === true),
        });
        const reasons = [
          ...new Set([...base, ...(extra.get(e.engagementId)?.reasons ?? [])]),
        ];
        return reasons.length === 0
          ? []
          : [
              {
                userId: e.subjectUserId,
                engagementId: e.engagementId,
                templateCode: e.templateCode,
                reasons,
              },
            ];
      });
    return { generatedAt: world.now.toISOString(), items };
  }

  private async exceptionsOf(
    tx: EntityManager,
    tenantId: string,
    world: GovernanceWorld,
  ): Promise<Record<string, unknown> & { generatedAt: string }> {
    const userIds = world.engagements.map((e) => e.subjectUserId);
    const engagementIds = new Set(world.engagements.map((e) => e.engagementId));
    const [approved, clinical] = await Promise.all([
      this.queries.fourEyesApprovedNotExecuted(tx, tenantId),
      this.queries.temporaryClinicalAccess(tx, tenantId, userIds, world.now),
    ]);
    const soon = world.now.getTime() + EXPIRING_GRANT_DAYS * DAY_MS;
    return {
      generatedAt: world.now.toISOString(),
      sodExceptions: world.engagements.flatMap((e) =>
        e.sodFindings
          .filter((f) => f.exceptionId)
          .map((f) => ({
            exceptionId: f.exceptionId,
            ruleCode: f.ruleCode,
            userId: e.subjectUserId,
            validTo: iso(f.exceptionValidTo),
          })),
      ),
      approvalsNotExecuted: approved
        .filter(
          (a) =>
            !a.organizationUserAssignmentId ||
            engagementIds.has(a.organizationUserAssignmentId),
        )
        .map((a) => ({
          id: a.id,
          requesterUserId: a.requesterUserId,
          approvedUntil: iso(a.approvedUntil),
        })),
      temporaryClinicalAccess: clinical.map((c) => ({
        id: c.id,
        userId: c.userId,
        validTo: c.validTo.toISOString(),
      })),
      expiringGrants: allGrants(world)
        .filter(
          ({ grant: g }) =>
            g.effect !== 'DENY' &&
            isGrantLive(g, world.now) &&
            !!g.validTo &&
            g.validTo.getTime() <= soon,
        )
        .map(({ engagement: e, grant: g }) => ({
          grantId: g.grantId,
          userId: e.subjectUserId,
          validTo: iso(g.validTo),
        })),
    };
  }

  private invalidDimension(): PreconditionFailedException {
    return new PreconditionFailedException(
      'Indique si quiere ver personas, o quién puede actuar sobre un doctor, servicio o espacio.',
      undefined,
      Reason.MATRIX_DIMENSION_INVALID,
    );
  }
}
