import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { DUNIT } from '../../diagnostic_units.concepts';

/** An active offering with its current public price. */
export interface StudyRow {
  id: string;
  unit_id: string;
  study_code: string;
  study_concept_id: string;
  modality_concept_id: string | null;
  display_name: string;
  preparation_instructions: string | null;
  amount: string | null;
  currency_code: string | null;
}

/**
 * The public price of an offering: active version of a public, active and
 * current schedule — the same rules the directory applies — newest first.
 * An offering the lab switched off for today (`available = false`) is not
 * offered, so a patient can neither see nor book it.
 */
const PRICE_LATERAL = `
    LEFT JOIN LATERAL (
      SELECT coalesce(p.patient_amount, p.base_amount)::text AS amount, cc.code AS currency_code
        FROM diagnostic_units.diagnostic_study_prices p
        JOIN diagnostic_units.diagnostic_price_schedules ps ON ps.id = p.price_schedule_id
        LEFT JOIN terminology.catalog_concepts cc ON cc.id = ps.currency_concept_id
       WHERE p.diagnostic_study_offering_id = o.id
         AND p.status_concept_id = ? AND p.effective_from <= now()
         AND (p.effective_to IS NULL OR p.effective_to > now())
         AND ps.public_visibility = true AND ps.status_concept_id = ?
         AND (ps.valid_from IS NULL OR ps.valid_from <= now())
         AND (ps.valid_to IS NULL OR ps.valid_to >= now())
       ORDER BY p.effective_from DESC
       LIMIT 1) pr ON true`;

const STUDY_SELECT = `
  SELECT o.id, o.diagnostic_unit_id AS unit_id, o.study_code, o.study_concept_id,
         o.modality_concept_id, o.display_name, o.preparation_instructions,
         pr.amount, pr.currency_code
    FROM diagnostic_units.diagnostic_study_offerings o
    JOIN diagnostic_units.diagnostic_units u ON u.id = o.diagnostic_unit_id
    ${PRICE_LATERAL}
   WHERE o.status_concept_id = ? AND o.available`;

/** One component of a panel offering; `amount` is null unless it is published and priced. */
export interface PartRow {
  study_concept_id: string;
  amount: string | null;
}

/** A part row as the quote rule reads it. */
export function toQuotedPart(row: PartRow): {
  conceptId: string;
  amount: number | null;
} {
  return {
    conceptId: row.study_concept_id,
    amount: row.amount === null ? null : Number(row.amount),
  };
}

const PRICE_PARAMS = [
  DUNIT.PRICE_ACTIVE,
  DUNIT.SCHEDULE_ACTIVE,
  DUNIT.OFFERING_ACTIVE,
];

/** `DU_CUR_BOB` → `BOB`: the wire carries the ISO code, not the concept code. */
export function currencyOf(code: string | null): string | null {
  return code === null ? null : code.replace(/^DU_CUR_/, '');
}

/** Reads the studies a center offers, with price and preparation. */
@Injectable()
export class CenterStudiesRepository {
  findForUnit(em: EntityManager, unitId: string): Promise<StudyRow[]> {
    return em.execute<StudyRow[]>(
      `${STUDY_SELECT} AND o.diagnostic_unit_id = ? ORDER BY o.display_name, o.id`,
      [...PRICE_PARAMS, unitId],
      'all',
    );
  }

  /**
   * The components of a panel offering that are parts of its catalog concept
   * (`part-of`), published or not, with their price. A panel the admin built
   * from standalone offerings has none: it is quoted whole.
   */
  findParts(em: EntityManager, panelOfferingId: string): Promise<PartRow[]> {
    return em.execute<PartRow[]>(
      `SELECT o.study_concept_id,
              CASE WHEN o.status_concept_id = ? THEN pr.amount END AS amount
         FROM diagnostic_units.diagnostic_study_components c
         JOIN diagnostic_units.diagnostic_study_offerings p ON p.id = c.parent_offering_id
         JOIN diagnostic_units.diagnostic_study_offerings o ON o.id = c.component_offering_id
         ${PRICE_LATERAL}
        WHERE c.parent_offering_id = ?
          AND EXISTS (SELECT 1 FROM terminology.concept_relationships r
                       WHERE r.source_concept_id = o.study_concept_id
                         AND r.target_concept_id = p.study_concept_id
                         AND r.relationship_type_concept_id = ?)`,
      [
        DUNIT.OFFERING_ACTIVE,
        ...PRICE_PARAMS.slice(0, 2),
        panelOfferingId,
        CONCEPTS.REL_PART_OF,
      ],
      'all',
    );
  }

  /** Offerings of a study concept in every published center. */
  findPublishedByConcept(
    em: EntityManager,
    studyConceptId: string,
  ): Promise<StudyRow[]> {
    return em.execute<StudyRow[]>(
      `${STUDY_SELECT} AND o.study_concept_id = ?
         AND u.status_concept_id = ? AND u.verification_status_concept_id = ?
       ORDER BY o.display_name, o.id`,
      [
        ...PRICE_PARAMS,
        studyConceptId,
        DUNIT.UNIT_ACTIVE,
        DUNIT.VERIFICATION_VERIFIED,
      ],
      'all',
    );
  }
}
