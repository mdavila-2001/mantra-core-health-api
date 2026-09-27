import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AllergyReactions } from '../entities';

/**
 * BR-14 (CL-11): lectura de `clinical.allergy_reactions` para el resumen del
 * paciente. `AllergyIntolerancesRepository` (de M3) ya escribe esta tabla
 * desde `AllergyIntolerancesService.create`, pero no expone una lectura en
 * lote por alergia — el resumen clínico (`ClinicalReadService`, que no es de
 * M3) la necesitaba y no existía.
 *
 * Archivo y clase **nuevos e independientes**: no toca
 * `allergy-intolerances.repository.ts` ni `allergy-intolerances.service.ts`
 * (dueño M3), sólo lee la misma tabla desde otro repositorio de sólo lectura,
 * igual criterio que ya usa el resto de `clinical` con repos de otros módulos
 * (clases sin estado, `EntityManager` por parámetro).
 */
@Injectable()
export class AllergyReactionsReadRepository {
  /**
   * Todas las reacciones de un lote de alergias, en una sola consulta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param allergyIds - Alergias cuyas reacciones se quieren leer.
   * @returns Las reacciones encontradas, en cualquier orden.
   */
  findByAllergyIds(
    em: EntityManager,
    allergyIds: readonly string[],
  ): Promise<AllergyReactions[]> {
    if (allergyIds.length === 0) return Promise.resolve([]);
    return em.find(AllergyReactions, { allergyId: { $in: [...allergyIds] } });
  }
}
