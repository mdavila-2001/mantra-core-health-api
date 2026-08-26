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
  BO_DEPARTMENT_VALUE_SET,
  BO_DEPARTMENT_VALUE_SET_NAME,
  BO_DEPARTMENT_VERSION,
  BO_DEPARTMENTS,
  boDepartmentCanonicalUrl,
  boDepartmentConceptCode,
  boDepartmentConceptId,
  boDepartmentDesignationId,
  boDepartmentIsoPropertyId,
  boDepartmentMemberId,
  boDepartmentValueSetId,
  boDepartmentVersionId,
  BO_DEPARTMENT_BY_INE_PREFIX,
  BO_MUNICIPALITIES,
  BO_MUNICIPALITY_VALUE_SET,
  BO_MUNICIPALITY_VALUE_SET_NAME,
  BO_MUNICIPALITY_VERSION,
  boMunicipalityCanonicalUrl,
  boMunicipalityConceptCode,
  boMunicipalityConceptId,
  boMunicipalityDesignationId,
  boMunicipalityMemberId,
  boMunicipalityParentPropertyId,
  boMunicipalityProvincePropertyId,
  boMunicipalityValueSetId,
  boMunicipalityVersionId,
} from './bo-geography.catalog';

/** Código de la propiedad que guarda el ISO 3166-2 de cada departamento. */
export const BO_DEPARTMENT_ISO_PROPERTY_CODE = 'geo:iso-3166-2';

/** Código de la propiedad que guarda la provincia de cada municipio. */
export const BO_MUNICIPALITY_PROVINCE_PROPERTY_CODE = 'geo:bo:province';

/**
 * Código de la propiedad que apunta al concepto del departamento padre.
 *
 * Es la arista del árbol, guardada como el uuid del departamento y no como su
 * sigla: quien lea el concepto suelto —fuera de la expansión— tiene ahí el
 * padre sin tener que interpretar un código. El selector del registro **no**
 * la usa: arma el árbol con el prefijo del código del INE, porque la expansión
 * de un conjunto no devuelve propiedades (ver `boMunicipalityConceptCode`).
 */
export const BO_MUNICIPALITY_PARENT_PROPERTY_CODE = 'geo:bo:department';

/** Tipo de dato de la propiedad ISO, en el vocabulario de `concept_properties`. */
const STRING_DATA_TYPE = 'string';

/**
 * Materializa el catálogo geográfico de Bolivia: `VS_BO_DEPARTMENT` con sus
 * nueve departamentos y `VS_BO_MUNICIPALITY` con los 340 municipios.
 *
 * ## Por qué existe
 *
 * El registro público pregunta «departamento que emitió tu documento» y «dónde
 * vivís», y resuelve las opciones por el **código** del conjunto, no por campo
 * destino (ver `bo-geography.catalog.ts`). Sin el conjunto sembrado, esa
 * lectura devuelve una página vacía y el desplegable queda en su estado de
 * fallo: la persona se registra igual —los dos campos son opcionales— pero
 * nunca puede completarlos.
 *
 * ## Por qué los dos conjuntos van en el mismo seeder
 *
 * Porque son un solo árbol y comparten la comprobación de unicidad: un
 * municipio sin su departamento sembrado es una arista colgando. Corriendo
 * juntos, o están los dos o no está ninguno.
 *
 * El catálogo lo declaraba un patch del paquete del modelo que nunca llegó al
 * repositorio, así que el conjunto no existía en ninguna base. Vive acá por lo
 * mismo que el vademécum: un catálogo que sólo existe como patch suelto fuera
 * de `apply_all.sql` desaparece cada vez que alguien reconstruye la base.
 *
 * ## Idempotencia
 *
 * Por el mismo mecanismo que el resto de la cadena: todo id es determinista
 * (UUIDv5 sobre una clave estable), así que una corrida repetida compara por id
 * e inserta sólo lo que falta. Arrancar dos veces no duplica nada y no escribe
 * nada la segunda vez.
 *
 * Corre **después** de `TerminologySeedService`: los conceptos cuelgan de
 * `SEED.codeSystemVersionId` y las designaciones referencian `CONCEPTS.LANG_ES`,
 * que aquél materializa. El orquestador (`SeedBootstrapService`) impone el orden.
 */
@Injectable()
export class BoGeographySeedService {
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
    this.logger.setContext(BoGeographySeedService.name);
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
    /** Conceptos de departamento creados. */
    departments: number;
    /** Conceptos de municipio creados. */
    municipalities: number;
    /** Designaciones preferidas (ES) creadas. */
    designations: number;
    /** Propiedades de concepto creadas (ISO, provincia, departamento padre). */
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
      departments: 0,
      municipalities: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
    };

    // --- Nivel 1: el conjunto de valores ---
    const valueSetIdentifier = boDepartmentValueSetId();
    const existingValueSets = await this.existingIds(em, ValueSets, [
      valueSetIdentifier,
    ]);
    if (!existingValueSets.has(valueSetIdentifier)) {
      em.create(
        ValueSets,
        {
          id: valueSetIdentifier,
          internalCode: BO_DEPARTMENT_VALUE_SET,
          name: BO_DEPARTMENT_VALUE_SET_NAME,
          canonicalUrl: boDepartmentCanonicalUrl(),
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
    const versionIdentifier = boDepartmentVersionId();
    const existingVersions = await this.existingIds(em, ValueSetVersions, [
      versionIdentifier,
    ]);
    if (!existingVersions.has(versionIdentifier)) {
      em.create(
        ValueSetVersions,
        {
          id: versionIdentifier,
          valueSetId: valueSetIdentifier,
          version: BO_DEPARTMENT_VERSION,
          validFrom: now,
          // `readExpansion` sin `valueSetVersionId` lee la vigente: sin esta
          // marca, la lectura del desplegable devolvería 404 aunque el
          // conjunto y sus miembros existan.
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

    // --- Nivel 3: los nueve conceptos ---
    const existingConcepts = await this.existingIds(
      em,
      CatalogConcepts,
      BO_DEPARTMENTS.map((department) =>
        boDepartmentConceptId(department.code),
      ),
    );
    for (const department of BO_DEPARTMENTS) {
      const id = boDepartmentConceptId(department.code);
      if (existingConcepts.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: boDepartmentConceptCode(department.code),
          // `display` es lo que devuelve la expansión y lo que pinta el
          // desplegable, así que va en castellano. Un departamento boliviano no
          // tiene nombre en inglés que valga la pena persistir.
          display: department.name,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.departments += 1;
    }
    await em.flush();

    // --- Nivel 4: designación preferida (ES) ---
    counters.designations += await this.seedDesignations(em, now);

    // --- Nivel 5: la subdivisión ISO de cada uno ---
    counters.properties += await this.seedIsoProperties(em, now);

    // --- Nivel 6: la expansión, en el orden oficial ---
    counters.memberships += await this.seedMemberships(em, now);

    // --- Los municipios, que cuelgan de los conceptos recién sembrados ---
    const municipios = await this.runMunicipalities(em, now);
    counters.valueSets += municipios.valueSets;
    counters.versions += municipios.versions;
    counters.municipalities += municipios.municipalities;
    counters.designations += municipios.designations;
    counters.properties += municipios.properties;
    counters.memberships += municipios.memberships;

    const total = Object.values(counters).reduce(
      (suma, valor) => suma + valor,
      0,
    );
    if (total > 0) {
      this.logger.info(
        { operation: 'seed.bo-geography', ...counters },
        'Catálogo geográfico de Bolivia materializado',
      );
    }
    return counters;
  }

  /**
   * Rompe si el catálogo declara dos veces la misma sigla.
   *
   * Dos entradas con la misma sigla colapsarían en el mismo id determinista y
   * una taparía a la otra sin que nadie se entere: mejor romper el arranque que
   * sembrar un catálogo ambiguo. Mismo criterio que `assertUniqueSlugs` del
   * glosario.
   */
  private assertUniqueCodes(): void {
    const vistas = new Set<string>();
    for (const department of BO_DEPARTMENTS) {
      if (vistas.has(department.code)) {
        throw new Error(
          `El catálogo geográfico declara la sigla "${department.code}" más de una vez`,
        );
      }
      vistas.add(department.code);
    }

    const siglas = new Set(BO_DEPARTMENTS.map((department) => department.code));
    const codigos = new Set<string>();
    for (const municipality of BO_MUNICIPALITIES) {
      if (codigos.has(municipality.ine)) {
        throw new Error(
          `El catálogo geográfico declara el código INE "${municipality.ine}" más de una vez`,
        );
      }
      codigos.add(municipality.ine);

      // Un municipio cuyo departamento no está en el catálogo dejaría una FK
      // apuntando a un concepto que nadie siembra: la fila entra y la lectura
      // revienta después, lejos de acá. Mejor no arrancar.
      if (!siglas.has(municipality.department)) {
        throw new Error(
          `El municipio "${municipality.name}" (${municipality.ine}) cuelga del ` +
            `departamento "${municipality.department}", que no está en el catálogo`,
        );
      }

      // El prefijo del código del INE ES el departamento: si los dos no
      // coinciden, el árbol que arma el cliente —que sólo mira el prefijo—
      // pondría el municipio bajo otro departamento.
      const porPrefijo = BO_DEPARTMENT_BY_INE_PREFIX.get(
        municipality.ine.slice(0, 2),
      );
      if (porPrefijo !== municipality.department) {
        throw new Error(
          `El municipio "${municipality.name}" declara el departamento ` +
            `"${municipality.department}" pero su código INE ${municipality.ine} ` +
            `corresponde a "${porPrefijo ?? 'ninguno'}"`,
        );
      }
    }
  }

  /**
   * El conjunto de municipios completo: conjunto, versión, conceptos,
   * designaciones, propiedades y expansión.
   *
   * Mismo esqueleto de seis niveles que los departamentos, en un método aparte
   * porque son 340 filas por nivel y mezclarlos en el `run` lo volvía ilegible.
   *
   * @param em - Contexto de persistencia ya bifurcado.
   * @param now - Marca de tiempo única de la pasada.
   * @returns Cuántas filas insertó, por nivel.
   */
  private async runMunicipalities(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<{
    valueSets: number;
    versions: number;
    municipalities: number;
    designations: number;
    properties: number;
    memberships: number;
  }> {
    const counters = {
      valueSets: 0,
      versions: 0,
      municipalities: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
    };

    const valueSetIdentifier = boMunicipalityValueSetId();
    const existingValueSets = await this.existingIds(em, ValueSets, [
      valueSetIdentifier,
    ]);
    if (!existingValueSets.has(valueSetIdentifier)) {
      em.create(
        ValueSets,
        {
          id: valueSetIdentifier,
          internalCode: BO_MUNICIPALITY_VALUE_SET,
          name: BO_MUNICIPALITY_VALUE_SET_NAME,
          canonicalUrl: boMunicipalityCanonicalUrl(),
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.valueSets += 1;
    }
    await em.flush();

    const versionIdentifier = boMunicipalityVersionId();
    const existingVersions = await this.existingIds(em, ValueSetVersions, [
      versionIdentifier,
    ]);
    if (!existingVersions.has(versionIdentifier)) {
      em.create(
        ValueSetVersions,
        {
          id: versionIdentifier,
          valueSetId: valueSetIdentifier,
          version: BO_MUNICIPALITY_VERSION,
          validFrom: now,
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

    const existingConcepts = await this.existingIds(
      em,
      CatalogConcepts,
      BO_MUNICIPALITIES.map((municipality) =>
        boMunicipalityConceptId(municipality.ine),
      ),
    );
    for (const municipality of BO_MUNICIPALITIES) {
      const id = boMunicipalityConceptId(municipality.ine);
      if (existingConcepts.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: boMunicipalityConceptCode(municipality.ine),
          // Sólo el nombre, sin el departamento pegado: quien lo muestra ya
          // sabe en qué rama del árbol está, y un «Sucre (Chuquisaca)» dentro
          // del grupo «Chuquisaca» dice dos veces lo mismo.
          display: municipality.name,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.municipalities += 1;
    }
    await em.flush();

    counters.designations += await this.seedMunicipalityDesignations(em, now);
    counters.properties += await this.seedMunicipalityProperties(em, now);
    counters.memberships += await this.seedMunicipalityMemberships(em, now);

    return counters;
  }

  /** Designación preferida (ES) de cada municipio. */
  private async seedMunicipalityDesignations(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ConceptDesignations,
      BO_MUNICIPALITIES.map((municipality) =>
        boMunicipalityDesignationId(municipality.ine),
      ),
    );

    let creadas = 0;
    for (const municipality of BO_MUNICIPALITIES) {
      const id = boMunicipalityDesignationId(municipality.ine);
      if (existing.has(id)) continue;
      em.create(
        ConceptDesignations,
        {
          id,
          conceptId: boMunicipalityConceptId(municipality.ine),
          value: municipality.name,
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
   * Las dos propiedades de cada municipio: su provincia y su departamento padre.
   *
   * El padre va como el **uuid** del concepto del departamento, no como su
   * sigla: es una arista del árbol y las aristas apuntan a identidades. La
   * provincia va como texto porque no hay catálogo de provincias —hoy nadie
   * pide una— y guardarla igual evita tener que volver a la fuente del INE el
   * día que alguien la necesite.
   */
  private async seedMunicipalityProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const ids = BO_MUNICIPALITIES.flatMap((municipality) => [
      boMunicipalityProvincePropertyId(municipality.ine),
      boMunicipalityParentPropertyId(municipality.ine),
    ]);
    const existing = await this.existingIds(em, ConceptProperties, ids);

    let creadas = 0;
    for (const municipality of BO_MUNICIPALITIES) {
      const conceptId = boMunicipalityConceptId(municipality.ine);

      const provinceId = boMunicipalityProvincePropertyId(municipality.ine);
      if (!existing.has(provinceId)) {
        em.create(
          ConceptProperties,
          {
            id: provinceId,
            conceptId,
            propertyCode: BO_MUNICIPALITY_PROVINCE_PROPERTY_CODE,
            dataType: STRING_DATA_TYPE,
            valueJson: municipality.province,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        creadas += 1;
      }

      const parentId = boMunicipalityParentPropertyId(municipality.ine);
      if (!existing.has(parentId)) {
        em.create(
          ConceptProperties,
          {
            id: parentId,
            conceptId,
            propertyCode: BO_MUNICIPALITY_PARENT_PROPERTY_CODE,
            dataType: STRING_DATA_TYPE,
            valueJson: boDepartmentConceptId(municipality.department),
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        creadas += 1;
      }
    }
    await em.flush();
    return creadas;
  }

  /** La expansión de municipios, en el orden del INE. */
  private async seedMunicipalityMemberships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ValueSetMembers,
      BO_MUNICIPALITIES.map((municipality) =>
        boMunicipalityMemberId(municipality.ine),
      ),
    );

    let creadas = 0;
    const versionIdentifier = boMunicipalityVersionId();
    BO_MUNICIPALITIES.forEach((municipality, ordinal) => {
      const id = boMunicipalityMemberId(municipality.ine);
      if (existing.has(id)) return;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: boMunicipalityConceptId(municipality.ine),
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

  /** Designación preferida (ES) de cada departamento. */
  private async seedDesignations(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ConceptDesignations,
      BO_DEPARTMENTS.map((department) =>
        boDepartmentDesignationId(department.code),
      ),
    );

    let creadas = 0;
    for (const department of BO_DEPARTMENTS) {
      const id = boDepartmentDesignationId(department.code);
      if (existing.has(id)) continue;
      em.create(
        ConceptDesignations,
        {
          id,
          conceptId: boDepartmentConceptId(department.code),
          value: department.name,
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
   * La subdivisión ISO 3166-2 de cada departamento.
   *
   * No la usa ninguna pantalla hoy. Va igual porque es el único puente hacia un
   * sistema externo que hable ISO y no siglas de cédula, y agregarla después
   * obligaría a una migración de datos para algo que acá cuesta una fila.
   */
  private async seedIsoProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ConceptProperties,
      BO_DEPARTMENTS.map((department) =>
        boDepartmentIsoPropertyId(department.code),
      ),
    );

    let creadas = 0;
    for (const department of BO_DEPARTMENTS) {
      const id = boDepartmentIsoPropertyId(department.code);
      if (existing.has(id)) continue;
      em.create(
        ConceptProperties,
        {
          id,
          conceptId: boDepartmentConceptId(department.code),
          propertyCode: BO_DEPARTMENT_ISO_PROPERTY_CODE,
          dataType: STRING_DATA_TYPE,
          valueJson: department.iso,
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

  /** La expansión: los nueve miembros, con el ordinal del orden oficial. */
  private async seedMemberships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      ValueSetMembers,
      BO_DEPARTMENTS.map((department) => boDepartmentMemberId(department.code)),
    );

    let creadas = 0;
    const versionIdentifier = boDepartmentVersionId();
    BO_DEPARTMENTS.forEach((department, ordinal) => {
      const id = boDepartmentMemberId(department.code);
      if (existing.has(id)) return;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: boDepartmentConceptId(department.code),
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
