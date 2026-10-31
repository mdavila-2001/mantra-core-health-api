import { Inject, Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, touch, type AuthenticatedUser } from '../../../common';
import { DAY_MS, assessInactivity } from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { OrganizationUserAssignments, type SodExceptions } from '../entities';
import {
  AccessReviewRepository,
  FourEyesRepository,
  GovernanceQueriesRepository,
  GrantUsageStatsRepository,
  SodRepository,
} from '../repositories';
import { AccessReviewAutomationService } from './access-review-automation.service';
import { AccessReviewCampaignsService } from './access-review-campaigns.service';
import { EngagementSuspensionService } from './engagement-suspension.service';
import { GovernanceAnomaliesService } from './governance-anomalies.service';
import { GovernanceAudit } from './governance-audit';
import { GovernanceCampaignSettings } from './governance-campaign-settings';
import { GovernanceEvents, GovernanceEventType } from './governance-events';
import { inTenantTransaction } from './governance-tenant-tx';
import { GovernanceWorldLoader } from './governance-world.loader';
import {
  SUPPORT_TENANT_ZONE_PORT,
  type TenantZonePort,
} from './support-access-context.ports';

const DEFAULT_ZONE = 'America/La_Paz';
/** Retención de la estadística de uso (`grant_usage_stats`). */
export const USAGE_RETENTION_DAYS = 400;
/** Tope por pasada de lo que se vence entre organizaciones. */
export const SWEEP_LIMIT = 500;

/** Conteos de una pasada. */
export interface SweepResult {
  readonly counts: Record<string, number>;
}

const COUNTERS = [
  'tenants',
  'tenantErrors',
  'fourEyesExpired',
  'sodExceptionsExpired',
  'sodRemediationItems',
  'campaignsClosed',
  'itemsAutoRevoked',
  'reminders',
  'escalations',
  'recertificationItems',
  'periodicCampaigns',
  'remediationItems',
  'inactiveSuspended',
  'lastActiveRefreshed',
  'usageRowsPurged',
] as const;

const zero = (): Record<string, number> =>
  Object.fromEntries(COUNTERS.map((c) => [c, 0]));

/**
 * Barridos del gobierno de accesos (`SYSTEM`, CONTRATO-GOBIERNO §8.6), sin cron
 * propio: los dispara el programador externo. Cada tarea es idempotente,
 * acotada y por organización (una que falla no detiene a las demás):
 * cuatro ojos vencidos, excepciones SoD vencidas, recordatorios, escalamientos
 * y cierres de campañas (auto-revocación de lo no certificado), ítems de
 * recertificación a 30 días, campañas periódicas y de remediación, suspensión
 * por inactividad (solo si la organización la activa), `last_active_at` y la
 * retención de la estadística de uso. `access_decision_log` es WORM (un
 * disparador impide borrar) y su archivo en frío es una decisión de operación
 * (CONTRATO-GOBIERNO §7.3 y D-13): este barrido no lo purga.
 */
@Injectable()
export class GovernanceSweepService {
  /**
   * @param em - Contexto de persistencia (se bifurca por organización).
   * @param reviews - Campañas.
   * @param fourEyes - Aprobaciones de cuatro ojos.
   * @param sod - Excepciones de segregación de funciones.
   * @param queries - Lecturas entre organizaciones.
   * @param usage - Estadística de uso.
   * @param campaigns - Cierre de campañas.
   * @param automation - Lo automático de las campañas.
   * @param anomalies - Detección de anomalías.
   * @param settings - Ajustes de gobierno.
   * @param loader - Hechos de gobierno de la organización.
   * @param events - Eventos de dominio (outbox).
   * @param audit - Sello de auditoría con su nombre de negocio.
   * @param suspension - Suspensión de vínculos (un solo camino, también para la inactividad).
   * @param zone - Zona horaria de la organización.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly reviews: AccessReviewRepository,
    private readonly fourEyes: FourEyesRepository,
    private readonly sod: SodRepository,
    private readonly queries: GovernanceQueriesRepository,
    private readonly usage: GrantUsageStatsRepository,
    private readonly campaigns: AccessReviewCampaignsService,
    private readonly automation: AccessReviewAutomationService,
    private readonly anomalies: GovernanceAnomaliesService,
    private readonly settings: GovernanceCampaignSettings,
    private readonly loader: GovernanceWorldLoader,
    private readonly events: GovernanceEvents,
    private readonly audit: GovernanceAudit,
    private readonly suspension: EngagementSuspensionService,
    @Optional()
    @Inject(SUPPORT_TENANT_ZONE_PORT)
    private readonly zone: TenantZonePort | undefined,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GovernanceSweepService.name);
  }

  /**
   * Barrido diario (02:30 hora de La Paz).
   *
   * @param actor - La cuenta de sistema que lo dispara (firma los asientos).
   * @param now - Reloj; por defecto, ahora.
   * @returns Los conteos de cada tarea.
   */
  async runDaily(
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<SweepResult> {
    // B-B12: exclusión mutua. Dos disparos simultáneos (reintento del programador, doble clic
    // de un operador) duplicaban campañas periódicas y remediaciones.
    const locked = await this.queries.withExclusiveLock(
      this.em,
      'governance-sweep:daily',
      () => this.dailyUnderLock(actor, now),
    );
    if (!locked.acquired) {
      this.logger.warn(
        { operation: 'delegated_access.governance_sweep.skipped' },
        'Governance sweep skipped: another run holds the lock',
      );
      // `skippedBusy: 1` solo aparece cuando esta pasada no hizo nada porque otra corría (B-B12).
      return { counts: { ...zero(), skippedBusy: 1 } };
    }
    return locked.value;
  }

  private async dailyUnderLock(
    actor: AuthenticatedUser,
    now: Date,
  ): Promise<SweepResult> {
    const counts = zero();
    await this.expireFourEyes(now, counts);
    await this.expireSod(actor, now, counts);
    const tenants = await this.queries.tenantsWithEngagements(this.em);
    for (const tenantId of tenants) {
      counts.tenants += 1;
      try {
        await inTenantTransaction(this.em, tenantId, (tx) =>
          this.sweepTenant(tx, tenantId, actor, now, counts),
        );
      } catch (error) {
        counts.tenantErrors += 1;
        this.logger.error(
          {
            operation: 'delegated_access.governance_sweep.tenant',
            tenantId,
            error: error instanceof Error ? error.name : 'unknown',
            // Solo identificadores y nombres de restricción: nunca datos de pacientes.
            detail:
              error instanceof Error ? error.message.slice(0, 400) : undefined,
          },
          'Governance sweep failed for one organization',
        );
      }
    }
    counts.usageRowsPurged = await this.em.transactional((tx) =>
      this.usage.purgeBefore(
        tx,
        new Date(now.getTime() - USAGE_RETENTION_DAYS * DAY_MS),
      ),
    );
    this.logger.info(
      { operation: 'delegated_access.governance_sweep', ...counts },
      'Governance sweep completed',
    );
    return { counts };
  }

  /**
   * Barrido horario de anomalías (minuto 17).
   *
   * @param now - Reloj; por defecto, ahora.
   * @returns Organizaciones recorridas y anomalías abiertas.
   */
  async runAnomalyScan(now: Date = new Date()): Promise<SweepResult> {
    const locked = await this.queries.withExclusiveLock(
      this.em,
      'governance-sweep:anomaly-scan',
      () => this.anomalyScanUnderLock(now),
    );
    if (!locked.acquired) {
      this.logger.warn(
        { operation: 'delegated_access.anomaly_scan.skipped' },
        'Anomaly scan skipped: another run holds the lock',
      );
      return {
        counts: {
          tenants: 0,
          anomaliesCreated: 0,
          tenantErrors: 0,
          skippedBusy: 1,
        },
      };
    }
    return locked.value;
  }

  private async anomalyScanUnderLock(now: Date): Promise<SweepResult> {
    const counts = { tenants: 0, anomaliesCreated: 0, tenantErrors: 0 };
    for (const tenantId of await this.queries.tenantsWithEngagements(this.em)) {
      counts.tenants += 1;
      try {
        const r = await inTenantTransaction(this.em, tenantId, (tx) =>
          this.anomalies.scan(tx, tenantId, now),
        );
        counts.anomaliesCreated += r.created;
      } catch (error) {
        counts.tenantErrors += 1;
        this.logger.error(
          {
            operation: 'delegated_access.anomaly_scan.tenant',
            tenantId,
            error: error instanceof Error ? error.name : 'unknown',
          },
          'Anomaly scan failed for one organization',
        );
      }
    }
    return { counts };
  }

  /** Cuatro ojos: `PENDING` vencidos y `APPROVED` sin consumir pasado su plazo. */
  private async expireFourEyes(
    now: Date,
    counts: Record<string, number>,
  ): Promise<void> {
    const pending = await this.fourEyes.findExpiredPendingAcrossTenants(
      this.em,
      now,
      SWEEP_LIMIT,
    );
    for (const row of pending) {
      // La fila se vuelve a leer dentro de la transacción de su organización.
      const done = await inTenantTransaction(
        this.em,
        row.tenantId,
        async (tx) => {
          const fresh = await this.fourEyes.findById(tx, row.tenantId, row.id);
          if (!fresh || fresh.statusConceptId !== DELEG.FOUR_EYES_PENDING)
            return false;
          this.fourEyes.markExpired(fresh, now);
          await tx.flush();
          await this.notifyFourEyes(
            tx,
            row.tenantId,
            row.id,
            row.requesterUserId,
          );
          return true;
        },
      );
      if (done) counts.fourEyesExpired += 1;
    }
    const approved = await this.queries.findOverdueApprovedAcrossTenants(
      this.em,
      now,
      SWEEP_LIMIT,
    );
    for (const row of approved) {
      const done = await inTenantTransaction(
        this.em,
        row.tenantId,
        async (tx) => {
          const expired = await this.fourEyes.expireApproved(tx, row.id, now);
          if (expired) await this.notifyFourEyes(tx, row.tenantId, row.id);
          return expired;
        },
      );
      if (done) counts.fourEyesExpired += 1;
    }
  }

  private async notifyFourEyes(
    tx: EntityManager,
    tenantId: string,
    id: string,
    requesterUserId?: string,
  ): Promise<void> {
    await this.events.publish(tx, {
      tenantId,
      type: GovernanceEventType.fourEyesExpired,
      aggregate: 'four_eyes_request',
      aggregateId: id,
      payload: {
        requestId: id,
        ...(requesterUserId ? { requesterUserId } : {}),
      },
    });
  }

  /** Excepciones SoD vencidas, por organización. */
  private async expireSod(
    actor: AuthenticatedUser,
    now: Date,
    counts: Record<string, number>,
  ): Promise<void> {
    const due = await this.sod.findDueExceptionsAcrossTenants(
      this.em,
      now,
      SWEEP_LIMIT,
    );
    const byTenant = new Map<string, SodExceptions[]>();
    for (const row of due) {
      const list = byTenant.get(row.tenantId) ?? [];
      list.push(row);
      byTenant.set(row.tenantId, list);
    }
    for (const [tenantId, rows] of byTenant) {
      try {
        const r = await inTenantTransaction(this.em, tenantId, async (tx) => {
          const fresh: SodExceptions[] = [];
          for (const row of rows) {
            const found = await this.sod.findExceptionById(
              tx,
              tenantId,
              row.id,
            );
            if (found && found.statusConceptId === CONCEPTS.STATE_ACTIVE)
              fresh.push(found);
          }
          return this.automation.expireSodExceptions(
            tx,
            tenantId,
            fresh,
            now,
            actor,
          );
        });
        counts.sodExceptionsExpired += r.expired;
        counts.sodRemediationItems += r.remediationItems;
      } catch (error) {
        counts.tenantErrors += 1;
        this.logger.error(
          {
            operation: 'delegated_access.governance_sweep.sod',
            tenantId,
            error: error instanceof Error ? error.name : 'unknown',
          },
          'SoD expiry failed for one organization',
        );
      }
    }
  }

  /** Lo diario de una organización. */
  private async sweepTenant(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    now: Date,
    counts: Record<string, number>,
  ): Promise<void> {
    const open = await this.reviews.findCampaigns(tx, tenantId, [
      DELEG.REVIEW_CAMPAIGN_OPEN,
    ]);
    for (const campaign of open) {
      const closed = await this.campaigns.closeCampaign(tx, campaign, now, {
        manual: false,
        actor,
      });
      if (closed.closed) {
        counts.campaignsClosed += 1;
        counts.itemsAutoRevoked += closed.autoRevoked;
        continue;
      }
      const r = await this.automation.remindAndEscalate(
        tx,
        campaign,
        now,
        actor,
      );
      counts.reminders += r.reminders;
      counts.escalations += r.escalations;
    }
    const zone = (await this.zone?.timeZoneOf(tx, tenantId)) ?? DEFAULT_ZONE;
    counts.recertificationItems += (
      await this.automation.openRecertificationItems(tx, tenantId, now, zone)
    ).items;
    counts.periodicCampaigns += (
      await this.automation.openPeriodicCampaigns(tx, tenantId, now)
    ).created;
    counts.remediationItems += (
      await this.automation.openRemediation(tx, tenantId, now)
    ).items;
    await this.activityAndInactivity(tx, tenantId, actor, now, counts);
  }

  /** `last_active_at` de cada persona y, si la organización lo activa, suspensión por inactividad. */
  private async activityAndInactivity(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    now: Date,
    counts: Record<string, number>,
  ): Promise<void> {
    const settings = await this.settings.read(tx, tenantId);
    const world = await this.loader.load(tx, tenantId, now);
    const active = world.engagements.filter((e) => e.state === 'ACTIVE');
    if (active.length === 0) return;
    const userIds = active.map((e) => e.subjectUserId);
    const [permits, logins, rows] = await Promise.all([
      this.queries.lastPermitByUser(tx, tenantId, userIds),
      this.queries.lastLoginByUser(tx, userIds),
      tx.find(OrganizationUserAssignments, {
        id: { $in: active.map((e) => e.engagementId) },
      }),
    ]);
    const byId = new Map(rows.map((r) => [r.id, r]));
    let suspended = 0;
    for (const e of active) {
      const row = byId.get(e.engagementId);
      if (!row) continue;
      const seen = [permits.get(e.subjectUserId), logins.get(e.subjectUserId)]
        .filter((d): d is Date => !!d)
        .sort((a, b) => b.getTime() - a.getTime())[0];
      if (
        seen &&
        (!row.lastActiveAt || seen.getTime() > row.lastActiveAt.getTime())
      ) {
        row.lastActiveAt = seen;
        touch(row, undefined, now);
        counts.lastActiveRefreshed += 1;
      }
      if (settings.autoSuspendInactiveDays === null) continue;
      const a = assessInactivity({
        now,
        referenceStart: e.createdAt,
        lastPermitAt: permits.get(e.subjectUserId),
        lastLoginAt: logins.get(e.subjectUserId),
        inactivityDays: settings.inactivityDays,
        autoSuspendInactiveDays: settings.autoSuspendInactiveDays,
      });
      if (!a.autoSuspend) continue;
      if (await this.suspendInactive(tx, tenantId, row, actor, now)) {
        suspended += 1;
      }
    }
    counts.inactiveSuspended += suspended;
    await tx.flush();
  }

  /**
   * Suspende por inactividad con el MISMO camino que la suspensión manual
   * (`EngagementSuspensionService.suspendSystem`: estado, delegaciones, membresía,
   * acceso derivado, caso `SUSPENSION` y evento), sin duplicar su lógica.
   * Si otro camino ya suspendió o dio de baja el vínculo, lo salta.
   *
   * @returns `true` si lo suspendió.
   */
  private async suspendInactive(
    tx: EntityManager,
    tenantId: string,
    row: OrganizationUserAssignments,
    actor: AuthenticatedUser,
    now: Date,
  ): Promise<boolean> {
    try {
      await this.suspension.suspendSystem(
        tx,
        tenantId,
        row.id,
        'INACTIVITY',
        now,
      );
    } catch (error) {
      const reason = (error as { reason?: string }).reason;
      if (
        reason === Reason.ENGAGEMENT_ALREADY_SUSPENDED ||
        reason === Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE
      ) {
        return false;
      }
      throw error;
    }
    await this.audit.seal(
      tx,
      actor,
      tenantId,
      'SUPPORT_ENGAGEMENT_SUSPENDED',
      'organization_user_assignment',
      row.id,
    );
    return true;
  }
}
