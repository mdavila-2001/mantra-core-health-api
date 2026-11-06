import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import type { ComponentRow } from './study-catalog.repository';

/**
 * Batch reads of the lab catalog that the lab portal needs and the doctor's
 * catalog does not: the direct components of many panels in one query.
 */
@Injectable()
export class LabCatalogRepository {
  /** Direct components of each panel, in panel order. */
  async findDirectComponents(
    em: EntityManager,
    panelIds: string[],
  ): Promise<ComponentRow[]> {
    if (panelIds.length === 0) return [];
    return em.execute<ComponentRow[]>(
      `SELECT r.source_concept_id AS id, r.target_concept_id AS parent_id, r.ordinal, 1 AS depth,
              cc.code, coalesce(es.value, cc.display) AS name, pr.props
         FROM terminology.concept_relationships r
         JOIN terminology.catalog_concepts cc ON cc.id = r.source_concept_id
         LEFT JOIN LATERAL (
           SELECT d.value FROM terminology.concept_designations d
            WHERE d.concept_id = cc.id AND d.language_concept_id = ? AND d.preferred IS TRUE
            ORDER BY d.created_at, d.id LIMIT 1) es ON TRUE
         LEFT JOIN LATERAL (
           SELECT jsonb_object_agg(p.property_code, p.value_json) AS props
             FROM terminology.concept_properties p
            WHERE p.concept_id = cc.id
              AND p.property_code = ANY(ARRAY['unit_ucum','loinc_code'])) pr ON TRUE
        WHERE r.relationship_type_concept_id = ? AND r.target_concept_id = ANY(ARRAY[?]::uuid[])
        ORDER BY r.target_concept_id, r.ordinal NULLS LAST, cc.code`,
      [CONCEPTS.LANG_ES, CONCEPTS.REL_PART_OF, panelIds],
      'all',
    );
  }
}
