import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  FacilityTypologyRules,
  SpaceFormParentRules,
} from '../../modules/practice/entities';
import { PRAC } from '../../modules/practice/practice.concepts';
import {
  PARENT_RULE_SEED,
  PRACTICE_CONCEPT_BY_CODE,
  TYPOLOGY_RULE_SEED,
} from '../../modules/practice/domain/structure/structure-catalog';
import { createdBy } from '../persistence/audit-fields';

/** Lo que insertó una corrida. */
export interface PracticeInfrastructureSeedResult {
  parentRules: number;
  typologyRules: number;
  formBackfill: number;
}

const idOf = (code: string): string => PRACTICE_CONCEPT_BY_CODE.get(code)!.id;

/**
 * Reglas del árbol físico y backfill de forma (F1 de infraestructura,
 * contrato §2 y «Desvíos» del modelo).
 *
 * - `practice.space_form_parent_rules` y `practice.facility_typology_rules`:
 *   el patch del modelo crea las tablas vacías porque los concept ids los
 *   deriva la API. Se insertan las filas que falten de `PARENT_RULE_SEED` y
 *   `TYPOLOGY_RULE_SEED`; una fila que ya está no se toca (puede haberla
 *   ajustado quien opera el catálogo).
 * - `practice.care_spaces.form_concept_id`: los espacios anteriores a F1
 *   quedan en `LOC_FORM_ROOM` (eran todos locales: el único tipo era
 *   `SPACE_TYPE_ROOM`).
 *
 * Idempotente: la segunda corrida inserta y actualiza cero filas. Corre en
 * contexto SYSTEM (SET LOCAL) porque `care_spaces` tiene RLS forzada y el
 * backfill cruza tenants.
 */
@Injectable()
export class PracticeInfrastructureSeedService {
  /**
   * @param orm - Para abrir un fork propio.
   * @param logger - Logger del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeInfrastructureSeedService.name);
  }

  /** Siembra lo que falte. */
  async run(): Promise<PracticeInfrastructureSeedResult> {
    const em = this.orm.em.fork();
    return em.transactional(async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      const now = new Date();

      const parents = await tx.find(SpaceFormParentRules, {});
      const havePair = new Set(
        parents.map((r) => `${r.parentFormConceptId}|${r.childFormConceptId}`),
      );
      let parentRules = 0;
      for (const rule of PARENT_RULE_SEED) {
        const parentId = idOf(rule.parent);
        const childId = idOf(rule.child);
        if (havePair.has(`${parentId}|${childId}`)) continue;
        tx.create(
          SpaceFormParentRules,
          {
            parentFormConceptId: parentId,
            childFormConceptId: childId,
            ...createdBy(undefined, now),
          },
          { partial: true },
        );
        parentRules += 1;
      }

      const typos = await tx.find(FacilityTypologyRules, {});
      const haveTypo = new Set(
        typos.map((r) => `${r.typologyConceptId}|${r.spaceFunctionConceptId}`),
      );
      let typologyRules = 0;
      for (const rule of TYPOLOGY_RULE_SEED) {
        const typologyId = idOf(rule.typology);
        const functionId = idOf(rule.function);
        if (haveTypo.has(`${typologyId}|${functionId}`)) continue;
        tx.create(
          FacilityTypologyRules,
          {
            typologyConceptId: typologyId,
            spaceFunctionConceptId: functionId,
            ruleConceptId: idOf(rule.rule),
            ...createdBy(undefined, now),
          },
          { partial: true },
        );
        typologyRules += 1;
      }
      await tx.flush();

      const updated = await tx.execute<{ id: string }[]>(
        `UPDATE practice.care_spaces
            SET form_concept_id = ?, updated_at = now()
          WHERE form_concept_id IS NULL
        RETURNING id`,
        [PRAC.LOC_FORM_ROOM],
        'all',
      );
      const formBackfill = updated.length;

      if (parentRules + typologyRules + formBackfill > 0) {
        this.logger.info(
          { parentRules, typologyRules, formBackfill },
          'Reglas de infraestructura sembradas y forma completada',
        );
      }
      return { parentRules, typologyRules, formBackfill };
    });
  }
}
