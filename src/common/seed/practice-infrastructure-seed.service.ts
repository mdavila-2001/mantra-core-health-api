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

/** Output metrics from infrastructure seed execution. */
export interface PracticeInfrastructureSeedResult {
  parentRules: number;
  typologyRules: number;
  formBackfill: number;
}

const idOf = (code: string): string => PRACTICE_CONCEPT_BY_CODE.get(code)!.id;

/**
 * Seeds physical tree rules and backfills care space form concepts.
 * Runs in SYSTEM context to bypass RLS during cross-tenant backfill.
 */
@Injectable()
export class PracticeInfrastructureSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeInfrastructureSeedService.name);
  }

  /** Seeds missing parent rules, typology rules, and backfills null room forms. */
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
          'Infrastructure rules seeded and forms backfilled',
        );
      }
      return { parentRules, typologyRules, formBackfill };
    });
  }
}
