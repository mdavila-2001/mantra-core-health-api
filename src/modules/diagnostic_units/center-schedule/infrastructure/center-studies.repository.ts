import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
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
 */
const STUDY_SELECT = `
  SELECT o.id, o.diagnostic_unit_id AS unit_id, o.study_code, o.study_concept_id,
         o.modality_concept_id, o.display_name, o.preparation_instructions,
         pr.amount, pr.currency_code
    FROM diagnostic_units.diagnostic_study_offerings o
    JOIN diagnostic_units.diagnostic_units u ON u.id = o.diagnostic_unit_id
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
       LIMIT 1) pr ON true
   WHERE o.status_concept_id = ?`;

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
