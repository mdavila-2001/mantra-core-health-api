import { HttpStatus, Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  DIR,
  TENANT_TYPE_CODE_BY_CONCEPT_ID,
} from '../../directory/directory.concepts';
import type {
  EngagementRequestItems,
  EngagementRequests,
  OrganizationUserAssignments,
  RoleTemplates,
} from '../entities';
import {
  SUPPORT_TEMPLATE_DEFAULTS,
  type SupportActionCode,
  type SupportTemplateCode,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { applyTenantContext, withPersonScope } from './tenant-context';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  CreateEngagementRequestDto,
  DecideEngagementRequestDto,
  EngagementDecisionResultDto,
  EngagementRequestItemViewDto,
  EngagementRequestViewDto,
  ItemDecisionDto,
  ListEngagementRequestsQueryDto,
  ListEngagementRequestsResponseDto,
  ResourceCreatedDto,
} from '../dto';
import {
  EngagementRequestsRepository,
  RoleTemplatesRepository,
  SupportActivityRepository,
  SupportDirectoryRepository,
  SupportEngagementsRepository,
  SupportGrantsRepository,
} from '../repositories';
import { assignmentRoleOfTemplate, STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { EffectiveSupportAccessService } from './effective-support-access.service';
import { emissionOf } from './engagement-requests.emission';
import { criticalAtomsOf } from './support-critical-atoms';
import { GovernanceStepUpGate } from './governance-step-up.gate';
import {
  EXPANSION_CONCEPT,
  TARGET_KIND_BY_CONCEPT,
  TARGET_KIND_CONCEPT,
} from './support-grant-facts';
import { LifecycleService } from './lifecycle.service';
import { SupportTargetsService } from './support-targets.service';
import { SupportGrantWriteGuard } from './support-grant-write.guard';
import { permissionIdOfInput } from './support-permission-input';

/** Vigencia de una solicitud sin decidir. */
/** Solicitudes abiertas que una persona puede tener en una misma organización. */
export const MAX_OPEN_REQUESTS_PER_TENANT = 3;
export const REQUEST_TTL_DAYS = 15;
const DAY_MS = 24 * 3600 * 1000;

/** Estado de solicitud (concepto) → código. */
export const REQUEST_STATUS_CODE: Readonly<Record<string, string>> = {
  [DELEG.ENGAGEMENT_STATUS_PENDING]: 'PENDING',
  [DELEG.ENGAGEMENT_STATUS_APPROVED]: 'APPROVED',
  [DELEG.ENGAGEMENT_STATUS_REJECTED]: 'REJECTED',
  [DELEG.ENGAGEMENT_STATUS_EXPIRED]: 'EXPIRED',
  [DELEG.ENGAGEMENT_STATUS_CANCELLED]: 'CANCELLED',
};

/** Código de estado de solicitud → concepto. */
const REQUEST_STATUS_CONCEPT: Record<string, string> = Object.fromEntries(
  Object.entries(REQUEST_STATUS_CODE).map(([concept, code]) => [code, concept]),
);

const ITEM_DECISION_CODE: Record<string, string> = {
  [DELEG.ENGAGEMENT_DECISION_PENDING]: 'PENDING',
  [DELEG.ENGAGEMENT_DECISION_APPROVED]: 'APPROVED',
  [DELEG.ENGAGEMENT_DECISION_ADJUSTED]: 'ADJUSTED',
  [DELEG.ENGAGEMENT_DECISION_REJECTED]: 'REJECTED',
};

/**
 * Alcance con el que decide quien administra por `/org/team/*` (CONTRATO-GOBIERNO
 * §6.4): solo toca los ítems dentro de su alcance y, al aprobar, de su techo; el
 * resto sigue `PENDING` para `SECURITY_ADMIN`. Sin él rige la regla de siempre.
 */
export interface DecideScope {
  /** ¿El ítem está dentro del alcance de quien decide? */
  readonly inScope: (item: EngagementRequestItems) => Promise<boolean>;
  /** Lanza 403 `ADMIN_CEILING_EXCEEDED` si aprobar o ajustar el ítem rebasa su techo. */
  readonly assertCeiling: (
    item: EngagementRequestItems,
    decision: ItemDecisionDto,
  ) => Promise<void>;
}

/** Opciones de {@link EngagementRequestsService.decide}. */
export interface DecideOptions {
  /** Decisión parcial por alcance (solo para quien decide por `/org/team`). */
  readonly scope?: DecideScope;
}

/**
 * Solicitudes, invitaciones y ampliaciones de vínculo de apoyo. La persona
 * pide (o la organización la invita); quien administra decide **por ítem**
 * —aprobar, ajustar o rechazar con motivo—, de modo que una aprobación puede
 * ser parcial. Las solicitudes vencen a los 15 días.
 */
@Injectable()
export class EngagementRequestsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param requests - Solicitudes e ítems.
   * @param templates - Plantillas de rol.
   * @param engagements - Vínculos de apoyo.
   * @param grants - Permisos de apoyo.
   * @param directory - Organización y membresías.
   * @param targets - Validación de objetivos contra el tenant.
   * @param effective - Acceso efectivo derivado.
   * @param scope - Política común de tenant.
   * @param logger - Logger estructurado.
   * @param names - Nombres para las vistas.
   * @param lifecycle - Ciclo de vida: abre el caso de ingreso al nacer el vínculo.
   * @param writeGuard - Guardián de escritura del gobierno (techos, condiciones, SoD).
   * @param stepUp - Paso extra: aprobar crea permisos y lo exige (B-M2); opcional.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly requests: EngagementRequestsRepository,
    private readonly templates: RoleTemplatesRepository,
    private readonly engagements: SupportEngagementsRepository,
    private readonly grants: SupportGrantsRepository,
    private readonly directory: SupportDirectoryRepository,
    private readonly targets: SupportTargetsService,
    private readonly effective: EffectiveSupportAccessService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
    private readonly names: SupportActivityRepository,
    @Optional() private readonly lifecycle?: LifecycleService,
    @Optional() private readonly writeGuard?: SupportGrantWriteGuard,
    @Optional() private readonly stepUp?: GovernanceStepUpGate,
  ) {
    this.logger.setContext(EngagementRequestsService.name);
  }

  /**
   * La persona pide un vínculo de apoyo (o la ampliación de uno existente).
   *
   * @param dto - Organización, plantilla e ítems pedidos.
   * @param actor - La persona que pide.
   * @returns La solicitud creada.
   */
  async create(
    dto: CreateEngagementRequestDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      {
        operation: 'delegated_access.engagement_request.create',
        tenantId: dto.tenantId,
        actorId: actor.id,
      },
      'Creating support engagement request',
    );
    return this.em.transactional(async (tx) => {
      if (!(await this.directory.findTenant(tx, dto.tenantId))) {
        throw this.requestNotFound();
      }
      // La organización ya existe: con ella corren las políticas por fila.
      await applyTenantContext(tx, dto.tenantId);
      // Tope de solicitudes abiertas por persona y organización: sin él una
      // cuenta cualquiera podía inundar la bandeja de quien decide.
      const mine = await this.requests.findByRequester(tx, actor.id, 200);
      const now = Date.now();
      const open = mine.filter(
        (r) =>
          r.tenantId === dto.tenantId &&
          r.statusConceptId === DELEG.ENGAGEMENT_STATUS_PENDING &&
          r.expiresAt.getTime() > now,
      );
      if (open.length >= MAX_OPEN_REQUESTS_PER_TENANT) {
        throw new PreconditionFailedException(
          'Ya tiene solicitudes abiertas en esa organización: espere su decisión',
          { limit: MAX_OPEN_REQUESTS_PER_TENANT },
          Reason.SUPPORT_REQUEST_LIMIT_REACHED,
        );
      }
      const template = await this.templates.findEffectiveByCode(
        tx,
        dto.tenantId,
        dto.roleTemplateCode,
      );
      if (!template) {
        throw new ResourceNotFoundException(
          'Plantilla de rol no encontrada',
          undefined,
          Reason.SUPPORT_TEMPLATE_NOT_FOUND,
        );
      }
      if (dto.parentAssignmentId) {
        const [own] = await this.loadOwnEngagements(
          tx,
          actor.id,
          dto.tenantId,
          [dto.parentAssignmentId],
        );
        if (!own || own.statusConceptId !== STATUS.ACTIVE) {
          throw new PreconditionFailedException(
            'Solo se amplía un vínculo propio y activo',
            undefined,
            Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
          );
        }
      }
      for (const item of dto.items) {
        await this.targets.assertTarget(
          tx,
          dto.tenantId,
          item.targetKind,
          item,
        );
      }

      const request = this.requests.create(tx, {
        tenantId: dto.tenantId,
        requesterUserId: actor.id,
        directionConceptId: DELEG.ENGAGEMENT_DIRECTION_REQUEST,
        roleTemplateId: template.id,
        parentAssignmentId: dto.parentAssignmentId,
        messageText: dto.message,
        statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
        expiresAt: new Date(Date.now() + REQUEST_TTL_DAYS * DAY_MS),
      });
      await tx.flush();
      const defaults = this.defaultActions(template);
      for (const item of dto.items) {
        this.requests.createItem(tx, {
          tenantId: dto.tenantId,
          engagementRequestId: request.id,
          targetKindConceptId: TARGET_KIND_CONCEPT[item.targetKind],
          practitionerRoleAssignmentId: item.practitionerRoleAssignmentId,
          healthcareServiceId: item.healthcareServiceId,
          careSpaceId: item.careSpaceId,
          practiceSiteId: item.practiceSiteId,
          proposedActions: item.actions ?? defaults,
          decisionConceptId: DELEG.ENGAGEMENT_DECISION_PENDING,
        });
      }
      await tx.flush();
      return {
        id: request.id,
        status: request.statusConceptId,
        createdAt: request.createdAt,
        tenantId: dto.tenantId,
      };
    });
  }

  /**
   * Solicitudes de la organización activa, las más recientes primero.
   *
   * @param query - Filtro de estado y paginación.
   * @returns Una página de solicitudes con sus ítems.
   */
  async listForTenant(
    query: ListEngagementRequestsQueryDto,
  ): Promise<ListEngagementRequestsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const limit = query.limit ?? 25;
    const tx = this.em.fork({ keepTransactionContext: true });
    const before = query.cursor ? decodeCursor(query.cursor) : undefined;
    const now = Date.now();
    const rows = await this.requests.findByTenant(
      tx,
      tenantId,
      query.status ? REQUEST_STATUS_CONCEPT[query.status] : undefined,
      limit + 1,
      before,
    );
    const page = rows.slice(0, limit);
    const items = await this.toViews(tx, page, now);
    const last = page[page.length - 1];
    return {
      items,
      count: items.length,
      nextCursor:
        rows.length > limit && last ? encodeCursor(last.createdAt) : null,
    };
  }

  /**
   * Solicitudes de una persona de apoyo (todas sus organizaciones).
   *
   * @param userId - Persona.
   * @returns Sus solicitudes con ítems.
   */
  async listMine(userId: string): Promise<EngagementRequestViewDto[]> {
    return withPersonScope(this.em, async (tx, scope) => {
      // Sin organización activa: las solicitudes se buscan por la persona que las
      // hizo, y los ítems de cada una se leen dentro de su organización.
      const rows = await scope.ownRows(() =>
        this.requests.findByRequester(tx, userId, 50),
      );
      const now = Date.now();
      const viewOf = new Map<string, EngagementRequestViewDto>();
      for (const tenantId of new Set(rows.map((r) => r.tenantId))) {
        const mine = rows.filter((r) => r.tenantId === tenantId);
        const views = await scope.inTenant(tenantId, () =>
          this.toViews(tx, mine, now),
        );
        mine.forEach((row, index) => viewOf.set(row.id, views[index]));
      }
      return rows.map((row) => viewOf.get(row.id)!);
    });
  }

  /**
   * Decide la solicitud ítem por ítem. Aprobar o ajustar emite el permiso (y
   * abre el vínculo si es el primero); rechazar exige un motivo.
   *
   * @param requestId - Solicitud.
   * @param dto - Decisión por ítem y periodicidad de recertificación.
   * @param actor - Quien decide, en nombre de la organización activa.
   * @param options - Alcance de quien decide por `/org/team`; sin él, todo ítem pendiente.
   * @returns Estado final, vínculo y permisos emitidos.
   */
  async decide(
    requestId: string,
    dto: DecideEngagementRequestDto,
    actor: AuthenticatedUser,
    options?: DecideOptions,
  ): Promise<EngagementDecisionResultDto> {
    const tenantId = this.scope.resolveTenant();
    this.logger.info(
      {
        operation: 'delegated_access.engagement_request.decide',
        requestId,
        tenantId,
        actorId: actor.id,
      },
      'Deciding support engagement request',
    );
    return this.em.transactional(async (tx) => {
      const request = await this.requests.findById(tx, requestId);
      if (!request || request.tenantId !== tenantId)
        throw this.requestNotFound();
      // Separación de funciones: quien pide no se aprueba a sí mismo.
      if (request.requesterUserId === actor.id) {
        throw new DomainException(
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          'No puede decidir una solicitud propia',
          undefined,
          Reason.SUPPORT_DECISION_SELF,
        );
      }
      if (request.statusConceptId !== DELEG.ENGAGEMENT_STATUS_PENDING) {
        throw new PreconditionFailedException(
          'La solicitud ya no está pendiente',
          { requestId },
          Reason.SUPPORT_REQUEST_NOT_PENDING,
        );
      }
      if (request.expiresAt.getTime() <= Date.now()) {
        throw new PreconditionFailedException(
          'La solicitud venció',
          { requestId },
          Reason.SUPPORT_REQUEST_EXPIRED,
        );
      }

      const items = await this.requests.findItems(tx, requestId);
      const pending = items.filter(
        (i) => i.decisionConceptId === DELEG.ENGAGEMENT_DECISION_PENDING,
      );
      let mine = pending;
      const scope = options?.scope;
      if (scope) {
        const inside = new Set<string>();
        for (const item of pending) {
          if (await scope.inScope(item)) inside.add(item.id);
        }
        // Tocar un ítem ajeno a su alcance no se «ignora»: se rechaza entero.
        if (
          dto.items.some(
            (d) =>
              pending.some((p) => p.id === d.itemId) && !inside.has(d.itemId),
          )
        ) {
          throw new DomainException(
            HttpStatus.FORBIDDEN,
            ErrorCode.FORBIDDEN,
            'Hay ítems fuera de su alcance: solo puede decidir los de su servicio o piso.',
            undefined,
            Reason.ADMIN_SCOPE_EXCEEDED,
          );
        }
        mine = pending.filter((i) => inside.has(i.id));
      }
      const decisions = this.matchDecisions(mine, dto.items);
      if (scope) {
        for (const item of mine) {
          const decision = decisions.get(item.id) as ItemDecisionDto;
          if (decision.decision !== 'REJECTED') {
            await scope.assertCeiling(item, decision);
          }
        }
      }

      const approved = [...decisions.values()].filter(
        (d) => d.decision !== 'REJECTED',
      );
      // Un átomo CRÍTICA nunca se otorga con una sola persona: no se aprueba
      // por esta ruta (se otorga aparte con `GRANT_CHANGE`, cuatro ojos).
      for (const item of mine) {
        const decision = decisions.get(item.id) as ItemDecisionDto;
        if (decision.decision === 'REJECTED') continue;
        const critical = criticalAtomsOf(emissionOf(item, decision).actions);
        if (critical.length > 0) {
          throw new DomainException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            ErrorCode.VALIDATION_FAILED,
            'Los permisos críticos no se otorgan al decidir una solicitud: apruebe sin ellos y otórguelos aparte para que los apruebe una segunda persona.',
            { itemId: item.id, criticalAtoms: critical },
            Reason.FOUR_EYES_REQUEST_INVALID,
          );
        }
      }
      let engagement: OrganizationUserAssignments | undefined;
      if (approved.length > 0) {
        // Aprobar o ajustar crea permisos: paso extra por cualquier ruta (rechazar no).
        await this.stepUp?.assertFresh(tx, actor);
        engagement = await this.openOrLoadEngagement(
          tx,
          request,
          dto.recertifyEveryMonths ?? 12,
          actor,
        );
      }

      const grantIds: string[] = [];
      for (const item of mine) {
        const decision = decisions.get(item.id) as ItemDecisionDto;
        item.decisionCommentText = decision.comment;
        if (decision.decision === 'REJECTED') {
          item.decisionConceptId = DELEG.ENGAGEMENT_DECISION_REJECTED;
          continue;
        }
        const grantId = await this.emitGrant(
          tx,
          tenantId,
          engagement as OrganizationUserAssignments,
          item,
          decision,
          actor,
        );
        item.resultingGrantId = grantId;
        item.decisionConceptId =
          decision.decision === 'ADJUSTED'
            ? DELEG.ENGAGEMENT_DECISION_ADJUSTED
            : DELEG.ENGAGEMENT_DECISION_APPROVED;
        grantIds.push(grantId);
      }

      const allItems = await this.requests.findItems(tx, requestId);
      const approvedCount = allItems.filter(
        (i) =>
          i.decisionConceptId === DELEG.ENGAGEMENT_DECISION_APPROVED ||
          i.decisionConceptId === DELEG.ENGAGEMENT_DECISION_ADJUSTED,
      ).length;
      // La solicitud se completa cuando todos los ítems están decididos: lo que
      // quien decide por alcance dejó pendiente sigue abierto para SECURITY_ADMIN.
      const stillPending = allItems
        .filter(
          (i) => i.decisionConceptId === DELEG.ENGAGEMENT_DECISION_PENDING,
        )
        .map((i) => i.id);
      if (stillPending.length === 0) {
        request.statusConceptId =
          approvedCount === 0
            ? DELEG.ENGAGEMENT_STATUS_REJECTED
            : DELEG.ENGAGEMENT_STATUS_APPROVED;
        request.decidedAt = new Date();
        request.decidedByUserId = actor.id;
        request.decisionReasonText = dto.reasonText;
      }
      touch(request, actor.id);
      await tx.flush();

      if (engagement) {
        await this.effective.refreshTenant(tenantId, {
          userId: request.requesterUserId,
          actorUserId: actor.id,
          tx,
        });
      }
      return {
        requestId,
        status: REQUEST_STATUS_CODE[request.statusConceptId],
        engagementId: engagement?.id,
        grantIds,
        ...(stillPending.length > 0 ? { pendingItemIds: stillPending } : {}),
      };
    });
  }

  /**
   * Vence las solicitudes pendientes pasados los 15 días.
   *
   * @param limit - Tope por pasada.
   * @returns Cuántas se vencieron.
   */
  async expireOverdue(limit = 500): Promise<number> {
    return this.em.transactional(async (tx) => {
      const rows = await this.requests.findOverduePending(
        tx,
        DELEG.ENGAGEMENT_STATUS_PENDING,
        new Date(),
        limit,
      );
      for (const row of rows) {
        row.statusConceptId = DELEG.ENGAGEMENT_STATUS_EXPIRED;
        row.updatedAt = new Date();
      }
      await tx.flush();
      return rows.length;
    });
  }

  /** Exige una decisión por cada ítem pendiente y sus motivos obligatorios. */
  private matchDecisions(
    pending: readonly EngagementRequestItems[],
    decisions: readonly ItemDecisionDto[],
  ): Map<string, ItemDecisionDto> {
    const byId = new Map<string, ItemDecisionDto>();
    for (const decision of decisions) {
      if (!pending.some((p) => p.id === decision.itemId)) {
        throw new ResourceNotFoundException(
          'Ítem de solicitud no encontrado',
          undefined,
          Reason.SUPPORT_REQUEST_NOT_FOUND,
        );
      }
      if (decision.decision !== 'APPROVED' && !decision.comment) {
        throw new DomainException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_FAILED,
          'Rechazar o ajustar un ítem exige un motivo',
          { itemId: decision.itemId },
          Reason.SUPPORT_DECISION_REASON_REQUIRED,
        );
      }
      if (
        decision.decision === 'ADJUSTED' &&
        !decision.adjustment &&
        !decision.actions
      ) {
        throw new DomainException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_FAILED,
          'Ajustar un ítem exige indicar el ajuste',
          { itemId: decision.itemId },
          Reason.SUPPORT_TARGET_INVALID,
        );
      }
      byId.set(decision.itemId, decision);
    }
    const missing = pending.filter((p) => !byId.has(p.id)).map((p) => p.id);
    if (missing.length > 0) {
      throw new PreconditionFailedException(
        'La decisión debe cubrir todos los ítems pendientes',
        { missing },
        Reason.SUPPORT_DECISION_INCOMPLETE,
      );
    }
    return byId;
  }

  /** Abre el vínculo de la persona (con su membresía) o carga el que se amplía. */
  private async openOrLoadEngagement(
    tx: EntityManager,
    request: EngagementRequests,
    recertifyEveryMonths: number,
    actor: AuthenticatedUser,
  ): Promise<OrganizationUserAssignments> {
    if (request.parentAssignmentId) {
      const [parent] = await this.loadOwnEngagements(
        tx,
        request.requesterUserId,
        request.tenantId,
        [request.parentAssignmentId],
      );
      if (!parent || parent.statusConceptId !== STATUS.ACTIVE) {
        throw new PreconditionFailedException(
          'El vínculo que se amplía ya no está activo',
          undefined,
          Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
        );
      }
      return parent;
    }
    const membership = await this.directory.ensureActiveStaffMembership(
      tx,
      request.requesterUserId,
      request.tenantId,
      DIR.MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT,
      actor.id,
    );
    await tx.flush();
    const template = (await this.templates.findById(
      tx,
      request.roleTemplateId,
    )) as RoleTemplates;
    const tenant = await this.directory.findTenant(tx, request.tenantId);
    const typeCode = tenant
      ? TENANT_TYPE_CODE_BY_CONCEPT_ID[tenant.tenantTypeConceptId]
      : undefined;
    // El modelo admite un vínculo activo por membresía y plantilla: si la
    // persona ya lo tiene, la aprobación lo amplía en vez de abrir otro.
    const already = await this.engagements.findActiveByMembershipTemplate(
      tx,
      membership.id,
      template.id,
    );
    if (already) return already;
    const now = new Date();
    const engagement = this.engagements.create(tx, {
      tenantId: membership.tenantId,
      tenantMembershipId: membership.id,
      assignmentRoleConceptId: assignmentRoleOfTemplate(template.code),
      accessScopeConceptId: DELEG.SCOPE_TENANT,
      roleTemplateId: template.id,
      originConceptId:
        request.directionConceptId === DELEG.ENGAGEMENT_DIRECTION_INVITATION
          ? DELEG.ENGAGEMENT_ORIGIN_INVITATION
          : DELEG.ENGAGEMENT_ORIGIN_REQUEST,
      ownerKindConceptId:
        typeCode === 'MEDICAL_OFFICE'
          ? DELEG.OWNER_KIND_PRIVATE_PRACTICE
          : DELEG.OWNER_KIND_ORGANIZATION,
      recertifyEveryMonths,
      nextRecertificationAt: addMonths(now, recertifyEveryMonths),
      validFrom: now,
      statusConceptId: STATUS.ACTIVE,
      actorUserId: actor.id,
    });
    await tx.flush();
    // Nace el vínculo: se abre su caso de ingreso (lista y compuerta, §6.1).
    await this.lifecycle?.openJoiner(tx, {
      engagement,
      tenantId: request.tenantId,
      userId: request.requesterUserId,
      actorUserId: actor.id,
    });
    return engagement;
  }

  /** Crea el permiso de un ítem aprobado o ajustado, con sus acciones. */
  private async emitGrant(
    tx: EntityManager,
    tenantId: string,
    engagement: OrganizationUserAssignments,
    item: EngagementRequestItems,
    decision: ItemDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const { kind, refs, actions, condition, expansionMode } = emissionOf(
      item,
      decision,
    );
    await this.targets.assertTarget(tx, tenantId, kind, refs);
    const mode = expansionMode;
    // Gobierno de accesos: techo, barandillas, condiciones y segregación de funciones
    // también al aprobar una solicitud (el guardián no está en las suites anteriores).
    if (this.writeGuard) {
      const request = await this.requests.findById(
        tx,
        item.engagementRequestId,
      );
      const template = engagement.roleTemplateId
        ? await this.templates.findById(tx, engagement.roleTemplateId)
        : null;
      await this.writeGuard.assertCanWrite(tx, {
        tenantId,
        actor,
        engagementId: engagement.id,
        userId: request?.requesterUserId ?? '',
        ...(template?.code ? { templateCode: template.code } : {}),
        grant: {
          targetKind: kind,
          actions,
          ...(decision.validTo ? { validTo: new Date(decision.validTo) } : {}),
          ...(condition ? { condition } : {}),
          ...refs,
        },
      });
    }
    const grant = this.grants.create(tx, {
      tenantId,
      organizationUserAssignmentId: engagement.id,
      targetKindConceptId: TARGET_KIND_CONCEPT[kind],
      ...refs,
      expansionModeConceptId: EXPANSION_CONCEPT[mode],
      fixedSnapshot:
        mode === 'FIXED'
          ? await this.targets.buildSnapshot(tx, tenantId, kind, refs)
          : undefined,
      validTo: decision.validTo ? new Date(decision.validTo) : undefined,
      statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
      approvedByUserId: actor.id,
      actorUserId: actor.id,
      ...(condition
        ? {
            condition,
            conditionSchemaVersion:
              typeof condition.schemaVersion === 'number'
                ? condition.schemaVersion
                : undefined,
          }
        : {}),
    });
    await tx.flush();
    this.grants.addActions(
      tx,
      grant,
      actions.map((code) => permissionIdOfInput(code)),
    );
    await tx.flush();
    return grant.id;
  }

  /** Vínculos de la persona en la organización, por id. */
  private async loadOwnEngagements(
    tx: EntityManager,
    userId: string,
    tenantId: string,
    ids: readonly string[],
  ): Promise<OrganizationUserAssignments[]> {
    const membership = await this.directory.findMembership(
      tx,
      userId,
      tenantId,
    );
    if (!membership) return [];
    const found = await this.engagements.findByIds(tx, ids);
    return found.filter((a) => a.tenantMembershipId === membership.id);
  }

  /** Acciones por defecto de una plantilla (de la fila, o las de plataforma por código). */
  private defaultActions(template: RoleTemplates): SupportActionCode[] {
    const stored = template.defaultActionsJson;
    if (Array.isArray(stored) && stored.length > 0) {
      return stored as SupportActionCode[];
    }
    return [
      ...(SUPPORT_TEMPLATE_DEFAULTS[template.code as SupportTemplateCode] ??
        []),
    ];
  }

  /** La solicitud (o su organización) no existe para quien la pide. */
  private requestNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Solicitud no encontrada',
      undefined,
      Reason.SUPPORT_REQUEST_NOT_FOUND,
    );
  }

  /**
   * Arma las vistas de una página de solicitudes con sus ítems y los nombres
   * (persona, organización, doctor, servicio y ubicación) resueltos en pocas
   * consultas. Una pendiente vencida figura vencida; una aprobada con algún
   * ítem rechazado figura `PARTIAL`.
   */
  private async toViews(
    tx: EntityManager,
    rows: readonly EngagementRequests[],
    now: number,
  ): Promise<EngagementRequestViewDto[]> {
    if (rows.length === 0) return [];
    const itemsOf = new Map<string, EngagementRequestItems[]>();
    for (const row of rows) {
      itemsOf.set(row.id, await this.requests.findItems(tx, row.id));
    }
    const allItems = [...itemsOf.values()].flat();
    const uniq = (values: (string | undefined)[]): string[] => [
      ...new Set(values.filter((v): v is string => !!v)),
    ];
    const roleIds = uniq(allItems.map((i) => i.practitionerRoleAssignmentId));
    const [templates, requesters, tenants, doctors, services, locations] =
      await Promise.all([
        Promise.all(
          uniq(rows.map((r) => r.roleTemplateId)).map(
            async (id) => [id, await this.templates.findById(tx, id)] as const,
          ),
        ),
        this.names.userNames(tx, uniq(rows.map((r) => r.requesterUserId))),
        this.names.tenantNames(tx, uniq(rows.map((r) => r.tenantId))),
        this.names.doctorNamesByRoleAssignment(tx, roleIds),
        this.names.serviceNames(
          tx,
          uniq(allItems.map((i) => i.healthcareServiceId)),
        ),
        this.names.locationNames(
          tx,
          uniq(allItems.flatMap((i) => [i.careSpaceId, i.practiceSiteId])),
        ),
      ]);
    const templateCode = new Map(templates.map(([id, t]) => [id, t?.code]));
    return rows.map((row): EngagementRequestViewDto => {
      const items = itemsOf.get(row.id) ?? [];
      const overdue =
        row.statusConceptId === DELEG.ENGAGEMENT_STATUS_PENDING &&
        row.expiresAt.getTime() <= now;
      const decisions = items.map(
        (i) => ITEM_DECISION_CODE[i.decisionConceptId],
      );
      const partial =
        row.statusConceptId === DELEG.ENGAGEMENT_STATUS_APPROVED &&
        decisions.includes('REJECTED');
      return {
        id: row.id,
        tenantId: row.tenantId,
        organizationName: tenants.get(row.tenantId) || undefined,
        requesterUserId: row.requesterUserId,
        requesterName: requesters.get(row.requesterUserId) || undefined,
        direction:
          row.directionConceptId === DELEG.ENGAGEMENT_DIRECTION_INVITATION
            ? 'INVITATION'
            : 'REQUEST',
        roleTemplateId: row.roleTemplateId,
        roleTemplateCode: templateCode.get(row.roleTemplateId),
        parentAssignmentId: row.parentAssignmentId,
        message: row.messageText,
        status: overdue
          ? 'EXPIRED'
          : partial
            ? 'PARTIAL'
            : REQUEST_STATUS_CODE[row.statusConceptId],
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        decidedAt: row.decidedAt,
        decisionReason: row.decisionReasonText,
        items: items.map((item): EngagementRequestItemViewDto => ({
          id: item.id,
          targetKind: TARGET_KIND_BY_CONCEPT[item.targetKindConceptId],
          practitionerRoleAssignmentId: item.practitionerRoleAssignmentId,
          healthcareServiceId: item.healthcareServiceId,
          careSpaceId: item.careSpaceId,
          practiceSiteId: item.practiceSiteId,
          practitionerName: item.practitionerRoleAssignmentId
            ? doctors.get(item.practitionerRoleAssignmentId)?.name || undefined
            : undefined,
          serviceName: item.healthcareServiceId
            ? services.get(item.healthcareServiceId) || undefined
            : undefined,
          locationName:
            locations.get(item.careSpaceId ?? item.practiceSiteId ?? '') ||
            undefined,
          proposedActions: item.proposedActionsJson as string[],
          decision: ITEM_DECISION_CODE[item.decisionConceptId],
          decisionComment: item.decisionCommentText,
          resultingGrantId: item.resultingGrantId,
        })),
      };
    });
  }
}

/** Suma meses de calendario a una fecha. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

/** Cursor opaco por fecha de creación. */
function encodeCursor(date: Date): string {
  return Buffer.from(date.toISOString()).toString('base64url');
}

/** Lee el cursor; uno ilegible equivale a no haber cursor. */
function decodeCursor(cursor: string): Date | undefined {
  const value = new Date(Buffer.from(cursor, 'base64url').toString('utf8'));
  return Number.isNaN(value.getTime()) ? undefined : value;
}
