import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProcessingPurposes } from '../entities';

/** Acceso a datos de `consent.processing_purposes` (catálogo, sin tenant). */
@Injectable()
export class ProcessingPurposesRepository {
  /**
   * Resuelve un propósito de tratamiento por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del propósito.
   * @returns El propósito, o `null` si no existe.
   */
  findById(em: EntityManager, id: string): Promise<ProcessingPurposes | null> {
    return em.findOne(ProcessingPurposes, { id });
  }
}
