import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import {
  CatalogConcepts,
  ConceptProperties,
  ValueSetMembers,
  ValueSets,
  ValueSetVersions,
} from '../../modules/terminology/entities';
import { CONCEPTS, SEED } from '../constants/concepts';
import {
  BO_FACILITY_PROPERTY_CODES,
  BO_FACILITY_PROPERTY_DATA_TYPE,
  BO_FACILITY_VALUE_SET,
  BO_FACILITY_VALUE_SET_NAME,
  BO_FACILITY_VERSION,
  BOLIVIA_FACILITIES,
  boFacilityCanonicalUrl,
  boFacilityConceptCode,
  boFacilityConceptId,
  boFacilityMemberId,
  boFacilityPropertyId,
  boFacilityValueSetId,
  boFacilityVersionId,
  type BoliviaFacilitySeed,
} from './bolivia-facilities.catalog';

/** Cuántas filas dejó cada nivel. */
export interface BoliviaFacilitiesResult {
  /** Conjuntos de valores creados (0 o 1). */
  valueSets: number;
  /** Versiones creadas (0 o 1). */
  versions: number;
  /** Establecimientos creados. */
  facilities: number;
  /** Propiedades creadas. */
  properties: number;
  /** Membresías de la expansión creadas. */
  memberships: number;
}

/**
 * Materializa el directorio de establecimientos de salud de Santa Cruz como el
 * conjunto de valores `VS_BO_HEALTH_FACILITY`.
 *
 * ## Por qué es un conjunto de valores y no organizaciones
 *
 * Porque es una **lista de consulta**, no un padrón de clientes. El registro de
 * procesos describe con detalle cómo se da de alta una organización de verdad
 * —razón social, forma societaria, NIT, SEPREC, licencia de funcionamiento,
 * certificado del SEDES, poder del representante legal, GPS de cada sucursal—
 * y ninguna de esas quinientas tres pasó por ahí. Crearlas como
 * `directory.tenants` las daría por registradas sin que nadie las registrara, y
 * dejaría el alta real sin trabajo que hacer.
 *
 * Lo que sí resuelve es lo que hoy no se puede: que el médico diga en qué
 * hospital está de turno y en qué clínica atiende, eligiendo de una lista de
 * establecimientos que existen, con su dirección y su teléfono.
 *
 * ## Idempotencia
 *
 * Por el mismo mecanismo que el catálogo geográfico: todo id es determinista
 * (UUIDv5 sobre una clave estable), así que una corrida repetida compara por id
 * e inserta sólo lo que falta.
 *
 * Corre **después** de `TerminologySeedService`: los conceptos cuelgan de
 * `SEED.codeSystemVersionId`.
 */
@Injectable()
export class BoliviaFacilitiesSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al `EntityManager` de la aplicación.
   * @param logger - Registro con el contexto de este servicio.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BoliviaFacilitiesSeedService.name);
  }

  /**
   * Ejecuta el seed.
   *
   * @returns Cuántas filas se insertaron en cada nivel.
   */
  async run(): Promise<BoliviaFacilitiesResult> {
    this.assertUniqueCodes();

    const em = this.orm.em.fork();
    const now = new Date();
    const contadores: BoliviaFacilitiesResult = {
      valueSets: 0,
      versions: 0,
      facilities: 0,
      properties: 0,
      memberships: 0,
    };

    // --- Nivel 1: el conjunto ---
    const valueSetIdentifier = boFacilityValueSetId();
    if (
      !(await this.existingIds(em, ValueSets, [valueSetIdentifier])).has(
        valueSetIdentifier,
      )
    ) {
      em.create(
        ValueSets,
        {
          id: valueSetIdentifier,
          internalCode: BO_FACILITY_VALUE_SET,
          name: BO_FACILITY_VALUE_SET_NAME,
          canonicalUrl: boFacilityCanonicalUrl(),
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      contadores.valueSets += 1;
    }
    await em.flush();

    // --- Nivel 2: su versión vigente ---
    const versionIdentifier = boFacilityVersionId();
    if (
      !(await this.existingIds(em, ValueSetVersions, [versionIdentifier])).has(
        versionIdentifier,
      )
    ) {
      em.create(
        ValueSetVersions,
        {
          id: versionIdentifier,
          valueSetId: valueSetIdentifier,
          version: BO_FACILITY_VERSION,
          validFrom: now,
          // Sin esta marca, leer la expansión sin versión devuelve 404 aunque
          // el conjunto y sus miembros existan.
          isDefault: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      contadores.versions += 1;
    }
    await em.flush();

    // --- Nivel 3: los conceptos ---
    contadores.facilities += await this.seedConcepts(em, now);

    // --- Nivel 4: sus propiedades ---
    contadores.properties += await this.seedProperties(em, now);

    // --- Nivel 5: la expansión ---
    contadores.memberships += await this.seedMemberships(em, now);

    const total =
      contadores.valueSets +
      contadores.versions +
      contadores.facilities +
      contadores.properties +
      contadores.memberships;
    if (total > 0) {
      this.logger.info(
        { operation: 'seed.bolivia-facilities', ...contadores },
        'Directorio de establecimientos de salud materializado',
      );
    }
    return contadores;
  }

  /** Rompe si el catálogo declara dos veces el mismo código. */
  private assertUniqueCodes(): void {
    const vistos = new Set<string>();
    for (const facility of BOLIVIA_FACILITIES) {
      if (vistos.has(facility.code)) {
        throw new Error(
          `El directorio declara el código "${facility.code}" más de una vez`,
        );
      }
      vistos.add(facility.code);
    }
  }

  /** Un concepto por establecimiento. */
  private async seedConcepts(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existentes = await this.existingIds(
      em,
      CatalogConcepts,
      BOLIVIA_FACILITIES.map((f) => boFacilityConceptId(f.code)),
    );

    let creados = 0;
    for (const facility of BOLIVIA_FACILITIES) {
      const id = boFacilityConceptId(facility.code);
      if (existentes.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: boFacilityConceptCode(facility.code),
          // En castellano y sin designación aparte, por lo mismo que los
          // departamentos: el nombre propio de un hospital boliviano no tiene
          // versión en inglés que valga la pena persistir.
          display: facility.nombre,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creados += 1;
    }
    await em.flush();
    return creados;
  }

  /** Tipo, nivel, naturaleza, municipio, dirección, teléfono y NIT. */
  private async seedProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const declaradas = BOLIVIA_FACILITIES.flatMap((facility) =>
      this.propertiesOf(facility).map(([propertyCode, value]) => ({
        id: boFacilityPropertyId(facility.code, propertyCode),
        conceptId: boFacilityConceptId(facility.code),
        propertyCode,
        value,
      })),
    );

    const existentes = await this.existingIds(
      em,
      ConceptProperties,
      declaradas.map((p) => p.id),
    );

    let creadas = 0;
    for (const propiedad of declaradas) {
      if (existentes.has(propiedad.id)) continue;
      em.create(
        ConceptProperties,
        {
          id: propiedad.id,
          conceptId: propiedad.conceptId,
          propertyCode: propiedad.propertyCode,
          dataType: BO_FACILITY_PROPERTY_DATA_TYPE,
          valueJson: propiedad.value,
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
   * Las propiedades que este establecimiento tiene de verdad.
   *
   * Sólo las que traen valor: una dirección vacía no es un dato, y sembrarla
   * como cadena en blanco obligaría a todo el que lea a distinguir «no la
   * sabemos» de «está vacía».
   */
  private propertiesOf(facility: BoliviaFacilitySeed): [string, string][] {
    const pares: [string, string | null][] = [
      [BO_FACILITY_PROPERTY_CODES.tipo, facility.tipo],
      [
        BO_FACILITY_PROPERTY_CODES.nivel,
        facility.nivel === null ? null : String(facility.nivel),
      ],
      [BO_FACILITY_PROPERTY_CODES.naturaleza, facility.naturaleza],
      [BO_FACILITY_PROPERTY_CODES.municipio, facility.municipio],
      [BO_FACILITY_PROPERTY_CODES.direccion, facility.direccion],
      [BO_FACILITY_PROPERTY_CODES.telefono, facility.telefonos[0] ?? null],
      [BO_FACILITY_PROPERTY_CODES.nit, facility.nit],
    ];
    return pares.filter((par): par is [string, string] => Boolean(par[1]));
  }

  /** La expansión, en el orden del listado. */
  private async seedMemberships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const versionIdentifier = boFacilityVersionId();
    const existentes = await this.existingIds(
      em,
      ValueSetMembers,
      BOLIVIA_FACILITIES.map((f) => boFacilityMemberId(f.code)),
    );

    let creadas = 0;
    let ordinal = 0;
    for (const facility of BOLIVIA_FACILITIES) {
      const id = boFacilityMemberId(facility.code);
      const posicion = ordinal;
      ordinal += 1;
      if (existentes.has(id)) continue;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: boFacilityConceptId(facility.code),
          included: true,
          ordinal: posicion,
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
   * Qué ids de los pedidos ya están en la base.
   *
   * En bloques, porque son más de tres mil propiedades y una sola cláusula
   * `IN` con todas ellas es una consulta que ningún planificador agradece.
   */
  private async existingIds<T extends object>(
    em: ReturnType<MikroORM['em']['fork']>,
    entity: new () => T,
    ids: string[],
  ): Promise<Set<string>> {
    const TAMANO_DE_BLOQUE = 500;
    const encontrados = new Set<string>();
    for (let i = 0; i < ids.length; i += TAMANO_DE_BLOQUE) {
      const bloque = ids.slice(i, i + TAMANO_DE_BLOQUE);
      const filas = await em.find(
        entity,
        { id: { $in: bloque } },
        { fields: ['id'] as never },
      );
      for (const fila of filas) encontrados.add((fila as { id: string }).id);
    }
    return encontrados;
  }
}
