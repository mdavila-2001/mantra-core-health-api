import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CodeSystems } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar un sistema de códigos. */
export interface CreateCodeSystemData {
  sourceId: string;
  internalCode: string;
  name: string;
  canonicalUrl: string;
  contentTypeConceptId?: string;
  stateConceptId?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.code_systems`.
 *
 * Métodos sin estado que reciben el `EntityManager` activo; la transacción y las
 * reglas de negocio viven en el servicio.
 */
@Injectable()
export class CodeSystemsRepository {
  /** Busca un sistema de códigos por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<CodeSystems | null> {
    return em.findOne(CodeSystems, { id });
  }

  /** Busca un sistema de códigos por su código interno; `null` si no existe. */
  findByInternalCode(
    em: EntityManager,
    internalCode: string,
  ): Promise<CodeSystems | null> {
    return em.findOne(CodeSystems, { internalCode });
  }

  /**
   * Busca un sistema de códigos por su URL canónica. Es el identificador con el
   * que `$lookup` recibe el `system` (UC-03-11): en FHIR un sistema se nombra por
   * su canonical URL, no por su id interno.
   */
  findByCanonicalUrl(
    em: EntityManager,
    canonicalUrl: string,
  ): Promise<CodeSystems | null> {
    return em.findOne(CodeSystems, { canonicalUrl });
  }

  /** Crea el sistema de códigos en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateCodeSystemData): CodeSystems {
    return em.create(
      CodeSystems,
      {
        sourceId: data.sourceId,
        internalCode: data.internalCode,
        name: data.name,
        canonicalUrl: data.canonicalUrl,
        contentTypeConceptId: data.contentTypeConceptId,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
