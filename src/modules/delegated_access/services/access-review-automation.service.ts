import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../common';
import {
  DAY_MS,
  REVIEW_DEFAULTS,
  escalationDue,
  isGrantLive,
  nextPeriodicReviewDue,
  planRecertificationItems,
  reminderDue,
  selectRemediationGrant,
  type CampaignScope,
  type ReviewKind,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import type {
  AccessReviewCampaigns,
  AccessReviewItems,
  SodExceptions,
} from '../entities';
import { AccessReviewRepository, SodRepository } from '../repositories';
import {
  REVIEWER_KIND_BY_CONCEPT,
  REVIEW_KIND_BY_CONCEPT,
  REVIEW_KIND_CONCEPT,
  UNCERTIFIED_CONCEPT,
} from './access-review-concepts';
import { addRoutedReviewers } from './access-review-evidence';
import { CAMPAIGN_SCOPE_SCHEMA_VERSION } from './access-review-input';
import { AccessReviewItemFactory } from './access-review-item.factory';
import { GovernanceAudit } from './governance-audit';
import { GovernanceCampaignSettings } from './governance-campaign-settings';
import { GovernanceEvents, GovernanceEventType } from './governance-events';
import {
  itemKey,
  type GovernanceWorld,
  type WorldEngagement,
} from './governance-world';
import { GovernanceWorldLoader } from './governance-world.loader';
import { ReviewerResolverService } from './reviewer-resolver.service';

const ORG_SCOPE: CampaignScope = { kind: 'ORGANIZATION' };
const PERIODIC_DUE_DAYS = 30;
const REMEDIATION_DUE_DAYS = 14;
const SOD_REMEDIATION_DUE_DAYS = 7;
/** Cada cuántos meses se revisan las concesiones ALTA/CRÍTICA si la organización revisa cada 12. */
const HIGH_RISK_CADENCE_MONTHS = 6;

/** Cómo abrir una campaña de remediación. */
interface RemediationPlan {
  readonly name: string;
  readonly dueDays: number;
  readonly grantIdsByEngagement: ReadonlyMap<string, ReadonlySet<string>>;
}

/**
 * Lo automático de las campañas de certificación (CONTRATO-GOBIERNO §6.2 y
 * §8.6): recordatorios y escalamiento, los ítems de recertificación individual
 * (6 o 12 meses) integrados con el barrido existente, las campañas periódicas
 * por cadencia, las de remediación (sobre el techo, conflictos, condiciones
 * ilegibles, doctores dados de baja) y el vencimiento de excepciones SoD con su
 * ítem de remediación de 7 días. Todo es idempotente: repetir el barrido da el
 * mismo estado.
 */
@Injectable()
export class AccessReviewAutomationService {
  /**
   * @param repo - Campañas e ítems.
   * @param sod - Reglas y excepciones de segregación de funciones.
   * @param loader - Hechos de gobierno de la organización.
   * @param resolver - Resolución de revisores.
   * @param factory - Creación de ítems con su evidencia.
   * @param events - Eventos de dominio (outbox).
   * @param audit - Sello de auditoría con su nombre de negocio.
   * @param settings - Ajustes de gobierno.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly repo: AccessReviewRepository,
    private readonly sod: SodRepository,
    private readonly loader: GovernanceWorldLoader,
    private readonly resolver: ReviewerResolverService,
    private readonly factory: AccessReviewItemFactory,
    private readonly events: GovernanceEvents,
    private readonly audit: GovernanceAudit,
    private readonly settings: GovernanceCampaignSettings,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccessReviewAutomationService.name);
  }

  /**
   * Recordatorios en `due − 7/−3/−1` días y a diario tras el vencimiento, y
   * escalamiento a los `escalate_after_days` (una sola vez). Solo mira los
   * ítems pendientes de una campaña abierta.
   */
  async remindAndEscalate(
    tx: EntityManager,
    campaign: AccessReviewCampaigns,
    now: Date,
    actor?: AuthenticatedUser,
  ): Promise<{ reminders: number; escalations: number }> {
    const all = await this.repo.findItemsByCampaign(tx, campaign.id);
    const pending = all.filter(
      (i) => i.decisionConceptId === DELEG.REVIEW_ITEM_PENDING,
    );
    if (pending.length === 0) return { reminders: 0, escalations: 0 };
    const days = Array.isArray(campaign.reminderDaysBeforeJson)
      ? campaign.reminderDaysBeforeJson.filter(
          (n): n is number => typeof n === 'number',
        )
      : undefined;
    const world = await this.loader.load(tx, campaign.tenantId, now, [
      ...new Set(pending.map((i) => i.organizationUserAssignmentId)),
    ]);
    const facts = await this.resolver.factsFor(tx, world, campaign.ownerUserId);
    let reminders = 0;
    let escalations = 0;
    for (const item of pending) {
      const r = reminderDue({
        dueAt: item.dueAt,
        now,
        lastRemindedAt: item.lastRemindedAt,
        reminderDaysBefore: days,
        launchedAt: campaign.launchedAt,
      });
      if (r.due) {
        item.reminderCount += 1;
        item.lastRemindedAt = now;
        touch(item, undefined, now);
        reminders += 1;
        await this.events.publish(tx, {
          tenantId: campaign.tenantId,
          type: GovernanceEventType.reminderDue,
          aggregate: 'access_review_item',
          aggregateId: item.id,
          payload: {
            campaignId: campaign.id,
            itemId: item.id,
            reviewerUserIds: this.reviewersOf(item),
            overdue: r.overdue,
            reminderCount: item.reminderCount,
          },
        });
      }
      const escalate = escalationDue({
        dueAt: item.dueAt,
        now,
        escalateAfterDays: campaign.escalateAfterDays,
        escalatedAt: item.escalatedAt,
      });
      if (!escalate) continue;
      const e = world.engagements.find(
        (x) => x.engagementId === item.organizationUserAssignmentId,
      );
      if (!e) continue;
      const g = item.supportScopeGrantId
        ? e.grants.find((x) => x.grantId === item.supportScopeGrantId)
        : undefined;
      const targets = this.resolver.escalate(
        REVIEWER_KIND_BY_CONCEPT[item.reviewerKindConceptId] ?? 'ADMIN',
        facts,
        e,
        g,
        REVIEW_KIND_BY_CONCEPT[campaign.kindConceptId] ?? 'PERIODIC',
      );
      if (targets.userIds.length === 0) continue;
      item.escalatedAt = now;
      item.escalatedToUserId = targets.userIds[0];
      item.evidenceJson = addRoutedReviewers(
        item.evidenceJson,
        targets.userIds,
      );
      touch(item, undefined, now);
      escalations += 1;
      await this.audit.seal(
        tx,
        actor,
        campaign.tenantId,
        'ACCESS_REVIEW_ITEM_ESCALATED',
        'access_review_item',
        item.id,
      );
      await this.events.publish(tx, {
        tenantId: campaign.tenantId,
        type: GovernanceEventType.itemEscalated,
        aggregate: 'access_review_item',
        aggregateId: item.id,
        payload: {
          campaignId: campaign.id,
          itemId: item.id,
          escalatedToUserIds: [...targets.userIds],
        },
      });
    }
    await tx.flush();
    return { reminders, escalations };
  }

  /**
   * Abre, para todo vínculo con `next_recertification_at ≤ hoy + 30 días` sin
   * ítem abierto, un ítem de vínculo en la campaña mensual «Recertificación
   * AAAA-MM» (tipo `RECERTIFICATION`; vence en su `next_recertification_at`).
   * `recertify` y el barrido de suspensión existentes no cambian.
   */
  async openRecertificationItems(
    tx: EntityManager,
    tenantId: string,
    now: Date,
    timeZone: string,
  ): Promise<{ campaigns: number; items: number }> {
    const world = await this.loader.load(tx, tenantId, now);
    const open = await this.openItemsOf(tx, tenantId, 'RECERTIFICATION');
    const hasOpen = new Set(
      open.items
        .filter((i) => !i.supportScopeGrantId)
        .map((i) => i.organizationUserAssignmentId),
    );
    const plans = planRecertificationItems({
      engagements: world.engagements.map((e) => ({
        engagementId: e.engagementId,
        state: e.state,
        nextRecertificationAt: e.nextRecertificationAt,
        hasOpenItem: hasOpen.has(e.engagementId),
      })),
      now,
      timeZone,
    });
    let campaigns = 0;
    let items = 0;
    for (const plan of plans) {
      const planned = new Map(plan.items.map((i) => [i.engagementId, i.dueAt]));
      const scoped: GovernanceWorld = {
        ...world,
        engagements: world.engagements.filter((e) =>
          planned.has(e.engagementId),
        ),
      };
      const facts = await this.resolver.factsFor(tx, scoped, null);
      const selection = this.resolver.select(scoped, facts, {
        kind: 'RECERTIFICATION',
        scope: ORG_SCOPE,
        existingOpenItemKeys: [...hasOpen].map((id) => itemKey(id, null)),
      });
      if (selection.items.length === 0) continue;
      let campaign = open.campaigns.find((c) => c.name === plan.name);
      const isNew = !campaign;
      if (!campaign) {
        campaign = this.newCampaign(tx, tenantId, {
          name: plan.name,
          kind: 'RECERTIFICATION',
          dueAt: plan.campaignDueAt,
          ownerUserId: undefined,
        });
        campaigns += 1;
      } else if (plan.campaignDueAt.getTime() > campaign.dueAt.getTime()) {
        campaign.dueAt = plan.campaignDueAt;
        touch(campaign, undefined, now);
      }
      const created = await this.factory.open(
        tx,
        campaign,
        scoped,
        selection.items,
        now,
        {
          activate: isNew,
          dueAtOf: (d) => planned.get(d.engagementId),
        },
      );
      items += created.created;
    }
    return { campaigns, items };
  }

  /**
   * Campañas periódicas por cadencia (D-08): con `reviewCadenceMonths` de 6 o
   * 12, una campaña de toda la organización cada ese tiempo y, con 12, otra de
   * las concesiones ALTA/CRÍTICA cada 6. Sin cadencia configurada solo hay
   * campañas manuales.
   */
  async openPeriodicCampaigns(
    tx: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<{ created: number }> {
    const cfg = await this.settings.read(tx, tenantId);
    if (cfg.reviewCadenceMonths === null) return { created: 0 };
    const campaigns = await this.repo.findCampaigns(tx, tenantId);
    const month = now.toISOString().slice(0, 7);
    const lines: Array<{
      readonly label: string;
      readonly months: number;
      readonly filters?: { minSensitivity: string };
    }> = [
      { label: 'Certificación periódica', months: cfg.reviewCadenceMonths },
      ...(cfg.reviewCadenceMonths === 12
        ? [
            {
              label: 'Certificación periódica (ALTA)',
              months: HIGH_RISK_CADENCE_MONTHS,
              filters: { minSensitivity: 'ALTA' },
            },
          ]
        : []),
    ];
    let created = 0;
    for (const line of lines) {
      const last = campaigns
        .filter(
          (c) =>
            c.kindConceptId === DELEG.REVIEW_KIND_PERIODIC &&
            c.name.startsWith(line.label) &&
            (line.filters || !c.name.includes('(ALTA)')) &&
            !!c.launchedAt,
        )
        .map((c) => c.launchedAt!)
        .sort((a, b) => b.getTime() - a.getTime())[0];
      if (
        last &&
        nextPeriodicReviewDue(last, line.months).getTime() > now.getTime()
      ) {
        continue;
      }
      const world = await this.loader.load(tx, tenantId, now);
      const facts = await this.resolver.factsFor(tx, world, null);
      const selection = this.resolver.select(world, facts, {
        kind: 'PERIODIC',
        scope: ORG_SCOPE,
        filters: line.filters,
      });
      if (selection.items.length === 0) continue;
      const campaign = this.newCampaign(tx, tenantId, {
        name: `${line.label} ${month}`,
        kind: 'PERIODIC',
        dueAt: new Date(now.getTime() + PERIODIC_DUE_DAYS * DAY_MS),
        filters: line.filters,
      });
      await this.factory.open(tx, campaign, world, selection.items, now, {
        activate: true,
      });
      created += 1;
    }
    return { created };
  }

  /**
   * Remediación: las concesiones sobre el techo de su plantilla, con conflicto
   * de segregación bloqueante, con condición ilegible o que apuntan a un doctor
   * dado de baja pasan a una campaña `REMEDIATION` de 14 días. Lo que ya tiene
   * un ítem abierto no se repite.
   */
  async openRemediation(
    tx: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<{ campaigns: number; items: number }> {
    const world = await this.loader.load(tx, tenantId, now);
    const flagged = new Map<string, Set<string>>();
    for (const e of world.engagements) {
      if (e.state !== 'ACTIVE') continue;
      const blocking = new Set(
        e.sodFindings
          .filter(
            (f) =>
              f.outcome === 'BLOCKED' || f.outcome === 'EXCEPTION_REQUIRED',
          )
          .flatMap((f) => [...f.grantIdsA, ...f.grantIdsB]),
      );
      for (const g of e.grants) {
        if (g.effect === 'DENY' || !isGrantLive(g, now)) continue;
        if (
          g.aboveCeiling === true ||
          g.unreadable === true ||
          g.doctorGone === true ||
          blocking.has(g.grantId)
        ) {
          const set = flagged.get(e.engagementId) ?? new Set<string>();
          set.add(g.grantId);
          flagged.set(e.engagementId, set);
        }
      }
    }
    return this.openRemediationFor(tx, tenantId, world, now, {
      name: `Remediación ${now.toISOString().slice(0, 10)}`,
      dueDays: REMEDIATION_DUE_DAYS,
      grantIdsByEngagement: flagged,
    });
  }

  /**
   * Vence excepciones SoD (`state:expired`): el conflicto reaparece, se avisa y
   * se abre un ítem de remediación de 7 días sobre la concesión MÁS RECIENTE de
   * cada conflicto; si nadie lo resuelve, el cierre de esa campaña la revoca.
   */
  async expireSodExceptions(
    tx: EntityManager,
    tenantId: string,
    rows: readonly SodExceptions[],
    now: Date,
    actor?: AuthenticatedUser,
  ): Promise<{ expired: number; remediationItems: number }> {
    for (const row of rows) {
      this.sod.markExpired(row, now);
      await this.audit.seal(
        tx,
        actor,
        tenantId,
        'SOD_EXCEPTION_EXPIRED',
        'sod_exception',
        row.id,
      );
      await this.events.publish(tx, {
        tenantId,
        type: GovernanceEventType.sodExceptionExpired,
        aggregate: 'sod_exception',
        aggregateId: row.id,
        payload: {
          exceptionId: row.id,
          engagementId: row.organizationUserAssignmentId,
        },
      });
    }
    await tx.flush();
    const engagementIds = [
      ...new Set(rows.map((r) => r.organizationUserAssignmentId)),
    ];
    const world = await this.loader.load(tx, tenantId, now, engagementIds);
    const flagged = new Map<string, Set<string>>();
    for (const e of world.engagements) {
      for (const f of e.sodFindings) {
        if (f.outcome !== 'BLOCKED' && f.outcome !== 'EXCEPTION_REQUIRED')
          continue;
        const pick = selectRemediationGrant(
          f,
          e.grants.map((g) => ({
            grantId: g.grantId,
            createdAt: g.createdAt ?? e.createdAt,
          })),
        );
        if (!pick) continue;
        const set = flagged.get(e.engagementId) ?? new Set<string>();
        set.add(pick);
        flagged.set(e.engagementId, set);
      }
    }
    const out = await this.openRemediationFor(tx, tenantId, world, now, {
      name: `Remediación SoD ${now.toISOString().slice(0, 10)}`,
      dueDays: SOD_REMEDIATION_DUE_DAYS,
      grantIdsByEngagement: flagged,
    });
    return { expired: rows.length, remediationItems: out.items };
  }

  /** Abre (o completa) una campaña de remediación con las concesiones marcadas. */
  private async openRemediationFor(
    tx: EntityManager,
    tenantId: string,
    world: GovernanceWorld,
    now: Date,
    plan: RemediationPlan,
  ): Promise<{ campaigns: number; items: number }> {
    if (plan.grantIdsByEngagement.size === 0) return { campaigns: 0, items: 0 };
    const scoped: GovernanceWorld = {
      ...world,
      engagements: world.engagements
        .filter((e) => plan.grantIdsByEngagement.has(e.engagementId))
        .map((e): WorldEngagement => ({
          ...e,
          grants: e.grants.filter((g) =>
            plan.grantIdsByEngagement.get(e.engagementId)!.has(g.grantId),
          ),
        })),
    };
    const open = await this.openItemsOf(tx, tenantId, 'REMEDIATION');
    const existing = open.items.map((i) =>
      itemKey(i.organizationUserAssignmentId, i.supportScopeGrantId ?? null),
    );
    const facts = await this.resolver.factsFor(tx, scoped, null);
    const selection = this.resolver.select(scoped, facts, {
      kind: 'REMEDIATION',
      scope: ORG_SCOPE,
      existingOpenItemKeys: existing,
    });
    if (selection.items.length === 0) return { campaigns: 0, items: 0 };
    let campaign = open.campaigns.find((c) => c.name === plan.name);
    const isNew = !campaign;
    if (!campaign) {
      campaign = this.newCampaign(tx, tenantId, {
        name: plan.name,
        kind: 'REMEDIATION',
        dueAt: new Date(now.getTime() + plan.dueDays * DAY_MS),
        graceDays: 0,
      });
    }
    const out = await this.factory.open(
      tx,
      campaign,
      scoped,
      selection.items,
      now,
      {
        activate: isNew,
      },
    );
    return { campaigns: isNew ? 1 : 0, items: out.created };
  }

  /** Campañas abiertas de un tipo y los ítems pendientes de ellas. */
  private async openItemsOf(
    tx: EntityManager,
    tenantId: string,
    kind: ReviewKind,
  ): Promise<{
    campaigns: AccessReviewCampaigns[];
    items: AccessReviewItems[];
  }> {
    const campaigns = (
      await this.repo.findCampaigns(tx, tenantId, [DELEG.REVIEW_CAMPAIGN_OPEN])
    ).filter((c) => c.kindConceptId === REVIEW_KIND_CONCEPT[kind]);
    const items = (
      await Promise.all(
        campaigns.map((c) => this.repo.findItemsByCampaign(tx, c.id)),
      )
    )
      .flat()
      .filter((i) => i.decisionConceptId === DELEG.REVIEW_ITEM_PENDING);
    return { campaigns, items };
  }

  /** Campaña en borrador del sistema (sin responsable). */
  private newCampaign(
    tx: EntityManager,
    tenantId: string,
    data: {
      readonly name: string;
      readonly kind: ReviewKind;
      readonly dueAt: Date;
      readonly graceDays?: number;
      readonly ownerUserId?: string;
      readonly filters?: unknown;
    },
  ): AccessReviewCampaigns {
    return this.repo.createCampaign(tx, {
      tenantId,
      name: data.name,
      kindConceptId: REVIEW_KIND_CONCEPT[data.kind],
      scope: ORG_SCOPE,
      scopeSchemaVersion: CAMPAIGN_SCOPE_SCHEMA_VERSION,
      filters: data.filters,
      dueAt: data.dueAt,
      graceDays: data.graceDays,
      uncertifiedActionConceptId:
        UNCERTIFIED_CONCEPT[
          REVIEW_DEFAULTS.defaultUncertifiedAction(data.kind)
        ],
      ownerUserId: data.ownerUserId,
    });
  }

  /** Quienes pueden decidir el ítem (asignados y escalados), solo identificadores. */
  private reviewersOf(item: AccessReviewItems): string[] {
    return [
      ...new Set(
        [item.reviewerUserId, item.escalatedToUserId].filter(
          (u): u is string => !!u,
        ),
      ),
    ];
  }
}
