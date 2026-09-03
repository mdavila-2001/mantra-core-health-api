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
  BO_EMPLOYER_SECTOR_PROPERTY_CODE,
  BO_EMPLOYER_VALUE_SET,
  BO_EMPLOYER_VALUE_SET_NAME,
  BO_EMPLOYER_VERSION,
  BO_EMPLOYERS,
  boEmployerCanonicalUrl,
  boEmployerConceptCode,
  boEmployerConceptId,
  boEmployerDesignationId,
  boEmployerMemberId,
  boEmployerSectorPropertyId,
  boEmployerValueSetId,
  boEmployerVersionId,
} from './bo-employers.catalog';

/** Tipo de dato de la propiedad de sector, en el vocabulario de `concept_properties`. */
const STRING_DATA_TYPE = 'string';

/**
 * Materializa `VS_BO_EMPLOYER`: las empresas que el alta de paciente ofrece
 * como «¿en qué empresa trabajás?».
 *
 * ## Por qué existe
 *
 * El alta preguntaba **dónde** queda el trabajo —municipio, calle y
 * coordenadas—: tres campos para un dato que casi nadie completaba y que, una
 * vez completado, no servía para agrupar a nadie. Ahora pregunta **la
 * empresa**, que es una sola pregunta, se sabe de memoria, y sí agrupa:
 * empleador es el eje de salud ocupacional y de convenio corporativo.
 *
 * Sin conjunto sembrado el campo se cae al texto libre, que es de donde salen
 * «BCP», «Banco de Crédito» y «bcp» como tres empresas distintas — el mismo
 * problema que `BoOccupationsSeedService` vino a cerrar para el oficio.
 *
 * La API es **el único dueño** de este conjunto, igual que del de ocupaciones:
 * el paquete del modelo no lo siembra. Sobre por qué la lista es provisional,
 * qué publica el SEPREC y qué pasa el día que haya un extracto real, ver
 * `bo-employers.catalog.ts` — está investigado y escrito ahí.
 *
 * ## Idempotencia
 *
 * Por el mismo mecanismo que el resto de la cadena: todo id es determinista
 * (UUIDv5 sobre una clave estable), así que una corrida repetida compara por id
 * e inserta sólo lo que falta. Arrancar dos veces no duplica nada, y **ampliar
 * la lista siembra sólo las entradas nuevas**.
 *
 * Corre **después** de `TerminologySeedService`, por lo mismo que las
 * ocupaciones: los conceptos cuelgan de `SEED.codeSystemVersionId` y las
 * designaciones referencian `CONCEPTS.LANG_ES`, que aquél materializa. El orden
 * lo impone `SeedBootstrapService`.
 */
@Injectable()
export class BoEmployersSeedService {
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
    this.logger.setContext(BoEmployersSeedService.name);
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
    /** Conceptos de empresa creados. */
    employers: number;
    /** Designaciones preferidas (ES) creadas. */
    designations: number;
    /** Propiedades de sector económico creadas. */
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
      employers: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
    };

    // --- Nivel 1: el conjunto de valores ---
    const valueSetIdentifier = boEmployerValueSetId();
    const existingValueSets = await this.existingIds(em, ValueSets, [
      valueSetIdentifier,
    ]);
    if (!existingValueSets.has(valueSetIdentifier)) {
      em.create(
        ValueSets,
        {
          id: valueSetIdentifier,
          internalCode: BO_EMPLOYER_VALUE_SET,
          name: BO_EMPLOYER_VALUE_SET_NAME,
          canonicalUrl: boEmployerCanonicalUrl(),
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
    const versionIdentifier = boEmployerVersionId();
    const existingVersions = await this.existingIds(em, ValueSetVersions, [
      versionIdentifier,
    ]);
    if (!existingVersions.has(versionIdentifier)) {
      em.create(
        ValueSetVersions,
        {
          id: versionIdentifier,
          valueSetId: valueSetIdentifier,
          version: BO_EMPLOYER_VERSION,
          validFrom: now,
          // `readExpansion` sin `valueSetVersionId` lee la vigente: sin esta
          // marca la lectura del buscador devolvería 404 aunque el conjunto y
          // sus miembros existan.
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
      BO_EMPLOYERS.map((employer) => boEmployerConceptId(employer.code)),
    );
    for (const employer of BO_EMPLOYERS) {
      const id = boEmployerConceptId(employer.code);
      if (existingConcepts.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: boEmployerConceptCode(employer.code),
          // `display` es lo que devuelve la expansión y lo que pinta el
          // buscador: va la razón social como la gente la reconoce, no un
          // término de terminología internacional.
          display: employer.name,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.employers += 1;
    }
    await em.flush();

    // --- Nivel 4: designación preferida (ES) ---
    counters.designations += await this.seedDesignations(em, now);

    // --- Nivel 5: el sector económico de cada una ---
    counters.properties += await this.seedSectorProperties(em, now);

    // --- Nivel 6: la expansión, en el orden declarado ---
    counters.memberships += await this.seedMemberships(em, now);

    const total = Object.values(counters).reduce(
      (suma, valor) => suma + valor,
      0,
    );
    if (total > 0) {
      this.logger.info(
        { operation: 'seed.bo-employers', ...counters },
        'Catálogo de empresas de Bolivia materializado',
      );
    }
    return counters;
  }

  /**
   * Rompe si el catálogo declara dos veces el mismo código.
   *
   * Dos entradas con el mismo código colapsarían en el mismo id determinista y
   * una taparía a la otra sin que nadie se entere. Mismo criterio que
   * `BoOccupationsSeedService.assertUniqueCodes`, y acá importa más: esta lista
   * está pensada para crecer, y es al agregar entradas cuando se repite un
   * código sin querer.
   */
  private assertUniqueCodes(): void {
    const vistos = new Set<string>();
    for (const employer of BO_EMPLOYERS) {
      if (vistos.has(employer.code)) {
        throw new Error(
          `El catálogo de empresas declara el código "${employer.code}" más de una vez`,
        );
      }
      vistos.add(employer.code);
    }
  }

  /** Designación preferida (ES) de cada empresa. */
  private async seedDesignations(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ConceptDesignations,
      BO_EMPLOYERS.map((employer) => boEmployerDesignationId(employer.code)),
    );

    let creadas = 0;
    for (const employer of BO_EMPLOYERS) {
      const id = boEmployerDesignationId(employer.code);
      if (existing.has(id)) continue;
      em.create(
        ConceptDesignations,
        {
          id,
          conceptId: boEmployerConceptId(employer.code),
          value: employer.name,
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
   * El sector económico de cada empresa.
   *
   * No lo usa ninguna pantalla hoy —el buscador ofrece la lista plana— y va
   * igual porque es el eje con el que el SEPREC publica sus agregados: el día
   * que llegue un extracto suyo, entra por este mismo campo sin reclasificar
   * nada a mano.
   */
  private async seedSectorProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ConceptProperties,
      BO_EMPLOYERS.map((employer) => boEmployerSectorPropertyId(employer.code)),
    );

    let creadas = 0;
    for (const employer of BO_EMPLOYERS) {
      const id = boEmployerSectorPropertyId(employer.code);
      if (existing.has(id)) continue;
      em.create(
        ConceptProperties,
        {
          id,
          conceptId: boEmployerConceptId(employer.code),
          propertyCode: BO_EMPLOYER_SECTOR_PROPERTY_CODE,
          dataType: STRING_DATA_TYPE,
          valueJson: employer.sector,
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

  /** La expansión: un miembro por empresa, con el ordinal del orden declarado. */
  private async seedMemberships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ValueSetMembers,
      BO_EMPLOYERS.map((employer) => boEmployerMemberId(employer.code)),
    );

    let creadas = 0;
    const versionIdentifier = boEmployerVersionId();
    BO_EMPLOYERS.forEach((employer, ordinal) => {
      const id = boEmployerMemberId(employer.code);
      if (existing.has(id)) return;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: boEmployerConceptId(employer.code),
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
