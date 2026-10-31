import { Inject, Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  ANOMALY_DEFAULTS,
  DAY_MS,
  anomalyWindow,
  assessInactivity,
  atomMeta,
  checklistFor,
  detectBrowsePatients,
  detectCancelSpike,
  detectDeniedBurst,
  detectInactiveAccount,
  detectOffHours,
  detectPrivilegeCreep,
  detectSearchSpike,
  isGrantLive,
  startOfZonedDay,
  type AnomalyFinding,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  AckAnomalyDto,
  AnomaliesQueryDto,
  AnomalyListDto,
  AnomalyResolutionResultDto,
  AnomalyViewDto,
} from '../dto/governance-reports.dto';
import type { AccessAnomalies } from '../entities';
import {
  AccessAnomaliesRepository,
  GovernanceQueriesRepository,
  GrantUsageStatsRepository,
  LifecycleRepository,
  SupportActivityRepository,
} from '../repositories';
import { DelegationScopeService } from './delegation-scope.service';
import { GovernanceAudit } from './governance-audit';
import { GovernanceCampaignSettings } from './governance-campaign-settings';
import { creepOfEngagement } from './governance-creep';
import {
  GovernanceAccessService,
  type GovernanceActor,
} from './governance-access.service';
import { GovernanceEvents, GovernanceEventType } from './governance-events';
import type { WorldEngagement } from './governance-world';
import { GovernanceWorldLoader } from './governance-world.loader';
import {
  SUPPORT_PATIENT_FACTS_PORT,
  SUPPORT_TENANT_ZONE_PORT,
  type PatientFactsPort,
  type TenantZonePort,
} from './support-access-context.ports';
import { REPORTS_VIEW_ATOM } from './governance-reports.service';

const HOUR_MS = 3_600_000;
const SEARCH_ATOM = 'patients.search.exact';
const CANCEL_ATOM = 'agenda.appointment.cancel';
const DEFAULT_ZONE = 'America/La_Paz';
const COMMENT_MIN = 10;

const STATUS_BY_CODE: Readonly<Record<string, string>> = {
  OPEN: DELEG.ANOMALY_OPEN,
  ACKNOWLEDGED: DELEG.ANOMALY_ACKNOWLEDGED,
  DISMISSED: DELEG.ANOMALY_DISMISSED,
  ESCALATED: DELEG.ANOMALY_ESCALATED,
};
const CODE_BY_STATUS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(STATUS_BY_CODE).map(([code, id]) => [id, code]),
);
const KIND_BY_CONCEPT = new Map<string, string>(
  [
    'ANOMALY_SEARCH_SPIKE',
    'ANOMALY_CANCEL_SPIKE',
    'ANOMALY_OFF_HOURS',
    'ANOMALY_DENIED_BURST',
    'ANOMALY_BROWSE_PATIENTS',
    'ANOMALY_INACTIVE_ACCOUNT',
    'ANOMALY_PRIVILEGE_CREEP',
  ].map((k) => [(DELEG as Record<string, string>)[k], k]),
);
const AUDIT_ACTION: Readonly<Record<string, string>> = {
  ACKNOWLEDGED: 'ANOMALY_ACKNOWLEDGED',
  DISMISSED: 'ANOMALY_DISMISSED',
  ESCALATED: 'ANOMALY_ESCALATED',
};

/** Fila de uso reducida a lo que usan las reglas. */
interface UsageRow {
  readonly userId: string;
  readonly permissionCode: string;
  readonly bucketStart: Date;
  readonly permitCount: number;
  readonly offHoursCount: number;
}

/**
 * Anomalías de actividad (CONTRATO-GOBIERNO §6.6): el barrido horario aplica
 * las 7 reglas deterministas del dominio sobre la estadística de uso y la
 * bitácora de decisiones (línea base de 28 días, sin aprendizaje automático) y
 * las abre de forma idempotente por ventana; las personas que administran las
 * reconocen, descartan o escalan. Una anomalía no corta el acceso por sí sola.
 * La evidencia son números y el átomo: nunca datos de pacientes.
 */
@Injectable()
export class GovernanceAnomaliesService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - Anomalías.
   * @param loader - Hechos de gobierno de la organización.
   * @param access - Autorización y población del administrador.
   * @param queries - Decisiones, pacientes vistos y actividad.
   * @param usage - Estadística de uso por hora.
   * @param settings - Ajustes de gobierno.
   * @param activity - Nombres de las personas.
   * @param events - Eventos de dominio (outbox).
   * @param audit - Sello de auditoría con su nombre de negocio.
   * @param lifecycle - Casos de ciclo de vida (la suspensión sugerida).
   * @param patientFacts - Citas de los pacientes (para «sin cita en la organización»).
   * @param zone - Zona horaria de la organización.
   * @param scope - Política común de organización.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AccessAnomaliesRepository,
    private readonly loader: GovernanceWorldLoader,
    private readonly access: GovernanceAccessService,
    private readonly queries: GovernanceQueriesRepository,
    private readonly usage: GrantUsageStatsRepository,
    private readonly settings: GovernanceCampaignSettings,
    private readonly activity: SupportActivityRepository,
    private readonly events: GovernanceEvents,
    private readonly audit: GovernanceAudit,
    private readonly lifecycle: LifecycleRepository,
    @Optional()
    @Inject(SUPPORT_PATIENT_FACTS_PORT)
    private readonly patientFacts: PatientFactsPort | undefined,
    @Optional()
    @Inject(SUPPORT_TENANT_ZONE_PORT)
    private readonly zone: TenantZonePort | undefined,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GovernanceAnomaliesService.name);
  }

  /** Anomalías de la organización (de la población de quien consulta), las más nuevas primero. */
  async list(
    actor: AuthenticatedUser,
    query: Pick<AnomaliesQueryDto, 'status' | 'kind'> = {},
  ): Promise<AnomalyListDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const authority = await this.access.authorize(
      tx,
      actor,
      tenantId,
      REPORTS_VIEW_ATOM,
    );
    return this.listFor(tx, tenantId, authority, query);
  }

  /**
   * Lo mismo con una autoridad ya comprobada (la exportación la comprueba con
   * otro átomo).
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param authority - Alcance de quien consulta.
   * @param query - Estado y tipo.
   */
  async listFor(
    tx: EntityManager,
    tenantId: string,
    authority: GovernanceActor,
    query: Pick<AnomaliesQueryDto, 'status' | 'kind'> = {},
  ): Promise<AnomalyListDto> {
    const rows = await this.repo.findByTenant(tx, tenantId, {
      ...(query.status
        ? { statusConceptIds: [STATUS_BY_CODE[query.status]] }
        : {}),
      ...(query.kind
        ? { kindConceptIds: [(DELEG as Record<string, string>)[query.kind]] }
        : {}),
      limit: 200,
    });
    const visible = authority.full
      ? rows
      : this.inPopulation(
          rows,
          this.access.restrict(
            await this.loader.load(tx, tenantId, new Date()),
            authority,
          ).engagements,
        );
    const names = await this.activity.userNames(tx, [
      ...new Set(visible.map((r) => r.userId)),
    ]);
    const items = visible.map((r) => view(r, names.get(r.userId)));
    return { items, count: items.length };
  }

  /**
   * Reconoce, descarta o escala una anomalía. Descartar exige un comentario de
   * al menos 10 caracteres; escalar abre una suspensión SUGERIDA (el caso de
   * ciclo de vida; nada se suspende solo).
   */
  async ack(
    id: string,
    dto: Pick<AckAnomalyDto, 'status' | 'comment'>,
    actor: AuthenticatedUser,
  ): Promise<AnomalyResolutionResultDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const authority = await this.access.authorize(
        tx,
        actor,
        tenantId,
        REPORTS_VIEW_ATOM,
      );
      const row = await this.repo.findById(tx, tenantId, id);
      if (!row) throw this.notFound();
      if (!authority.full) {
        const world = this.access.restrict(
          await this.loader.load(tx, tenantId, new Date()),
          authority,
        );
        if (this.inPopulation([row], world.engagements).length === 0)
          throw this.notFound();
      }
      if (row.statusConceptId !== DELEG.ANOMALY_OPEN) {
        throw new ConflictException(
          'Esta alerta ya se atendió.',
          undefined,
          Reason.ANOMALY_ALREADY_RESOLVED,
        );
      }
      const comment = dto.comment?.trim();
      if (dto.status === 'DISMISSED' && (comment?.length ?? 0) < COMMENT_MIN) {
        throw new PreconditionFailedException(
          'Escriba un comentario de al menos 10 caracteres para descartar la alerta.',
          undefined,
          Reason.ANOMALY_COMMENT_REQUIRED,
        );
      }
      const now = new Date();
      this.repo.resolve(row, {
        statusConceptId: STATUS_BY_CODE[dto.status],
        byUserId: actor.id,
        comment,
        now,
      });
      if (dto.status === 'ESCALATED')
        await this.suggestSuspension(tx, row, actor, now);
      await this.audit.seal(
        tx,
        actor,
        tenantId,
        AUDIT_ACTION[dto.status],
        'access_anomaly',
        row.id,
      );
      await tx.flush();
      return { ok: true, status: dto.status };
    });
  }

  /**
   * Barrido horario de una organización: aplica las reglas a cada persona con
   * vínculo activo y abre las anomalías nuevas (idempotente por ventana).
   *
   * @param tx - Transacción de la organización.
   * @param tenantId - Organización.
   * @param now - Reloj del barrido.
   * @returns Cuántas se abrieron y de qué tipo.
   */
  async scan(
    tx: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<{ created: number; byKind: Record<string, number> }> {
    const world = await this.loader.load(tx, tenantId, now);
    const settings = await this.settings.read(tx, tenantId);
    const tz = (await this.zone?.timeZoneOf(tx, tenantId)) ?? DEFAULT_ZONE;
    const active = world.engagements.filter(
      (e) =>
        e.state === 'ACTIVE' &&
        e.grants.some((g) => g.effect !== 'DENY' && isGrantLive(g, now)),
    );
    const byKind: Record<string, number> = {};
    if (active.length === 0) return { created: 0, byKind };
    const userIds = active.map((e) => e.subjectUserId);
    const [rows, denied, permits, logins, admins] = await Promise.all([
      this.usage.findSince(tx, tenantId, new Date(now.getTime() - 30 * DAY_MS)),
      this.queries.deniedDecisions(
        tx,
        tenantId,
        new Date(now.getTime() - 2 * HOUR_MS),
        now,
      ),
      this.queries.lastPermitByUser(tx, tenantId, userIds),
      this.queries.lastLoginByUser(tx, userIds),
      this.queries.securityAdminUserIds(tx, tenantId),
    ]);
    const hour = anomalyWindow('ANOMALY_SEARCH_SPIKE', now, tz);
    const day = anomalyWindow('ANOMALY_CANCEL_SPIKE', now, tz);
    const viewed = await this.viewedWithoutAppointment(tx, tenantId, day, now);
    let created = 0;
    for (const e of active) {
      const mine = rows.filter((r) => r.userId === e.subjectUserId);
      const findings: AnomalyFinding[] = [];
      const push = (f: AnomalyFinding | undefined): void => {
        if (f) findings.push(f);
      };
      push(
        detectSearchSpike({
          ...hour,
          permitsInWindow: sumPermits(
            mine,
            SEARCH_ATOM,
            hour.windowStart,
            hour.windowEnd,
          ),
          hourlyBaseline: hourlySeries(mine, SEARCH_ATOM, hour.windowStart),
        }),
      );
      push(
        detectCancelSpike({
          ...day,
          cancelsInWindow: sumPermits(
            mine,
            CANCEL_ATOM,
            day.windowStart,
            day.windowEnd,
          ),
          dailyBaseline: dailySeries(mine, CANCEL_ATOM, now, tz),
        }),
      );
      push(
        detectOffHours({
          ...day,
          timeZone: tz,
          events: mine
            .filter(
              (r) => r.offHoursCount > 0 && sensitiveEnough(r.permissionCode),
            )
            .flatMap((r) =>
              Array.from({ length: r.offHoursCount }, () => ({
                at: r.bucketStart,
                sensitivity: atomMeta(r.permissionCode)!.sensitivity,
              })),
            ),
        }),
      );
      push(
        detectDeniedBurst({
          decisions: denied
            .filter((d) => d.userId === e.subjectUserId)
            .map((d) => d.recordedAt),
        }),
      );
      const views = viewed.get(e.subjectUserId);
      if (views) push(detectBrowsePatients({ ...day, views }));
      push(
        detectInactiveAccount({
          ...day,
          inactivityDays: settings.inactivityDays,
          assessment: assessInactivity({
            now,
            referenceStart: e.createdAt,
            lastPermitAt: permits.get(e.subjectUserId),
            lastLoginAt: logins.get(e.subjectUserId),
            inactivityDays: settings.inactivityDays,
            autoSuspendInactiveDays: settings.autoSuspendInactiveDays,
          }),
        }),
      );
      push(
        detectPrivilegeCreep({
          ...day,
          creep: creepOfEngagement(e, now, settings.creepThreshold),
        }),
      );
      for (const f of findings) {
        if (await this.open(tx, tenantId, e, f, admins)) {
          created += 1;
          byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
        }
      }
    }
    this.logger.info(
      {
        operation: 'delegated_access.anomaly.scan',
        created,
        people: active.length,
      },
      'Anomaly scan completed',
    );
    return { created, byKind };
  }

  /** Abre una anomalía (idempotente) y avisa a quien administra a la persona. */
  private async open(
    tx: EntityManager,
    tenantId: string,
    e: WorldEngagement,
    f: AnomalyFinding,
    securityAdmins: readonly string[],
  ): Promise<boolean> {
    const kindConceptId = (DELEG as Record<string, string>)[f.kind];
    const created = await this.repo.createIfAbsent(tx, {
      tenantId,
      userId: e.subjectUserId,
      organizationUserAssignmentId: e.engagementId,
      kindConceptId,
      windowStart: f.windowStart,
      windowEnd: f.windowEnd,
      observedValue: f.observed.toFixed(2),
      ...(f.baseline === null ? {} : { baselineValue: f.baseline.toFixed(2) }),
      thresholdValue: f.threshold.toFixed(2),
      evidence: f.evidence,
    });
    if (!created) return false;
    const id = await this.queries.anomalyIdByWindow(
      tx,
      tenantId,
      e.subjectUserId,
      kindConceptId,
      f.windowStart,
    );
    await this.events.publish(tx, {
      tenantId,
      type: GovernanceEventType.anomalyDetected,
      aggregate: 'access_anomaly',
      aggregateId: id ?? e.engagementId,
      payload: {
        anomalyId: id,
        anomalyKind: f.kind,
        userId: e.subjectUserId,
        engagementId: e.engagementId,
        notifyUserIds: e.supervisorUserId
          ? [e.supervisorUserId]
          : [...securityAdmins],
      },
    });
    return true;
  }

  /** Pacientes distintos que una persona vio en el día, con si tienen cita en la organización. */
  private async viewedWithoutAppointment(
    tx: EntityManager,
    tenantId: string,
    day: { windowStart: Date; windowEnd: Date },
    now: Date,
  ): Promise<
    Map<string, Array<{ patientId: string; hasAppointment: boolean }>>
  > {
    const out = new Map<
      string,
      Array<{ patientId: string; hasAppointment: boolean }>
    >();
    if (!this.patientFacts) return out;
    const rows = await this.queries.viewedPatients(
      tx,
      tenantId,
      day.windowStart,
      day.windowEnd,
    );
    if (rows.length === 0) return out;
    const facts = await this.patientFacts.loadMany(tx, {
      tenantId,
      patientProfileIds: [...new Set(rows.map((r) => r.patientProfileId))],
      now,
      bookingRange: { daysBefore: 30, daysAfter: 30 },
      needsCoverage: false,
      needsCareTeam: false,
      needsBirthDate: false,
    });
    for (const r of rows) {
      const list = out.get(r.userId) ?? [];
      list.push({
        patientId: r.patientProfileId,
        hasAppointment:
          (facts.get(r.patientProfileId)?.bookings.length ?? 0) > 0,
      });
      out.set(r.userId, list);
    }
    return out;
  }

  /** Escalar abre un caso `SUSPENSION` sugerido, una sola vez por vínculo. */
  private async suggestSuspension(
    tx: EntityManager,
    row: AccessAnomalies,
    actor: AuthenticatedUser,
    now: Date,
  ): Promise<void> {
    if (!row.organizationUserAssignmentId) return;
    const open = await this.lifecycle.findOpenCase(
      tx,
      row.organizationUserAssignmentId,
      DELEG.LIFECYCLE_SUSPENSION,
    );
    if (open) return;
    this.lifecycle.createCase(tx, {
      tenantId: row.tenantId,
      organizationUserAssignmentId: row.organizationUserAssignmentId,
      subjectUserId: row.userId,
      kindConceptId: DELEG.LIFECYCLE_SUSPENSION,
      openedByUserId: actor.id,
      openedAt: now,
      reasonText: 'Alerta de actividad escalada: se sugiere suspender.',
      checklist: checklistFor('SUSPENSION'),
      details: { suggested: true, anomalyId: row.id },
      actorUserId: actor.id,
    });
  }

  private inPopulation(
    rows: readonly AccessAnomalies[],
    engagements: readonly WorldEngagement[],
  ): AccessAnomalies[] {
    const users = new Set(engagements.map((e) => e.subjectUserId));
    return rows.filter((r) => users.has(r.userId));
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Alerta no encontrada',
      undefined,
      Reason.ANOMALY_NOT_FOUND,
    );
  }
}

function view(r: AccessAnomalies, name: string | undefined): AnomalyViewDto {
  return {
    id: r.id,
    userId: r.userId,
    ...(name ? { userName: name } : {}),
    kind: KIND_BY_CONCEPT.get(r.kindConceptId) ?? 'ANOMALY_SEARCH_SPIKE',
    status: CODE_BY_STATUS[r.statusConceptId] ?? 'OPEN',
    windowStart: r.windowStart.toISOString(),
    windowEnd: r.windowEnd.toISOString(),
    observed: Number(r.observedValue),
    baseline: r.baselineValue === undefined ? null : Number(r.baselineValue),
    threshold: Number(r.thresholdValue),
    evidence:
      r.evidenceJson !== null && typeof r.evidenceJson === 'object'
        ? (r.evidenceJson as Record<string, unknown>)
        : {},
    ...(r.acknowledgedAt
      ? { acknowledgedAt: r.acknowledgedAt.toISOString() }
      : {}),
    ...(r.resolutionCommentText
      ? { resolutionComment: r.resolutionCommentText }
      : {}),
  };
}

function sensitiveEnough(code: string): boolean {
  const s = atomMeta(code)?.sensitivity;
  return s === 'MEDIUM' || s === 'HIGH' || s === 'CRITICAL';
}

/** Suma de `PERMIT` de un permiso en `[from, to)`. */
function sumPermits(
  rows: readonly UsageRow[],
  code: string,
  from: Date,
  to: Date,
): number {
  return rows
    .filter(
      (r) =>
        r.permissionCode === code &&
        r.bucketStart.getTime() >= from.getTime() &&
        r.bucketStart.getTime() < to.getTime(),
    )
    .reduce((n, r) => n + r.permitCount, 0);
}

/** Conteo por hora de los 28 días previos a `windowStart` (las horas sin actividad en cero). */
function hourlySeries(
  rows: readonly UsageRow[],
  code: string,
  windowStart: Date,
): number[] {
  const byHour = new Map<number, number>();
  for (const r of rows) {
    if (r.permissionCode !== code) continue;
    const k = r.bucketStart.getTime();
    byHour.set(k, (byHour.get(k) ?? 0) + r.permitCount);
  }
  const hours = ANOMALY_DEFAULTS.baselineDays * 24;
  return Array.from(
    { length: hours },
    (_, i) => byHour.get(windowStart.getTime() - (hours - i) * HOUR_MS) ?? 0,
  );
}

/** Conteo por día local de los 28 días previos a hoy. */
function dailySeries(
  rows: readonly UsageRow[],
  code: string,
  now: Date,
  tz: string,
): number[] {
  return Array.from({ length: ANOMALY_DEFAULTS.baselineDays }, (_, i) => {
    const offset = i - ANOMALY_DEFAULTS.baselineDays;
    const from =
      startOfZonedDay(now, tz, offset) ??
      new Date(Math.floor(now.getTime() / DAY_MS) * DAY_MS + offset * DAY_MS);
    const to =
      startOfZonedDay(now, tz, offset + 1) ?? new Date(from.getTime() + DAY_MS);
    return sumPermits(rows, code, from, to);
  });
}
