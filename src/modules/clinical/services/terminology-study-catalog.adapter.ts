import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import type {
  BodySiteEntry,
  StudyCatalogEntry,
  StudyCatalogPort,
  StudyFamily,
  StudyValueSetCode,
} from '../study-catalog.port';

/** Profundidad máxima al bajar por `part-of` (paneles anidados: 57021-8 llega a 3). */
const MAX_PANEL_DEPTH = 6;

/**
 * Adaptador por defecto de {@link StudyCatalogPort}: lee `terminology.*` con los
 * contratos de datos que publica el módulo `study_catalog`:
 *
 * - pertenencia: `value_sets.internal_code` → versión por defecto → miembros incluidos;
 * - componentes: `concept_relationships` de tipo `REL_PART_OF` (componente
 *   `part-of` panel; se acepta también el sentido inverso, panel→componente,
 *   porque el plan lo describe así);
 * - familia: propiedad de concepto `study_family` (`LAB|IMAGING|OTHER`);
 * - modalidad: relación cuyo tipo tiene `code = 'has-modality'`;
 * - lateralizable: propiedad de concepto `lateralizable` (boolean).
 *
 * Lo que el catálogo no declara devuelve `null` y la validación correspondiente
 * no se aplica: no se adivina una regla clínica.
 */
@Injectable()
export class TerminologyStudyCatalogAdapter implements StudyCatalogPort {
  async findStudy(
    em: EntityManager,
    conceptId: string,
  ): Promise<StudyCatalogEntry | null> {
    if (!(await this.isInValueSet(em, 'service-request-code', conceptId))) {
      return null;
    }
    const [family, components, modality] = await Promise.all([
      this.property(em, conceptId, 'study_family'),
      this.panelComponentIds(em, conceptId),
      this.modalityOf(em, conceptId),
    ]);
    return {
      conceptId,
      family: isFamily(family) ? family : null,
      componentsSelectable: components.size > 0,
      modalityConceptId: modality,
    };
  }

  async panelComponentIds(
    em: EntityManager,
    panelConceptId: string,
  ): Promise<ReadonlySet<string>> {
    const found = new Set<string>();
    let frontier = [panelConceptId];
    for (
      let depth = 0;
      depth < MAX_PANEL_DEPTH && frontier.length > 0;
      depth++
    ) {
      const rows = await em
        .getConnection()
        .execute<{ source_concept_id: string; target_concept_id: string }[]>(
          `SELECT source_concept_id, target_concept_id
           FROM terminology.concept_relationships
          WHERE relationship_type_concept_id = ?
            AND (target_concept_id = ANY(string_to_array(?, ',')::uuid[])
                 OR source_concept_id = ANY(string_to_array(?, ',')::uuid[]))`,
          [CONCEPTS.REL_PART_OF, frontier.join(','), frontier.join(',')],
          'all',
        );
      const next: string[] = [];
      const inFrontier = new Set(frontier);
      for (const row of rows) {
        const child = inFrontier.has(row.target_concept_id)
          ? row.source_concept_id
          : row.target_concept_id;
        if (child === panelConceptId || found.has(child)) continue;
        found.add(child);
        next.push(child);
      }
      frontier = next;
    }
    return found;
  }

  async isInValueSet(
    em: EntityManager,
    valueSet: StudyValueSetCode,
    conceptId: string,
  ): Promise<boolean> {
    const rows = await em.getConnection().execute<{ ok: number }[]>(
      `SELECT 1 AS ok
         FROM terminology.value_sets vs
         JOIN terminology.value_set_versions v
           ON v.value_set_id = vs.id AND v.is_default = true
         JOIN terminology.value_set_members m
           ON m.value_set_version_id = v.id AND m.included = true
        WHERE vs.internal_code = ? AND m.concept_id = ?
        LIMIT 1`,
      [valueSet, conceptId],
      'all',
    );
    return rows.length > 0;
  }

  async findBodySite(
    em: EntityManager,
    conceptId: string,
  ): Promise<BodySiteEntry | null> {
    if (!(await this.isInValueSet(em, 'imaging-body-structure', conceptId))) {
      return null;
    }
    const value = await this.property(em, conceptId, 'lateralizable');
    return {
      conceptId,
      lateralizable: typeof value === 'boolean' ? value : null,
    };
  }

  private async property(
    em: EntityManager,
    conceptId: string,
    code: string,
  ): Promise<unknown> {
    const rows = await em.getConnection().execute<{ value_json: unknown }[]>(
      `SELECT value_json FROM terminology.concept_properties
          WHERE concept_id = ? AND property_code = ? LIMIT 1`,
      [conceptId, code],
      'all',
    );
    return rows[0]?.value_json ?? null;
  }

  private async modalityOf(
    em: EntityManager,
    conceptId: string,
  ): Promise<string | null> {
    const rows = await em.getConnection().execute<{ target: string }[]>(
      `SELECT r.target_concept_id AS target
         FROM terminology.concept_relationships r
         JOIN terminology.catalog_concepts t ON t.id = r.relationship_type_concept_id
        WHERE r.source_concept_id = ? AND t.code = 'has-modality'
        ORDER BY r.target_concept_id
        LIMIT 1`,
      [conceptId],
      'all',
    );
    return rows[0]?.target ?? null;
  }
}

function isFamily(value: unknown): value is StudyFamily {
  return value === 'LAB' || value === 'IMAGING' || value === 'OTHER';
}
