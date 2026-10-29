import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../../common';
import {
  AdmissionRequirements,
  PractitionerAdmissionReviews,
} from '../../entities';
import { PROF } from '../../profiles.concepts';
import type { ReviewState } from '../../domain/admissions/admission-checklist';
import type { ChecklistRequirement } from '../../domain/admissions/admission-checklist';
import {
  admissionItemTypeOf,
  type AdmissionRequirementSeed,
  type ProfessionGroup,
  requirementId,
} from '../../domain/admissions/admission-requirements.catalog';

/** Concepto de cada estado de revisión. */
export const REVIEW_STATE_CONCEPT: Readonly<Record<ReviewState, string>> = {
  PENDING: PROF.ADMISSION_REVIEW_PENDING,
  VERIFIED: PROF.ADMISSION_REVIEW_VERIFIED,
  REJECTED: PROF.ADMISSION_REVIEW_REJECTED,
  INFO_REQUIRED: PROF.ADMISSION_REVIEW_INFO_REQUIRED,
};

const REVIEW_STATE_BY_CONCEPT: ReadonlyMap<string, ReviewState> = new Map(
  (Object.keys(REVIEW_STATE_CONCEPT) as ReviewState[]).map((state) => [
    REVIEW_STATE_CONCEPT[state],
    state,
  ]),
);

/** El estado de revisión de un concepto; falla ante uno desconocido. */
export function reviewStateOf(conceptId: string): ReviewState {
  const state = REVIEW_STATE_BY_CONCEPT.get(conceptId);
  if (!state) throw new Error(`Concepto de revisión desconocido: ${conceptId}`);
  return state;
}

/** Un requisito de la base, en la forma que usa el cálculo del checklist. */
export function toChecklistRequirement(
  row: AdmissionRequirements,
): ChecklistRequirement {
  const itemType = admissionItemTypeOf(row.itemTypeConceptId);
  if (!itemType) {
    throw new Error(`Clase de ítem desconocida: ${row.itemTypeConceptId}`);
  }
  return {
    id: row.id,
    code: row.requirementCode,
    label: row.label,
    description: row.description ?? undefined,
    itemType,
    itemSubtype: row.itemSubtypeCode ?? undefined,
    evidence:
      row.evidenceKindConceptId === PROF.ADMISSION_EVIDENCE_DATA
        ? 'DATA'
        : 'DOCUMENT',
    required: row.isRequired,
    requiresSourceUri: row.requiresSourceUri,
    professionGroup: (row.appliesToProfessionGroup ?? undefined) as
      | ProfessionGroup
      | undefined,
    minItems: row.minItems ?? undefined,
    maxItems: row.maxItems ?? undefined,
    sortOrder: row.sortOrder,
  };
}

/** Datos para crear una revisión. */
export interface CreateReviewData {
  readonly admissionId: string;
  readonly requirementId: string;
  readonly itemId: string;
  readonly fileId?: string;
  readonly evidenceSha256?: string;
  readonly actorUserId?: string;
}

/** Acceso a datos de `profiles.practitioner_admission_reviews`. */
@Injectable()
export class PractitionerAdmissionReviewsRepository {
  /** Las revisiones de una admisión. */
  findByAdmission(
    em: EntityManager,
    admissionId: string,
  ): Promise<PractitionerAdmissionReviews[]> {
    return em.find(
      PractitionerAdmissionReviews,
      { admissionId },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
  }

  /** Las revisiones de varias admisiones, en una consulta. */
  findByAdmissions(
    em: EntityManager,
    admissionIds: readonly string[],
  ): Promise<PractitionerAdmissionReviews[]> {
    if (admissionIds.length === 0) return Promise.resolve([]);
    return em.find(PractitionerAdmissionReviews, {
      admissionId: { $in: [...admissionIds] },
    });
  }

  /** Una revisión por id, con la fila bloqueada. */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerAdmissionReviews | null> {
    return em.findOne(
      PractitionerAdmissionReviews,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Crea una revisión PENDIENTE. El llamador hace el flush. */
  create(
    em: EntityManager,
    data: CreateReviewData,
  ): PractitionerAdmissionReviews {
    return em.create(
      PractitionerAdmissionReviews,
      {
        admissionId: data.admissionId,
        requirementId: data.requirementId,
        itemId: data.itemId,
        statusConceptId: PROF.ADMISSION_REVIEW_PENDING,
        fileId: data.fileId,
        evidenceSha256: data.evidenceSha256,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Borra una revisión cuyo ítem ya no existe (el médico lo retiró). */
  remove(em: EntityManager, row: PractitionerAdmissionReviews): void {
    em.remove(row);
  }
}

/** Acceso al catálogo `profiles.admission_requirements`. */
@Injectable()
export class AdmissionRequirementsRepository {
  /** Los requisitos activos de un tipo de admisión. */
  async findActiveByType(
    em: EntityManager,
    admissionTypeConceptId: string,
  ): Promise<AdmissionRequirements[]> {
    return em.find(
      AdmissionRequirements,
      { admissionTypeConceptId, isActive: true },
      { orderBy: { sortOrder: 'asc', requirementCode: 'asc' } },
    );
  }

  /** Requisitos por id (activos o no: una revisión vieja puede apuntar a uno retirado). */
  findByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<AdmissionRequirements[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(AdmissionRequirements, { id: { $in: [...ids] } });
  }

  /**
   * Siembra idempotente del catálogo de un tipo. Crea lo que falta y no toca lo
   * existente: la semántica de un requisito no se edita en sitio (se desactiva
   * y se crea otro), porque cambiarla alteraría revisiones en vuelo.
   *
   * @returns Cuántos requisitos creó.
   */
  async seedMissing(
    em: EntityManager,
    admissionTypeConceptId: string,
    typeKey: string,
    seeds: readonly AdmissionRequirementSeed[],
    conceptOfItemType: Readonly<Record<string, string>>,
  ): Promise<number> {
    const existing = await em.find(
      AdmissionRequirements,
      { admissionTypeConceptId },
      { fields: ['id', 'requirementCode'] },
    );
    const have = new Set(existing.map((r) => r.requirementCode));
    const now = new Date();
    let created = 0;
    for (const seed of seeds) {
      if (have.has(seed.code)) continue;
      em.create(
        AdmissionRequirements,
        {
          id: requirementId(typeKey, seed.code),
          admissionTypeConceptId,
          requirementCode: seed.code,
          label: seed.label,
          description: seed.description,
          itemTypeConceptId: conceptOfItemType[seed.itemType],
          itemSubtypeCode: seed.itemSubtype,
          evidenceKindConceptId:
            seed.evidence === 'DATA'
              ? PROF.ADMISSION_EVIDENCE_DATA
              : PROF.ADMISSION_EVIDENCE_DOCUMENT,
          verificationMethodConceptId: PROF.ADMISSION_METHOD_MANUAL,
          isRequired: seed.required,
          requiresSourceUri: seed.requiresSourceUri,
          appliesToProfessionGroup: seed.professionGroup,
          minItems: seed.minItems,
          maxItems: seed.maxItems,
          sortOrder: seed.sortOrder,
          isActive: true,
          ...createdBy(undefined, now),
        },
        { partial: true },
      );
      created += 1;
    }
    return created;
  }
}
