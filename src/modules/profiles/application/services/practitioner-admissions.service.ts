import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { assertNotSelfAccess } from './admission-self-access';
import { InsufficientRoleException } from '../../../../common/errors/domain.exception';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { Users } from '../../../iam/entities';
import {
  HealthPractitionerProfiles,
  JurisdictionAuthorizations,
  PractitionerAdmissions,
  type PractitionerAdmissionReviews,
} from '../../entities';
import { PROF } from '../../profiles.concepts';
import { ProfilesErrorReason } from '../../profiles.error-reasons';
import {
  PersonAccountLinksRepository,
  PractitionerAdmissionEventsRepository,
  PractitionerAdmissionReviewsRepository,
  PractitionerAdmissionsRepository,
  REVIEW_STATE_CONCEPT,
  reviewStateOf,
} from '../../infrastructure/repositories';
import {
  ONBOARDING_TYPE,
  PractitionerAdmissionsReadService,
} from './practitioner-admissions-read.service';
import {
  NULL,
  PractitionerAdmissionChecklistService,
  type ChecklistView,
  type ResetMode,
} from './practitioner-admission-checklist.service';
import { PractitionerAdmissionEvidenceService } from './practitioner-admission-evidence.service';
import { PractitionerVerificationProjector } from './practitioner-verification-projector.service';
import {
  ADMISSION_NOTICE_PORT,
  type AdmissionNoticeKind,
  type AdmissionNoticePort,
} from '../ports/admission-notice.port';
import {
  ADMISSION_STATUS_CONCEPT,
  admissionStatusCode,
  canTransition,
  targetStatus,
  type AdmissionAction,
  type AdmissionStatusCode,
} from '../../domain/admissions/admission-status';
import {
  EVENT_TYPES,
  REASONS,
  SOURCE_TYPES,
  type AdmissionEventCode,
  type ReasonCode,
  type SourceTypeCode,
} from '../../domain/admissions/admission-vocabulary';
import { ADMISSION_ITEM_CONCEPT } from '../../domain/admissions/admission-requirements.catalog';
import {
  addBusinessDays,
  addMonthsUtc,
  endOfDayLaPaz,
  todayLaPaz,
  toDateOnly,
} from '../../domain/admissions/business-days';
import { loadAdmissionsConfig } from '../../domain/admissions/admissions.config';
import type {
  AdmissionDetailDto,
  AdmissionSweepResultDto,
  DecideAdmissionDto,
  OwnAdmissionDto,
  RequestAdmissionInfoDto,
  ReviewAdmissionItemDto,
  SuspendAdmissionDto,
} from '../../presentation/dto/admissions.dto';

/** Quién actúa y desde qué petición. */
export interface AdmissionCaller {
  readonly user: AuthenticatedUser;
  /** Id de la petición HTTP, para correlacionar la bitácora. */
  readonly requestId?: string;
}

/** Atestación del solicitante al enviar. */
export interface AdmissionAttestation {
  readonly acceptedAt: Date;
  readonly textVersion: string;
}

/** Aviso pendiente de emitir cuando la transacción ya confirmó. */
interface PendingNotice {
  readonly kind: AdmissionNoticeKind;
  readonly admissionId: string;
  readonly statusCode: AdmissionStatusCode;
  readonly practitionerProfileId: string;
}

/** Las fuentes con las que un revisor puede cerrar un ítem. */
interface SourceInput {
  readonly sourceType?: SourceTypeCode;
  readonly sourceRef?: string;
  readonly sourceConsultedAt?: string;
  readonly verificationSourceUri?: string;
}

const NOT_BLANK = (value: string | undefined): value is string =>
  value !== undefined && value.trim() !== '';

/**
 * Casos de uso de las admisiones de profesionales (v4.2.67): el único camino
 * por el que un alta de médico se revisa, se verifica, se suspende o vence.
 *
 * ## Qué garantiza
 *
 * - **La API decide.** Una admisión sólo pasa a VERIFICADA si todos los
 *   requisitos obligatorios aplicables están verificados; el cliente no
 *   promueve nada. Un obligatorio rechazado la impide, un opcional rechazado no.
 * - **Una transacción.** La resolución escribe revisiones, fichas (matrículas,
 *   títulos, especialidades), el estado del perfil, el sello público y la
 *   bitácora juntos; si algo falla no queda nada.
 * - **Un solo escritor** de `PRACT_VERIF_*`: {@link PractitionerVerificationProjector}.
 * - **Concurrencia.** `FOR UPDATE` + `expectedRowVersion` (409 `ADMISSION_STALE`);
 *   repetir la misma resolución sobre una admisión ya resuelta es idempotente.
 * - **Cuatro ojos** configurable (`ADMISSIONS_FOUR_EYES`): quien resuelve no es
 *   quien revisó. Nadie revisa ni aprueba su propia admisión, con o sin flag.
 * - **Avisos al médico** en cada transición (in-app y correo), después de
 *   confirmar y sin poder romper la decisión.
 */
@Injectable()
export class PractitionerAdmissionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly admissionsRepo: PractitionerAdmissionsRepository,
    private readonly eventsRepo: PractitionerAdmissionEventsRepository,
    private readonly reviewsRepo: PractitionerAdmissionReviewsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly checklist: PractitionerAdmissionChecklistService,
    private readonly evidence: PractitionerAdmissionEvidenceService,
    private readonly projector: PractitionerVerificationProjector,
    private readonly read: PractitionerAdmissionsReadService,
    @Inject(ADMISSION_NOTICE_PORT)
    private readonly notices: AdmissionNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PractitionerAdmissionsService.name);
  }

  // ═════════════════════════════════════════════════════════ creación ══

  /**
   * Abre la admisión ENVIADA de un profesional recién registrado, **dentro de
   * la transacción del alta**: si algo falla, se revierte el alta entera.
   *
   * Idempotente: si ya hay una abierta la devuelve. Debe llamarse cuando las
   * fichas del médico (matrículas, títulos, especialidades) ya están creadas.
   *
   * @param tx - La transacción del alta.
   * @param input - Perfil, quién registra y la atestación, si la hubo.
   */
  async openForRegistration(
    tx: EntityManager,
    input: {
      practitionerProfileId: string;
      actorUserId: string;
      attestation?: AdmissionAttestation;
      now?: Date;
    },
  ): Promise<PractitionerAdmissions> {
    await tx.flush();
    const existing = await this.admissionsRepo.findOpenByPractitioner(
      tx,
      input.practitionerProfileId,
      ONBOARDING_TYPE.concept,
    );
    if (existing) return existing;

    const config = loadAdmissionsConfig();
    const now = input.now ?? new Date();
    const live = await this.evidence.collect(tx, input.practitionerProfileId);
    const snapshot = await this.evidence.buildSnapshot(
      tx,
      input.practitionerProfileId,
      now,
      live.professionGroup,
    );
    const admission = this.admissionsRepo.create(tx, {
      practitionerProfileId: input.practitionerProfileId,
      admissionTypeConceptId: ONBOARDING_TYPE.concept,
      statusConceptId: ADMISSION_STATUS_CONCEPT.ENVIADA,
      submittedAt: now,
      dueAt: addBusinessDays(now, config.slaBusinessDays),
      submittedSnapshot: snapshot as unknown as Record<string, unknown>,
      attestedAt: input.attestation?.acceptedAt,
      attestationTextVersion: input.attestation?.textVersion,
      actorUserId: input.actorUserId,
    });
    await tx.flush();
    this.appendEvent(tx, admission, 'CREATED', {
      toStatus: 'ENVIADA',
      actorUserId: input.actorUserId,
      role: 'REGISTRATION',
      now,
    });
    await this.checklist.materialize(tx, admission, {
      actorUserId: input.actorUserId,
    });
    return admission;
  }

  // ═════════════════════════════════════════════════════ revisión ══

  /** Toma la admisión para revisarla (ENVIADA a EN_REVISION). */
  async claim(
    id: string,
    expectedRowVersion: number,
    caller: AdmissionCaller,
  ): Promise<AdmissionDetailDto> {
    const notices: PendingNotice[] = [];
    const detail = await this.em.transactional(async (tx) => {
      const role = this.roleFor(caller.user, 'REVIEWER');
      const admission = await this.loadLocked(tx, id);
      await this.assertNotOwnAdmission(tx, admission, caller.user);
      const status = admissionStatusCode(admission.statusConceptId);
      if (
        status === 'EN_REVISION' &&
        admission.assignedToUserId === caller.user.id
      ) {
        return this.read.detailOf(tx, admission);
      }
      this.assertVersion(admission, expectedRowVersion);
      this.assertTransition('CLAIM', status);
      const now = new Date();
      this.admissionsRepo.setStatus(
        admission,
        'EN_REVISION',
        caller.user.id,
        now,
      );
      admission.assignedToUserId = caller.user.id;
      this.appendEvent(tx, admission, 'CLAIMED', {
        fromStatus: status,
        toStatus: 'EN_REVISION',
        actorUserId: caller.user.id,
        role,
        requestId: caller.requestId,
        now,
      });
      await this.checklist.materialize(tx, admission, {
        actorUserId: caller.user.id,
      });
      await tx.flush();
      return this.read.detailOf(tx, admission, now);
    });
    await this.emit(notices);
    return detail;
  }

  /** Suelta una revisión tomada (EN_REVISION a ENVIADA) para que otro la tome. */
  async release(
    id: string,
    expectedRowVersion: number,
    caller: AdmissionCaller,
  ): Promise<AdmissionDetailDto> {
    return this.em.transactional(async (tx) => {
      const admission = await this.loadLocked(tx, id);
      const status = admissionStatusCode(admission.statusConceptId);
      // El dueño de la revisión la suelta; un aprobador puede soltar la de otro.
      const isOwner = admission.assignedToUserId === caller.user.id;
      const role = isOwner
        ? this.roleFor(caller.user, 'REVIEWER')
        : this.roleFor(caller.user, 'APPROVER');
      await this.assertNotOwnAdmission(tx, admission, caller.user);
      this.assertVersion(admission, expectedRowVersion);
      this.assertTransition('RELEASE', status);
      const now = new Date();
      this.admissionsRepo.setStatus(admission, 'ENVIADA', caller.user.id, now);
      admission.assignedToUserId = NULL;
      this.appendEvent(tx, admission, 'RELEASED', {
        fromStatus: status,
        toStatus: 'ENVIADA',
        actorUserId: caller.user.id,
        role,
        requestId: caller.requestId,
        now,
      });
      await tx.flush();
      return this.read.detailOf(tx, admission, now);
    });
  }

  /** Pasa una revisión tomada a otro revisor (sigue EN_REVISION). */
  async reassign(
    id: string,
    toUserId: string,
    expectedRowVersion: number,
    caller: AdmissionCaller,
  ): Promise<AdmissionDetailDto> {
    return this.em.transactional(async (tx) => {
      const role = this.roleFor(caller.user, 'APPROVER');
      const admission = await this.loadLocked(tx, id);
      await this.assertNotOwnAdmission(tx, admission, caller.user);
      const status = admissionStatusCode(admission.statusConceptId);
      this.assertVersion(admission, expectedRowVersion);
      // ENVIADA: reasignar es asignar y tomar a la vez.
      if (status !== 'EN_REVISION') this.assertTransition('CLAIM', status);
      const target = await tx.findOne(Users, { id: toUserId });
      const ownerLink = await this.accountLinksRepo.findActiveByPerson(
        tx,
        admission.practitionerProfileId,
      );
      if (!target || ownerLink?.userId === toUserId) {
        throw new PreconditionFailedException(
          'El revisor indicado no existe o es el propio solicitante',
          {},
          ProfilesErrorReason.ADMISSION_ASSIGNEE_INVALID,
        );
      }
      const now = new Date();
      if (status === 'ENVIADA') {
        this.admissionsRepo.setStatus(
          admission,
          'EN_REVISION',
          caller.user.id,
          now,
        );
      } else {
        touch(admission, caller.user.id, now);
      }
      admission.assignedToUserId = toUserId;
      this.appendEvent(tx, admission, 'REASSIGNED', {
        fromStatus: status,
        toStatus: 'EN_REVISION',
        actorUserId: caller.user.id,
        role,
        requestId: caller.requestId,
        reasonText: `Asignada a ${toUserId}`,
        now,
      });
      await this.checklist.materialize(tx, admission, {
        actorUserId: caller.user.id,
      });
      await tx.flush();
      return this.read.detailOf(tx, admission, now);
    });
  }

  /** Pide información al médico (EN_REVISION a INFORMACION_REQUERIDA). */
  async requestInfo(
    id: string,
    dto: RequestAdmissionInfoDto,
    caller: AdmissionCaller,
  ): Promise<AdmissionDetailDto> {
    const notices: PendingNotice[] = [];
    const detail = await this.em.transactional(async (tx) => {
      const role = this.roleFor(caller.user, 'REVIEWER');
      const admission = await this.loadLocked(tx, id);
      await this.assertNotOwnAdmission(tx, admission, caller.user);
      const status = admissionStatusCode(admission.statusConceptId);
      this.assertVersion(admission, dto.expectedRowVersion);
      this.assertTransition('REQUEST_INFO', status);
      this.assertAssignee(admission, caller.user);
      const reason = dto.reason?.trim();
      if (!NOT_BLANK(reason)) throw reasonRequired();

      const config = loadAdmissionsConfig();
      const now = new Date();
      const view = await this.checklist.materialize(tx, admission, {
        actorUserId: caller.user.id,
      });
      // Los ítems nombrados quedan INFO_REQUIRED, cada uno con su motivo.
      const wanted = new Set((dto.items ?? []).map((i) => `${i.type}:${i.id}`));
      for (const row of view.evaluation.rows) {
        for (const item of row.items) {
          if (
            !item.review ||
            !wanted.has(`${item.live.itemType}:${item.live.itemId}`)
          )
            continue;
          this.applyReview(item.review, 'INFO_REQUIRED', caller.user.id, now, {
            reason,
            reasonCode: dto.reasonCode ?? 'OTRO',
          });
          this.appendEvent(tx, admission, 'ITEM_INFO_REQUIRED', {
            actorUserId: caller.user.id,
            role,
            requestId: caller.requestId,
            requirementId: row.requirement.id,
            itemType: item.live.itemType,
            itemId: item.live.itemId,
            reasonCode: dto.reasonCode ?? 'OTRO',
            reasonText: reason,
            now,
          });
        }
      }
      this.admissionsRepo.setStatus(
        admission,
        'INFORMACION_REQUERIDA',
        caller.user.id,
        now,
      );
      admission.infoRequestedText = reason;
      admission.infoDueAt = new Date(
        now.getTime() + config.infoWindowDays * 86_400_000,
      );
      this.appendEvent(tx, admission, 'INFO_REQUESTED', {
        fromStatus: status,
        toStatus: 'INFORMACION_REQUERIDA',
        actorUserId: caller.user.id,
        role,
        requestId: caller.requestId,
        reasonCode: dto.reasonCode ?? 'OTRO',
        reasonText: reason,
        now,
      });
      await tx.flush();
      notices.push(
        this.notice('INFO_REQUIRED', admission, 'INFORMACION_REQUERIDA'),
      );
      return this.read.detailOf(tx, admission, now);
    });
    await this.emit(notices);
    return detail;
  }

  /**
   * Revisa un ítem del checklist: lo verifica, lo rechaza o pide información de ese ítem.
   *
   * `itemId` es el id de la revisión (el `id` del ítem del checklist). La
   * concurrencia se resuelve por ítem: `expectedRowVersion` es la del ítem, así
   * que dos revisores sobre ítems distintos no se estorban y sobre el mismo el
   * segundo recibe 409.
   */
  async reviewItem(
    admissionId: string,
    reviewId: string,
    dto: ReviewAdmissionItemDto,
    caller: AdmissionCaller,
  ): Promise<AdmissionDetailDto> {
    return this.em.transactional(async (tx) => {
      const role = this.roleFor(caller.user, 'REVIEWER');
      const review = await this.reviewsRepo.findByIdForUpdate(tx, reviewId);
      // Un ítem de OTRA admisión se trata como inexistente (BOLA).
      if (!review || review.admissionId !== admissionId) {
        throw new ResourceNotFoundException(
          'Ítem de la admisión no encontrado',
          {},
          ProfilesErrorReason.ADMISSION_ITEM_NOT_FOUND,
        );
      }
      const admission = await this.admissionsRepo.findById(tx, admissionId);
      if (!admission) {
        throw new ResourceNotFoundException(
          'Admisión no encontrada',
          {},
          ProfilesErrorReason.ADMISSION_NOT_FOUND,
        );
      }
      const status = admissionStatusCode(admission.statusConceptId);
      await this.assertNotOwnAdmission(tx, admission, caller.user);

      const live = (
        await this.evidence.collect(tx, admission.practitionerProfileId)
      ).items.find((i) => i.itemId === review.itemId);

      // Idempotencia: repetir la misma revisión no escribe ni duplica el evento.
      const recorded = reviewStateOf(review.statusConceptId);
      if (
        recorded === dto.decision &&
        this.sameReview(review, dto) &&
        live?.evidenceSha256 === review.evidenceSha256
      ) {
        return this.read.detailOf(tx, admission);
      }
      if (review.rowVersion !== dto.expectedRowVersion) {
        throw stale(review.rowVersion);
      }
      if (status !== 'EN_REVISION') {
        throw new PreconditionFailedException(
          'La admisión no está en revisión',
          { action: 'REVIEW_ITEM', status },
          ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
        );
      }
      this.assertAssignee(admission, caller.user);

      // TOCTOU: la huella que queda es la que el revisor tuvo delante
      // (`dto.evidenceSha256`), nunca la de «hoy». Si el médico cambió el dato o
      // el archivo entre que el revisor lo miró y decidió, no se verifica nada.
      const seen = dto.evidenceSha256;
      const evidenceMoved =
        dto.decision === 'VERIFIED'
          ? !live || seen !== live.evidenceSha256
          : seen !== undefined && seen !== live?.evidenceSha256;
      if (evidenceMoved) {
        throw new ConcurrencyConflictException(
          'La evidencia del ítem cambió desde que la revisó: vuelva a abrirla',
          { currentEvidenceSha256: live?.evidenceSha256 ?? null },
          ProfilesErrorReason.ADMISSION_EVIDENCE_CHANGED,
        );
      }

      const requirement = (
        await this.checklist.requirementsOf(
          tx,
          admission.admissionTypeConceptId,
        )
      ).find((r) => r.id === review.requirementId);
      const now = new Date();
      const input = this.sourceOf(dto, now);

      if (dto.decision === 'VERIFIED') {
        if ((requirement?.requiresSourceUri ?? true) && !input.hasSource) {
          throw new PreconditionFailedException(
            'Verificar este ítem exige declarar la fuente consultada',
            { requirementCode: requirement?.code },
            ProfilesErrorReason.ADMISSION_ITEM_REQUIRES_SOURCE,
          );
        }
      } else if (!NOT_BLANK(dto.reason)) {
        throw reasonRequired();
      }

      if (live) {
        review.fileId = live.fileId;
        review.evidenceSha256 = live.evidenceSha256;
      }
      this.applyReview(review, dto.decision, caller.user.id, now, {
        reason: dto.reason?.trim(),
        reasonCode:
          dto.reasonCode ?? (dto.decision === 'VERIFIED' ? undefined : 'OTRO'),
        internalNote: dto.internalNote?.trim(),
        source: input.source,
      });
      const eventCode: AdmissionEventCode =
        dto.decision === 'VERIFIED'
          ? 'ITEM_VERIFIED'
          : dto.decision === 'REJECTED'
            ? 'ITEM_REJECTED'
            : 'ITEM_INFO_REQUIRED';
      this.appendEvent(tx, admission, eventCode, {
        actorUserId: caller.user.id,
        role,
        requestId: caller.requestId,
        requirementId: review.requirementId,
        itemType: live?.itemType,
        itemId: review.itemId,
        verificationSourceUri:
          review.verificationSourceUri ?? review.sourceRef ?? undefined,
        reasonCode:
          dto.decision === 'VERIFIED' ? undefined : (dto.reasonCode ?? 'OTRO'),
        reasonText:
          dto.decision === 'VERIFIED' ? undefined : dto.reason?.trim(),
        now,
      });
      await tx.flush();
      return this.read.detailOf(tx, admission, now);
    });
  }

  // ═════════════════════════════════════════════════════ resolución ══

  /**
   * Resuelve la admisión: VERIFICADA o RECHAZADA.
   *
   * El servidor **deriva** el resultado de las revisiones por ítem; el comando
   * no recibe ítems. VERIFICADA exige el checklist completo: todos los
   * requisitos obligatorios aplicables verificados, ningún ítem pendiente.
   */
  async decide(
    id: string,
    dto: DecideAdmissionDto,
    caller: AdmissionCaller,
  ): Promise<AdmissionDetailDto> {
    if (dto.items !== undefined && dto.items.length > 0) {
      throw new PreconditionFailedException(
        'La resolución no recibe ítems: se revisan uno por uno en .../items/:itemId/review',
        {},
        ProfilesErrorReason.ADMISSION_DECISION_ITEMS_NOT_ACCEPTED,
      );
    }
    const notices: PendingNotice[] = [];
    const detail = await this.em.transactional(async (tx) => {
      const role = this.roleFor(caller.user, 'APPROVER');
      const admission = await this.loadLocked(tx, id);
      await this.assertNotOwnAdmission(tx, admission, caller.user);
      const status = admissionStatusCode(admission.statusConceptId);
      const action: AdmissionAction =
        dto.decision === 'VERIFIED' ? 'VERIFY' : 'REJECT';
      const target = targetStatus(action);

      // Idempotencia: la misma resolución sobre una admisión ya resuelta es un 200.
      if (status === target) return this.read.detailOf(tx, admission);

      this.assertVersion(admission, dto.expectedRowVersion);
      this.assertTransition(action, status);

      const config = loadAdmissionsConfig();
      const reviews = await this.reviewsRepo.findByAdmission(tx, admission.id);
      const waived = this.assertFourEyes(
        admission,
        reviews,
        caller.user,
        config.fourEyes,
      );

      const now = new Date();
      const view = await this.checklist.materialize(tx, admission, {
        actorUserId: caller.user.id,
      });
      const reason = dto.reason?.trim();
      let validUntilDate: string | undefined;

      if (dto.decision === 'VERIFIED') {
        if (!view.evaluation.canVerify) {
          throw new PreconditionFailedException(
            'El checklist no está completo: hay requisitos sin verificar o rechazados',
            { blockers: view.evaluation.blockers.map((b) => ({ ...b })) },
            ProfilesErrorReason.ADMISSION_CHECKLIST_INCOMPLETE,
          );
        }
        validUntilDate = await this.computeValidUntil(
          tx,
          view,
          now,
          config.defaultValidityMonths,
        );
      } else if (!NOT_BLANK(reason)) {
        throw reasonRequired();
      }

      // Proyección sobre las fichas: lo verificado queda verificado y lo rechazado, rechazado.
      for (const row of view.evaluation.rows) {
        for (const item of row.items) {
          const review = item.review;
          if (!review) continue;
          if (item.state === 'VERIFIED') {
            if (dto.decision === 'VERIFIED') {
              await this.checklist.applyEntityDecision(
                tx,
                item.live,
                'VERIFIED',
                {
                  actorUserId: caller.user.id,
                  at: review.reviewedAt ?? now,
                  sourceRef:
                    review.verificationSourceUri ??
                    review.sourceRef ??
                    undefined,
                },
              );
            }
          } else if (item.state === 'REJECTED') {
            await this.checklist.applyEntityDecision(
              tx,
              item.live,
              'REJECTED',
              {
                actorUserId: caller.user.id,
                at: review.reviewedAt ?? now,
                reasonText: review.reasonText ?? undefined,
              },
            );
          }
        }
      }

      this.admissionsRepo.setStatus(admission, target, caller.user.id, now);
      admission.decidedAt = now;
      admission.decidedByUserId = caller.user.id;
      admission.decisionReasonText = NOT_BLANK(reason) ? reason : NULL;
      admission.decisionReasonCodeConceptId = dto.reasonCode
        ? REASONS[dto.reasonCode].concept
        : NULL;
      admission.internalNote = NOT_BLANK(dto.internalNote)
        ? dto.internalNote.trim()
        : NULL;
      admission.fourEyesWaived = waived;
      admission.infoRequestedText = NULL;
      admission.infoDueAt = NULL;

      if (dto.decision === 'VERIFIED' && validUntilDate) {
        admission.validUntil = new Date(`${validUntilDate}T00:00:00.000Z`);
        await this.projector.projectVerified(
          tx,
          admission.practitionerProfileId,
          caller.user.id,
          admission.id,
          endOfDayLaPaz(validUntilDate),
        );
      } else {
        await this.projector.projectNotVerified(
          tx,
          admission.practitionerProfileId,
          caller.user.id,
        );
      }
      this.appendEvent(
        tx,
        admission,
        dto.decision === 'VERIFIED' ? 'VERIFIED' : 'REJECTED',
        {
          fromStatus: status,
          toStatus: target,
          actorUserId: caller.user.id,
          role,
          requestId: caller.requestId,
          reasonCode: dto.reasonCode,
          reasonText: NOT_BLANK(reason) ? reason : undefined,
          now,
        },
      );
      await tx.flush();
      notices.push(
        this.notice(
          dto.decision === 'VERIFIED' ? 'VERIFIED' : 'REJECTED',
          admission,
          target,
        ),
      );
      return this.read.detailOf(tx, admission, now);
    });
    await this.emit(notices);
    return detail;
  }

  /** Suspende una admisión verificada (VERIFICADA a SUSPENDIDA): baja el check. */
  async suspend(
    id: string,
    dto: SuspendAdmissionDto,
    caller: AdmissionCaller,
  ): Promise<AdmissionDetailDto> {
    const notices: PendingNotice[] = [];
    const detail = await this.em.transactional(async (tx) => {
      const role = this.roleFor(caller.user, 'APPROVER');
      const admission = await this.loadLocked(tx, id);
      await this.assertNotOwnAdmission(tx, admission, caller.user);
      const status = admissionStatusCode(admission.statusConceptId);
      if (status === 'SUSPENDIDA') return this.read.detailOf(tx, admission);
      this.assertVersion(admission, dto.expectedRowVersion);
      this.assertTransition('SUSPEND', status);
      const reason = dto.reason?.trim();
      if (!NOT_BLANK(reason)) throw reasonRequired();
      const now = new Date();
      this.admissionsRepo.setStatus(
        admission,
        'SUSPENDIDA',
        caller.user.id,
        now,
      );
      admission.decidedAt = now;
      admission.decidedByUserId = caller.user.id;
      admission.decisionReasonText = reason;
      admission.decisionReasonCodeConceptId = dto.reasonCode
        ? REASONS[dto.reasonCode].concept
        : NULL;
      admission.internalNote = NOT_BLANK(dto.internalNote)
        ? dto.internalNote.trim()
        : NULL;
      await this.projector.projectNotVerified(
        tx,
        admission.practitionerProfileId,
        caller.user.id,
      );
      this.appendEvent(tx, admission, 'SUSPENDED', {
        fromStatus: status,
        toStatus: 'SUSPENDIDA',
        actorUserId: caller.user.id,
        role,
        requestId: caller.requestId,
        reasonCode: dto.reasonCode,
        reasonText: reason,
        now,
      });
      await tx.flush();
      notices.push(this.notice('SUSPENDED', admission, 'SUSPENDIDA'));
      return this.read.detailOf(tx, admission, now);
    });
    await this.emit(notices);
    return detail;
  }

  /** Repone una admisión suspendida (SUSPENDIDA a VERIFICADA): devuelve el check. */
  async reinstate(
    id: string,
    dto: SuspendAdmissionDto,
    caller: AdmissionCaller,
  ): Promise<AdmissionDetailDto> {
    const notices: PendingNotice[] = [];
    const detail = await this.em.transactional(async (tx) => {
      const role = this.roleFor(caller.user, 'APPROVER');
      const admission = await this.loadLocked(tx, id);
      await this.assertNotOwnAdmission(tx, admission, caller.user);
      const status = admissionStatusCode(admission.statusConceptId);
      if (status === 'VERIFICADA') return this.read.detailOf(tx, admission);
      this.assertVersion(admission, dto.expectedRowVersion);
      this.assertTransition('REINSTATE', status);
      const reason = dto.reason?.trim();
      if (!NOT_BLANK(reason)) throw reasonRequired();
      const now = new Date();
      // Una verificación vencida no se repone: se renueva.
      if (
        !admission.validUntil ||
        endOfDayLaPaz(admission.validUntil).getTime() < now.getTime()
      ) {
        throw new PreconditionFailedException(
          'La verificación ya venció: el médico debe renovarla',
          {},
          ProfilesErrorReason.ADMISSION_VALIDITY_LAPSED,
        );
      }
      this.admissionsRepo.setStatus(
        admission,
        'VERIFICADA',
        caller.user.id,
        now,
      );
      admission.decidedAt = now;
      admission.decidedByUserId = caller.user.id;
      admission.decisionReasonText = reason;
      await this.projector.projectVerified(
        tx,
        admission.practitionerProfileId,
        caller.user.id,
        admission.id,
        endOfDayLaPaz(admission.validUntil),
      );
      this.appendEvent(tx, admission, 'REINSTATED', {
        fromStatus: status,
        toStatus: 'VERIFICADA',
        actorUserId: caller.user.id,
        role,
        requestId: caller.requestId,
        reasonText: reason,
        now,
      });
      await tx.flush();
      notices.push(this.notice('REINSTATED', admission, 'VERIFICADA'));
      return this.read.detailOf(tx, admission, now);
    });
    await this.emit(notices);
    return detail;
  }

  // ═════════════════════════════════════════════════════ barrido ══

  /**
   * Baja las verificaciones vencidas (VERIFICADA a EXPIRADA, y con ellas el
   * check) y cierra por abandono las solicitudes cuyo solicitante no respondió
   * en su plazo (INFORMACION_REQUERIDA a ABANDONADA). Idempotente: una segunda
   * corrida no encuentra nada.
   */
  async expireSweep(
    caller: AdmissionCaller,
    limit = 200,
  ): Promise<AdmissionSweepResultDto> {
    const role = caller.user.roles.includes('SYSTEM')
      ? 'SYSTEM'
      : 'SECURITY_ADMIN';
    const now = new Date();
    const notices: PendingNotice[] = [];
    const expiredIds = (
      await this.admissionsRepo.findExpired(this.em.fork(), now, limit)
    ).map((a) => a.id);
    const abandonedIds = (
      await this.admissionsRepo.findAbandoned(this.em.fork(), now, limit)
    ).map((a) => a.id);

    let expired = 0;
    for (const id of expiredIds) {
      await this.em.transactional(async (tx) => {
        const admission = await this.admissionsRepo.findByIdForUpdate(tx, id);
        if (!admission) return;
        const status = admissionStatusCode(admission.statusConceptId);
        if (!canTransition('EXPIRE', status)) return;
        this.admissionsRepo.setStatus(
          admission,
          'EXPIRADA',
          caller.user.id,
          now,
        );
        await this.projector.projectNotVerified(
          tx,
          admission.practitionerProfileId,
          caller.user.id,
          'EXPIRED',
        );
        this.appendEvent(tx, admission, 'EXPIRED', {
          fromStatus: status,
          toStatus: 'EXPIRADA',
          actorUserId: caller.user.id,
          role,
          requestId: caller.requestId,
          reasonText: 'La vigencia de la verificación venció',
          now,
        });
        await tx.flush();
        notices.push(this.notice('EXPIRED', admission, 'EXPIRADA'));
        expired += 1;
      });
    }
    let abandoned = 0;
    for (const id of abandonedIds) {
      await this.em.transactional(async (tx) => {
        const admission = await this.admissionsRepo.findByIdForUpdate(tx, id);
        if (!admission) return;
        const status = admissionStatusCode(admission.statusConceptId);
        if (!canTransition('ABANDON', status)) return;
        this.admissionsRepo.setStatus(
          admission,
          'ABANDONADA',
          caller.user.id,
          now,
        );
        this.appendEvent(tx, admission, 'ABANDONED', {
          fromStatus: status,
          toStatus: 'ABANDONADA',
          actorUserId: caller.user.id,
          role,
          requestId: caller.requestId,
          reasonText: 'El solicitante no respondió dentro de su plazo',
          now,
        });
        await tx.flush();
        notices.push(this.notice('ABANDONED', admission, 'ABANDONADA'));
        abandoned += 1;
      });
    }
    if (expired + abandoned > 0) {
      this.logger.info(
        { operation: 'profiles.admission.expire-sweep', expired, abandoned },
        'Admissions sweep done',
      );
    }
    await this.emit(notices);
    return { expired, abandoned };
  }

  // ═══════════════════════════════════════════════════ el médico ══

  /** El médico reenvía su solicitud (INFORMACION_REQUERIDA/RECHAZADA/EXPIRADA/ABANDONADA a ENVIADA). */
  async resubmit(
    actor: AuthenticatedUser,
    requestId?: string,
    attestation?: AdmissionAttestation,
  ): Promise<OwnAdmissionDto> {
    const notices: PendingNotice[] = [];
    const dto = await this.em.transactional(async (tx) => {
      const admission = await this.ownLocked(tx, actor);
      const status = admissionStatusCode(admission.statusConceptId);
      this.assertTransition('RESUBMIT', status);
      const config = loadAdmissionsConfig();
      if (admission.resubmissionCount >= config.maxResubmissions) {
        throw new PreconditionFailedException(
          'Llegó al tope de reenvíos de la solicitud',
          { maxResubmissions: config.maxResubmissions },
          ProfilesErrorReason.ADMISSION_RESUBMISSION_LIMIT,
        );
      }
      const now = new Date();
      const reset: ResetMode = status === 'EXPIRADA' ? 'ALL' : 'CHANGED';
      const view = await this.checklist.materialize(tx, admission, {
        reset,
        actorUserId: actor.id,
      });
      const snapshot = await this.evidence.buildSnapshot(
        tx,
        admission.practitionerProfileId,
        now,
        view.live.professionGroup,
      );
      this.admissionsRepo.setStatus(admission, 'ENVIADA', actor.id, now);
      admission.submittedAt = now;
      admission.dueAt = addBusinessDays(now, config.slaBusinessDays);
      admission.resubmissionCount += 1;
      admission.assignedToUserId = NULL;
      admission.infoRequestedText = NULL;
      admission.infoDueAt = NULL;
      admission.decisionReasonText = NULL;
      admission.decisionReasonCodeConceptId = NULL;
      admission.submittedSnapshot = snapshot as unknown as Record<
        string,
        unknown
      >;
      if (attestation) {
        admission.attestedAt = attestation.acceptedAt;
        admission.attestationTextVersion = attestation.textVersion;
      }
      this.appendEvent(tx, admission, 'RESUBMITTED', {
        fromStatus: status,
        toStatus: 'ENVIADA',
        actorUserId: actor.id,
        role: 'PRACTITIONER',
        requestId,
        now,
      });
      await tx.flush();
      notices.push(this.notice('RECEIVED', admission, 'ENVIADA'));
      return this.read.ownOf(tx, admission);
    });
    await this.emit(notices);
    return dto;
  }

  /** El médico retira su solicitud (ENVIADA/INFORMACION_REQUERIDA a RETIRADA). */
  async withdraw(
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<OwnAdmissionDto> {
    const notices: PendingNotice[] = [];
    const dto = await this.em.transactional(async (tx) => {
      const admission = await this.ownLocked(tx, actor);
      const status = admissionStatusCode(admission.statusConceptId);
      if (status === 'RETIRADA') return this.read.ownOf(tx, admission);
      this.assertTransition('WITHDRAW', status);
      const now = new Date();
      this.admissionsRepo.setStatus(admission, 'RETIRADA', actor.id, now);
      admission.closedAt = now;
      admission.assignedToUserId = NULL;
      this.appendEvent(tx, admission, 'WITHDRAWN', {
        fromStatus: status,
        toStatus: 'RETIRADA',
        actorUserId: actor.id,
        role: 'PRACTITIONER',
        requestId,
        now,
      });
      await tx.flush();
      notices.push(this.notice('WITHDRAWN', admission, 'RETIRADA'));
      return this.read.ownOf(tx, admission);
    });
    await this.emit(notices);
    return dto;
  }

  // ═══════════════════════ ganchos de los caminos heredados (CV-20, M27) ══

  /**
   * CV-20: registra en la admisión abierta la verificación de un título hecha
   * por el endpoint heredado, **sin tocar el perfil**. Si el médico no tiene
   * admisión abierta pero está pendiente, la abre; si ya está verificado o no
   * hay requisito que aplique, no registra nada (el título se actualiza solo).
   *
   * @returns `true` si quedó registrada en una admisión.
   */
  async recordCredentialReview(
    tx: EntityManager,
    input: {
      credentialId: string;
      practitionerProfileId: string;
      decision: 'VERIFIED' | 'REJECTED';
      verificationSourceUri?: string;
      reason?: string;
      actor: AuthenticatedUser;
    },
  ): Promise<boolean> {
    const now = new Date();
    const source = input.verificationSourceUri?.trim();
    // Nadie verifica ni rechaza su propio título, ni siquiera fuera de una admisión.
    await this.assertNotOwnAdmission(
      tx,
      { practitionerProfileId: input.practitionerProfileId },
      input.actor,
    );
    return this.recordItemOutcome(tx, {
      gate: input.actor,
      itemId: input.credentialId,
      practitionerProfileId: input.practitionerProfileId,
      state: input.decision,
      actorUserId: input.actor.id,
      role: input.actor.roles.includes('SECURITY_ADMIN')
        ? 'SECURITY_ADMIN'
        : 'SYSTEM',
      sourceType: 'OTRO',
      sourceRef: source,
      verificationSourceUri: source,
      reason: input.reason?.trim(),
      now,
    });
  }

  /**
   * M27: la autoridad externa verificó una matrícula. Queda como revisión del
   * ítem, con tipo de fuente y el caso como referencia; **no** verifica el
   * perfil ni concede el check: el cierre es de la admisión.
   */
  async recordExternalLicenseVerification(
    tx: EntityManager,
    input: {
      authorizationId: string;
      practitionerProfileId: string;
      identityCaseId: string;
      actorUserId: string;
    },
  ): Promise<boolean> {
    return this.recordItemOutcome(tx, {
      itemId: input.authorizationId,
      practitionerProfileId: input.practitionerProfileId,
      state: 'VERIFIED',
      actorUserId: input.actorUserId,
      role: 'SYSTEM',
      sourceType: 'REGISTRO_MINSALUD',
      sourceRef: `identity_verification_case:${input.identityCaseId}`,
      now: new Date(),
    });
  }

  private async recordItemOutcome(
    tx: EntityManager,
    input: {
      /**
       * Revisión hecha por una PERSONA (CV-20): pasa por las mismas puertas que
       * `reviewItem` —rol, no ser el propio profesional, admisión EN_REVISION y
       * ser quien la tomó—. Sin `gate` es una autoridad externa (M27).
       */
      gate?: AuthenticatedUser;
      itemId: string;
      practitionerProfileId: string;
      state: 'VERIFIED' | 'REJECTED';
      actorUserId: string;
      role: string;
      sourceType: SourceTypeCode;
      sourceRef?: string;
      verificationSourceUri?: string;
      reason?: string;
      now: Date;
    },
  ): Promise<boolean> {
    let admission = await this.admissionsRepo.findOpenByPractitionerForUpdate(
      tx,
      input.practitionerProfileId,
      ONBOARDING_TYPE.concept,
    );
    if (!admission) {
      const profile = await tx.findOne(HealthPractitionerProfiles, {
        profileId: input.practitionerProfileId,
      });
      if (profile?.verificationStatusConceptId !== PROF.PRACT_VERIF_PENDING)
        return false;
      admission = await this.openForRegistration(tx, {
        practitionerProfileId: input.practitionerProfileId,
        actorUserId: input.actorUserId,
      });
    }
    const status = admissionStatusCode(admission.statusConceptId);
    if (status !== 'ENVIADA' && status !== 'EN_REVISION') return false;
    let role = input.role;
    if (input.gate) {
      role = this.roleFor(input.gate, 'REVIEWER');
      await this.assertNotOwnAdmission(tx, admission, input.gate);
      // VERIFIED no entra por acá: el revisor tiene que ver la evidencia (huella)
      // que verifica, y eso sólo lo garantiza `reviewItem`. El camino heredado
      // queda para rechazar.
      if (input.state === 'VERIFIED') {
        throw new PreconditionFailedException(
          'Un título de una admisión abierta se verifica desde la revisión de la admisión ' +
            '(POST /admissions/:id/items/:itemId/review), con la huella de lo que se vio',
          { admissionId: admission.id },
          ProfilesErrorReason.ADMISSION_VERIFY_VIA_REVIEW,
        );
      }
      if (status !== 'EN_REVISION') {
        throw new PreconditionFailedException(
          'La admisión no está en revisión: tómela antes de verificar sus títulos',
          { action: 'REVIEW_ITEM', status },
          ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
        );
      }
      this.assertAssignee(admission, input.gate);
    }
    const view = await this.checklist.materialize(tx, admission, {
      actorUserId: input.actorUserId,
    });
    for (const row of view.evaluation.rows) {
      for (const item of row.items) {
        if (item.live.itemId !== input.itemId || !item.review) continue;
        // La huella que queda es la que el revisor tiene delante en este instante.
        item.review.evidenceSha256 = item.live.evidenceSha256;
        item.review.fileId = item.live.fileId;
        this.applyReview(
          item.review,
          input.state,
          input.actorUserId,
          input.now,
          {
            reason: input.reason,
            reasonCode: input.state === 'REJECTED' ? 'OTRO' : undefined,
            source: {
              sourceType: input.sourceType,
              sourceRef: input.sourceRef,
              verificationSourceUri: input.verificationSourceUri,
              sourceConsultedAt: input.now,
            },
          },
        );
        this.appendEvent(
          tx,
          admission,
          input.state === 'VERIFIED' ? 'ITEM_VERIFIED' : 'ITEM_REJECTED',
          {
            actorUserId: input.actorUserId,
            role,
            requirementId: row.requirement.id,
            itemType: item.live.itemType,
            itemId: item.live.itemId,
            verificationSourceUri:
              input.verificationSourceUri ?? input.sourceRef,
            reasonCode: input.state === 'REJECTED' ? 'OTRO' : undefined,
            reasonText: input.reason,
            now: input.now,
          },
        );
        await tx.flush();
        return true;
      }
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════ privados ══

  /** Carga la admisión con la fila bloqueada o responde 404. */
  private async loadLocked(
    tx: EntityManager,
    id: string,
  ): Promise<PractitionerAdmissions> {
    const admission = await this.admissionsRepo.findByIdForUpdate(tx, id);
    if (!admission) {
      throw new ResourceNotFoundException(
        'Admisión no encontrada',
        {},
        ProfilesErrorReason.ADMISSION_NOT_FOUND,
      );
    }
    return admission;
  }

  /** La admisión del médico de la SESIÓN, con la fila bloqueada (404 si no tiene). */
  private async ownLocked(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<PractitionerAdmissions> {
    const current = await this.read.currentOf(tx, actor);
    if (!current) {
      throw new ResourceNotFoundException(
        'No tiene una solicitud de verificación',
        {},
        ProfilesErrorReason.ADMISSION_NOT_FOUND,
      );
    }
    return this.loadLocked(tx, current.id);
  }

  private assertVersion(
    admission: PractitionerAdmissions,
    expected: number,
  ): void {
    if (admission.rowVersion !== expected) throw stale(admission.rowVersion);
  }

  private assertTransition(
    action: AdmissionAction,
    from: AdmissionStatusCode,
  ): void {
    if (!canTransition(action, from)) {
      throw new PreconditionFailedException(
        `La acción no es válida desde el estado ${from}`,
        { action, status: from },
        ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
      );
    }
  }

  private assertAssignee(
    admission: PractitionerAdmissions,
    user: AuthenticatedUser,
  ): void {
    if (admission.assignedToUserId !== user.id) {
      throw new InsufficientRoleException(
        'Sólo quien tomó la revisión puede actuar sobre sus ítems',
        {},
        ProfilesErrorReason.ADMISSION_NOT_ASSIGNED_TO_ACTOR,
      );
    }
  }

  /** Nadie revisa ni aprueba su propia admisión (un administrador que además es médico). */
  private assertNotOwnAdmission(
    tx: EntityManager,
    admission: Pick<PractitionerAdmissions, 'practitionerProfileId'>,
    user: AuthenticatedUser,
  ): Promise<void> {
    return assertNotSelfAccess(this.accountLinksRepo, tx, admission, user);
  }

  /**
   * Cuatro ojos: quien resuelve no es quien tomó la revisión ni quien revisó un
   * ítem. Encendido, bloquea (403); apagado, deja pasar y devuelve `true` para
   * marcar la resolución como `four_eyes_waived` cuando de verdad coincidió.
   */
  private assertFourEyes(
    admission: PractitionerAdmissions,
    reviews: readonly PractitionerAdmissionReviews[],
    user: AuthenticatedUser,
    enforced: boolean,
  ): boolean {
    const reviewers = new Set<string>();
    if (admission.assignedToUserId) reviewers.add(admission.assignedToUserId);
    for (const review of reviews) {
      if (review.reviewedByUserId) reviewers.add(review.reviewedByUserId);
    }
    if (!reviewers.has(user.id)) return false;
    if (enforced) {
      throw new InsufficientRoleException(
        'Cuatro ojos: la resolución debe hacerla una persona distinta de quien revisó',
        {},
        ProfilesErrorReason.ADMISSION_FOUR_EYES_REQUIRED,
      );
    }
    return true;
  }

  /**
   * El rol con el que actúa quien llama, o 403.
   *
   * `SUPERADMIN` es el comodín de plataforma (lo es también para `RolesGuard`).
   * `SECURITY_ADMIN` hereda ambos niveles sólo si `ADMISSIONS_SECURITY_ADMIN_INHERITS`
   * (por defecto no en producción): allí los roles `ADMISSIONS_*` se asignan
   * explícitamente.
   */
  private roleFor(
    user: AuthenticatedUser,
    level: 'REVIEWER' | 'APPROVER',
  ): string {
    const roles = user.roles;
    if (roles.includes('SUPERADMIN')) return 'SUPERADMIN';
    const explicit =
      level === 'REVIEWER' ? 'ADMISSIONS_REVIEWER' : 'ADMISSIONS_APPROVER';
    if (roles.includes(explicit)) return explicit;
    if (
      roles.includes('SECURITY_ADMIN') &&
      loadAdmissionsConfig().securityAdminInherits
    ) {
      return 'SECURITY_ADMIN';
    }
    throw new InsufficientRoleException(
      'Su rol no alcanza para esta acción de admisiones',
      { required: explicit },
      ProfilesErrorReason.ADMISSION_ROLE_REQUIRED,
    );
  }

  private sameReview(
    review: PractitionerAdmissionReviews,
    dto: ReviewAdmissionItemDto,
  ): boolean {
    if (dto.decision === 'VERIFIED') return true;
    return (review.reasonText ?? '') === (dto.reason?.trim() ?? '');
  }

  /**
   * La fuente de una verificación, a partir de lo que mandó el revisor. Basta el
   * tipo de fuente o (compatibilidad) la URL consultada.
   */
  private sourceOf(
    dto: SourceInput,
    now: Date,
  ): { hasSource: boolean; source: AppliedSource } {
    const uri = dto.verificationSourceUri?.trim();
    const ref = dto.sourceRef?.trim();
    const hasSource = dto.sourceType !== undefined || NOT_BLANK(uri);
    let consulted = now;
    if (dto.sourceConsultedAt) {
      const parsed = new Date(dto.sourceConsultedAt);
      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getTime() > now.getTime() + 5 * 60_000
      ) {
        throw new PreconditionFailedException(
          'La fecha de consulta de la fuente no puede ser futura',
          {},
          ProfilesErrorReason.ADMISSION_ITEM_REQUIRES_SOURCE,
        );
      }
      consulted = parsed;
    }
    return {
      hasSource,
      source: {
        sourceType: dto.sourceType ?? (NOT_BLANK(uri) ? 'OTRO' : undefined),
        sourceRef: NOT_BLANK(ref) ? ref : NOT_BLANK(uri) ? uri : undefined,
        verificationSourceUri: NOT_BLANK(uri) ? uri : undefined,
        sourceConsultedAt: consulted,
      },
    };
  }

  /** Aplica el resultado de una revisión sobre su fila. */
  private applyReview(
    review: PractitionerAdmissionReviews,
    state: 'VERIFIED' | 'REJECTED' | 'INFO_REQUIRED',
    actorUserId: string,
    now: Date,
    detail: {
      reason?: string;
      reasonCode?: ReasonCode;
      internalNote?: string;
      source?: AppliedSource;
    },
  ): void {
    review.statusConceptId = REVIEW_STATE_CONCEPT[state];
    review.reviewedByUserId = actorUserId;
    review.reviewedAt = now;
    review.reasonText = NOT_BLANK(detail.reason) ? detail.reason : NULL;
    review.reasonCodeConceptId = detail.reasonCode
      ? REASONS[detail.reasonCode].concept
      : NULL;
    review.internalNote = NOT_BLANK(detail.internalNote)
      ? detail.internalNote
      : NULL;
    if (state === 'VERIFIED' && detail.source) {
      review.sourceTypeConceptId = detail.source.sourceType
        ? SOURCE_TYPES[detail.source.sourceType].concept
        : NULL;
      review.sourceRef = detail.source.sourceRef ?? NULL;
      review.verificationSourceUri =
        detail.source.verificationSourceUri ?? NULL;
      review.sourceConsultedAt = detail.source.sourceConsultedAt;
    } else if (state !== 'VERIFIED') {
      review.sourceTypeConceptId = NULL;
      review.sourceRef = NULL;
      review.verificationSourceUri = NULL;
      review.sourceConsultedAt = NULL;
    }
    touch(review, actorUserId, now);
  }

  /**
   * Hasta cuándo vale la verificación: el vencimiento más próximo entre las
   * matrículas verificadas que lo declaran o, si ninguna, hoy + la vigencia por
   * defecto. Fecha de calendario en America/La_Paz. Una matrícula ya vencida
   * impide verificar.
   */
  private async computeValidUntil(
    tx: EntityManager,
    view: ChecklistView,
    now: Date,
    defaultMonths: number,
  ): Promise<string> {
    const today = todayLaPaz(now);
    const licenseIds = view.evaluation.rows
      .flatMap((r) => r.items)
      .filter((i) => i.state === 'VERIFIED' && i.live.itemType === 'LICENSE')
      .map((i) => i.live.itemId);
    const licenses = licenseIds.length
      ? await tx.find(JurisdictionAuthorizations, { id: { $in: licenseIds } })
      : [];
    const dates = licenses
      .map((l) => (l.validTo ? toDateOnly(l.validTo) : undefined))
      .filter((d): d is string => d !== undefined);
    if (dates.some((d) => d < today)) {
      throw new PreconditionFailedException(
        'Una matrícula verificada ya venció: no se puede verificar con ella',
        {},
        ProfilesErrorReason.ADMISSION_VALIDITY_LAPSED,
      );
    }
    if (dates.length > 0) return [...dates].sort()[0];
    return toDateOnly(
      addMonthsUtc(new Date(`${today}T00:00:00.000Z`), defaultMonths),
    );
  }

  private appendEvent(
    tx: EntityManager,
    admission: PractitionerAdmissions,
    code: AdmissionEventCode,
    data: {
      fromStatus?: AdmissionStatusCode;
      toStatus?: AdmissionStatusCode;
      actorUserId?: string;
      role?: string;
      requestId?: string;
      requirementId?: string;
      itemType?: keyof typeof ADMISSION_ITEM_CONCEPT;
      itemId?: string;
      verificationSourceUri?: string;
      reasonCode?: ReasonCode;
      reasonText?: string;
      now: Date;
    },
  ): void {
    this.eventsRepo.append(tx, {
      admissionId: admission.id,
      eventTypeConceptId: EVENT_TYPES[code],
      fromStatusConceptId: data.fromStatus
        ? ADMISSION_STATUS_CONCEPT[data.fromStatus]
        : undefined,
      toStatusConceptId: data.toStatus
        ? ADMISSION_STATUS_CONCEPT[data.toStatus]
        : undefined,
      itemTypeConceptId: data.itemType
        ? ADMISSION_ITEM_CONCEPT[data.itemType]
        : undefined,
      itemId: data.itemId,
      requirementId: data.requirementId,
      verificationSourceUri: data.verificationSourceUri,
      reasonCodeConceptId: data.reasonCode
        ? REASONS[data.reasonCode].concept
        : undefined,
      reasonText: data.reasonText,
      actorUserId: data.actorUserId,
      actorRoleCode: data.role,
      requestId:
        data.requestId && UUID_RE.test(data.requestId)
          ? data.requestId
          : undefined,
      occurredAt: data.now,
    });
  }

  private notice(
    kind: AdmissionNoticeKind,
    admission: PractitionerAdmissions,
    status: AdmissionStatusCode,
  ): PendingNotice {
    return {
      kind,
      admissionId: admission.id,
      statusCode: status,
      practitionerProfileId: admission.practitionerProfileId,
    };
  }

  /** Emite los avisos ya confirmada la transacción. Nunca rompe la operación. */
  private async emit(notices: readonly PendingNotice[]): Promise<void> {
    for (const notice of notices) {
      try {
        await this.notices.emit(notice);
      } catch (error) {
        this.logger.warn(
          {
            operation: 'profiles.admission.notice',
            kind: notice.kind,
            err: error,
          },
          'Admission notice failed; the decision stands',
        );
      }
    }
  }
}

/** Fuente ya normalizada, lista para guardarse en la revisión. */
interface AppliedSource {
  sourceType?: SourceTypeCode;
  sourceRef?: string;
  verificationSourceUri?: string;
  sourceConsultedAt: Date;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reasonRequired(): PreconditionFailedException {
  return new PreconditionFailedException(
    'Esta acción exige un motivo',
    {},
    ProfilesErrorReason.ADMISSION_REASON_REQUIRED,
  );
}

function stale(currentRowVersion: number): ConcurrencyConflictException {
  return new ConcurrencyConflictException(
    'Otra persona modificó esta admisión: recargue para ver los cambios',
    { currentRowVersion },
    ProfilesErrorReason.ADMISSION_STALE,
  );
}
