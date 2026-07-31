import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Practices } from '../../practice/entities';

/**
 * Lectura mínima de `practice.practices`, solo lo que el worker de morosidad
 * (Fase 4 del plan de corrección de workers) necesita para agrupar facturas
 * por tenant: `invoices` no tiene `tenant_id` propio, solo `practice_id`
 * (columna uuid plana, no relación del ORM), así que hay que resolverlo aquí.
 * No es un repositorio de negocio de `billing` — es deliberadamente estrecho.
 */
@Injectable()
export class PracticesLookupRepository {
  /** Prácticas activas, agrupables por tenant. */
  findActive(
    em: EntityManager,
    activeStatusConceptId: string,
  ): Promise<Practices[]> {
    return em.find(Practices, { statusConceptId: activeStatusConceptId });
  }
}
