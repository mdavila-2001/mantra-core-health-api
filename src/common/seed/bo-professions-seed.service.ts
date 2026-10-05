import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  ConceptDesignations,
  ValueSetMembers,
  ValueSets,
  ValueSetVersions,
} from '../../modules/terminology/entities';
import { CONCEPTS, SEED } from '../constants/concepts';
import {
  BO_PROFESSION_VALUE_SET,
  BO_PROFESSION_VALUE_SET_NAME,
  BO_PROFESSION_VERSION,
  BO_PROFESSIONS,
  boProfessionCanonicalUrl,
  boProfessionConceptCode,
  boProfessionConceptId,
  boProfessionDesignationId,
  boProfessionMemberId,
  boProfessionValueSetId,
  boProfessionVersionId,
} from './bo-professions.catalog';

type Em = ReturnType<MikroORM['em']['fork']>;

/** Lo que insertó una pasada, por nivel. */
export interface BoProfessionsSeedResult {
  valueSets: number;
  versions: number;
  professions: number;
  designations: number;
  memberships: number;
}

/**
 * Materializa `VS_BO_PROFESSION`: la COB-2023 del INE (grandes grupos 2 y 3),
 * que es la lista de «Otra profesión» en el alta del médico.
 *
 * La API es el único dueño del conjunto, como de `VS_BO_OCCUPATION`. Mismo
 * mecanismo de idempotencia que `BoOccupationsSeedService`: todo id es
 * determinista, se compara por id y se inserta sólo lo que falta. Corre después
 * de `TerminologySeedService` (los conceptos cuelgan de
 * `SEED.codeSystemVersionId` y las designaciones de `CONCEPTS.LANG_ES`).
 */
@Injectable()
export class BoProfessionsSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BoProfessionsSeedService.name);
  }

  /** Ejecuta el seed. Público para `yarn seed:boot` y el arnés de integración. */
  async run(): Promise<BoProfessionsSeedResult> {
    this.assertUniqueCodes();
    const em = this.orm.em.fork();
    const now = new Date();
    const audit = { createdAt: now, updatedAt: now };
    const counters: BoProfessionsSeedResult = {
      valueSets: await this.insertMissing(em, ValueSets, [
        {
          id: boProfessionValueSetId(),
          internalCode: BO_PROFESSION_VALUE_SET,
          name: BO_PROFESSION_VALUE_SET_NAME,
          canonicalUrl: boProfessionCanonicalUrl(),
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          ...audit,
        },
      ]),
      versions: await this.insertMissing(em, ValueSetVersions, [
        {
          id: boProfessionVersionId(),
          valueSetId: boProfessionValueSetId(),
          version: BO_PROFESSION_VERSION,
          validFrom: now,
          // Sin la marca, la expansión sin versión explícita devolvería 404.
          isDefault: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          ...audit,
        },
      ]),
      professions: await this.insertMissing(
        em,
        CatalogConcepts,
        BO_PROFESSIONS.map((profession) => ({
          id: boProfessionConceptId(profession.code),
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: boProfessionConceptCode(profession.code),
          display: profession.name,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          ...audit,
        })),
      ),
      designations: await this.insertMissing(
        em,
        ConceptDesignations,
        BO_PROFESSIONS.map((profession) => ({
          id: boProfessionDesignationId(profession.code),
          conceptId: boProfessionConceptId(profession.code),
          value: profession.name,
          languageConceptId: CONCEPTS.LANG_ES,
          designationTypeConceptId: CONCEPTS.DESIG_PREFERRED,
          preferred: true,
          ...audit,
        })),
      ),
      // El ordinal sigue el orden alfabético: es el orden del desplegable.
      memberships: await this.insertMissing(
        em,
        ValueSetMembers,
        [...BO_PROFESSIONS]
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))
          .map((profession, ordinal) => ({
            id: boProfessionMemberId(profession.code),
            valueSetVersionId: boProfessionVersionId(),
            conceptId: boProfessionConceptId(profession.code),
            included: true,
            ordinal,
            ...audit,
          })),
      ),
    };

    const total =
      counters.valueSets +
      counters.versions +
      counters.professions +
      counters.designations +
      counters.memberships;
    if (total > 0) {
      this.logger.info(
        { operation: 'seed.bo-professions', ...counters },
        'Catálogo de profesiones COB-2023 materializado',
      );
    }
    return counters;
  }

  /** Rompe si dos entradas comparten código: colapsarían en el mismo id. */
  private assertUniqueCodes(): void {
    const vistos = new Set<string>();
    for (const profession of BO_PROFESSIONS) {
      if (vistos.has(profession.code)) {
        throw new Error(
          `El catálogo de profesiones declara el código "${profession.code}" más de una vez`,
        );
      }
      vistos.add(profession.code);
    }
  }

  /** Inserta las filas cuyo id todavía no está en la base y cuenta cuántas. */
  private async insertMissing<T extends object>(
    em: Em,
    entity: new () => T,
    rows: readonly ({ id: string } & Record<string, unknown>)[],
  ): Promise<number> {
    if (rows.length === 0) return 0;
    const existentes = await em.find(
      entity,
      { id: { $in: rows.map((row) => row.id) } },
      { fields: ['id'] as never },
    );
    const ids = new Set(existentes.map((row) => (row as { id: string }).id));
    const faltantes = rows.filter((row) => !ids.has(row.id));
    for (const row of faltantes) {
      em.create(entity, row as never, { partial: true });
    }
    await em.flush();
    return faltantes.length;
  }
}
