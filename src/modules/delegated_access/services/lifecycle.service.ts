import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import { DIR } from '../../directory/directory.concepts';
import { OutboxService } from '../../messaging/services/outbox.service';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  canComplete,
  completeChecklistItem,
  evaluateJoinerChecklist,
  onboardingDueAt,
  ownerEligibility,
  ownerlessReasons,
  sha256Hex,
  canonicalJson,
  type ChecklistItem,
  type LifecycleKind,
  type OwnerlessReason,
} from '../domain';
import type { LifecycleCases, OrganizationUserAssignments } from '../entities';
import type {
  CompleteChecklistItemDto,
  ConfidentialityAckResultDto,
  IdentityVerificationDto,
  LifecycleCaseDetailDto,
  LifecycleCaseExportDto,
  LifecycleCaseSummaryDto,
  ListLifecycleCasesQueryDto,
  ListLifecycleCasesResponseDto,
  OperationResultDto,
  PutOwnerDto,
} from '../dto';
import {
  LifecycleRepository,
  SupportAccessRepository,
  type EngagementRecord,
} from '../repositories';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { governanceError } from './governance-errors';
import { JoinerFactsReader } from './lifecycle-joiner-facts';
import { LifecycleSettingsReader } from './support-lifecycle-settings';
import { SupportAdminDirectory } from './support-admin-directory';
import { withPersonScope } from './tenant-context';

const KIND_CONCEPT: Readonly<Record<LifecycleKind, string>> = {
  JOINER: DELEG.LIFECYCLE_JOINER,
  MOVER: DELEG.LIFECYCLE_MOVER,
  LEAVER: DELEG.LIFECYCLE_LEAVER,
  SUSPENSION: DELEG.LIFECYCLE_SUSPENSION,
  REACTIVATION: DELEG.LIFECYCLE_REACTIVATION,
};
const KIND_BY_CONCEPT: Readonly<Record<string, LifecycleKind>> =
  Object.fromEntries(
    Object.entries(KIND_CONCEPT).map(([k, v]) => [v, k as LifecycleKind]),
  );
const STATUS_BY_CONCEPT: Readonly<Record<string, string>> = {
  [DELEG.LIFECYCLE_OPEN]: 'OPEN',
  [DELEG.LIFECYCLE_COMPLETED]: 'COMPLETED',
  [DELEG.LIFECYCLE_CANCELLED]: 'CANCELLED',
};
const HANDOVER_KIND: Readonly<Record<string, string>> = {
  [DELEG.HANDOVER_CONVERSATION]: 'CONVERSATION',
  [DELEG.HANDOVER_WORKFLOW_TASK]: 'WORKFLOW_TASK',
  [DELEG.HANDOVER_SUPERVISED_ENGAGEMENT]: 'SUPERVISED_ENGAGEMENT',
  [DELEG.HANDOVER_PENDING_BOOKING]: 'PENDING_BOOKING',
};
const HANDOVER_STATUS: Readonly<Record<string, string>> = {
  [DELEG.HANDOVER_PENDING]: 'PENDING',
  [DELEG.HANDOVER_REASSIGNED]: 'REASSIGNED',
  [DELEG.HANDOVER_RETURNED_TO_POOL]: 'RETURNED_TO_POOL',
  [DELEG.HANDOVER_CLOSED]: 'CLOSED',
};
const IDENTITY_METHOD: Readonly<Record<string, string>> = {
  IN_PERSON: DELEG.IDENTITY_METHOD_IN_PERSON,
  DOCUMENT_UPLOAD: DELEG.IDENTITY_METHOD_DOCUMENT_UPLOAD,
};

/** Datos para abrir el ingreso de un vínculo recién nacido. */
export interface OpenJoinerInput {
  readonly engagement: OrganizationUserAssignments;
  readonly tenantId: string;
  readonly userId: string;
  readonly actorUserId?: string;
}

/** Lee la lista guardada reconstruyendo las fechas (la columna es JSON). */
export function readChecklist(json: unknown): ChecklistItem[] {
  if (!Array.isArray(json)) return [];
  return (json as unknown[])
    .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
    .map((i) => {
      const at = i.completedAt;
      return {
        code: String(i.code),
        label: String(i.label),
        required: i.required === true,
        completion: i.completion as ChecklistItem['completion'],
        status: i.status as ChecklistItem['status'],
        completedAt:
          typeof at === 'string' || typeof at === 'number' || at instanceof Date
            ? new Date(at)
            : null,
        ...(typeof i.pendingCount === 'number'
          ? { pendingCount: i.pendingCount }
          : {}),
      };
    });
}

/**
 * Ciclo de vida de un vínculo de apoyo (CONTRATO-GOBIERNO §6.1): ingreso con su
 * lista y su compuerta, dueño de la cuenta, verificación de identidad,
 * compromiso de confidencialidad y consulta de los casos. El cambio, la baja con
 * traspaso, la suspensión y la reactivación viven en sus propios servicios.
 */
@Injectable()
export class LifecycleService {
  /**
   * @param em - Contexto de persistencia.
   * @param lifecycle - Casos y traspasos.
   * @param access - Lecturas de vínculos.
   * @param settings - Ajustes de gobierno de la organización.
   * @param directory - Quién es quién (candidatos a dueño).
   * @param facts - Hechos que la lista deduce sola.
   * @param outbox - Eventos de dominio.
   * @param audit - Asientos de la cadena de auditoría.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly lifecycle: LifecycleRepository,
    private readonly access: SupportAccessRepository,
    private readonly settings: LifecycleSettingsReader,
    private readonly directory: SupportAdminDirectory,
    private readonly facts: JoinerFactsReader,
    private readonly outbox: OutboxService,
    private readonly audit: AuditTrailService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LifecycleService.name);
  }

  /**
   * Abre el caso de ingreso de un vínculo recién nacido (solicitud aprobada,
   * invitación dirigida o canje aprobado). Idempotente: si ya hay uno abierto,
   * lo devuelve.
   *
   * @param tx - Transacción en la que nació el vínculo.
   * @param input - Vínculo, organización y persona.
   * @param now - Reloj.
   * @returns El caso de ingreso.
   */
  async openJoiner(
    tx: EntityManager,
    input: OpenJoinerInput,
    now: Date = new Date(),
  ): Promise<LifecycleCases> {
    const a = input.engagement;
    const open = await this.lifecycle.findOpenCase(
      tx,
      a.id,
      DELEG.LIFECYCLE_JOINER,
    );
    if (open) return open;
    const items = await this.evaluate(
      tx,
      input.tenantId,
      input.userId,
      a,
      null,
      now,
    );
    const created = this.lifecycle.createCase(tx, {
      tenantId: input.tenantId,
      organizationUserAssignmentId: a.id,
      subjectUserId: input.userId,
      kindConceptId: DELEG.LIFECYCLE_JOINER,
      openedByUserId: input.actorUserId,
      openedAt: now,
      dueAt: onboardingDueAt(a.createdAt ?? now),
      checklist: items,
      actorUserId: input.actorUserId,
    });
    await this.publish(
      tx,
      input.tenantId,
      'joiner_opened',
      created.id,
      a.id,
      input.actorUserId,
    );
    if (canComplete(items))
      await this.finishJoiner(tx, input.tenantId, created, a, items, now);
    return created;
  }

  /**
   * Vuelve a evaluar la lista de ingreso con los hechos de hoy y, si no falta
   * nada obligatorio, completa el caso y fija `onboarding_completed_at`. Lo
   * llaman las operaciones que mueven un ítem (compromiso, identidad, dueño).
   *
   * @param tx - Transacción activa.
   * @param engagementId - Vínculo.
   * @param now - Reloj.
   */
  async refreshJoiner(
    tx: EntityManager,
    engagementId: string,
    now: Date = new Date(),
  ): Promise<void> {
    const [record] = await this.access.findEngagements(tx, {
      ids: [engagementId],
    });
    if (!record || record.assignment.onboardingCompletedAt) return;
    const kase = await this.lifecycle.findOpenCase(
      tx,
      engagementId,
      DELEG.LIFECYCLE_JOINER,
    );
    if (!kase) return;
    const ack = readChecklist(kase.checklistJson).find(
      (i) => i.code === 'CONFIDENTIALITY_ACK',
    );
    const items = await this.evaluate(
      tx,
      record.tenantId,
      record.userId,
      record.assignment,
      ack?.status === 'DONE' ? (ack.completedAt ?? now) : null,
      now,
    );
    kase.checklistJson = items;
    kase.updatedAt = now;
    if (canComplete(items)) {
      await this.finishJoiner(
        tx,
        record.tenantId,
        kase,
        record.assignment,
        items,
        now,
      );
    }
  }

  /**
   * Asigna el dueño de la cuenta (D-07, GP-8): administrador de seguridad, doctor
   * de la organización o administrador delegado vivo, distinto de la persona.
   * Si el vínculo quedó huérfano por una baja con traspaso pendiente, lo resuelve.
   *
   * @param engagementId - Vínculo.
   * @param dto - Nuevo dueño.
   * @param actor - Quien lo asigna.
   * @returns El nuevo dueño.
   */
  async setOwner(
    engagementId: string,
    dto: PutOwnerDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto & { supervisorUserId: string }> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const record = await this.loadInTenant(tx, engagementId, tenantId);
      const a = record.assignment;
      if (
        a.statusConceptId !== STATUS.ACTIVE &&
        a.statusConceptId !== STATUS.SUSPENDED
      ) {
        throw governanceError(
          Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
          'El vínculo de apoyo no está vigente.',
        );
      }
      const now = new Date();
      const candidate = await this.directory.ownerCandidate(
        tx,
        dto.supervisorUserId,
        tenantId,
        now,
      );
      const verdict = ownerEligibility({
        candidate,
        subjectUserId: record.userId,
      });
      if (!verdict.eligible) {
        throw governanceError(
          verdict.reason === 'GUARDRAIL_SELF_SUPERVISION'
            ? Reason.GUARDRAIL_SELF_SUPERVISION
            : Reason.OWNER_NOT_ELIGIBLE,
          verdict.reason === 'GUARDRAIL_SELF_SUPERVISION'
            ? 'Nadie puede ser dueño de su propia cuenta.'
            : 'El dueño debe ser administrador, doctor de la organización o administrador delegado con membresía vigente.',
        );
      }
      a.supervisorUserId = dto.supervisorUserId;
      touch(a, actor.id, now);
      await this.resolveOrphanHandover(
        tx,
        tenantId,
        engagementId,
        dto.supervisorUserId,
        actor.id,
        now,
      );
      await tx.flush();
      await this.refreshJoiner(tx, engagementId, now);
      await tx.flush();
      return { ok: true, supervisorUserId: dto.supervisorUserId };
    });
  }

  /**
   * Un administrador registra la verificación de identidad en persona o con
   * documento subido; se reevalúa el ingreso.
   *
   * @param engagementId - Vínculo.
   * @param dto - Método y nota.
   * @param actor - Quien la registra.
   * @returns `{ ok: true }`.
   */
  async identityVerification(
    engagementId: string,
    dto: IdentityVerificationDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const record = await this.loadInTenant(tx, engagementId, tenantId);
      const a = record.assignment;
      if (
        a.statusConceptId !== STATUS.ACTIVE &&
        a.statusConceptId !== STATUS.SUSPENDED
      ) {
        throw governanceError(
          Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
          'El vínculo de apoyo no está vigente.',
        );
      }
      const now = new Date();
      a.identityVerifiedAt = now;
      a.identityVerifiedByUserId = actor.id;
      a.identityMethodConceptId = IDENTITY_METHOD[dto.method];
      touch(a, actor.id, now);
      await tx.flush();
      await this.refreshJoiner(tx, engagementId, now);
      await tx.flush();
      return { ok: true };
    });
  }

  /**
   * La propia persona acepta el compromiso de confidencialidad. Solo acepta por
   * sí misma: un vínculo ajeno responde como inexistente.
   *
   * @param engagementId - Vínculo de la persona.
   * @param actor - La persona de apoyo.
   * @returns La organización (para el sello) y la fecha.
   */
  async confidentialityAckMine(
    engagementId: string,
    actor: AuthenticatedUser,
  ): Promise<ConfidentialityAckResultDto> {
    return withPersonScope(
      this.em,
      async (tx, scope) => {
        const [record] = await scope.ownRows(() =>
          this.access.findEngagements(tx, {
            ids: [engagementId],
            userId: actor.id,
          }),
        );
        if (!record || record.userId !== actor.id) throw this.notFound();
        const a = record.assignment;
        const live =
          a.statusConceptId === STATUS.ACTIVE &&
          record.membershipStatusConceptId === DIR.MEMBERSHIP_ACTIVE;
        if (!live) {
          throw governanceError(
            Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
            'Solo acepta el compromiso quien tiene el vínculo activo.',
          );
        }
        const now = new Date();
        await scope.inTenant(record.tenantId, async () => {
          let kase = await this.lifecycle.findOpenCase(
            tx,
            a.id,
            DELEG.LIFECYCLE_JOINER,
          );
          if (!kase && !a.onboardingCompletedAt) {
            kase = await this.openJoiner(
              tx,
              {
                engagement: a,
                tenantId: record.tenantId,
                userId: record.userId,
              },
              now,
            );
          }
          if (!kase) return;
          kase.checklistJson = readChecklist(kase.checklistJson).map((i) =>
            i.code === 'CONFIDENTIALITY_ACK' && i.status !== 'DONE'
              ? { ...i, status: 'DONE' as const, completedAt: now }
              : i,
          );
          kase.updatedAt = now;
          await tx.flush();
          await this.refreshJoiner(tx, a.id, now);
          await tx.flush();
        });
        return { ok: true, tenantId: record.tenantId, acknowledgedAt: now };
      },
      { transactional: true },
    );
  }

  /**
   * Marca a mano un ítem de la lista de un caso abierto.
   *
   * @param caseId - Caso.
   * @param code - Código del ítem.
   * @param actor - Quien lo marca.
   * @param _dto - Nota (se admite; la lista guarda solo la fecha).
   * @returns El caso con su lista al día.
   */
  async completeItem(
    caseId: string,
    code: string,
    actor: AuthenticatedUser,
    _dto?: CompleteChecklistItemDto,
  ): Promise<LifecycleCaseDetailDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const kase = await this.openCase(tx, tenantId, caseId);
      const now = new Date();
      const done = completeChecklistItem(
        readChecklist(kase.checklistJson),
        code,
        now,
      );
      if (!done.ok) {
        throw governanceError(
          done.reason === 'LIFECYCLE_ITEM_AUTOMATIC'
            ? Reason.LIFECYCLE_ITEM_AUTOMATIC
            : Reason.LIFECYCLE_ITEM_UNKNOWN,
          done.reason === 'LIFECYCLE_ITEM_AUTOMATIC'
            ? 'Ese ítem lo completa el sistema o la propia persona; no se marca a mano.'
            : 'Ese ítem no existe en este caso.',
        );
      }
      kase.checklistJson = done.items;
      touch(kase, actor.id, now);
      await tx.flush();
      if (KIND_BY_CONCEPT[kase.kindConceptId] === 'JOINER') {
        await this.refreshJoiner(tx, kase.organizationUserAssignmentId, now);
      } else if (canComplete(done.items)) {
        this.lifecycle.complete(kase, now, actor.id);
      }
      await tx.flush();
      return this.detail(tx, kase);
    });
  }

  /**
   * Casos de la organización, los más recientes primero.
   *
   * @param query - Tipo y estado opcionales.
   * @returns Los casos.
   */
  async listCases(
    query: ListLifecycleCasesQueryDto,
  ): Promise<ListLifecycleCasesResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const rows = await this.lifecycle.findCases(tx, tenantId, {
      ...(query.kind ? { kindConceptId: KIND_CONCEPT[query.kind] } : {}),
      ...(query.status
        ? {
            statusConceptId: Object.entries(STATUS_BY_CONCEPT).find(
              ([, v]) => v === query.status,
            )?.[0],
          }
        : {}),
    });
    const items = rows.map((r) => this.summary(r));
    return { items, count: items.length };
  }

  /**
   * Un caso con su lista de verificación y sus traspasos.
   *
   * @param caseId - Caso.
   * @returns El detalle; uno ajeno responde 404.
   */
  async getCase(caseId: string): Promise<LifecycleCaseDetailDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const kase = await this.lifecycle.findCaseById(tx, tenantId, caseId);
    if (!kase) throw this.caseNotFound();
    return this.detail(tx, kase);
  }

  /**
   * Registro de transferencia exportable: el caso con su hash y el asiento de
   * la exportación en la cadena de auditoría.
   *
   * @param caseId - Caso.
   * @param actor - Quien exporta.
   * @returns El caso, la fecha y el SHA-256 del contenido.
   */
  async exportCase(
    caseId: string,
    actor: AuthenticatedUser,
  ): Promise<LifecycleCaseExportDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const kase = await this.lifecycle.findCaseById(tx, tenantId, caseId);
      if (!kase) throw this.caseNotFound();
      const detail = await this.detail(tx, kase);
      await this.audit.record(tx, actor, {
        action: 'GOVERNANCE_REPORT_EXPORTED',
        entity: 'lifecycle_case',
        entityId: caseId,
        tenantId,
        success: true,
      });
      return {
        case: detail,
        exportedAt: new Date(),
        sha256: sha256Hex(canonicalJson(detail)),
      };
    });
  }

  /**
   * Cuentas vivas sin dueño o cuyo dueño ya no es elegible (D-07).
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param now - Reloj.
   * @returns Cada cuenta huérfana con sus motivos.
   */
  async listOwnerless(
    em: EntityManager,
    tenantId: string,
    now: Date = new Date(),
  ): Promise<
    Array<{ engagementId: string; userId: string; reasons: OwnerlessReason[] }>
  > {
    const records = (
      await this.access.findEngagements(em, { tenantId })
    ).filter(
      (r) =>
        r.assignment.statusConceptId === STATUS.ACTIVE &&
        r.membershipStatusConceptId === DIR.MEMBERSHIP_ACTIVE,
    );
    const eligible = new Map<string, boolean>();
    const out: Array<{
      engagementId: string;
      userId: string;
      reasons: OwnerlessReason[];
    }> = [];
    for (const r of records) {
      const owner = r.assignment.supervisorUserId;
      let stillEligible: boolean | undefined;
      if (owner) {
        const key = `${owner}|${r.userId}`;
        if (!eligible.has(key)) {
          const candidate = await this.directory.ownerCandidate(
            em,
            owner,
            tenantId,
            now,
          );
          eligible.set(
            key,
            ownerEligibility({ candidate, subjectUserId: r.userId }).eligible,
          );
        }
        stillEligible = eligible.get(key);
      }
      const reasons = ownerlessReasons({
        supervisorUserId: owner,
        supervisorStillEligible: stillEligible,
      });
      if (reasons.length > 0)
        out.push({ engagementId: r.assignment.id, userId: r.userId, reasons });
    }
    return out;
  }

  /** Evalúa la lista de ingreso con los hechos de la persona. */
  private async evaluate(
    tx: EntityManager,
    tenantId: string,
    userId: string,
    a: OrganizationUserAssignments,
    ackAt: Date | null,
    now: Date,
  ): Promise<ChecklistItem[]> {
    const settings = await this.settings.forTenant(tx, tenantId, now);
    const [platformIdentityVerified, mfaEnrolled, acceptances] =
      await Promise.all([
        this.facts.platformIdentityVerified(tx, userId),
        this.facts.mfaEnrolled(tx, userId),
        this.facts.doctorAcceptances(tx, a.id),
      ]);
    return evaluateJoinerChecklist({
      now,
      platformIdentityVerified,
      identityVerifiedAt: a.identityVerifiedAt ?? null,
      confidentialityAckAt: ackAt,
      mfaEnrolled,
      requireMfa: settings.requireMfa,
      supervisorUserId: a.supervisorUserId ?? null,
      scopeBlocked: false,
      nextRecertificationAt: a.nextRecertificationAt ?? null,
      doctorAcceptancesPending: acceptances.pending,
      doctorAcceptancesTotal: acceptances.total,
    });
  }

  /** Completa el ingreso: caso `COMPLETED` y `onboarding_completed_at` en el vínculo. */
  private async finishJoiner(
    tx: EntityManager,
    tenantId: string,
    kase: LifecycleCases,
    a: OrganizationUserAssignments,
    items: ChecklistItem[],
    now: Date,
  ): Promise<void> {
    kase.checklistJson = items;
    this.lifecycle.complete(kase, now, undefined);
    a.onboardingCompletedAt = now;
    await this.publish(
      tx,
      tenantId,
      'joiner_completed',
      kase.id,
      a.id,
      undefined,
    );
  }

  /** Un traspaso pendiente de «cuentas que supervisaba» se resuelve al darles dueño. */
  private async resolveOrphanHandover(
    tx: EntityManager,
    tenantId: string,
    engagementId: string,
    toUserId: string,
    byUserId: string,
    now: Date,
  ): Promise<void> {
    const pending = await this.lifecycle.findPendingItemsBySource(
      tx,
      tenantId,
      engagementId,
      DELEG.HANDOVER_SUPERVISED_ENGAGEMENT,
    );
    for (const item of pending) {
      this.lifecycle.reassign(item, {
        toUserId,
        byUserId,
        now,
        note: 'Dueño asignado',
      });
      // El conteo lee de la base: sin confirmar antes el cambio de estado de este
      // ítem, aún lo cuenta como pendiente y el caso de la baja nunca se completa.
      await tx.flush();
      if (
        (await this.lifecycle.countPendingHandover(
          tx,
          item.lifecycleCaseId,
        )) === 0
      ) {
        const kase = await this.lifecycle.findCaseById(
          tx,
          tenantId,
          item.lifecycleCaseId,
        );
        if (kase && kase.statusConceptId === DELEG.LIFECYCLE_OPEN) {
          kase.checklistJson = readChecklist(kase.checklistJson).map((i) =>
            i.status === 'PENDING'
              ? { ...i, status: 'DONE' as const, completedAt: now }
              : i,
          );
          this.lifecycle.complete(kase, now, byUserId);
        }
      }
    }
  }

  /** Caso abierto de la organización; uno cerrado o ajeno responde como inexistente. */
  private async openCase(
    tx: EntityManager,
    tenantId: string,
    caseId: string,
  ): Promise<LifecycleCases> {
    const kase = await this.lifecycle.findCaseById(tx, tenantId, caseId);
    if (!kase || kase.statusConceptId !== DELEG.LIFECYCLE_OPEN)
      throw this.caseNotFound();
    return kase;
  }

  private async loadInTenant(
    tx: EntityManager,
    engagementId: string,
    tenantId: string,
  ): Promise<EngagementRecord> {
    const [record] = await this.access.findEngagements(tx, {
      ids: [engagementId],
      tenantId,
    });
    if (!record) throw this.notFound();
    return record;
  }

  private summary(r: LifecycleCases): LifecycleCaseSummaryDto {
    return {
      id: r.id,
      kind: KIND_BY_CONCEPT[r.kindConceptId] ?? 'JOINER',
      status: STATUS_BY_CONCEPT[r.statusConceptId] ?? 'OPEN',
      engagementId: r.organizationUserAssignmentId,
      subjectUserId: r.subjectUserId,
      openedByUserId: r.openedByUserId,
      openedAt: r.openedAt,
      dueAt: r.dueAt,
      completedAt: r.completedAt,
    };
  }

  private async detail(
    tx: EntityManager,
    r: LifecycleCases,
  ): Promise<LifecycleCaseDetailDto> {
    const handover = await this.lifecycle.findHandoverItems(tx, r.id);
    return {
      ...this.summary(r),
      reason: r.reasonText,
      checklist: readChecklist(r.checklistJson).map((i) => ({
        ...i,
        completedAt: i.completedAt ?? undefined,
      })),
      handover: handover.map((h) => ({
        id: h.id,
        kind: HANDOVER_KIND[h.itemKindConceptId] ?? 'CONVERSATION',
        sourceId: h.sourceId,
        fromUserId: h.fromUserId,
        toUserId: h.toUserId,
        status: HANDOVER_STATUS[h.statusConceptId] ?? 'PENDING',
        reassignedAt: h.reassignedAt,
        reassignedByUserId: h.reassignedByUserId,
      })),
    };
  }

  private async publish(
    tx: EntityManager,
    tenantId: string,
    type: 'joiner_opened' | 'joiner_completed',
    caseId: string,
    engagementId: string,
    actorUserId: string | undefined,
  ): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId,
      eventType: `delegated_access.lifecycle.${type}`,
      aggregateType: 'lifecycle_case',
      aggregateId: caseId,
      payloadJson: { tenantId, caseId, engagementId },
      ...(actorUserId ? { actorUserId } : {}),
    });
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Vínculo de apoyo no encontrado',
      undefined,
      Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
    );
  }

  private caseNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Caso no encontrado',
      undefined,
      Reason.LIFECYCLE_CASE_NOT_FOUND,
    );
  }
}
