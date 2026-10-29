import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FacilityTypologyRules, SpaceFormParentRules } from '../entities';
import { PRAC } from '../practice.concepts';
import { createdBy } from '../../../common';
import type { RuleSet } from '../services/infrastructure-rules';

/**
 * Lee y siembra las reglas de infraestructura (`space_form_parent_rules` y
 * `facility_typology_rules`). Son catálogos globales —sin tenant ni RLS—.
 */
@Injectable()
export class InfrastructureRulesRepository {
  /**
   * Carga todas las reglas. Son decenas de filas: se leen enteras en cada
   * validación en vez de cachearlas, porque «las reglas son datos» y un cambio
   * de la tabla debe valer en la siguiente petición.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @returns Las reglas como conjuntos de ids de concepto.
   */
  async loadRuleSet(em: EntityManager): Promise<RuleSet> {
    const [parents, typologies] = await Promise.all([
      em.find(SpaceFormParentRules, {}),
      em.find(FacilityTypologyRules, {}),
    ]);
    const parentChildren = new Map<string, Set<string>>();
    for (const rule of parents) {
      const set = parentChildren.get(rule.parentFormConceptId) ?? new Set();
      set.add(rule.childFormConceptId);
      parentChildren.set(rule.parentFormConceptId, set);
    }
    const typologyAllowed = new Map<string, Set<string>>();
    const typologyRequired = new Map<string, Set<string>>();
    for (const rule of typologies) {
      const target =
        rule.ruleConceptId === PRAC.TYPO_REQUIRED
          ? typologyRequired
          : typologyAllowed;
      const set = target.get(rule.typologyConceptId) ?? new Set();
      set.add(rule.spaceFunctionConceptId);
      target.set(rule.typologyConceptId, set);
    }
    return { parentChildren, typologyAllowed, typologyRequired };
  }

  /**
   * Inserta las reglas padre→hijo que falten (idempotente).
   *
   * @param em - Contexto de persistencia.
   * @param pairs - Pares `[formaPadreId, formaHijaId]` de la semilla.
   * @returns Cuántas filas se insertaron.
   */
  async seedParentRules(
    em: EntityManager,
    pairs: ReadonlyArray<readonly [string, string]>,
  ): Promise<number> {
    const existing = await em.find(SpaceFormParentRules, {});
    const have = new Set(
      existing.map((r) => `${r.parentFormConceptId}>${r.childFormConceptId}`),
    );
    let inserted = 0;
    for (const [parent, child] of pairs) {
      if (have.has(`${parent}>${child}`)) continue;
      em.create(
        SpaceFormParentRules,
        {
          parentFormConceptId: parent,
          childFormConceptId: child,
          ...createdBy(),
        },
        { partial: true },
      );
      inserted += 1;
    }
    if (inserted > 0) await em.flush();
    return inserted;
  }

  /**
   * Inserta las reglas de tipología que falten (idempotente). Una fila
   * existente con otra regla no se pisa: lo que el operador cambió a mano es
   * suyo.
   *
   * @param em - Contexto de persistencia.
   * @param rows - Filas de la semilla (ids de concepto).
   * @returns Cuántas filas se insertaron.
   */
  async seedTypologyRules(
    em: EntityManager,
    rows: ReadonlyArray<{
      /** Tipología. */
      typologyId: string;
      /** Función. */
      functionId: string;
      /** Regla (`TYPO_ALLOWED` / `TYPO_REQUIRED`). */
      ruleId: string;
    }>,
  ): Promise<number> {
    const existing = await em.find(FacilityTypologyRules, {});
    const have = new Set(
      existing.map((r) => `${r.typologyConceptId}|${r.spaceFunctionConceptId}`),
    );
    let inserted = 0;
    for (const row of rows) {
      if (have.has(`${row.typologyId}|${row.functionId}`)) continue;
      em.create(
        FacilityTypologyRules,
        {
          typologyConceptId: row.typologyId,
          spaceFunctionConceptId: row.functionId,
          ruleConceptId: row.ruleId,
          ...createdBy(),
        },
        { partial: true },
      );
      inserted += 1;
    }
    if (inserted > 0) await em.flush();
    return inserted;
  }
}
