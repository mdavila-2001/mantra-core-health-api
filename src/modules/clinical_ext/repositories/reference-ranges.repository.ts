import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ReferenceRanges } from '../entities';

/**
 * Acceso de solo lectura a los rangos de referencia de `clinical_ext.reference_ranges`.
 *
 * El analito se identifica por `code_concept_id`; un mismo analito tiene varios
 * rangos (por sexo, edad o condición), por lo que la consulta por analito
 * devuelve una lista. La tabla no modela un laboratorio propietario (`source` es
 * texto libre), así que no existe una búsqueda por laboratorio a nivel de FK.
 */
@Injectable()
export class ReferenceRangesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ReferenceRanges | null>`.
   */
  findById(em: EntityManager, id: string): Promise<ReferenceRanges | null> {
    return em.findOne(ReferenceRanges, { id });
  }

  /**
   * Rangos de referencia de un analito (`code_concept_id`): varios por
   * estratificación de sexo, edad o condición.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param codeConceptId - Identificador de code concept del analito.
   * @returns Resultado de list by analyte conforme al contrato `Promise<ReferenceRanges[]>`.
   */
  listByAnalyte(
    em: EntityManager,
    codeConceptId: string,
  ): Promise<ReferenceRanges[]> {
    return em.find(ReferenceRanges, { codeConceptId });
  }
}
