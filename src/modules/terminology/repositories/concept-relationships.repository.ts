import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConceptRelationships } from '../entities';
import { createdBy } from '../../../common';
import type { GlossaryRelationDirection } from '../glossary.constants';

/** Cuántos vecinos distintos tiene un concepto por tipo de relación y sentido. */
export interface RelationCountByType {
  /** `relationship_type_concept_id` del grupo. */
  relationshipTypeConceptId: string;
  /** De qué lado de la relación está el concepto consultado. */
  direction: GlossaryRelationDirection;
  /** Vecinos distintos del grupo. */
  total: number;
}

/** Qué vecinos cuentan: los que el glosario público puede mostrar. */
export interface NeighborCountScope {
  /** `state_concept_id` que debe tener el vecino (el término publicado). */
  neighborStateConceptId: string;
  /** Código de la propiedad que da el slug; sin ella el vecino no es navegable. */
  slugPropertyCode: string;
}

/**
 * Una evidencia de una relación, con sus calificadores ya traducidos a código
 * de concepto (`catalog_concepts.code`). Es lo que el vecindario del glosario
 * necesita para decir de dónde sale una relación y a quién aplica.
 */
export interface RelationshipEvidenceSummary {
  /** `concept_relationship_id` de la evidencia. */
  relationshipId: string;
  /** Id de origen en la fuente (`ORPHA:…`, PMID, `NNAC25_…`). */
  sourceReference: string;
  /** Código del sexo al que aplica; `null` si aplica a todos. */
  sexCode: string | null;
  ageMinDays: number | null;
  ageMaxDays: number | null;
  /** Código de aplicabilidad en el embarazo; `null` si la fuente no lo dice. */
  pregnancyCode: string | null;
  /** Código del nivel de atención (I, II, III); `null` si no lo restringe. */
  careLevelCode: string | null;
  /** Código de la línea de tratamiento; `null` si no lo dice. */
  lineOfTherapyCode: string | null;
}

/** Datos mínimos para materializar una relación entre conceptos. */
export interface CreateConceptRelationshipData {
  /**
   * Identificador asociado a source concept.
   */
  sourceConceptId: string;
  /**
   * Identificador asociado a target concept.
   */
  targetConceptId: string;
  /**
   * Identificador asociado a relationship type concept.
   */
  relationshipTypeConceptId: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.concept_relationships`.
 *
 * Métodos sin estado que reciben el `EntityManager` activo; la transacción y las
 * reglas de negocio viven en el servicio.
 */
@Injectable()
export class ConceptRelationshipsRepository {
  /** Busca una relación equivalente (mismo origen, destino y tipo); `null` si no existe. */
  findEquivalent(
    em: EntityManager,
    sourceConceptId: string,
    targetConceptId: string,
    relationshipTypeConceptId: string,
  ): Promise<ConceptRelationships | null> {
    return em.findOne(ConceptRelationships, {
      sourceConceptId,
      targetConceptId,
      relationshipTypeConceptId,
    });
  }

  /**
   * Aristas de un tipo dado cuyo origen está entre los conceptos indicados.
   *
   * La expansión con operador `is-a` necesita recorrer la jerarquía (UC-03-08), y
   * traerla acotada a los conceptos de la versión evita cargar el grafo completo
   * del catálogo para resolver una sola regla.
   */
  findByTypeForSources(
    em: EntityManager,
    relationshipTypeConceptId: string,
    sourceConceptIds: string[],
  ): Promise<ConceptRelationships[]> {
    if (sourceConceptIds.length === 0) return Promise.resolve([]);
    return em.find(ConceptRelationships, {
      relationshipTypeConceptId,
      sourceConceptId: { $in: sourceConceptIds },
    });
  }

  /**
   * Aristas de cualquiera de los tipos indicados cuyo origen está entre los
   * conceptos indicados.
   *
   * Es lo que necesita la ficha/búsqueda del glosario para resolver las
   * relaciones tipadas (`RELATED_TERM`/`DISEASE`/`PROCEDURE`/`TREATMENT`/
   * `ANATOMY`/`DIAGNOSTIC_TEST`) de un lote de términos en una sola consulta,
   * en vez de una por término y por tipo.
   */
  findByTypesForSources(
    em: EntityManager,
    relationshipTypeConceptIds: string[],
    sourceConceptIds: string[],
  ): Promise<ConceptRelationships[]> {
    if (
      relationshipTypeConceptIds.length === 0 ||
      sourceConceptIds.length === 0
    ) {
      return Promise.resolve([]);
    }
    return em.find(ConceptRelationships, {
      relationshipTypeConceptId: { $in: relationshipTypeConceptIds },
      sourceConceptId: { $in: sourceConceptIds },
    });
  }

  /**
   * Aristas de cualquiera de los tipos indicados cuyo **destino** está entre los
   * conceptos indicados: el espejo de `findByTypesForSources`.
   *
   * Las relaciones del glosario se guardan en un solo sentido —la enfermedad
   * apunta al síntoma, no al revés—, así que el mapa de un síntoma sólo puede
   * mostrar las enfermedades que lo presentan leyendo este camino inverso.
   */
  findByTypesForTargets(
    em: EntityManager,
    relationshipTypeConceptIds: string[],
    targetConceptIds: string[],
  ): Promise<ConceptRelationships[]> {
    if (
      relationshipTypeConceptIds.length === 0 ||
      targetConceptIds.length === 0
    ) {
      return Promise.resolve([]);
    }
    return em.find(ConceptRelationships, {
      relationshipTypeConceptId: { $in: relationshipTypeConceptIds },
      targetConceptId: { $in: targetConceptIds },
    });
  }

  /**
   * Cuántos vecinos distintos tiene un concepto por tipo y sentido, en un
   * único `GROUP BY` por sentido.
   *
   * Cuenta **vecinos**, no filas: la tabla todavía no tiene índice único por
   * clave natural (llega en TAREA-41 F1), así que una arista repetida no puede
   * inflar el total. Quedan fuera la autorreferencia y los vecinos que el
   * glosario público no muestra (sin el estado publicado o sin slug), con el
   * mismo criterio con que el servicio arma los ítems: el `total` de un grupo
   * nunca promete más vecinos de los que se pueden abrir.
   *
   * @param em - Contexto de persistencia.
   * @param conceptId - Concepto cuyo vecindario se cuenta.
   * @param relationshipTypeConceptIds - Tipos de relación a contar.
   * @param scope - Qué vecinos cuentan.
   * @returns Un elemento por tipo y sentido con al menos un vecino.
   */
  async countNeighborsByType(
    em: EntityManager,
    conceptId: string,
    relationshipTypeConceptIds: string[],
    scope: NeighborCountScope,
  ): Promise<RelationCountByType[]> {
    if (relationshipTypeConceptIds.length === 0) return [];
    const [outgoing, incoming] = await Promise.all([
      this.countNeighborsInDirection(
        em,
        conceptId,
        relationshipTypeConceptIds,
        scope,
        'outgoing',
      ),
      this.countNeighborsInDirection(
        em,
        conceptId,
        relationshipTypeConceptIds,
        scope,
        'incoming',
      ),
    ]);
    return [...outgoing, ...incoming];
  }

  /** El `GROUP BY` de un sentido; ver `countNeighborsByType`. */
  private async countNeighborsInDirection(
    em: EntityManager,
    conceptId: string,
    relationshipTypeConceptIds: string[],
    scope: NeighborCountScope,
    direction: GlossaryRelationDirection,
  ): Promise<RelationCountByType[]> {
    const ownColumn =
      direction === 'outgoing' ? 'source_concept_id' : 'target_concept_id';
    const neighborColumn =
      direction === 'outgoing' ? 'target_concept_id' : 'source_concept_id';
    const rows: { type_id: string; total: string | number }[] = await em
      .getConnection()
      .execute(
        `SELECT r.relationship_type_concept_id AS type_id,
                count(DISTINCT r.${neighborColumn}) AS total
           FROM terminology.concept_relationships r
           JOIN terminology.catalog_concepts n ON n.id = r.${neighborColumn}
          WHERE r.${ownColumn} = ?
            AND r.${neighborColumn} <> ?
            AND r.relationship_type_concept_id IN (?)
            AND n.state_concept_id = ?
            AND EXISTS (SELECT 1
                          FROM terminology.concept_properties p
                         WHERE p.concept_id = n.id
                           AND p.property_code = ?
                           AND jsonb_typeof(p.value_json) = 'string')
          GROUP BY r.relationship_type_concept_id`,
        [
          conceptId,
          conceptId,
          [...relationshipTypeConceptIds],
          scope.neighborStateConceptId,
          scope.slugPropertyCode,
        ],
      );
    return rows.map((row) => ({
      relationshipTypeConceptId: row.type_id,
      direction,
      total: Number(row.total),
    }));
  }

  /**
   * La evidencia de un lote de relaciones, con los calificadores traducidos a
   * código de concepto en la misma consulta.
   *
   * El vecindario la pide sólo para los vecinos de la página que tienen
   * evidencia (`evidence_count > 0`), así que el lote es chico y el camino es
   * el índice de la FK `concept_relationship_id`.
   *
   * @param em - Contexto de persistencia.
   * @param relationshipIds - Relaciones cuya evidencia se quiere.
   * @returns Una fila por evidencia, ordenadas por relación y referencia.
   */
  async findEvidenceSummaries(
    em: EntityManager,
    relationshipIds: string[],
  ): Promise<RelationshipEvidenceSummary[]> {
    if (relationshipIds.length === 0) return [];
    const rows: {
      relationship_id: string;
      source_reference: string;
      sex_code: string | null;
      age_min_days: number | null;
      age_max_days: number | null;
      pregnancy_code: string | null;
      care_level_code: string | null;
      line_of_therapy_code: string | null;
    }[] = await em.getConnection().execute(
      `SELECT e.concept_relationship_id AS relationship_id,
              e.source_reference,
              sex.code AS sex_code,
              e.age_min_days,
              e.age_max_days,
              pregnancy.code AS pregnancy_code,
              care.code AS care_level_code,
              line.code AS line_of_therapy_code
         FROM terminology.concept_relationship_evidence e
         LEFT JOIN terminology.catalog_concepts sex
                ON sex.id = e.sex_concept_id
         LEFT JOIN terminology.catalog_concepts pregnancy
                ON pregnancy.id = e.pregnancy_applicability_concept_id
         LEFT JOIN terminology.catalog_concepts care
                ON care.id = e.care_level_concept_id
         LEFT JOIN terminology.catalog_concepts line
                ON line.id = e.line_of_therapy_concept_id
        WHERE e.concept_relationship_id IN (?)
        ORDER BY e.concept_relationship_id, e.source_reference`,
      [[...relationshipIds]],
    );
    return rows.map((row) => ({
      relationshipId: row.relationship_id,
      sourceReference: row.source_reference,
      sexCode: row.sex_code,
      ageMinDays: row.age_min_days,
      ageMaxDays: row.age_max_days,
      pregnancyCode: row.pregnancy_code,
      careLevelCode: row.care_level_code,
      lineOfTherapyCode: row.line_of_therapy_code,
    }));
  }

  /** Crea la relación en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateConceptRelationshipData,
  ): ConceptRelationships {
    return em.create(
      ConceptRelationships,
      {
        sourceConceptId: data.sourceConceptId,
        targetConceptId: data.targetConceptId,
        relationshipTypeConceptId: data.relationshipTypeConceptId,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
