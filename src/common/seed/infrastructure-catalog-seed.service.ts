import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ATTRIBUTES,
  FORMS,
  FUNCTIONS,
  PARENT_RULE_SEEDS,
  REGULATORY,
  TYPOLOGY_RULE_SEEDS,
} from '../../modules/practice/infrastructure-catalog';
import { PRAC } from '../../modules/practice/practice.concepts';
import { InfrastructureRulesRepository } from '../../modules/practice/repositories/infrastructure-rules.repository';

/** Resultado de la siembra del catálogo de infraestructura. */
export interface InfrastructureCatalogSeedResult {
  /** Reglas padre→hijo insertadas. */
  readonly parentRules: number;
  /** Reglas de tipología insertadas. */
  readonly typologyRules: number;
  /** Espacios preexistentes a los que se les completó la forma `LOC_FORM_ROOM`. */
  readonly formBackfilled: number;
  /** Vínculos `OWNER` creados para espacios preexistentes que ya tenían unidad. */
  readonly ownerAssignments: number;
  /** Total de filas escritas (lo que cuenta el orquestador). */
  readonly inserted: number;
}

/**
 * Siembra los datos de infraestructura hospitalaria que el modelo no puede
 * sembrar porque sus ids de concepto son de la API (CONTRATO-F0-F1, Desvíos del
 * modelo):
 *
 * 1. `practice.space_form_parent_rules` y `practice.facility_typology_rules`
 *    (INV-18: las reglas son datos; la validación lee estas tablas).
 * 2. El backfill de `care_spaces.form_concept_id` a `LOC_FORM_ROOM` en los
 *    espacios que existían antes de F1.
 * 3. El vínculo `OWNER` espacio ↔ unidad de los espacios que ya tenían
 *    `clinical_unit_id` (el árbol organizativo ligado al físico).
 *
 * Es idempotente: la segunda corrida inserta cero. Los pasos 2 y 3 tocan tablas
 * con RLS de varios tenants, así que corren en una transacción con el contexto
 * SYSTEM abierto sólo para ella (`set_config(…, true)` = `SET LOCAL`).
 */
@Injectable()
export class InfrastructureCatalogSeedService {
  /**
   * @param orm - Acceso al `EntityManager` raíz para abrir un fork propio.
   * @param rules - Repositorio de reglas.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly rules: InfrastructureRulesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InfrastructureCatalogSeedService.name);
  }

  /**
   * Siembra reglas y backfills.
   *
   * @returns Cuántas filas escribió cada paso.
   */
  async run(): Promise<InfrastructureCatalogSeedResult> {
    const em = this.orm.em.fork();

    const parentPairs = PARENT_RULE_SEEDS.flatMap((rule) =>
      rule.children.map(
        (child) =>
          [
            FORMS.byInput(`LOC_FORM_${rule.parent}`)!.id,
            FORMS.byInput(`LOC_FORM_${child}`)!.id,
          ] as const,
      ),
    );
    const parentRules = await this.rules.seedParentRules(em, parentPairs);

    const typologyRules = await this.rules.seedTypologyRules(
      em,
      TYPOLOGY_RULE_SEEDS.map((row) => ({
        typologyId: REGULATORY.typology.byInput(row.typology)!.id,
        functionId: FUNCTIONS.byInput(row.fn)!.id,
        ruleId: PRAC[row.rule],
      })),
    );

    const room = FORMS.byInput('LOC_FORM_ROOM')!.id;
    const owner = ATTRIBUTES.unitRole.byInput('SPACE_UNIT_ROLE_OWNER')!.id;
    const { formBackfilled, ownerAssignments } = await em.transactional(
      async (tx) => {
        await tx.execute(
          "select set_config('app.system_context', 'true', true)",
        );
        const filled = await tx.execute<{ id: string }[]>(
          `update practice.care_spaces set form_concept_id = ?
            where form_concept_id is null returning id`,
          [room],
        );
        const linked = await tx.execute<{ id: string }[]>(
          `insert into practice.space_unit_assignments
             (id, tenant_id, care_space_id, clinical_unit_id, role_concept_id,
              valid_from, created_at, updated_at, row_version)
           select gen_random_uuid(), cs.tenant_id, cs.id, cs.clinical_unit_id, ?,
                  coalesce(cs.valid_from, cs.created_at), now(), now(), 1
             from practice.care_spaces cs
            where cs.clinical_unit_id is not null
              and cs.status_concept_id <> ?
              and not exists (
                select 1 from practice.space_unit_assignments a
                 where a.care_space_id = cs.id
                   and a.clinical_unit_id = cs.clinical_unit_id
                   and a.valid_to is null)
           returning id`,
          [owner, PRAC.SPACE_RETIRED],
        );
        return {
          formBackfilled: filled.length,
          ownerAssignments: linked.length,
        };
      },
    );

    const inserted =
      parentRules + typologyRules + formBackfilled + ownerAssignments;
    if (inserted > 0) {
      this.logger.info(
        { parentRules, typologyRules, formBackfilled, ownerAssignments },
        'Catálogo de infraestructura hospitalaria sembrado',
      );
    }
    return {
      parentRules,
      typologyRules,
      formBackfilled,
      ownerAssignments,
      inserted,
    };
  }
}
