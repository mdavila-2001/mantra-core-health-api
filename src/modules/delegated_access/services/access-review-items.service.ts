import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  SUPPORT_CONDITION_SCHEMA_VERSION,
  atomsOfGrant,
  atomsOfPermissionId,
  evaluateBulkDecision,
  isGrantLive,
  permissionAtomId,
  validateCondition,
  validateReviewDecision,
  type GrantAdjustmentShape,
  type ReviewDecision,
  type ReviewDecisionErrorCode,
  type ReviewItemFacts,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  BulkReviewDecisionDto,
  BulkReviewResultDto,
  DecideReviewItemDto,
  MyReviewsQueryDto,
  ReviewDecisionResultDto,
  ReviewItemListDto,
  ReviewItemViewDto,
} from '../dto/access-reviews.dto';
import {
  AccessReviewItems,
  OrganizationUserAssignments,
  type AccessReviewCampaigns,
} from '../entities';
import {
  AccessReviewRepository,
  GovernanceQueriesRepository,
  SupportActivityRepository,
  SupportGrantsRepository,
} from '../repositories';
import {
  ITEM_STATE_BY_CONCEPT,
  ITEM_STATE_CONCEPT,
  REVIEW_KIND_BY_CONCEPT,
} from './access-review-concepts';
import { routedReviewerIds } from './access-review-evidence';
import { toItemView } from './access-review-views';
import { DelegationScopeService } from './delegation-scope.service';
import { EffectiveSupportAccessService } from './effective-support-access.service';
import { GovernanceAudit } from './governance-audit';
import { GovernanceEvents, GovernanceEventType } from './governance-events';
import { conditionError } from './governance-rules.service';
import type {
  GovernanceWorld,
  WorldEngagement,
  WorldGrant,
} from './governance-world';
import { GovernanceWorldLoader } from './governance-world.loader';
import { ReviewerResolverService } from './reviewer-resolver.service';
import { SupportEngagementsService } from './support-engagements.service';

const FORBIDDEN_CODES: ReadonlySet<ReviewDecisionErrorCode> = new Set([
  'REVIEW_NOT_REVIEWER',
]);

/** Un ítem con todo lo que hace falta para decidirlo. */
interface LoadedItem {
  readonly row: AccessReviewItems;
  readonly campaign: AccessReviewCampaigns;
  readonly engagement: WorldEngagement;
  readonly grant?: WorldGrant;
  readonly facts: ReviewItemFacts;
}

/**
 * Bandeja del revisor y sus decisiones (CONTRATO-GOBIERNO §6.2): ver sus ítems
 * con la evidencia congelada, certificar, revocar o ajustar (el ajuste solo
 * reduce) y decidir en lote lo de bajo riesgo (todo o nada). Nunca decide la
 * persona revisada ni quien otorgó o aprobó la concesión (`SOD-GOV-02`).
 */
@Injectable()
export class AccessReviewItemsService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - Campañas e ítems.
   * @param grants - Concesiones de apoyo.
   * @param loader - Hechos de gobierno de la organización.
   * @param queries - Bandeja de un revisor.
   * @param resolver - Revisores resueltos (el ítem de vínculo y los ajenos al lanzamiento).
   * @param engagements - Recertificación y baja de vínculos (los existentes).
   * @param effective - Acceso efectivo derivado.
   * @param events - Eventos de dominio (outbox).
   * @param audit - Sello de auditoría con su nombre de negocio.
   * @param scope - Política común de organización.
   * @param activity - Nombres de las personas.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AccessReviewRepository,
    private readonly grants: SupportGrantsRepository,
    private readonly loader: GovernanceWorldLoader,
    private readonly queries: GovernanceQueriesRepository,
    private readonly resolver: ReviewerResolverService,
    private readonly engagements: SupportEngagementsService,
    private readonly effective: EffectiveSupportAccessService,
    private readonly events: GovernanceEvents,
    private readonly audit: GovernanceAudit,
    private readonly scope: DelegationScopeService,
    private readonly activity: SupportActivityRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccessReviewItemsService.name);
  }

  /** Mis ítems: pendientes por defecto, o los que ya decidí. */
  async list(
    actor: AuthenticatedUser,
    query: MyReviewsQueryDto = {},
  ): Promise<ReviewItemListDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const status = query.status ?? 'PENDING';
    const rows: AccessReviewItems[] = [];
    if (status !== 'DECIDED') {
      for (const id of await this.queries.pendingItemIdsOfReviewer(
        tx,
        tenantId,
        actor.id,
      )) {
        const row = await this.repo.findItemById(tx, tenantId, id);
        if (row) rows.push(row);
      }
    }
    if (status !== 'PENDING') {
      rows.push(
        ...(await tx.find(
          AccessReviewItems,
          { tenantId, decidedByUserId: actor.id },
          { orderBy: { decidedAt: 'desc', id: 'asc' }, limit: 200 },
        )),
      );
    }
    const world = await this.loader.load(tx, tenantId, new Date(), [
      ...new Set(rows.map((r) => r.organizationUserAssignmentId)),
    ]);
    const subjectOf = new Map(
      world.engagements.map((e) => [e.engagementId, e.subjectUserId]),
    );
    const names = await this.activity.userNames(tx, [...subjectOf.values()]);
    const campaigns = new Map<string, string>();
    for (const cid of new Set(rows.map((r) => r.accessReviewCampaignId))) {
      const c = await this.repo.findCampaignById(tx, tenantId, cid);
      if (c) campaigns.set(cid, c.name);
    }
    const items = rows
      .filter((r) => subjectOf.has(r.organizationUserAssignmentId))
      .map((r) => {
        const subjectUserId = subjectOf.get(r.organizationUserAssignmentId)!;
        return toItemView(
          r,
          {
            subjectUserId,
            subjectName: names.get(subjectUserId) || undefined,
            campaignName: campaigns.get(r.accessReviewCampaignId),
          },
          false,
        );
      });
    return { items, count: items.length };
  }

  /**
   * Un ítem mío, con su evidencia. Uno que no me corresponde responde igual
   * que uno inexistente (404 uniforme).
   */
  async get(id: string, actor: AuthenticatedUser): Promise<ReviewItemViewDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const loaded = await this.load(tx, tenantId, id, new Date());
    if (!loaded.facts.reviewerUserIds.includes(actor.id)) throw this.notFound();
    const names = await this.activity.userNames(tx, [
      loaded.engagement.subjectUserId,
    ]);
    return toItemView(
      loaded.row,
      {
        subjectUserId: loaded.engagement.subjectUserId,
        subjectName: names.get(loaded.engagement.subjectUserId) || undefined,
        campaignName: loaded.campaign.name,
      },
      true,
    );
  }

  /**
   * Decide un ítem: certifica, revoca o ajusta. Un ajuste que amplía es 422
   * `REVIEW_ADJUST_CANNOT_BROADEN`; el comentario es obligatorio al revocar,
   * ajustar o certificar algo de riesgo alto o sin uso.
   */
  async decide(
    id: string,
    dto: DecideReviewItemDto,
    actor: AuthenticatedUser,
  ): Promise<ReviewDecisionResultDto> {
    const tenantId = this.scope.resolveTenant();
    const now = new Date();
    const checked = await this.em.transactional(async (tx) => {
      // B-B3: el ítem se bloquea ANTES de validarlo. Dos revisores a la vez (o un
      // doble clic) se ponen en fila: el segundo espera, relee el ítem ya
      // decidido y recibe 409 `REVIEW_ALREADY_DECIDED` sin repetir ningún efecto.
      await this.repo.lockItem(tx, tenantId, id);
      const loaded = await this.load(tx, tenantId, id, now);
      const adjustment = this.adjustmentOf(dto, loaded.grant);
      this.assertDecision(
        validateReviewDecision({
          item: loaded.facts,
          decision: dto.decision,
          deciderUserId: actor.id,
          comment: dto.comment,
          now,
          current: loaded.grant ? this.currentShape(loaded.grant) : undefined,
          adjustment,
        }),
      );
      this.assertAdjustmentCondition(loaded.grant, adjustment);
      if (loaded.facts.isEngagementItem) {
        // Un ítem de vínculo se ANOTA primero (y se confirma): quien llegue
        // después ve la decisión y no ejecuta otro efecto. El efecto va fuera de
        // esta transacción (abre las suyas) y, si falla, la anotación se deshace.
        this.repo.decide(loaded.row, {
          decisionConceptId: ITEM_STATE_CONCEPT[stateOf(dto.decision)],
          decidedByUserId: actor.id,
          comment: dto.comment,
          now,
        });
        await tx.flush();
        return { loaded, adjustment, deferred: true };
      }
      await this.applyGrantDecision(
        tx,
        tenantId,
        loaded,
        dto,
        adjustment,
        actor,
        now,
      );
      return { loaded, adjustment, deferred: false };
    });
    if (checked.deferred) {
      try {
        await this.applyEngagementDecision(checked.loaded, dto, actor);
      } catch (error) {
        await this.releaseClaim(tenantId, id, actor, now);
        throw error;
      }
      await this.em.transactional(async (tx) => {
        await this.publishDecided(
          tx,
          tenantId,
          checked.loaded,
          dto.decision,
          actor,
        );
        await tx.flush();
      });
    }
    return { ok: true, state: stateOf(dto.decision) };
  }

  /**
   * Decisión en lote, TODO O NADA: solo `CERTIFY` de ítems de sensibilidad
   * máxima ≤ MEDIA y con uso reciente. Un ítem de vínculo no entra en lote.
   *
   * @throws PreconditionFailedException 422 `REVIEW_BULK_NOT_ALLOWED` con `details.itemIds` de los que lo impiden.
   */
  async bulk(
    dto: BulkReviewDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<BulkReviewResultDto> {
    const tenantId = this.scope.resolveTenant();
    const now = new Date();
    return this.em.transactional(async (tx) => {
      // B-B3: se bloquean todos los ítems (en orden estable, sin abrazos mortales) antes de leerlos.
      for (const id of [...new Set(dto.itemIds)].sort())
        await this.repo.lockItem(tx, tenantId, id);
      const loaded: LoadedItem[] = [];
      for (const id of dto.itemIds)
        loaded.push(await this.load(tx, tenantId, id, now));
      const check = evaluateBulkDecision({
        decision: dto.decision,
        items: loaded.map((l) => l.facts),
        deciderUserId: actor.id,
        now,
      });
      if (!check.ok) {
        throw this.errorOf(check.code, check.httpStatus, {
          itemIds: [...check.itemIds],
        });
      }
      const engagementItems = loaded.filter((l) => l.facts.isEngagementItem);
      if (engagementItems.length > 0) {
        throw this.errorOf('REVIEW_BULK_NOT_ALLOWED', 422, {
          itemIds: engagementItems.map((l) => l.row.id),
        });
      }
      for (const l of loaded) {
        await this.applyGrantDecision(
          tx,
          tenantId,
          l,
          { decision: 'CERTIFY', comment: dto.comment },
          undefined,
          actor,
          now,
        );
      }
      return { ok: true, decided: loaded.length };
    });
  }

  /** Carga un ítem de la organización con sus hechos de decisión. */
  private async load(
    tx: EntityManager,
    tenantId: string,
    id: string,
    now: Date,
  ): Promise<LoadedItem> {
    const row = await this.repo.findItemById(tx, tenantId, id);
    if (!row) throw this.notFound();
    const campaign = await this.repo.findCampaignById(
      tx,
      tenantId,
      row.accessReviewCampaignId,
    );
    if (!campaign) throw this.notFound();
    const world: GovernanceWorld = await this.loader.load(tx, tenantId, now, [
      row.organizationUserAssignmentId,
    ]);
    const engagement = world.engagements[0];
    if (!engagement) throw this.notFound();
    const grant = row.supportScopeGrantId
      ? engagement.grants.find((g) => g.grantId === row.supportScopeGrantId)
      : undefined;
    if (row.supportScopeGrantId && !grant) throw this.notFound();
    return {
      row,
      campaign,
      engagement,
      grant,
      facts: await this.factsOf(tx, row, campaign, world, engagement, grant),
    };
  }

  /** Hechos de decisión: revisores (asignados, escalados y re-resueltos), otorgante, átomos y uso. */
  private async factsOf(
    tx: EntityManager,
    row: AccessReviewItems,
    campaign: AccessReviewCampaigns,
    world: GovernanceWorld,
    engagement: WorldEngagement,
    grant: WorldGrant | undefined,
  ): Promise<ReviewItemFacts> {
    const live = engagement.grants.filter(
      (g) => g.effect !== 'DENY' && isGrantLive(g, world.now),
    );
    const stored = [
      ...routedReviewerIds(row.evidenceJson),
      row.reviewerUserId,
      row.escalatedToUserId,
    ].filter((u): u is string => !!u);
    // Un ítem sin enrutamiento guardado se vuelve a resolver con el mismo criterio.
    const reviewerUserIds = [
      ...new Set(
        stored.length > 0
          ? stored
          : this.resolver.resolve(
              await this.resolver.factsFor(tx, world, campaign.ownerUserId),
              engagement,
              grant,
              REVIEW_KIND_BY_CONCEPT[campaign.kindConceptId] ?? 'PERIODIC',
            ).userIds,
      ),
    ];
    const used = (grant ? [grant] : live)
      .map((g) => g.lastUsedAt)
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      itemId: row.id,
      state: ITEM_STATE_BY_CONCEPT[row.decisionConceptId] ?? 'PENDING',
      campaignOpen: campaign.statusConceptId === DELEG.REVIEW_CAMPAIGN_OPEN,
      subjectUserId: engagement.subjectUserId,
      reviewerUserIds,
      grantedByUserId: grant?.grantedByUserId ?? null,
      approvedByUserIds: grant?.approvedByUserIds ?? [],
      atoms: grant ? atomsOfGrant(grant) : live.flatMap((g) => atomsOfGrant(g)),
      lastUsedAt: used ?? null,
      createdAt: grant?.createdAt ?? engagement.createdAt,
      isEngagementItem: !row.supportScopeGrantId,
    };
  }

  /** Forma actual de la concesión, para comparar el ajuste. */
  private currentShape(grant: WorldGrant) {
    return {
      atoms: [...grant.actions, ...(grant.atomGrants ?? []).map((a) => a.atom)],
      validTo: grant.validTo,
      condition: grant.condition ?? undefined,
    };
  }

  /** Ajuste del cuerpo en la forma del dominio (una condición sin versión hereda la de la concesión). */
  private adjustmentOf(
    dto: DecideReviewItemDto,
    grant: WorldGrant | undefined,
  ): GrantAdjustmentShape | undefined {
    const a = dto.adjustment;
    if (!a) return undefined;
    const current = (grant?.condition ?? undefined) as
      { schemaVersion?: number } | undefined;
    return {
      ...(a.atoms !== undefined ? { atoms: a.atoms } : {}),
      ...(a.validTo !== undefined
        ? { validTo: a.validTo === null ? null : new Date(a.validTo) }
        : {}),
      ...(a.condition !== undefined
        ? {
            condition: {
              schemaVersion:
                current?.schemaVersion ?? SUPPORT_CONDITION_SCHEMA_VERSION,
              ...a.condition,
            },
          }
        : {}),
    };
  }

  /**
   * B-M6: la condición que guarda el revisor pasa por el MISMO validador que
   * cualquier escritura (tamaño ≤ 8 KiB, claves cerradas, versión del esquema):
   * `conditionTightens` solo compara las claves que ya existían.
   *
   * @throws DomainException 422 `CONDITION_*`.
   */
  private assertAdjustmentCondition(
    grant: WorldGrant | undefined,
    adjustment: GrantAdjustmentShape | undefined,
  ): void {
    if (!adjustment || adjustment.condition === undefined) return;
    if (adjustment.condition === null) return;
    const errors = validateCondition(adjustment.condition, {
      effect: grant?.effect ?? 'ALLOW',
      grantAtoms: grant ? this.currentShape(grant).atoms : [],
    });
    if (errors.length > 0) throw conditionError(errors);
  }

  /**
   * Deshace la anotación de un ítem de vínculo cuando su efecto falló (B-B3). Solo
   * si el ítem sigue siendo el que ESTE decisor anotó (misma persona, mismo
   * instante): si otra vía lo cambió entretanto, no se pisa.
   */
  private async releaseClaim(
    tenantId: string,
    id: string,
    actor: AuthenticatedUser,
    claimedAt: Date,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const row = await this.repo.lockItem(tx, tenantId, id);
      if (
        !row ||
        row.decisionConceptId === DELEG.REVIEW_ITEM_PENDING ||
        row.decidedByUserId !== actor.id ||
        row.decidedAt?.getTime() !== claimedAt.getTime()
      ) {
        return;
      }
      this.repo.undecide(row, actor.id, new Date());
      await tx.flush();
    });
  }

  /** Aplica la decisión de un ítem de CONCESIÓN dentro de la transacción. */
  private async applyGrantDecision(
    tx: EntityManager,
    tenantId: string,
    loaded: LoadedItem,
    dto: { decision: ReviewDecision; comment?: string },
    adjustment: GrantAdjustmentShape | undefined,
    actor: AuthenticatedUser,
    now: Date,
  ): Promise<void> {
    const { row, engagement } = loaded;
    const grantRow = await this.grants.findById(tx, row.supportScopeGrantId!);
    if (!grantRow) throw this.notFound();
    if (dto.decision === 'REVOKE') {
      grantRow.statusConceptId = DELEG.SUPPORT_GRANT_REVOKED;
      grantRow.validTo = now;
      touch(grantRow, actor.id, now);
    } else if (dto.decision === 'ADJUST' && adjustment) {
      await this.reduceGrant(tx, grantRow, adjustment, actor.id, now);
    }
    this.repo.decide(row, {
      decisionConceptId: ITEM_STATE_CONCEPT[stateOf(dto.decision)],
      decidedByUserId: actor.id,
      comment: dto.comment,
      ...(dto.decision === 'ADJUST'
        ? { adjustment: (dto as DecideReviewItemDto).adjustment }
        : {}),
      now,
    });
    await tx.flush();
    if (dto.decision === 'CERTIFY') {
      // B-B2: certificar UNA concesión no certifica el vínculo. `last_certified_at`
      // es el «desde cuándo» de la acumulación de privilegios del vínculo (puntaje de
      // creep): moverlo por una concesión trivial «limpiaría» la métrica de las demás.
      // Solo se mueve cuando ya no queda ningún ítem del vínculo sin decidir en la campaña.
      const undecided = await this.repo.countUndecidedOfEngagement(
        tx,
        tenantId,
        row.accessReviewCampaignId,
        row.organizationUserAssignmentId,
      );
      if (undecided === 0) {
        const a = await tx.findOne(OrganizationUserAssignments, {
          id: row.organizationUserAssignmentId,
        });
        if (a) {
          a.lastCertifiedAt = now;
          touch(a, actor.id, now);
          await tx.flush();
        }
      }
    }
    if (dto.decision !== 'CERTIFY') {
      await this.effective.refreshTenant(tenantId, {
        userId: engagement.subjectUserId,
        actorUserId: actor.id,
        tx,
      });
    }
    await this.publishDecided(tx, tenantId, loaded, dto.decision, actor);
  }

  /** Aplica la decisión de un ítem de VÍNCULO con las operaciones existentes. */
  private async applyEngagementDecision(
    loaded: LoadedItem,
    dto: DecideReviewItemDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const engagementId = loaded.row.organizationUserAssignmentId;
    if (dto.decision === 'CERTIFY') {
      await this.engagements.recertify(engagementId, {}, actor);
    } else if (dto.decision === 'REVOKE') {
      await this.engagements.end(
        engagementId,
        { reason: (dto.comment ?? '').trim() },
        actor,
      );
    }
  }

  /**
   * Un ajuste que SOLO reduce: conserva los átomos pedidos (reemplazando los
   * alias por átomos con la condición que tuvieran), acorta la vigencia y/o
   * endurece la condición de la concesión.
   */
  private async reduceGrant(
    tx: EntityManager,
    grantRow: NonNullable<
      Awaited<ReturnType<SupportGrantsRepository['findById']>>
    >,
    adjustment: GrantAdjustmentShape,
    actorUserId: string,
    now: Date,
  ): Promise<void> {
    if (adjustment.atoms !== undefined) {
      const wanted = new Set(adjustment.atoms);
      const rows = await this.grants.findLiveActions(tx, grantRow.id);
      const keepIds = new Set<string>();
      const toSupersede = [];
      const additions = new Map<
        string,
        {
          permissionId: string;
          condition?: unknown;
          conditionSchemaVersion?: number;
        }
      >();
      for (const r of rows) {
        const atoms = atomsOfPermissionId(r.permissionId) ?? [];
        const isAlias = atoms.some((a) => a.origin === 'LEGACY');
        if (!isAlias && atoms.every((a) => wanted.has(a.atom))) {
          keepIds.add(r.permissionId);
          continue;
        }
        toSupersede.push(r);
        if (isAlias) {
          for (const a of atoms) {
            if (!wanted.has(a.atom)) continue;
            additions.set(a.atom, {
              permissionId: permissionAtomId(a.atom),
              ...(r.conditionJson
                ? {
                    condition: r.conditionJson,
                    conditionSchemaVersion:
                      r.conditionSchemaVersion ?? undefined,
                  }
                : {}),
            });
          }
        }
      }
      this.grants.markSuperseded(toSupersede, now, actorUserId);
      this.grants.addActions(
        tx,
        grantRow,
        [...additions.values()].filter((a) => !keepIds.has(a.permissionId)),
      );
    }
    if (adjustment.validTo !== undefined) {
      grantRow.validTo = adjustment.validTo ?? undefined;
    }
    if (adjustment.condition !== undefined) {
      const condition = adjustment.condition as {
        schemaVersion: number;
      } | null;
      grantRow.conditionJson = condition ?? undefined;
      grantRow.conditionSchemaVersion = condition?.schemaVersion;
    }
    touch(grantRow, actorUserId, now);
  }

  private async publishDecided(
    tx: EntityManager,
    tenantId: string,
    loaded: LoadedItem,
    decision: ReviewDecision,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.events.publish(tx, {
      tenantId,
      type: GovernanceEventType.itemDecided,
      aggregate: 'access_review_item',
      aggregateId: loaded.row.id,
      payload: {
        campaignId: loaded.row.accessReviewCampaignId,
        itemId: loaded.row.id,
        decision,
        subjectUserId: loaded.engagement.subjectUserId,
        deciderUserId: actor.id,
      },
      actorUserId: actor.id,
    });
    await this.audit.seal(
      tx,
      actor,
      tenantId,
      AUDIT_ACTION[decision],
      'access_review_item',
      loaded.row.id,
    );
    this.logger.info(
      {
        operation: 'delegated_access.access_review.decide',
        itemId: loaded.row.id,
        decision,
      },
      'Access review item decided',
    );
  }

  private assertDecision(
    check: ReturnType<typeof validateReviewDecision>,
  ): void {
    if (!check.ok) throw this.errorOf(check.code, check.httpStatus);
  }

  /** Excepción con el estado y la razón del código del dominio. */
  private errorOf(
    code: ReviewDecisionErrorCode,
    httpStatus: 403 | 409 | 422,
    details?: Record<string, unknown>,
  ): Error {
    const reason = Reason[code];
    const message = MESSAGES[code];
    if (FORBIDDEN_CODES.has(code) || httpStatus === 403) {
      return new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        message,
        details,
        reason,
      );
    }
    return httpStatus === 409
      ? new ConflictException(message, details, reason)
      : new PreconditionFailedException(message, details, reason);
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Ítem de revisión no encontrado',
      undefined,
      Reason.REVIEW_ITEM_NOT_FOUND,
    );
  }
}

const AUDIT_ACTION: Readonly<Record<ReviewDecision, string>> = {
  CERTIFY: 'ACCESS_REVIEW_ITEM_CERTIFIED',
  REVOKE: 'ACCESS_REVIEW_ITEM_REVOKED',
  ADJUST: 'ACCESS_REVIEW_ITEM_ADJUSTED',
};

/** Estado del ítem que deja cada decisión. */
function stateOf(decision: ReviewDecision) {
  return decision === 'CERTIFY'
    ? 'CERTIFIED'
    : decision === 'REVOKE'
      ? 'REVOKED'
      : 'ADJUSTED';
}

const MESSAGES: Readonly<Record<ReviewDecisionErrorCode, string>> = {
  REVIEW_NOT_REVIEWER: 'Usted no es quien revisa este acceso.',
  REVIEW_CAMPAIGN_NOT_OPEN: 'La campaña ya no está abierta.',
  REVIEW_ALREADY_DECIDED: 'Este acceso ya se decidió.',
  REVIEW_COMMENT_REQUIRED:
    'Escriba un comentario de al menos 10 caracteres para esta decisión.',
  REVIEW_ADJUST_CANNOT_BROADEN:
    'Un ajuste solo puede reducir el acceso, no ampliarlo.',
  REVIEW_ADJUST_NOT_APPLICABLE: 'Este acceso no admite ese ajuste.',
  REVIEW_BULK_NOT_ALLOWED:
    'Solo se certifican en lote los accesos de bajo riesgo y con uso reciente.',
};
