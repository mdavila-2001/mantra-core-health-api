import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FacilityTypologyRules, SpaceFormParentRules } from '../entities';
import {
  PRACTICE_CONCEPT_BY_ID,
  type FormCode,
  type ParentRule,
  type TypologyRule,
  type TypologyRuleCode,
} from '../domain/structure/structure-catalog';

/**
 * Reglas del árbol físico tal como están en la base (F1).
 *
 * Las tablas guardan concept ids; acá se traducen a códigos para que las
 * reglas puras (`domain/structure/structure-rules.ts`) trabajen sin uuids.
 * Una fila cuyo concepto no reconoce este módulo se descarta: no es una regla
 * que la API sepa aplicar, y aplicarla a ciegas sería peor que ignorarla.
 */
@Injectable()
export class StructureRulesRepository {
  /**
   * Reglas padre→hijo vigentes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   */
  async parentRules(em: EntityManager): Promise<ParentRule[]> {
    const rows = await em.find(SpaceFormParentRules, {});
    return rows.flatMap((row) => {
      const parent = PRACTICE_CONCEPT_BY_ID.get(row.parentFormConceptId)?.code;
      const child = PRACTICE_CONCEPT_BY_ID.get(row.childFormConceptId)?.code;
      return parent && child
        ? [{ parent: parent as FormCode, child: child as FormCode }]
        : [];
    });
  }

  /**
   * Reglas de tipología vigentes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   */
  async typologyRules(em: EntityManager): Promise<TypologyRule[]> {
    const rows = await em.find(FacilityTypologyRules, {});
    return rows.flatMap((row) => {
      const typology = PRACTICE_CONCEPT_BY_ID.get(row.typologyConceptId)?.code;
      const fn = PRACTICE_CONCEPT_BY_ID.get(row.spaceFunctionConceptId)?.code;
      const rule = PRACTICE_CONCEPT_BY_ID.get(row.ruleConceptId)?.code;
      return typology && fn && rule
        ? [{ typology, function: fn, rule: rule as TypologyRuleCode }]
        : [];
    });
  }
}
