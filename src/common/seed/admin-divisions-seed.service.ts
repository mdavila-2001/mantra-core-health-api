import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  ConceptDesignations,
  ConceptProperties,
  ValueSetMembers,
  ValueSets,
  ValueSetVersions,
} from '../../modules/terminology/entities';
import { CONCEPTS, SEED } from '../constants/concepts';
import {
  ADMIN_DIVISION_COUNTRY_PROPERTY_CODE,
  ADMIN_DIVISION_LEVEL_PROPERTY_CODE,
  ADMIN_DIVISION_PARENT_PROPERTY_CODE,
  ADMIN_DIVISION_VALUE_SET,
  ADMIN_DIVISION_VALUE_SET_NAME,
  ADMIN_DIVISION_VERSION,
  adminDivisionCanonicalUrl,
  adminDivisionDesignationId,
  adminDivisionMemberId,
  adminDivisionPropertyId,
  adminDivisionValueSetId,
  adminDivisionVersionId,
  allAdminDivisions,
  type AdminDivisionSeed,
} from './admin-divisions.catalog';

/** Tipo de dato de las tres propiedades, en el vocabulario de `concept_properties`. */
const STRING_DATA_TYPE = 'string';

type Em = ReturnType<MikroORM['em']['fork']>;

/**
 * Materializa `VS_ADMIN_DIVISION`: las divisiones administrativas de todo país
 * con catálogo, con su país, su nivel y su padre (ADR-0028).
 *
 * ## Qué crea y qué no
 *
 * - **Conceptos**: sólo los que el catálogo declara propios
 *   (`ownsConcept`), hoy las 112 provincias de Bolivia. Los departamentos y
 *   los municipios ya los siembra `BoGeographySeedService` con los mismos ids;
 *   este sembrador no los duplica.
 * - **Designación preferida**: sólo de los conceptos propios.
 * - **Propiedades** `geo:country`, `geo:level` y `geo:parent`: de todas las
 *   divisiones, propias o no. Son las que hacen al árbol navegable sin
 *   interpretar códigos de un país en particular.
 * - **Membresías** del conjunto: todas, en el orden del catálogo (país, y
 *   dentro de cada país, nivel por nivel en el orden oficial).
 *
 * ## Idempotencia y orden
 *
 * Todo id es determinista: una segunda corrida no inserta nada. Corre
 * **después** de `BoGeographySeedService`, porque las propiedades y las
 * membresías apuntan a sus conceptos: el orquestador impone el orden.
 */
@Injectable()
export class AdminDivisionsSeedService {
  /**
   * @param orm - Acceso al contexto de persistencia.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdminDivisionsSeedService.name);
  }

  /**
   * Ejecuta el seed.
   *
   * @returns Cuántas filas insertó esta pasada, por nivel.
   */
  async run(): Promise<{
    valueSets: number;
    versions: number;
    concepts: number;
    designations: number;
    properties: number;
    memberships: number;
  }> {
    const divisions = allAdminDivisions();
    this.assertTree(divisions);

    const em = this.orm.em.fork();
    const now = new Date();
    const counters = {
      valueSets: 0,
      versions: 0,
      concepts: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
    };

    const valueSetIdentifier = await this.resolveValueSetId(em, now, counters);
    await em.flush();
    const versionIdentifier = await this.resolveVersionId(
      em,
      now,
      valueSetIdentifier,
      counters,
    );
    await em.flush();

    const owned = divisions.filter((division) => division.ownsConcept);
    counters.concepts += await this.seedConcepts(em, now, owned);
    counters.designations += await this.seedDesignations(em, now, owned);
    counters.properties += await this.seedProperties(em, now, divisions);
    counters.memberships += await this.seedMemberships(
      em,
      now,
      versionIdentifier,
      divisions,
    );

    const total = Object.values(counters).reduce((a, b) => a + b, 0);
    if (total > 0) {
      this.logger.info(
        { operation: 'seed.admin-divisions', ...counters },
        'Catálogo de divisiones administrativas materializado',
      );
    }
    return counters;
  }

  /**
   * Rompe el arranque si el catálogo no es un árbol: ids repetidos, un padre
   * que no está, un padre de otro país o de un nivel que no es el anterior.
   * Una arista rota entra a la base sin error y revienta después, lejos.
   */
  private assertTree(divisions: readonly AdminDivisionSeed[]): void {
    const byId = new Map<string, AdminDivisionSeed>();
    for (const division of divisions) {
      if (byId.has(division.conceptId)) {
        throw new Error(
          `El catálogo de divisiones declara dos veces el concepto ${division.conceptCode}`,
        );
      }
      byId.set(division.conceptId, division);
    }
    for (const division of divisions) {
      if (division.level === 1) {
        if (division.parentConceptId !== null) {
          throw new Error(
            `La división de nivel 1 ${division.conceptCode} no puede tener padre`,
          );
        }
        continue;
      }
      const parent =
        division.parentConceptId === null
          ? undefined
          : byId.get(division.parentConceptId);
      if (
        parent === undefined ||
        parent.country !== division.country ||
        parent.level !== division.level - 1
      ) {
        throw new Error(
          `La división ${division.conceptCode} cuelga de un padre que no es ` +
            `una división de nivel ${division.level - 1} de ${division.country}`,
        );
      }
    }
  }

  private async seedConcepts(
    em: Em,
    now: Date,
    owned: readonly AdminDivisionSeed[],
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      CatalogConcepts,
      owned.map((division) => division.conceptId),
    );
    let created = 0;
    for (const division of owned) {
      if (existing.has(division.conceptId)) continue;
      em.create(
        CatalogConcepts,
        {
          id: division.conceptId,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: division.conceptCode,
          display: division.name,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
    await em.flush();
    return created;
  }

  private async seedDesignations(
    em: Em,
    now: Date,
    owned: readonly AdminDivisionSeed[],
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ConceptDesignations,
      owned.map((division) => adminDivisionDesignationId(division.conceptId)),
    );
    let created = 0;
    for (const division of owned) {
      const id = adminDivisionDesignationId(division.conceptId);
      if (existing.has(id)) continue;
      em.create(
        ConceptDesignations,
        {
          id,
          conceptId: division.conceptId,
          value: division.name,
          languageConceptId: CONCEPTS.LANG_ES,
          designationTypeConceptId: CONCEPTS.DESIG_PREFERRED,
          preferred: true,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
    await em.flush();
    return created;
  }

  private async seedProperties(
    em: Em,
    now: Date,
    divisions: readonly AdminDivisionSeed[],
  ): Promise<number> {
    const rows = divisions.flatMap((division) => {
      const own = [
        {
          id: adminDivisionPropertyId(division.conceptId, 'country'),
          code: ADMIN_DIVISION_COUNTRY_PROPERTY_CODE,
          value: division.country,
        },
        {
          id: adminDivisionPropertyId(division.conceptId, 'level'),
          code: ADMIN_DIVISION_LEVEL_PROPERTY_CODE,
          value: String(division.level),
        },
      ];
      if (division.parentConceptId !== null) {
        own.push({
          id: adminDivisionPropertyId(division.conceptId, 'parent'),
          code: ADMIN_DIVISION_PARENT_PROPERTY_CODE,
          value: division.parentConceptId,
        });
      }
      return own.map((row) => ({ ...row, conceptId: division.conceptId }));
    });

    const existing = await this.existingIds(
      em,
      ConceptProperties,
      rows.map((row) => row.id),
    );
    let created = 0;
    for (const row of rows) {
      if (existing.has(row.id)) continue;
      em.create(
        ConceptProperties,
        {
          id: row.id,
          conceptId: row.conceptId,
          propertyCode: row.code,
          dataType: STRING_DATA_TYPE,
          valueJson: row.value,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
    await em.flush();
    return created;
  }

  private async seedMemberships(
    em: Em,
    now: Date,
    versionIdentifier: string,
    divisions: readonly AdminDivisionSeed[],
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ValueSetMembers,
      divisions.map((division) => adminDivisionMemberId(division.conceptId)),
    );
    let created = 0;
    divisions.forEach((division, ordinal) => {
      const id = adminDivisionMemberId(division.conceptId);
      if (existing.has(id)) return;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: division.conceptId,
          included: true,
          ordinal,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    });
    await em.flush();
    return created;
  }

  /** El conjunto por su clave natural; si vino de otra siembra con otro id, ése manda. */
  private async resolveValueSetId(
    em: Em,
    now: Date,
    counters: { valueSets: number },
  ): Promise<string> {
    const present = await em.findOne(ValueSets, {
      internalCode: ADMIN_DIVISION_VALUE_SET,
    });
    if (present) return present.id;
    em.create(
      ValueSets,
      {
        id: adminDivisionValueSetId(),
        internalCode: ADMIN_DIVISION_VALUE_SET,
        name: ADMIN_DIVISION_VALUE_SET_NAME,
        canonicalUrl: adminDivisionCanonicalUrl(),
        stateConceptId: CONCEPTS.TERM_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    counters.valueSets += 1;
    return adminDivisionValueSetId();
  }

  /** La versión vigente: sin `isDefault`, la expansión sin versión daría 404. */
  private async resolveVersionId(
    em: Em,
    now: Date,
    valueSetIdentifier: string,
    counters: { versions: number },
  ): Promise<string> {
    const present = await em.findOne(ValueSetVersions, {
      valueSetId: valueSetIdentifier,
      version: ADMIN_DIVISION_VERSION,
    });
    if (present) return present.id;
    em.create(
      ValueSetVersions,
      {
        id: adminDivisionVersionId(),
        valueSetId: valueSetIdentifier,
        version: ADMIN_DIVISION_VERSION,
        validFrom: now,
        isDefault: true,
        stateConceptId: CONCEPTS.TERM_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    counters.versions += 1;
    return adminDivisionVersionId();
  }

  private async existingIds<T extends object>(
    em: Em,
    entity: new () => T,
    ids: string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await em.find(
      entity,
      { id: { $in: ids } },
      { fields: ['id'] as never },
    );
    return new Set(rows.map((row) => (row as { id: string }).id));
  }
}
