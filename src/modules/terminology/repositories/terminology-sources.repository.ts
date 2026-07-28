import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TerminologySources } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar una fuente de terminología. */
export interface CreateTerminologySourceData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a source type concept.
   */
  sourceTypeConceptId?: string;
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
 * Acceso a datos de `terminology.terminology_sources`.
 *
 * Los métodos reciben el `EntityManager` activo para que el servicio controle la
 * unidad de trabajo y la transacción; el repositorio solo construye consultas y
 * entidades, sin reglas de negocio.
 */
@Injectable()
export class TerminologySourcesRepository {
  /** Busca una fuente por su código de negocio; `null` si no existe. */
  findByCode(
    em: EntityManager,
    code: string,
  ): Promise<TerminologySources | null> {
    return em.findOne(TerminologySources, { code });
  }

  /** Crea la fuente en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateTerminologySourceData,
  ): TerminologySources {
    return em.create(
      TerminologySources,
      {
        code: data.code,
        name: data.name,
        sourceTypeConceptId: data.sourceTypeConceptId,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
