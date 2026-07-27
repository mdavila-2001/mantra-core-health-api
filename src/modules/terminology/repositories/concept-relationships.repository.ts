import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConceptRelationships } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar una relación entre conceptos. */
export interface CreateConceptRelationshipData {
  sourceConceptId: string;
  targetConceptId: string;
  relationshipTypeConceptId: string;
  ordinal?: number;
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
