import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { touch } from '../../../../common';
import type {
  PractitionerAdmissionReviews,
  PractitionerAdmissions,
} from '../../entities';
import {
  JurisdictionAuthorizations,
  PractitionerSpecialties,
  ProfessionalCredentials,
} from '../../entities';
import { PROF } from '../../profiles.concepts';
import {
  AdmissionRequirementsRepository,
  PractitionerAdmissionReviewsRepository,
  REVIEW_STATE_CONCEPT,
  reviewStateOf,
  toChecklistRequirement,
} from '../../infrastructure/repositories';
import {
  applicableRequirements,
  evaluateChecklist,
  type ChecklistEvaluation,
  type ChecklistItemState,
  type ChecklistRequirement,
  type ReviewState,
} from '../../domain/admissions/admission-checklist';
import type { AdmissionItemType } from '../../domain/admissions/admission-requirements.catalog';
import {
  PractitionerAdmissionEvidenceService,
  type LiveAdmissionEvidence,
  type LiveAdmissionItem,
} from './practitioner-admission-evidence.service';

/**
 * Para limpiar una columna nullable: MikroORM no escribe `undefined`, así que
 * borrar un valor exige asignar `null` (las entidades tipan estas columnas como
 * opcionales, no como `null`).
 */
export const NULL = null as unknown as undefined;

/** Un ítem del checklist: lo que hay hoy más su revisión (si ya existe). */
export interface ChecklistViewItem extends ChecklistItemState {
  readonly live: LiveAdmissionItem;
  /** `undefined` mientras la revisión no se materializó (antes de tomarla). */
  readonly review?: PractitionerAdmissionReviews;
  /** El dato o el archivo cambió después de que el revisor lo vio. */
  readonly evidenceChanged: boolean;
}

/** La vista completa del checklist de una admisión. */
export interface ChecklistView {
  readonly evaluation: ChecklistEvaluation<ChecklistViewItem>;
  readonly live: LiveAdmissionEvidence;
  readonly reviews: PractitionerAdmissionReviews[];
}

/** Cuánto invalida un reenvío de lo ya revisado. */
export type ResetMode = 'NONE' | 'CHANGED' | 'ALL';

/** Estado de la ficha que se proyecta al resolver. */
export type EntityDecision = 'PENDING' | 'VERIFIED' | 'REJECTED';

const AUTH_STATE: Readonly<Record<EntityDecision, string>> = {
  PENDING: PROF.AUTH_PENDING,
  VERIFIED: PROF.AUTH_ACTIVE,
  REJECTED: PROF.AUTH_REJECTED,
};
const CRED_STATE: Readonly<Record<EntityDecision, string>> = {
  PENDING: PROF.CRED_PENDING,
  VERIFIED: PROF.CRED_VERIFIED,
  REJECTED: PROF.CRED_REJECTED,
};
const SPEC_STATE: Readonly<Record<EntityDecision, string>> = {
  PENDING: PROF.SPEC_VERIF_PENDING,
  VERIFIED: PROF.SPEC_VERIF_VERIFIED,
  REJECTED: PROF.SPEC_VERIF_REJECTED,
};

/** Metadatos de la verificación que se copian a la ficha. */
export interface EntityDecisionMeta {
  readonly actorUserId: string;
  readonly at: Date;
  readonly sourceRef?: string;
  readonly reasonText?: string;
}

/**
 * El checklist de una admisión: cruza el catálogo de requisitos con lo que el
 * médico tiene hoy y con las revisiones ya hechas.
 *
 * Es el único lugar que sabe qué ítem corresponde a qué requisito, y el único
 * que proyecta una decisión sobre la ficha (matrícula, título, especialidad).
 */
@Injectable()
export class PractitionerAdmissionChecklistService {
  constructor(
    private readonly requirementsRepo: AdmissionRequirementsRepository,
    private readonly reviewsRepo: PractitionerAdmissionReviewsRepository,
    private readonly evidence: PractitionerAdmissionEvidenceService,
  ) {}

  /** Los requisitos activos del tipo, ya en la forma del cálculo. */
  async requirementsOf(
    em: EntityManager,
    admissionTypeConceptId: string,
  ): Promise<ChecklistRequirement[]> {
    const rows = await this.requirementsRepo.findActiveByType(
      em,
      admissionTypeConceptId,
    );
    return rows.map(toChecklistRequirement);
  }

  /**
   * Arma la vista del checklist sin escribir nada (sirve para lecturas).
   *
   * Un ítem con revisión pero cuyo dato o archivo cambió desde entonces se
   * evalúa como PENDIENTE: la verificación ya no corresponde a lo que hay.
   */
  async buildView(
    em: EntityManager,
    admission: PractitionerAdmissions,
    preloaded?: {
      live?: LiveAdmissionEvidence;
      reviews?: PractitionerAdmissionReviews[];
      requirements?: ChecklistRequirement[];
    },
  ): Promise<ChecklistView> {
    const [live, reviews, requirements] = await Promise.all([
      preloaded?.live ??
        this.evidence.collect(em, admission.practitionerProfileId),
      preloaded?.reviews ??
        this.reviewsRepo.findByAdmission(em, admission.id),
      preloaded?.requirements ??
        this.requirementsOf(em, admission.admissionTypeConceptId),
    ]);
    const reviewByKey = new Map(
      reviews.map((r) => [`${r.requirementId}:${r.itemId}`, r]),
    );
    const applicable = applicableRequirements(requirements, live.professionGroup);
    const inputs = applicable.map((requirement) => ({
      requirement,
      items: live.items
        .filter((item) => matches(requirement, item))
        .map((item): ChecklistViewItem => {
          const review = reviewByKey.get(`${requirement.id}:${item.itemId}`);
          const recorded = review ? reviewStateOf(review.statusConceptId) : 'PENDING';
          const evidenceChanged =
            review !== undefined &&
            recorded !== 'PENDING' &&
            review.evidenceSha256 !== undefined &&
            review.evidenceSha256 !== null &&
            review.evidenceSha256 !== item.evidenceSha256;
          return {
            live: item,
            review,
            evidenceChanged,
            state: evidenceChanged ? 'PENDING' : recorded,
          };
        }),
    }));
    return { evaluation: evaluateChecklist(inputs), live, reviews };
  }

  /**
   * Materializa (idempotente) las revisiones de una admisión.
   *
   * - Crea la revisión PENDIENTE de cada ítem que aún no la tiene.
   * - Borra las que ya no corresponden (el médico retiró el ítem o el requisito
   *   dejó de aplicar).
   * - `CHANGED` (reenvío): lo que el médico cambió —y la información pedida que
   *   respondió— vuelve a PENDIENTE; lo verificado y sin cambios se conserva.
   *   `ALL` (renovación tras vencer): todo vuelve a PENDIENTE.
   *
   * Lo que vuelve a PENDIENTE también devuelve su ficha a pendiente, para que el
   * médico pueda corregirla.
   *
   * @returns La vista ya consistente con la base.
   */
  async materialize(
    tx: EntityManager,
    admission: PractitionerAdmissions,
    options: { reset?: ResetMode; actorUserId?: string } = {},
  ): Promise<ChecklistView> {
    const reset = options.reset ?? 'NONE';
    const view = await this.buildView(tx, admission);
    const now = new Date();
    const wanted = new Set<string>();

    for (const row of view.evaluation.rows) {
      for (const item of row.items) {
        const key = `${row.requirement.id}:${item.live.itemId}`;
        wanted.add(key);
        if (!item.review) {
          this.reviewsRepo.create(tx, {
            admissionId: admission.id,
            requirementId: row.requirement.id,
            itemId: item.live.itemId,
            fileId: item.live.fileId,
            evidenceSha256: item.live.evidenceSha256,
            actorUserId: options.actorUserId,
          });
          continue;
        }
        const review = item.review;
        const recorded = reviewStateOf(review.statusConceptId);
        const changed =
          review.evidenceSha256 != null &&
          review.evidenceSha256 !== item.live.evidenceSha256;
        const mustReset =
          recorded !== 'PENDING' &&
          (reset === 'ALL' ||
            (reset === 'CHANGED' &&
              (changed || recorded === 'INFO_REQUIRED')));
        if (mustReset) {
          this.clearReview(review, now, options.actorUserId);
          await this.applyEntityDecision(tx, item.live, 'PENDING', {
            actorUserId: options.actorUserId ?? 'system',
            at: now,
          });
        }
        if (mustReset || recorded === 'PENDING' || review.evidenceSha256 == null) {
          review.fileId = item.live.fileId;
          review.evidenceSha256 = item.live.evidenceSha256;
          touch(review, options.actorUserId, now);
        }
      }
    }
    for (const review of view.reviews) {
      if (!wanted.has(`${review.requirementId}:${review.itemId}`)) {
        this.reviewsRepo.remove(tx, review);
      }
    }
    await tx.flush();
    return this.buildView(tx, admission);
  }

  /** Devuelve una revisión a PENDIENTE y limpia lo que el revisor había escrito. */
  clearReview(
    review: PractitionerAdmissionReviews,
    now: Date,
    actorUserId?: string,
  ): void {
    review.statusConceptId = REVIEW_STATE_CONCEPT.PENDING;
    review.verificationSourceUri = NULL;
    review.sourceTypeConceptId = NULL;
    review.sourceRef = NULL;
    review.sourceConsultedAt = NULL;
    review.reasonCodeConceptId = NULL;
    review.reasonText = NULL;
    review.internalNote = NULL;
    review.reviewedByUserId = NULL;
    review.reviewedAt = NULL;
    touch(review, actorUserId, now);
  }

  /** Proyecta la decisión sobre la ficha que el ítem representa. */
  async applyEntityDecision(
    tx: EntityManager,
    item: Pick<LiveAdmissionItem, 'itemType' | 'itemId'>,
    decision: EntityDecision,
    meta: EntityDecisionMeta,
  ): Promise<void> {
    const type: AdmissionItemType = item.itemType;
    if (type === 'LICENSE') {
      const row = await tx.findOne(JurisdictionAuthorizations, { id: item.itemId });
      if (!row) return;
      row.stateConceptId = AUTH_STATE[decision];
      if (decision === 'PENDING') {
        row.verifiedByUserId = NULL;
        row.verifiedAt = NULL;
        row.verificationSourceUri = NULL;
        row.rejectionReasonText = NULL;
      } else {
        row.verifiedByUserId = meta.actorUserId;
        row.verifiedAt = meta.at;
        row.verificationSourceUri = meta.sourceRef;
        row.rejectionReasonText =
          decision === 'REJECTED' ? meta.reasonText : NULL;
      }
      touch(row, meta.actorUserId, meta.at);
    } else if (type === 'CREDENTIAL') {
      const row = await tx.findOne(ProfessionalCredentials, { id: item.itemId });
      if (!row) return;
      row.stateConceptId = CRED_STATE[decision];
      if (decision === 'PENDING') {
        row.verifiedByUserId = NULL;
        row.verifiedAt = NULL;
        row.verificationSourceUri = NULL;
        row.rejectionReasonText = NULL;
      } else {
        row.verifiedByUserId = meta.actorUserId;
        row.verifiedAt = meta.at;
        row.verificationSourceUri = meta.sourceRef;
        row.rejectionReasonText =
          decision === 'REJECTED' ? meta.reasonText : NULL;
      }
      touch(row, meta.actorUserId, meta.at);
    } else if (type === 'SPECIALTY') {
      const row = await tx.findOne(PractitionerSpecialties, { id: item.itemId });
      if (!row) return;
      row.verificationStatusConceptId = SPEC_STATE[decision];
      row.verifiedAt = decision === 'VERIFIED' ? meta.at : NULL;
      touch(row, meta.actorUserId, meta.at);
    }
    // PROFILE: los datos del perfil no tienen estado propio; vale la revisión.
  }
}

function matches(requirement: ChecklistRequirement, item: LiveAdmissionItem): boolean {
  return (
    requirement.itemType === item.itemType &&
    (requirement.itemSubtype === undefined ||
      requirement.itemSubtype === item.itemSubtype)
  );
}

export type { ReviewState };
