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
  BO_OCCUPATION_GROUP_PROPERTY_CODE,
  BO_OCCUPATION_VALUE_SET,
  BO_OCCUPATION_VALUE_SET_NAME,
  BO_OCCUPATION_VERSION,
  BO_OCCUPATIONS,
  boOccupationCanonicalUrl,
  boOccupationConceptCode,
  boOccupationConceptId,
  boOccupationDesignationId,
  boOccupationGroupPropertyId,
  boOccupationMemberId,
  boOccupationValueSetId,
  boOccupationVersionId,
} from './bo-occupations.catalog';

/** Tipo de dato de la propiedad de rama, en el vocabulario de `concept_properties`. */
const STRING_DATA_TYPE = 'string';

/**
 * Materializa `VS_BO_OCCUPATION`: las ocupaciones que el alta de paciente
 * ofrece como «¿en qué trabajás?».
 *
 * ## Por qué existe
 *
 * `RegisterPatientDto.occupationConceptId` declara el campo desde el principio
 * como miembro de este conjunto, pero el conjunto no lo sembraba nadie: la
 * lectura del cliente devolvía una página vacía y el formulario se quedaba con
 * el texto libre, que es de donde salen «Docente», «docente» y «Prof.» como
 * tres ocupaciones distintas. Sin conjunto sembrado no hay ocupación
 * catalogada, por más que el DTO la acepte.
 *
 * La API es **el único dueño** de este conjunto: el paquete del modelo no lo
 * siembra, y así lo fija la nota de entidad de `profiles.persons` (v4.1.8).
 * Sobre por qué la lista de hoy es provisional y qué pasa cuando llegue la
 * COB-2023, ver `bo-occupations.catalog.ts`.
 *
 * ## Idempotencia
 *
 * Por el mismo mecanismo que el resto de la cadena: todo id es determinista
 * (UUIDv5 sobre una clave estable), así que una corrida repetida compara por id
 * e inserta sólo lo que falta. Arrancar dos veces no duplica nada.
 *
 * Corre **después** de `TerminologySeedService`, por lo mismo que el catálogo
 * geográfico: los conceptos cuelgan de `SEED.codeSystemVersionId` y las
 * designaciones referencian `CONCEPTS.LANG_ES`, que aquél materializa. El orden
 * lo impone `SeedBootstrapService`.
 */
@Injectable()
export class BoOccupationsSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al contexto de persistencia.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BoOccupationsSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que `yarn seed:boot` y el arnés de las
   * pruebas de integración puedan garantizar el catálogo por su cuenta.
   *
   * @returns Cuántas filas insertó esta pasada, por nivel.
   */
  async run(): Promise<{
    /** Conjuntos de valores creados (0 ó 1). */
    valueSets: number;
    /** Versiones de conjunto creadas (0 ó 1). */
    versions: number;
    /** Conceptos de ocupación creados. */
    occupations: number;
    /** Designaciones preferidas (ES) creadas. */
    designations: number;
    /** Propiedades de rama de actividad creadas. */
    properties: number;
    /** Membresías de la expansión creadas. */
    memberships: number;
  }> {
    this.assertUniqueCodes();

    const em = this.orm.em.fork();
    const now = new Date();
    const counters = {
      valueSets: 0,
      versions: 0,
      occupations: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
    };

    // --- Nivel 1: el conjunto de valores ---
    const valueSetIdentifier = boOccupationValueSetId();
    const existingValueSets = await this.existingIds(em, ValueSets, [
      valueSetIdentifier,
    ]);
    if (!existingValueSets.has(valueSetIdentifier)) {
      em.create(
        ValueSets,
        {
          id: valueSetIdentifier,
          internalCode: BO_OCCUPATION_VALUE_SET,
          name: BO_OCCUPATION_VALUE_SET_NAME,
          canonicalUrl: boOccupationCanonicalUrl(),
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.valueSets += 1;
    }
    await em.flush();

    // --- Nivel 2: su versión única, marcada vigente ---
    const versionIdentifier = boOccupationVersionId();
    const existingVersions = await this.existingIds(em, ValueSetVersions, [
      versionIdentifier,
    ]);
    if (!existingVersions.has(versionIdentifier)) {
      em.create(
        ValueSetVersions,
        {
          id: versionIdentifier,
          valueSetId: valueSetIdentifier,
          version: BO_OCCUPATION_VERSION,
          validFrom: now,
          // `readExpansion` sin `valueSetVersionId` lee la vigente: sin esta
          // marca la lectura del desplegable devolvería 404 aunque el conjunto
          // y sus miembros existan.
          isDefault: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.versions += 1;
    }
    await em.flush();

    // --- Nivel 3: los conceptos ---
    const existingConcepts = await this.existingIds(
      em,
      CatalogConcepts,
      BO_OCCUPATIONS.map((occupation) =>
        boOccupationConceptId(occupation.code),
      ),
    );
    for (const occupation of BO_OCCUPATIONS) {
      const id = boOccupationConceptId(occupation.code);
      if (existingConcepts.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: boOccupationConceptCode(occupation.code),
          // `display` es lo que devuelve la expansión y lo que pinta el
          // desplegable, así que va en castellano: es un oficio boliviano, no
          // un término de terminología internacional.
          display: occupation.name,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.occupations += 1;
    }
    await em.flush();

    // --- Nivel 4: designación preferida (ES) ---
    counters.designations += await this.seedDesignations(em, now);

    // --- Nivel 5: la rama de actividad de cada una ---
    counters.properties += await this.seedGroupProperties(em, now);

    // --- Nivel 6: la expansión, en orden alfabético ---
    counters.memberships += await this.seedMemberships(em, now);

    const total = Object.values(counters).reduce(
      (suma, valor) => suma + valor,
      0,
    );
    if (total > 0) {
      this.logger.info(
        { operation: 'seed.bo-occupations', ...counters },
        'Catálogo de ocupaciones de Bolivia materializado',
      );
    }
    return counters;
  }

  /**
   * Rompe si el catálogo declara dos veces el mismo código.
   *
   * Dos entradas con el mismo código colapsarían en el mismo id determinista y
   * una taparía a la otra sin que nadie se entere. Mismo criterio que
   * `BoGeographySeedService.assertUniqueCodes`.
   */
  private assertUniqueCodes(): void {
    const vistos = new Set<string>();
    for (const occupation of BO_OCCUPATIONS) {
      if (vistos.has(occupation.code)) {
        throw new Error(
          `El catálogo de ocupaciones declara el código "${occupation.code}" más de una vez`,
        );
      }
      vistos.add(occupation.code);
    }
  }

  /** Designación preferida (ES) de cada ocupación. */
  private async seedDesignations(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ConceptDesignations,
      BO_OCCUPATIONS.map((occupation) =>
        boOccupationDesignationId(occupation.code),
      ),
    );

    let creadas = 0;
    for (const occupation of BO_OCCUPATIONS) {
      const id = boOccupationDesignationId(occupation.code);
      if (existing.has(id)) continue;
      em.create(
        ConceptDesignations,
        {
          id,
          conceptId: boOccupationConceptId(occupation.code),
          value: occupation.name,
          languageConceptId: CONCEPTS.LANG_ES,
          designationTypeConceptId: CONCEPTS.DESIG_PREFERRED,
          preferred: true,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creadas += 1;
    }
    await em.flush();
    return creadas;
  }

  /**
   * La rama de actividad de cada ocupación.
   *
   * No la usa ninguna pantalla hoy —el desplegable ofrece la lista plana—, y va
   * igual porque es lo que permite agrupar por riesgo laboral el día que la
   * ficha clínica lo pida, sin volver a clasificar el catálogo a mano.
   */
  private async seedGroupProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ConceptProperties,
      BO_OCCUPATIONS.map((occupation) =>
        boOccupationGroupPropertyId(occupation.code),
      ),
    );

    let creadas = 0;
    for (const occupation of BO_OCCUPATIONS) {
      const id = boOccupationGroupPropertyId(occupation.code);
      if (existing.has(id)) continue;
      em.create(
        ConceptProperties,
        {
          id,
          conceptId: boOccupationConceptId(occupation.code),
          propertyCode: BO_OCCUPATION_GROUP_PROPERTY_CODE,
          dataType: STRING_DATA_TYPE,
          valueJson: occupation.group,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creadas += 1;
    }
    await em.flush();
    return creadas;
  }

  /** La expansión: un miembro por ocupación, con el ordinal del orden alfabético. */
  private async seedMemberships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ValueSetMembers,
      BO_OCCUPATIONS.map((occupation) => boOccupationMemberId(occupation.code)),
    );

    let creadas = 0;
    const versionIdentifier = boOccupationVersionId();
    BO_OCCUPATIONS.forEach((occupation, ordinal) => {
      const id = boOccupationMemberId(occupation.code);
      if (existing.has(id)) return;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: boOccupationConceptId(occupation.code),
          included: true,
          ordinal,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creadas += 1;
    });
    await em.flush();
    return creadas;
  }

  /** Los ids que ya están en la base, de entre los que se van a sembrar. */
  private async existingIds<T extends object>(
    em: ReturnType<MikroORM['em']['fork']>,
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
