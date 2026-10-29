import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../../common';
import { assertNotSelfAccess } from './admission-self-access';
import { badRequestWithReason } from '../../../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../../../common/errors/system-error-reasons';
import {
  HealthPractitionerProfiles,
  JurisdictionAuthorizations,
  PractitionerAdmissions,
  PractitionerAdmissionEvents,
  PractitionerSpecialties,
  ProfessionalCredentials,
  Persons,
} from '../../entities';
import type { PractitionerAdmissionReviews } from '../../entities';
import { PROF } from '../../profiles.concepts';
import {
  ADMISSION_FOREIGN_READS_PORT,
  type AdmissionForeignReadsPort,
} from '../ports/admission-foreign-reads.port';
import { ProfilesErrorReason } from '../../profiles.error-reasons';
import {
  PersonAccountLinksRepository,
  PractitionerAdmissionEventsRepository,
  PractitionerAdmissionReviewsRepository,
  PractitionerAdmissionsRepository,
  reviewStateOf,
  type AdmissionListFilters,
} from '../../infrastructure/repositories';
import {
  applicableRequirements,
  evaluateChecklist,
} from '../../domain/admissions/admission-checklist';
import { ADMISSION_ITEM_CONCEPT } from '../../domain/admissions/admission-requirements.catalog';
import {
  ADMISSION_STATUS_CODES,
  ADMISSION_STATUS_CONCEPT,
  ADMISSION_STATUS_LABEL,
  admissionStatusCode,
  visibleVerification,
  type AdmissionStatusCode,
  type PractitionerVerificationView,
} from '../../domain/admissions/admission-status';
import {
  applicantVisibleReason,
  eventCodeOf,
  reasonCodeOf,
  sourceTypeOf,
} from '../../domain/admissions/admission-vocabulary';
import { resolveProfessionGroup } from '../../domain/admissions/admission-requirements.catalog';
import { toDateOnly } from '../../domain/admissions/business-days';
import { loadAdmissionsConfig } from '../../domain/admissions/admissions.config';
import type {
  AdmissionActorDto,
  AdmissionChecklistItemDto,
  AdmissionChecklistRequirementDto,
  AdmissionCodeLabelDto,
  AdmissionCredentialDto,
  AdmissionDetailDto,
  AdmissionDocumentDto,
  AdmissionEventDto,
  AdmissionItemsSummaryDto,
  AdmissionLicenseDto,
  AdmissionListDto,
  AdmissionPractitionerDetailDto,
  AdmissionRequirementsSummaryDto,
  AdmissionSpecialtyDto,
  AdmissionSummaryDto,
  ListAdmissionsQueryDto,
  OwnAdmissionDto,
} from '../../presentation/dto/admissions.dto';
import {
  PractitionerAdmissionChecklistService,
  type ChecklistView,
} from './practitioner-admission-checklist.service';
import {
  PractitionerAdmissionEvidenceService,
  type SubmittedForm,
} from './practitioner-admission-evidence.service';

/** Tipo de admisión que existe hoy. */
export const ONBOARDING_TYPE = {
  code: 'ALTA_DE_DOCTOR',
  label: 'Alta de doctor',
  concept: PROF.ADMISSION_TYPE_PRACTITIONER_ONBOARDING,
} as const;

/** Estados en los que el plazo de la plataforma sigue corriendo. */
const SLA_RUNNING: readonly AdmissionStatusCode[] = ['ENVIADA', 'EN_REVISION'];

/** Enmascara una cédula: deja sólo los últimos tres caracteres. */
export function maskNationalId(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 3) return '***';
  return `${'*'.repeat(Math.min(6, trimmed.length - 3))}${trimmed.slice(-3)}`;
}

interface PractitionerBasics {
  fullName: string;
  profession: string | null;
  nationalId: string | null;
}

/**
 * Lecturas de las admisiones: bandeja, detalle y vista del propio médico.
 *
 * Sólo lee. Lo que mueve estados vive en `PractitionerAdmissionsService`.
 */
@Injectable()
export class PractitionerAdmissionsReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly admissionsRepo: PractitionerAdmissionsRepository,
    private readonly eventsRepo: PractitionerAdmissionEventsRepository,
    private readonly reviewsRepo: PractitionerAdmissionReviewsRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly checklist: PractitionerAdmissionChecklistService,
    private readonly evidence: PractitionerAdmissionEvidenceService,
    @Inject(ADMISSION_FOREIGN_READS_PORT)
    private readonly foreign: AdmissionForeignReadsPort,
  ) {}

  // ───────────────────────────────────────────────────────────── bandeja ──

  /** Una página de la bandeja, con conteos por estado. */
  async list(
    query: ListAdmissionsQueryDto,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<AdmissionListDto> {
    const em = this.em.fork();
    const limit = query.limit ?? 25;
    // Nadie ve su propia admisión en la bandeja ni en los conteos.
    const ownPersonIds = await this.accountLinksRepo.findActivePersonIdsByUser(
      em,
      actor.id,
    );
    const q = query.q?.trim();
    if (q !== undefined && q !== '' && q.length < 2) {
      throw badRequestWithReason(
        'La búsqueda necesita al menos 2 caracteres',
        SystemErrorReason.MALFORMED_VALUE,
        { parameter: 'q' },
      );
    }
    const filters: AdmissionListFilters = {
      typeConceptId: ONBOARDING_TYPE.concept,
      statusConceptId: query.status
        ? ADMISSION_STATUS_CONCEPT[query.status]
        : undefined,
      ...this.assignmentFilter(query.assignedTo, actor),
      overdue: query.overdue === true ? true : undefined,
      excludePractitionerProfileIds:
        ownPersonIds.length > 0 ? ownPersonIds : undefined,
      q: q ? q : undefined,
      now,
    };
    let after: { dueAtIso: string; id: string } | undefined;
    if (query.cursor) {
      const key = decodeKeysetCursor(query.cursor);
      if (typeof key.d !== 'string' || typeof key.i !== 'string') {
        throw badRequestWithReason(
          'El cursor de paginación no es válido',
          SystemErrorReason.INVALID_CURSOR,
          { parameter: 'cursor' },
        );
      }
      after = { dueAtIso: key.d, id: key.i };
    }

    const rows = await this.admissionsRepo.listPage(
      em,
      filters,
      after,
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    const [counts, summaries] = await Promise.all([
      // Los conteos son las pestañas: se calculan con todos los filtros MENOS el estado.
      this.admissionsRepo.countByStatus(em, {
        ...filters,
        statusConceptId: undefined,
      }),
      this.summaries(em, page, now),
    ]);
    const countsByCode: Record<string, number> = {};
    for (const code of ADMISSION_STATUS_CODES) {
      countsByCode[code] = counts.get(ADMISSION_STATUS_CONCEPT[code]) ?? 0;
    }
    return {
      items: summaries,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ d: last.dueAtIso, i: last.id })
          : null,
      counts: countsByCode,
    };
  }

  private assignmentFilter(
    assignedTo: string | undefined,
    actor: AuthenticatedUser,
  ): { assignedToUserId?: string; unassigned?: boolean } {
    if (!assignedTo) return {};
    if (assignedTo === 'me') return { assignedToUserId: actor.id };
    if (assignedTo === 'none') return { unassigned: true };
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        assignedTo,
      )
    ) {
      throw badRequestWithReason(
        'assignedTo debe ser un uuid, `me` o `none`',
        SystemErrorReason.MALFORMED_VALUE,
        { parameter: 'assignedTo' },
      );
    }
    return { assignedToUserId: assignedTo };
  }

  /** Arma las filas de la bandeja con avance del checklist, en pocas consultas. */
  private async summaries(
    em: EntityManager,
    rows: Awaited<ReturnType<PractitionerAdmissionsRepository['listPage']>>,
    now: Date,
  ): Promise<AdmissionSummaryDto[]> {
    if (rows.length === 0) return [];
    const admissionIds = rows.map((r) => r.id);
    const [reviews, requirements, assignees] = await Promise.all([
      this.reviewsRepo.findByAdmissions(em, admissionIds),
      this.checklist.requirementsOf(em, ONBOARDING_TYPE.concept),
      this.userNames(
        em,
        rows.map((r) => r.assignedToUserId),
      ),
    ]);
    const reqById = new Map(requirements.map((r) => [r.id, r]));
    const reviewsByAdmission = new Map<
      string,
      PractitionerAdmissionReviews[]
    >();
    for (const review of reviews) {
      const list = reviewsByAdmission.get(review.admissionId) ?? [];
      list.push(review);
      reviewsByAdmission.set(review.admissionId, list);
    }
    const groups = await this.professionGroups(
      em,
      rows.map((r) => r.practitionerProfileId),
    );

    const result: AdmissionSummaryDto[] = [];
    for (const row of rows) {
      const own = reviewsByAdmission.get(row.id);
      let requirementsSummary: AdmissionRequirementsSummaryDto;
      let itemsSummary: AdmissionItemsSummaryDto;
      if (own && own.length > 0) {
        const group = groups.get(row.practitionerProfileId) ?? 'MEDICO';
        const applicable = applicableRequirements(requirements, group);
        const evaluation = evaluateChecklist(
          applicable.map((requirement) => ({
            requirement,
            items: own
              .filter((r) => r.requirementId === requirement.id)
              .map((r) => ({ state: reviewStateOf(r.statusConceptId) })),
          })),
        );
        requirementsSummary = { ...evaluation.summary };
        itemsSummary = countItems(
          own.map((r) => reqById.get(r.requirementId)?.itemType),
        );
      } else {
        // Sin revisiones materializadas (admisión del backfill): se calcula en vivo.
        const live = await this.liveSummary(
          em,
          row.id,
          row.practitionerProfileId,
        );
        requirementsSummary = live.requirementsSummary;
        itemsSummary = live.itemsSummary;
      }
      const statusCode = admissionStatusCode(row.statusConceptId);
      result.push({
        id: row.id,
        type: { code: ONBOARDING_TYPE.code, label: ONBOARDING_TYPE.label },
        status: statusView(statusCode),
        practitioner: {
          id: row.practitionerProfileId,
          fullName: row.fullName ?? row.professionalTitle ?? 'Sin nombre',
          profession: row.professionName ?? row.professionalTitle ?? null,
          maskedNationalId: maskNationalId(row.nationalId),
        },
        itemsSummary,
        requirementsSummary,
        submittedAt: row.submittedAt.toISOString(),
        dueAt: row.dueAt.toISOString(),
        overdue:
          SLA_RUNNING.includes(statusCode) &&
          row.dueAt.getTime() < now.getTime(),
        assignedTo: row.assignedToUserId
          ? {
              id: row.assignedToUserId,
              name: assignees.get(row.assignedToUserId) ?? 'Revisor',
            }
          : null,
        rowVersion: row.rowVersion,
      });
    }
    return result;
  }

  private async liveSummary(
    em: EntityManager,
    admissionId: string,
    practitionerProfileId: string,
  ): Promise<{
    requirementsSummary: AdmissionRequirementsSummaryDto;
    itemsSummary: AdmissionItemsSummaryDto;
  }> {
    const admission = await this.admissionsRepo.findById(em, admissionId);
    if (!admission) {
      return {
        requirementsSummary: { total: 0, verified: 0, rejected: 0, pending: 0 },
        itemsSummary: { licenses: 0, credentials: 0, specialties: 0 },
      };
    }
    void practitionerProfileId;
    const view = await this.checklist.buildView(em, admission);
    return {
      requirementsSummary: { ...view.evaluation.summary },
      itemsSummary: countItems(view.live.items.map((i) => i.itemType)),
    };
  }

  // ─────────────────────────────────────────────────────────────── detalle ──

  /** El detalle de una admisión (404 si no existe). */
  async detail(
    id: string,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<AdmissionDetailDto> {
    const em = this.em.fork();
    const admission = await this.admissionsRepo.findById(em, id);
    if (!admission) throw notFound();
    await this.assertNotSelfAccess(em, admission, actor);
    return this.detailOf(em, admission, now);
  }

  /**
   * Quien además es el profesional de la admisión no la ve por la vista del
   * personal (notas internas, quién revisó, datos de revisión): su caso lo ve
   * sólo por `GET /profiles/practitioners/me/admission`.
   */
  assertNotSelfAccess(
    em: EntityManager,
    admission: Pick<PractitionerAdmissions, 'practitionerProfileId'>,
    actor: AuthenticatedUser,
  ): Promise<void> {
    return assertNotSelfAccess(this.accountLinksRepo, em, admission, actor);
  }

  /** Arma el detalle con el contexto de persistencia que se le pase (p. ej. la transacción). */
  async detailOf(
    em: EntityManager,
    admission: PractitionerAdmissions,
    now: Date = new Date(),
    preloadedView?: ChecklistView,
  ): Promise<AdmissionDetailDto> {
    const view =
      preloadedView ?? (await this.checklist.buildView(em, admission));
    const events = await this.eventsRepo.findByAdmission(em, admission.id);
    const requirementRows = view.evaluation.rows;
    const requirementCodeById = new Map(
      requirementRows.map((r) => [r.requirement.id, r.requirement.code]),
    );

    const fileIds = view.live.items.map((i) => i.fileId);
    const [facts, basics] = await Promise.all([
      this.evidence.fileFacts(em, fileIds),
      this.practitionerBasics(em, [admission.practitionerProfileId]),
    ]);
    const reviewerIds = [
      admission.assignedToUserId,
      ...events.map((e) => e.actorUserId),
      ...view.reviews.map((r) => r.reviewedByUserId),
    ];
    const names = await this.userNames(em, reviewerIds);
    const actorOf = (id?: string | null): AdmissionActorDto | null =>
      id ? { id, name: names.get(id) ?? 'Usuario' } : null;

    // El formulario enviado: la foto si existe; si no, lectura viva (marcada).
    const snapshot = admission.submittedSnapshot as unknown as
      SubmittedForm | undefined;
    const form: SubmittedForm =
      snapshot ??
      (await this.evidence.buildSnapshot(
        em,
        admission.practitionerProfileId,
        now,
        view.live.professionGroup,
      ));

    const requirements: AdmissionChecklistRequirementDto[] =
      requirementRows.map(({ requirement, items, evaluation }) => ({
        code: requirement.code,
        label: requirement.label,
        description: requirement.description ?? null,
        required: requirement.required,
        evidenceKind: requirement.evidence,
        requiresSource: requirement.requiresSourceUri,
        professionGroup: requirement.professionGroup ?? null,
        minItems: requirement.minItems ?? null,
        maxItems: requirement.maxItems ?? null,
        state: evaluation.state,
        satisfied: evaluation.satisfied,
        blockedBy: evaluation.blockedBy,
        items: items.map((item): AdmissionChecklistItemDto => {
          const review = item.review;
          const reasonCode = reasonCodeOf(review?.reasonCodeConceptId);
          return {
            id: review?.id ?? null,
            itemId: item.live.itemId,
            itemType: item.live.itemType,
            label: item.live.label,
            state: item.state,
            fileId: item.live.fileId ?? null,
            verificationSourceUri: review?.verificationSourceUri ?? null,
            sourceType: sourceTypeOf(review?.sourceTypeConceptId) ?? null,
            sourceRef: review?.sourceRef ?? null,
            sourceConsultedAt: review?.sourceConsultedAt?.toISOString() ?? null,
            reasonCode: reasonCode ?? null,
            reasonText: review?.reasonText ?? null,
            internalNote: review?.internalNote ?? null,
            reviewedBy: actorOf(review?.reviewedByUserId),
            reviewedAt: review?.reviewedAt?.toISOString() ?? null,
            evidenceChanged: item.evidenceChanged,
            evidenceSha256: item.live.evidenceSha256,
            rowVersion: review?.rowVersion ?? null,
          };
        }),
      }));

    // Documentos: todos los archivos de la solicitud, en orden estable (orden del
    // requisito, luego por id del ítem).
    const documents: AdmissionDocumentDto[] = [];
    for (const { requirement, items } of requirementRows) {
      const ordered = [...items].sort((a, b) =>
        a.live.itemId < b.live.itemId
          ? -1
          : a.live.itemId > b.live.itemId
            ? 1
            : 0,
      );
      for (const item of ordered) {
        if (!item.live.fileId) continue;
        const file = facts.get(item.live.fileId);
        documents.push({
          id: item.review?.id ?? item.live.itemId,
          requirementCode: requirement.code,
          fileId: item.live.fileId,
          name: file?.name ?? 'documento',
          mimeType: file?.mimeType ?? 'application/octet-stream',
          sizeBytes: file?.sizeBytes ?? 0,
          uploadedAt: (file?.uploadedAt ?? admission.submittedAt).toISOString(),
          pages: null,
          reviewState: item.state,
          evidenceSha256: item.live.evidenceSha256,
        });
      }
    }

    const statusCode = admissionStatusCode(admission.statusConceptId);
    const base = basics.get(admission.practitionerProfileId);
    const detailPractitioner: AdmissionPractitionerDetailDto = {
      id: admission.practitionerProfileId,
      fullName: base?.fullName ?? 'Sin nombre',
      profession: base?.profession ?? null,
      maskedNationalId: maskNationalId(
        base?.nationalId ?? form.personal.nationalId,
      ),
      nationalId: form.personal.nationalId,
      nationalIdIssuer: form.personal.nationalIdIssuer,
      birthDate: form.personal.birthDate,
      age: form.personal.age,
      occupation: form.personal.occupation,
      personalMobile: form.contact.personalMobile,
      personalEmail: form.contact.personalEmail,
      workMobile: form.contact.workMobile,
      workPhone: form.contact.workPhone,
      workEmail: form.contact.workEmail,
    };

    const itemById = new Map(view.live.items.map((i) => [i.itemId, i]));
    const [licenses, credentials, specialties] = await Promise.all([
      em.find(JurisdictionAuthorizations, {
        practitionerProfileId: admission.practitionerProfileId,
      }),
      em.find(ProfessionalCredentials, {
        practitionerProfileId: admission.practitionerProfileId,
      }),
      em.find(PractitionerSpecialties, {
        practitionerProfileId: admission.practitionerProfileId,
        validTo: null,
      }),
    ]);
    const reqCodeForItem = (itemId: string): string => {
      for (const row of requirementRows) {
        if (row.items.some((i) => i.live.itemId === itemId))
          return row.requirement.code;
      }
      return 'SIN_REQUISITO';
    };

    const licenseDtos: AdmissionLicenseDto[] = licenses.map((l) => ({
      id: l.id,
      requirementCode: reqCodeForItem(l.id),
      number: l.licenseNumber,
      jurisdiction:
        form.licenses.find((x) => x.id === l.id)?.jurisdiction ?? null,
      state: authStateView(l.stateConceptId),
      fileId: l.fileId ?? null,
      verifiedAt: l.verifiedAt?.toISOString() ?? null,
      verificationSourceUri: l.verificationSourceUri ?? null,
      rejectionReasonText: l.rejectionReasonText ?? null,
    }));
    const credentialDtos: AdmissionCredentialDto[] = credentials.map((c) => ({
      id: c.id,
      requirementCode: reqCodeForItem(c.id),
      level: form.education.find((x) => x.id === c.id)?.level ?? 'Título',
      title: c.titleText ?? null,
      institution: c.issuingInstitutionText ?? null,
      state: credStateView(c.stateConceptId),
      fileId: c.fileId ?? null,
      verifiedAt: c.verifiedAt?.toISOString() ?? null,
      verificationSourceUri: c.verificationSourceUri ?? null,
      rejectionReasonText: c.rejectionReasonText ?? null,
    }));
    const specialtyDtos: AdmissionSpecialtyDto[] = specialties.map((s) => ({
      id: s.id,
      requirementCode: reqCodeForItem(s.id),
      name: itemById.get(s.id)?.label ?? null,
      state: specStateView(s.verificationStatusConceptId),
      supportingCredentialId: s.supportingCredentialId ?? null,
    }));

    const summary = await this.summaryBase(
      em,
      admission,
      base,
      view,
      names,
      now,
    );
    return {
      ...summary,
      practitioner: detailPractitioner,
      licenses: licenseDtos,
      credentials: credentialDtos,
      specialties: specialtyDtos,
      events: events.map((e) => this.eventDto(e, requirementCodeById, names)),
      infoRequestedText: admission.infoRequestedText ?? null,
      infoDueAt: admission.infoDueAt?.toISOString() ?? null,
      decisionReasonText: admission.decisionReasonText ?? null,
      decisionReasonCode:
        reasonCodeOf(admission.decisionReasonCodeConceptId) ?? null,
      internalNote: admission.internalNote ?? null,
      validUntil: admission.validUntil
        ? toDateOnly(admission.validUntil)
        : null,
      resubmissionCount: admission.resubmissionCount,
      attestedAt: admission.attestedAt?.toISOString() ?? null,
      fourEyesRequired: loadAdmissionsConfig().fourEyes,
      requirements,
      blockers: view.evaluation.blockers.map((b) => ({ ...b })),
      canVerify: view.evaluation.canVerify,
      documents,
      submittedForm: form as unknown as Record<string, unknown>,
      submittedFormSource: snapshot ? 'SNAPSHOT' : 'LIVE',
      status: statusView(statusCode),
    };
  }

  private async summaryBase(
    em: EntityManager,
    admission: PractitionerAdmissions,
    base: PractitionerBasics | undefined,
    view: ChecklistView,
    names: Map<string, string>,
    now: Date,
  ) {
    const statusCode = admissionStatusCode(admission.statusConceptId);
    void em;
    return {
      id: admission.id,
      type: { code: ONBOARDING_TYPE.code, label: ONBOARDING_TYPE.label },
      status: statusView(statusCode),
      itemsSummary: countItems(view.live.items.map((i) => i.itemType)),
      requirementsSummary: { ...view.evaluation.summary },
      submittedAt: admission.submittedAt.toISOString(),
      dueAt: admission.dueAt.toISOString(),
      overdue:
        SLA_RUNNING.includes(statusCode) &&
        admission.dueAt.getTime() < now.getTime(),
      assignedTo: admission.assignedToUserId
        ? {
            id: admission.assignedToUserId,
            name: names.get(admission.assignedToUserId) ?? 'Revisor',
          }
        : null,
      rowVersion: admission.rowVersion,
    };
  }

  private eventDto(
    event: PractitionerAdmissionEvents,
    requirementCodeById: Map<string, string>,
    names: Map<string, string>,
  ): AdmissionEventDto {
    const statusOf = (id?: string | null): AdmissionCodeLabelDto | null => {
      if (!id) return null;
      try {
        return statusView(admissionStatusCode(id));
      } catch {
        return null;
      }
    };
    return {
      id: event.id,
      type: eventCodeOf(event.eventTypeConceptId) ?? 'UNKNOWN',
      fromStatus: statusOf(event.fromStatusConceptId),
      toStatus: statusOf(event.toStatusConceptId),
      itemType: itemTypeCodeOf(event.itemTypeConceptId),
      itemId: event.itemId ?? null,
      requirementCode: event.requirementId
        ? (requirementCodeById.get(event.requirementId) ?? null)
        : null,
      verificationSourceUri: event.verificationSourceUri ?? null,
      reasonCode: reasonCodeOf(event.reasonCodeConceptId) ?? null,
      reasonText: event.reasonText ?? null,
      actor: event.actorUserId
        ? {
            id: event.actorUserId,
            name: names.get(event.actorUserId) ?? 'Usuario',
          }
        : null,
      actorRole: event.actorRoleCode ?? null,
      occurredAt: event.occurredAt.toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────── el propio ──

  /** La admisión del propio médico (el sujeto sale de la SESIÓN). */
  async own(actor: AuthenticatedUser): Promise<OwnAdmissionDto> {
    const em = this.em.fork();
    const admission = await this.currentOf(em, actor);
    if (!admission) throw notFound();
    return this.ownOf(em, admission);
  }

  /** La admisión vigente del médico de la sesión, o `null`. */
  async currentOf(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<PractitionerAdmissions | null> {
    const personId = await this.ownPersonId(em, actor);
    if (!personId) return null;
    const map = await this.admissionsRepo.findCurrentByPractitioners(em, [
      personId,
    ]);
    return map.get(personId) ?? null;
  }

  /**
   * El perfil profesional de la sesión (su `person_id`), o `null` si la cuenta no tiene.
   *
   * «Mi perfil» es el de un vínculo propio (`SELF`) y ACTIVO de la cuenta: un
   * vínculo de delegado o de familiar no hace de esa persona «yo». Si la cuenta
   * tiene varios vínculos propios activos (el índice único del modelo no está
   * materializado) gana el más reciente que tenga perfil profesional, con un
   * orden total, así que la respuesta no depende del orden de las filas.
   */
  async ownPersonId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string | null> {
    const links = await this.accountLinksRepo.findSelfActiveByUser(
      em,
      actor.id,
    );
    if (links.length === 0) return null;
    const personIds = [...new Set(links.map((link) => link.personId))];
    const practitioners = await em.find(
      HealthPractitionerProfiles,
      { profileId: { $in: personIds } },
      { fields: ['profileId'] },
    );
    const withProfile = new Set(practitioners.map((p) => p.profileId));
    return personIds.find((id) => withProfile.has(id)) ?? null;
  }

  /** Lo que el dueño ve: estados, qué falta y los mensajes dirigidos a él; nada del personal. */
  async ownOf(
    em: EntityManager,
    admission: PractitionerAdmissions,
  ): Promise<OwnAdmissionDto> {
    const view = await this.checklist.buildView(em, admission);
    const statusCode = admissionStatusCode(admission.statusConceptId);
    const config = loadAdmissionsConfig();
    const items = view.evaluation.rows.flatMap(({ items }) =>
      items.map((item) => {
        const code = applicantVisibleReason(
          reasonCodeOf(item.review?.reasonCodeConceptId),
        );
        return {
          type: item.live.itemType,
          id: item.live.itemId,
          label: item.live.label,
          state: item.state,
          reasonText:
            item.state === 'REJECTED' || item.state === 'INFO_REQUIRED'
              ? (item.review?.reasonText ?? null)
              : null,
          reasonCode:
            item.state === 'PENDING' || item.state === 'VERIFIED'
              ? null
              : (code ?? null),
        };
      }),
    );
    return {
      id: admission.id,
      status: statusView(statusCode),
      submittedAt: admission.submittedAt.toISOString(),
      dueAt: admission.dueAt.toISOString(),
      infoRequestedText: admission.infoRequestedText ?? null,
      infoDueAt: admission.infoDueAt?.toISOString() ?? null,
      decisionReasonText:
        statusCode === 'RECHAZADA' || statusCode === 'SUSPENDIDA'
          ? (admission.decisionReasonText ?? null)
          : null,
      validUntil: admission.validUntil
        ? toDateOnly(admission.validUntil)
        : null,
      items,
      resubmissionCount: admission.resubmissionCount,
      resubmissions: {
        used: admission.resubmissionCount,
        max: config.maxResubmissions,
        remaining: Math.max(
          0,
          config.maxResubmissions - admission.resubmissionCount,
        ),
      },
      canResubmit:
        [
          'INFORMACION_REQUERIDA',
          'RECHAZADA',
          'EXPIRADA',
          'ABANDONADA',
        ].includes(statusCode) &&
        admission.resubmissionCount < config.maxResubmissions,
      canWithdraw:
        statusCode === 'ENVIADA' || statusCode === 'INFORMACION_REQUERIDA',
    };
  }

  // ──────────────────────────────────────────────────── insignia visible ──

  /**
   * El estado visible de verificación de varios profesionales, en una consulta.
   *
   * Lo que no tiene admisión (padrón cargado) es `UNVERIFIED`: nunca
   * `IN_REVIEW`. Una verificación cuya vigencia pasó se ve `EXPIRED` aunque el
   * barrido todavía no la haya bajado.
   */
  async verificationOf(
    em: EntityManager,
    practitionerProfileIds: readonly string[],
    now: Date = new Date(),
  ): Promise<Map<string, PractitionerVerificationView>> {
    const current = await this.admissionsRepo.findCurrentByPractitioners(
      em,
      practitionerProfileIds,
    );
    const result = new Map<string, PractitionerVerificationView>();
    for (const id of practitionerProfileIds) {
      const admission = current.get(id);
      result.set(
        id,
        visibleVerification(
          admission
            ? {
                status: admissionStatusCode(admission.statusConceptId),
                decidedAt: admission.decidedAt,
                validUntil: admission.validUntil,
              }
            : undefined,
          now,
        ),
      );
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────── auxiliares ──

  /** Nombres de cuentas (revisores, actores). */
  userNames(
    em: EntityManager,
    ids: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, string>> {
    return this.foreign.userNames(em, ids);
  }

  /** ¿Existe esa cuenta? (para reasignar una revisión). */
  userExists(em: EntityManager, userId: string): Promise<boolean> {
    return this.foreign.userExists(em, userId);
  }

  private async practitionerBasics(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, PractitionerBasics>> {
    const result = new Map<string, PractitionerBasics>();
    if (ids.length === 0) return result;
    const [persons, identifiers, credentials, profiles] = await Promise.all([
      em.find(Persons, { id: { $in: [...ids] } }),
      this.foreign.nationalIds(em, ids),
      em.find(ProfessionalCredentials, {
        practitionerProfileId: { $in: [...ids] },
      }),
      em.find(HealthPractitionerProfiles, { profileId: { $in: [...ids] } }),
    ]);
    const names = await this.conceptDisplay(
      em,
      credentials.map((c) => c.professionConceptId),
    );
    for (const person of persons) {
      const fullName =
        [person.name, person.middleName, person.lastName, person.motherLastName]
          .filter((p): p is string => !!p && p.trim() !== '')
          .join(' ') ||
        person.displayName ||
        'Sin nombre';
      const profession =
        credentials
          .filter(
            (c) =>
              c.practitionerProfileId === person.id && c.professionConceptId,
          )
          .map((c) => names.get(c.professionConceptId as string))
          .find((n): n is string => !!n) ??
        profiles.find((p) => p.profileId === person.id)?.professionalTitle ??
        null;
      result.set(person.id, {
        fullName,
        profession,
        nationalId: identifiers.get(person.id)?.value ?? null,
      });
    }
    return result;
  }

  private conceptDisplay(
    em: EntityManager,
    ids: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, string>> {
    return this.foreign.conceptNames(em, ids);
  }

  private async professionGroups(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, 'MEDICO' | 'ODONTOLOGO'>> {
    const credentials = await em.find(ProfessionalCredentials, {
      practitionerProfileId: { $in: [...ids] },
    });
    const names = await this.conceptDisplay(
      em,
      credentials.map((c) => c.professionConceptId),
    );
    const result = new Map<string, 'MEDICO' | 'ODONTOLOGO'>();
    for (const id of ids) {
      const own = credentials.filter((c) => c.practitionerProfileId === id);
      result.set(
        id,
        resolveProfessionGroup([
          ...own.map((c) => names.get(c.professionConceptId ?? '')),
          ...own.map((c) => c.titleText),
        ]),
      );
    }
    return result;
  }
}

// ──────────────────────────────────────────────────────────────── helpers ──

function notFound(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Admisión no encontrada',
    {},
    ProfilesErrorReason.ADMISSION_NOT_FOUND,
  );
}

/** El estado como `{code,label}`. */
export function statusView(code: AdmissionStatusCode): AdmissionCodeLabelDto {
  return { code, label: ADMISSION_STATUS_LABEL[code] };
}

function countItems(
  types: ReadonlyArray<string | undefined>,
): AdmissionItemsSummaryDto {
  return {
    licenses: types.filter((t) => t === 'LICENSE').length,
    credentials: types.filter((t) => t === 'CREDENTIAL').length,
    specialties: types.filter((t) => t === 'SPECIALTY').length,
  };
}

function itemTypeCodeOf(conceptId?: string | null): string | null {
  if (!conceptId) return null;
  const entry = Object.entries(ADMISSION_ITEM_CONCEPT).find(
    ([, concept]) => concept === conceptId,
  );
  return entry ? entry[0] : null;
}

function authStateView(conceptId: string): AdmissionCodeLabelDto {
  switch (conceptId) {
    case PROF.AUTH_ACTIVE:
      return { code: 'ACTIVE', label: 'Vigente' };
    case PROF.AUTH_REJECTED:
      return { code: 'REJECTED', label: 'Rechazada' };
    case PROF.AUTH_EXPIRED:
      return { code: 'EXPIRED', label: 'Vencida' };
    default:
      return { code: 'PENDING', label: 'Pendiente' };
  }
}

function credStateView(conceptId: string): AdmissionCodeLabelDto {
  switch (conceptId) {
    case PROF.CRED_VERIFIED:
      return { code: 'VERIFIED', label: 'Verificado' };
    case PROF.CRED_REJECTED:
      return { code: 'REJECTED', label: 'Rechazado' };
    default:
      return { code: 'PENDING', label: 'Pendiente' };
  }
}

function specStateView(conceptId: string): AdmissionCodeLabelDto {
  switch (conceptId) {
    case PROF.SPEC_VERIF_VERIFIED:
      return { code: 'VERIFIED', label: 'Verificada' };
    case PROF.SPEC_VERIF_REJECTED:
      return { code: 'REJECTED', label: 'Rechazada' };
    default:
      return { code: 'PENDING', label: 'Pendiente' };
  }
}
