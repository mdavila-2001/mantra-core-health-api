import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConceptMaps } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar un mapeo entre conceptos. */
export interface UpsertConceptMapData {
  /**
   * Identificador asociado a source concept.
   */
  sourceConceptId: string;
  /**
   * Identificador asociado a target concept.
   */
  targetConceptId: string;
  /**
   * Identificador asociado a equivalence concept.
   */
  equivalenceConceptId?: string;
  /**
   * Valor de context mantenido por la instancia.
   */
  context?: string;
  /**
   * Valor de version mantenido por la instancia.
   */
  version?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.concept_maps` (UC-03-09).
 *
 * Métodos sin estado que reciben el `EntityManager` activo; la transacción y las
 * reglas de negocio viven en el servicio.
 */
@Injectable()
export class ConceptMapsRepository {
  /**
   * Mapeo por su clave natural `(origen, destino, contexto, versión)`. El caso de
   * uso declara `concept_maps — UPSERT`, así que recurar un mapa tiene que
   * reencontrar el existente en vez de añadir un segundo con otra equivalencia.
   */
  findEquivalent(
    em: EntityManager,
    sourceConceptId: string,
    targetConceptId: string,
    context: string | undefined,
    version: string | undefined,
  ): Promise<ConceptMaps | null> {
    return em.findOne(ConceptMaps, {
      sourceConceptId,
      targetConceptId,
      context: context ?? null,
      version: version ?? null,
    });
  }

  /** El mismo mapeo, bloqueado: dos recurados simultáneos compiten por la fila. */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ConceptMaps | null> {
    return em.findOne(
      ConceptMaps,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Traducciones activas de un concepto de origen. Es la lectura que sirve
   * `$translate`: un concepto puede mapear a varios destinos con equivalencias
   * distintas, y devolver sólo uno escondería el resto.
   */
  findTranslations(
    em: EntityManager,
    sourceConceptId: string,
    activeStateConceptId: string,
    context?: string,
  ): Promise<ConceptMaps[]> {
    const where: Record<string, unknown> = {
      sourceConceptId,
      stateConceptId: activeStateConceptId,
    };
    if (context) where.context = context;
    return em.find(ConceptMaps, where);
  }

  /** Crea el mapeo en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: UpsertConceptMapData): ConceptMaps {
    return em.create(
      ConceptMaps,
      {
        sourceConceptId: data.sourceConceptId,
        targetConceptId: data.targetConceptId,
        equivalenceConceptId: data.equivalenceConceptId,
        context: data.context,
        version: data.version,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
