import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  REVIEW_DEFAULTS,
  campaignCloseAt,
  maxSensitivityOf,
  summarizeCampaignResults,
  type CampaignFilters,
  type CampaignScope,
  type ReviewKind,
  type UncertifiedAction,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  CampaignDraftDto,
  CampaignListDto,
  CampaignPreviewDto,
  CampaignResultsDto,
  CampaignViewDto,
  CloseCampaignResultDto,
  LaunchCampaignResultDto,
  ReviewItemListDto,
  UpdateCampaignDto,
} from '../dto/access-reviews.dto';
import type { OperationResultDto } from '../dto';
import type { AccessReviewCampaigns, AccessReviewItems } from '../entities';
import {
  AccessReviewRepository,
  SupportActivityRepository,
} from '../repositories';
import {
  ITEM_STATE_BY_CONCEPT,
  REVIEWER_KIND_BY_CONCEPT,
  REVIEW_KIND_BY_CONCEPT,
  REVIEW_KIND_CONCEPT,
  UNCERTIFIED_CONCEPT,
  uncertifiedActionOf,
} from './access-review-concepts';
import { AccessReviewClosureService } from './access-review-closure.service';
import { AccessReviewItemFactory } from './access-review-item.factory';
import {
  CAMPAIGN_SCOPE_SCHEMA_VERSION,
  parseCampaignFilters,
  parseCampaignScope,
} from './access-review-input';
import {
  evidenceAtomCodes,
  toCampaignView,
  toItemView,
} from './access-review-views';
import { DelegationScopeService } from './delegation-scope.service';
import { governanceError } from './governance-errors';
import {
  GovernanceAccessService,
  type GovernanceActor,
} from './governance-access.service';
import type { GovernanceWorld } from './governance-world';
import { GovernanceWorldLoader } from './governance-world.loader';
import {
  ReviewerResolverService,
  type ReviewerFacts,
} from './reviewer-resolver.service';
import type { CloseOutcome } from './access-review-closure.service';

/** Átomo que exige crear y lanzar campañas a un administrador delegado. */
export const CAMPAIGN_MANAGE_ATOM = 'team.campaigns.manage';
/** Átomo con el que un administrador delegado quita permisos (N-9: sin él no hay revocación por vencimiento). */
const REVOKE_ATOM = 'team.grants.revoke';
/** Tope de ítems que lista la vista previa. */
const PREVIEW_LIMIT = 500;

/** Campaña con sus parámetros ya validados (para seleccionar sus ítems). */
interface DraftShape {
  readonly kind: ReviewKind;
  readonly scope: CampaignScope;
  readonly filters?: CampaignFilters;
}

/**
 * Campañas de certificación de accesos (CONTRATO-GOBIERNO §6.2): vista previa,
 * borrador, lanzamiento con evidencia congelada y su hash, cierre con
 * auto-revocación de lo no certificado (D-09) y resultados. Las decisiones de
 * los revisores están en `AccessReviewItemsService`; los recordatorios, el
 * escalamiento y las campañas automáticas, en `AccessReviewAutomationService`.
 */
@Injectable()
export class AccessReviewCampaignsService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - Campañas e ítems.
   * @param loader - Hechos de gobierno de la organización.
   * @param resolver - Resolución de revisores.
   * @param access - Autorización y población del administrador.
   * @param factory - Creación de ítems con su evidencia.
   * @param closure - Cierre y auto-revocación.
   * @param scope - Política común de organización.
   * @param activity - Nombres de las personas.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AccessReviewRepository,
    private readonly loader: GovernanceWorldLoader,
    private readonly resolver: ReviewerResolverService,
    private readonly access: GovernanceAccessService,
    private readonly factory: AccessReviewItemFactory,
    private readonly closure: AccessReviewClosureService,
    private readonly scope: DelegationScopeService,
    private readonly activity: SupportActivityRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccessReviewCampaignsService.name);
  }

  /** Campañas de la organización, las más próximas a vencer primero. */
  async list(actor: AuthenticatedUser): Promise<CampaignListDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const authority = await this.access.authorize(
      tx,
      actor,
      tenantId,
      CAMPAIGN_MANAGE_ATOM,
    );
    // Un administrador delegado solo ve las campañas que él creó.
    const rows = (await this.repo.findCampaigns(tx, tenantId)).filter(
      (c) => authority.full || c.ownerUserId === actor.id,
    );
    return { items: rows.map(toCampaignView), count: rows.length };
  }

  /** Una campaña de la organización. */
  async get(id: string, actor: AuthenticatedUser): Promise<CampaignViewDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const authority = await this.access.authorize(
      tx,
      actor,
      tenantId,
      CAMPAIGN_MANAGE_ATOM,
    );
    return toCampaignView(
      await this.loadCampaign(tx, tenantId, id, authority, actor),
    );
  }

  /**
   * Cuántos ítems tendría una campaña y quién los revisa, sin crear nada.
   *
   * @throws PreconditionFailedException 422 `REVIEW_SCOPE_EMPTY` si no apunta a nada.
   */
  async preview(
    dto: CampaignDraftDto,
    actor: AuthenticatedUser,
  ): Promise<CampaignPreviewDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const authority = await this.access.authorize(
      tx,
      actor,
      tenantId,
      CAMPAIGN_MANAGE_ATOM,
    );
    const draft = this.parseDraft(dto);
    const { selection } = await this.select(
      tx,
      tenantId,
      authority,
      draft,
      actor.id,
      new Date(),
    );
    if (selection.empty) throw this.emptyScope();
    const byKind: Record<string, number> = {};
    for (const i of selection.items)
      byKind[i.reviewerKind] = (byKind[i.reviewerKind] ?? 0) + 1;
    return {
      total: selection.items.length,
      byReviewerKind: byKind,
      withoutReviewer: selection.items.filter((i) => i.unresolvedReviewer)
        .length,
      items: selection.items.slice(0, PREVIEW_LIMIT).map((i) => ({
        engagementId: i.engagementId,
        subjectUserId: i.subjectUserId,
        ...(i.grantId ? { grantId: i.grantId } : {}),
        reviewerKind: i.reviewerKind,
        reviewerUserIds: [...i.reviewerUserIds],
        ...(i.maxSensitivity ? { maxSensitivity: i.maxSensitivity } : {}),
        suggestRevoke: i.suggestRevoke,
      })),
    };
  }

  /**
   * Crea la campaña en borrador (valida el alcance contra la población real).
   *
   * @throws ConflictException 409 `REVIEW_CAMPAIGN_DUPLICATE` si el nombre ya está en uso en borrador o abierta.
   */
  async create(
    dto: CampaignDraftDto,
    actor: AuthenticatedUser,
  ): Promise<{ id: string }> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const authority = await this.access.authorize(
        tx,
        actor,
        tenantId,
        CAMPAIGN_MANAGE_ATOM,
      );
      const draft = this.parseDraft(dto);
      const now = new Date();
      this.assertDueInFuture(dto.dueAt, now);
      this.assertDelegateSchedule(authority, dto.dueAt, dto.graceDays, now);
      const { selection } = await this.select(
        tx,
        tenantId,
        authority,
        draft,
        actor.id,
        now,
      );
      if (selection.empty) throw this.emptyScope();
      await this.assertNameFree(tx, tenantId, dto.name);
      const uncertified = this.effectiveUncertifiedAction(
        authority,
        draft.kind,
        dto.uncertifiedAction,
      );
      const row = this.repo.createCampaign(tx, {
        tenantId,
        name: dto.name.trim(),
        kindConceptId: REVIEW_KIND_CONCEPT[draft.kind],
        scope: draft.scope,
        scopeSchemaVersion: CAMPAIGN_SCOPE_SCHEMA_VERSION,
        filters: draft.filters,
        dueAt: new Date(dto.dueAt),
        graceDays: dto.graceDays,
        reminderDaysBefore: dto.reminderDaysBefore,
        escalateAfterDays: dto.escalateAfterDays,
        uncertifiedActionConceptId: UNCERTIFIED_CONCEPT[uncertified],
        ownerUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: row.id };
    });
  }

  /** Edita una campaña en borrador. */
  async update(
    id: string,
    dto: UpdateCampaignDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const authority = await this.access.authorize(
        tx,
        actor,
        tenantId,
        CAMPAIGN_MANAGE_ATOM,
      );
      const row = await this.loadCampaign(tx, tenantId, id, authority, actor);
      if (row.statusConceptId !== DELEG.REVIEW_CAMPAIGN_DRAFT) {
        throw new ConflictException(
          'Solo se edita una campaña en borrador',
          undefined,
          Reason.REVIEW_CAMPAIGN_NOT_DRAFT,
        );
      }
      const now = new Date();
      if (dto.name !== undefined) {
        if (dto.name.trim() !== row.name)
          await this.assertNameFree(tx, tenantId, dto.name, row.id);
        row.name = dto.name.trim();
      }
      if (dto.kind !== undefined)
        row.kindConceptId = REVIEW_KIND_CONCEPT[dto.kind];
      if (dto.scope !== undefined) {
        const scope = parseCampaignScope(dto.scope);
        if (!scope) throw this.emptyScope();
        row.scopeJson = scope;
      }
      if (dto.filters !== undefined)
        row.filtersJson = parseCampaignFilters(dto.filters);
      if (dto.dueAt !== undefined) {
        this.assertDueInFuture(dto.dueAt, now);
        row.dueAt = new Date(dto.dueAt);
      }
      if (dto.graceDays !== undefined) row.graceDays = dto.graceDays;
      this.assertDelegateSchedule(
        authority,
        row.dueAt.toISOString(),
        row.graceDays,
        now,
      );
      if (dto.reminderDaysBefore !== undefined)
        row.reminderDaysBeforeJson = [...dto.reminderDaysBefore];
      if (dto.escalateAfterDays !== undefined)
        row.escalateAfterDays = dto.escalateAfterDays;
      if (dto.uncertifiedAction !== undefined) {
        this.assertMayAutoRevoke(authority, dto.uncertifiedAction);
        row.uncertifiedActionConceptId =
          UNCERTIFIED_CONCEPT[dto.uncertifiedAction];
      }
      touch(row, actor.id, now);
      await tx.flush();
      return { ok: true };
    });
  }

  /**
   * Lanza la campaña: genera un ítem por concesión (o por vínculo) con su
   * evidencia congelada y el `evidence_hash`, y la abre.
   *
   * @throws ConflictException 409 `REVIEW_CAMPAIGN_NOT_DRAFT`.
   * @throws PreconditionFailedException 422 `REVIEW_SCOPE_EMPTY`.
   */
  async launch(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<LaunchCampaignResultDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const authority = await this.access.authorize(
        tx,
        actor,
        tenantId,
        CAMPAIGN_MANAGE_ATOM,
      );
      const campaign = await this.loadCampaign(
        tx,
        tenantId,
        id,
        authority,
        actor,
      );
      if (campaign.statusConceptId !== DELEG.REVIEW_CAMPAIGN_DRAFT) {
        throw new ConflictException(
          'La campaña ya no está en borrador',
          undefined,
          Reason.REVIEW_CAMPAIGN_NOT_DRAFT,
        );
      }
      const now = new Date();
      // Un borrador viejo no se lanza con un plazo que ya quedó por debajo del mínimo.
      this.assertDelegateSchedule(
        authority,
        campaign.dueAt.toISOString(),
        campaign.graceDays,
        now,
      );
      // Un borrador de cuando el delegado aún podía revocar no se lanza si perdió el átomo.
      this.assertMayAutoRevoke(
        authority,
        uncertifiedActionOf(campaign.uncertifiedActionConceptId),
      );
      const { world, selection } = await this.select(
        tx,
        tenantId,
        authority,
        this.draftOf(campaign),
        campaign.ownerUserId ?? actor.id,
        now,
      );
      if (selection.empty) throw this.emptyScope();
      const out = await this.factory.open(
        tx,
        campaign,
        world,
        selection.items,
        now,
        { activate: true, actorUserId: actor.id },
      );
      return { ok: true, items: out.created, withoutReviewer: out.unresolved };
    });
  }

  /** Cierra la campaña a mano y aplica la acción de lo no certificado. */
  async close(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<CloseCampaignResultDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const authority = await this.access.authorize(
        tx,
        actor,
        tenantId,
        CAMPAIGN_MANAGE_ATOM,
      );
      const campaign = await this.loadCampaign(
        tx,
        tenantId,
        id,
        authority,
        actor,
      );
      if (campaign.statusConceptId !== DELEG.REVIEW_CAMPAIGN_OPEN) {
        throw new ConflictException(
          'La campaña no está abierta',
          undefined,
          Reason.REVIEW_CAMPAIGN_NOT_OPEN,
        );
      }
      const now = new Date();
      // El cierre manual omite fecha y gracia: un delegado no lo usa para
      // adelantarse a los revisores y auto-revocar lo que aún no decidieron.
      if (
        !authority.full &&
        now.getTime() <
          campaignCloseAt(campaign.dueAt, campaign.graceDays).getTime()
      ) {
        throw new ConflictException(
          'Aún no vence la fecha límite de la campaña ni su gracia.',
          undefined,
          Reason.REVIEW_CAMPAIGN_NOT_DUE,
        );
      }
      const out = await this.closure.close(tx, campaign, now, {
        manual: true,
        actorUserId: actor.id,
        actor,
      });
      return {
        ok: true,
        autoRevoked: out.autoRevoked,
        skipped: out.skipped,
      };
    });
  }

  /** Cancela la campaña: no revoca nada; los ítems pendientes se omiten. */
  async cancel(
    id: string,
    _dto: { reason?: string },
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const authority = await this.access.authorize(
        tx,
        actor,
        tenantId,
        CAMPAIGN_MANAGE_ATOM,
      );
      const campaign = await this.loadCampaign(
        tx,
        tenantId,
        id,
        authority,
        actor,
      );
      const open = campaign.statusConceptId === DELEG.REVIEW_CAMPAIGN_OPEN;
      if (!open && campaign.statusConceptId !== DELEG.REVIEW_CAMPAIGN_DRAFT) {
        throw new ConflictException(
          'La campaña ya terminó',
          undefined,
          Reason.REVIEW_CAMPAIGN_NOT_OPEN,
        );
      }
      const now = new Date();
      for (const item of await this.repo.findItemsByCampaign(tx, id)) {
        if (item.decisionConceptId !== DELEG.REVIEW_ITEM_PENDING) continue;
        this.repo.decide(item, {
          decisionConceptId: DELEG.REVIEW_ITEM_SKIPPED,
          now,
        });
      }
      campaign.statusConceptId = DELEG.REVIEW_CAMPAIGN_CANCELLED;
      campaign.cancelledAt = now;
      touch(campaign, actor.id, now);
      await tx.flush();
      return { ok: true };
    });
  }

  /** Estado de cada ítem de la campaña. */
  async items(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<ReviewItemListDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const authority = await this.access.authorize(
      tx,
      actor,
      tenantId,
      CAMPAIGN_MANAGE_ATOM,
    );
    const campaign = await this.loadCampaign(
      tx,
      tenantId,
      id,
      authority,
      actor,
    );
    const rows = await this.repo.findItemsByCampaign(tx, id);
    const world = this.access.restrict(
      await this.loader.load(tx, tenantId, new Date()),
      authority,
    );
    const subjectOf = new Map(
      world.engagements.map((e) => [e.engagementId, e.subjectUserId]),
    );
    const visible = rows.filter((r) =>
      subjectOf.has(r.organizationUserAssignmentId),
    );
    const names = await this.activity.userNames(tx, [
      ...new Set([...subjectOf.values()]),
    ]);
    return {
      items: visible.map((r) => {
        const subjectUserId = subjectOf.get(r.organizationUserAssignmentId)!;
        return toItemView(
          r,
          {
            subjectUserId,
            subjectName: names.get(subjectUserId) || undefined,
            campaignName: campaign.name,
          },
          false,
        );
      }),
      count: visible.length,
    };
  }

  /** Resultados de la campaña. */
  async results(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<CampaignResultsDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const authority = await this.access.authorize(
      tx,
      actor,
      tenantId,
      CAMPAIGN_MANAGE_ATOM,
    );
    const campaign = await this.loadCampaign(
      tx,
      tenantId,
      id,
      authority,
      actor,
    );
    return this.resultsOf(
      campaign,
      await this.repo.findItemsByCampaign(tx, id),
    );
  }

  /** Cierra una campaña (la usan el barrido y `POST …/close`). */
  closeCampaign(
    tx: EntityManager,
    campaign: AccessReviewCampaigns,
    now: Date,
    opts: {
      readonly manual: boolean;
      readonly actorUserId?: string;
      readonly actor?: AuthenticatedUser;
    },
  ): Promise<CloseOutcome> {
    return this.closure.close(tx, campaign, now, opts);
  }

  /** Resultados de una campaña ya cargada (también los usa la exportación). */
  resultsOf(
    campaign: AccessReviewCampaigns,
    rows: readonly AccessReviewItems[],
  ): CampaignResultsDto {
    const r = summarizeCampaignResults({
      items: rows.map((i) => ({
        itemId: i.id,
        decision: ITEM_STATE_BY_CONCEPT[i.decisionConceptId] ?? 'PENDING',
        reviewerKind:
          REVIEWER_KIND_BY_CONCEPT[i.reviewerKindConceptId] ?? 'ADMIN',
        maxSensitivity: maxSensitivityOf(evidenceAtomCodes(i.evidenceJson)),
        launchedAt: campaign.launchedAt ?? i.createdAt ?? campaign.dueAt,
        decidedAt: i.decidedAt ?? null,
      })),
    });
    return {
      total: r.total,
      byDecision: { ...r.byDecision },
      byReviewerKind: { ...r.byReviewerKind },
      bySensitivity: { ...r.bySensitivity },
      pending: r.pending,
      coveragePercent: r.coveragePercent,
      meanResponseHours: r.meanResponseHours,
      autoRevokedItemIds: [...r.autoRevokedItemIds],
    };
  }

  /** Alcance y filtros de una campaña guardada. */
  private draftOf(campaign: AccessReviewCampaigns): DraftShape {
    return {
      kind: REVIEW_KIND_BY_CONCEPT[campaign.kindConceptId] ?? 'PERIODIC',
      scope: parseCampaignScope(campaign.scopeJson) ?? { kind: 'ORGANIZATION' },
      filters: parseCampaignFilters(campaign.filtersJson),
    };
  }

  /** Valida el cuerpo: tipo, alcance con objetivos y filtros reconocidos. */
  private parseDraft(dto: CampaignDraftDto): DraftShape {
    const scope = parseCampaignScope(dto.scope);
    if (!scope) throw this.emptyScope();
    return {
      kind: dto.kind,
      scope,
      filters: parseCampaignFilters(dto.filters),
    };
  }

  /** Mundo acotado a la población de quien llama, resolución de revisores y selección. */
  private async select(
    tx: EntityManager,
    tenantId: string,
    authority: GovernanceActor,
    draft: DraftShape,
    ownerUserId: string,
    now: Date,
  ): Promise<{
    world: GovernanceWorld;
    facts: ReviewerFacts;
    selection: ReturnType<ReviewerResolverService['select']>;
  }> {
    const world = this.access.restrict(
      await this.loader.load(tx, tenantId, now),
      authority,
    );
    const facts = await this.resolver.factsFor(tx, world, ownerUserId);
    const selection = this.resolver.select(world, facts, {
      kind: draft.kind,
      scope: draft.scope,
      filters: draft.filters,
    });
    return { world, facts, selection };
  }

  /**
   * Carga la campaña. Un administrador delegado solo alcanza las que él creó:
   * una ajena responde como inexistente (404 uniforme).
   */
  private async loadCampaign(
    tx: EntityManager,
    tenantId: string,
    id: string,
    authority?: GovernanceActor,
    actor?: AuthenticatedUser,
  ): Promise<AccessReviewCampaigns> {
    const row = await this.repo.findCampaignById(tx, tenantId, id);
    if (
      !row ||
      (authority && !authority.full && row.ownerUserId !== actor?.id)
    ) {
      throw new ResourceNotFoundException(
        'Campaña no encontrada',
        undefined,
        Reason.REVIEW_CAMPAIGN_NOT_FOUND,
      );
    }
    return row;
  }

  /**
   * N-9: la acción por vencimiento. Un delegado sin `team.grants.revoke` no puede
   * hacer que el barrido revoque a su nombre: lo que no indica queda en
   * `UNCERTIFIED_ESCALATE` (no se revoca nada; el administrador decide).
   */
  private effectiveUncertifiedAction(
    authority: GovernanceActor,
    kind: ReviewKind,
    requested: UncertifiedAction | undefined,
  ): UncertifiedAction {
    if (requested !== undefined) {
      this.assertMayAutoRevoke(authority, requested);
      return requested;
    }
    const byDefault = REVIEW_DEFAULTS.defaultUncertifiedAction(kind);
    return byDefault === 'UNCERTIFIED_REVOKE' && !this.mayRevoke(authority)
      ? 'UNCERTIFIED_ESCALATE'
      : byDefault;
  }

  /** ¿Puede quien llama quitar permisos (`team.grants.revoke`, o ve todo)? */
  private mayRevoke(authority: GovernanceActor): boolean {
    return authority.full || authority.atoms?.has(REVOKE_ATOM) === true;
  }

  /**
   * N-9: revocar por vencimiento es revocar. Quien no tiene `team.grants.revoke`
   * no obtiene esa revocación por la puerta de las campañas.
   *
   * @throws DomainException 403 `ADMIN_CEILING_EXCEEDED` con `breach: AUTO_REVOKE`.
   */
  private assertMayAutoRevoke(
    authority: GovernanceActor,
    action: UncertifiedAction,
  ): void {
    if (action !== 'UNCERTIFIED_REVOKE' || this.mayRevoke(authority)) return;
    throw governanceError(
      Reason.ADMIN_CEILING_EXCEEDED,
      'Su perfil no le permite quitar permisos: la campaña no puede revocar por vencimiento. Elija «escalar» o pida a un administrador de seguridad.',
      { breach: 'AUTO_REVOKE' },
    );
  }

  /** Un delegado no lanza campañas que vencen enseguida (el barrido revoca a fecha + gracia). */
  private assertDelegateSchedule(
    authority: GovernanceActor,
    dueAt: string,
    graceDays: number | undefined,
    now: Date,
  ): void {
    if (authority.full) return;
    const minDue =
      now.getTime() + REVIEW_DEFAULTS.delegateMinDueDays * 86_400_000;
    const shortDue = new Date(dueAt).getTime() < minDue;
    const shortGrace =
      graceDays !== undefined &&
      graceDays < REVIEW_DEFAULTS.delegateMinGraceDays;
    if (shortDue || shortGrace) {
      throw new PreconditionFailedException(
        `La fecha límite debe estar al menos a ${REVIEW_DEFAULTS.delegateMinDueDays} días y la gracia ser de ${REVIEW_DEFAULTS.delegateMinGraceDays} días o más.`,
        {
          minDueDays: REVIEW_DEFAULTS.delegateMinDueDays,
          minGraceDays: REVIEW_DEFAULTS.delegateMinGraceDays,
        },
        Reason.REVIEW_SCHEDULE_TOO_SHORT,
      );
    }
  }

  private async assertNameFree(
    tx: EntityManager,
    tenantId: string,
    name: string,
    exceptId?: string,
  ): Promise<void> {
    const live = await this.repo.findCampaigns(tx, tenantId, [
      DELEG.REVIEW_CAMPAIGN_DRAFT,
      DELEG.REVIEW_CAMPAIGN_OPEN,
    ]);
    if (live.some((c) => c.id !== exceptId && c.name === name.trim())) {
      throw new ConflictException(
        'Ya hay una campaña con ese nombre',
        undefined,
        Reason.REVIEW_CAMPAIGN_DUPLICATE,
      );
    }
  }

  private assertDueInFuture(dueAt: string, now: Date): void {
    if (new Date(dueAt).getTime() <= now.getTime()) {
      throw new PreconditionFailedException(
        'La fecha límite debe ser futura',
        undefined,
        Reason.VALID_TO_NOT_IN_FUTURE,
      );
    }
  }

  private emptyScope(): PreconditionFailedException {
    return new PreconditionFailedException(
      'El alcance no alcanza a ningún permiso para revisar',
      undefined,
      Reason.REVIEW_SCOPE_EMPTY,
    );
  }
}
