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
  BO_FEE_PROPERTY_CODES,
  BO_FEE_PROPERTY_DATA_TYPE,
  BO_FEE_VALUE_SET,
  BO_FEE_VALUE_SET_NAME,
  BO_FEE_VERSION,
  BOLIVIA_PROCEDURES,
  boFeeCanonicalUrl,
  boFeeConceptCode,
  boFeeConceptId,
  boFeeMemberId,
  boFeePropertyId,
  boFeeValueSetId,
  boFeeVersionId,
  type BoliviaProcedureSeed,
} from './bolivia-fee-schedule.catalog';

/** Cuántas filas dejó cada nivel. */
export interface BoliviaFeeScheduleResult {
  /** Conjuntos de valores creados (0 o 1). */
  valueSets: number;
  /** Versiones creadas (0 o 1). */
  versions: number;
  /** Procedimientos creados. */
  procedures: number;
  /** Propiedades creadas. */
  properties: number;
  /** Membresías de la expansión creadas. */
  memberships: number;
}

/** Cuántos ids se consultan por vuelta contra la base. */
const TAMANO_DE_BLOQUE = 500;

/**
 * Materializa el nomenclador de procedimientos con su precio de referencia,
 * como el conjunto `VS_BO_MEDICAL_PROCEDURE`.
 *
 * ## Por qué es un conjunto de valores
 *
 * Porque es un **arancel de referencia**, no la lista de precios de nadie. Las
 * tres tablas de precios del modelo son otra cosa: `payments.fee_schedules` son
 * las comisiones de la plataforma, `diagnostic_units.diagnostic_study_prices`
 * exige el centro concreto que cobra, y `pharmacy.pharmacy_product_prices` son
 * medicamentos. El arancel del Colegio Médico no es de ninguno de ellos: es el
 * pliego contra el que todos cotizan.
 *
 * Puesto como catálogo de conceptos, el día que una clínica cargue *su* precio
 * lo hace apuntando a este concepto, y las dos cosas conviven sin pisarse: la
 * referencia y lo que cobra cada quien.
 *
 * ## Sobre la calidad del texto
 *
 * El PDF del arancel médico **es escaneado**. Su propia hoja de metadatos pide
 * validar nombres, acentos, códigos y UMA antes de producción, y se le nota
 * («Anestesiblogos», «Térax», «cardiol6gico»). Las filas con daño evidente
 * llevan la propiedad `procedure:review-needed`, que es lo que permite
 * revisarlas sin volver al PDF.
 *
 * Ese detector encuentra sólo lo obvio —letras y dígitos mezclados dentro de una
 * palabra—, así que **no llevar la marca no certifica nada**. Se carga igual
 * porque un nomenclador incompleto no sirve para cotizar y porque el texto
 * crudo, marcado, es honesto; inventar la corrección sería peor: un nombre de
 * procedimiento plausible pero falso no se distingue del bueno.
 *
 * Idempotente por ids deterministas, como el resto de la cadena. Corre después
 * de `TerminologySeedService`: los conceptos cuelgan de
 * `SEED.codeSystemVersionId`.
 */
@Injectable()
export class BoliviaFeeScheduleSeedService {
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
    this.logger.setContext(BoliviaFeeScheduleSeedService.name);
  }

  /**
   * Ejecuta el seed.
   *
   * @returns Cuántas filas se insertaron en cada nivel.
   */
  async run(): Promise<BoliviaFeeScheduleResult> {
    this.assertUniqueCodes();

    const em = this.orm.em.fork();
    const now = new Date();
    const contadores: BoliviaFeeScheduleResult = {
      valueSets: 0,
      versions: 0,
      procedures: 0,
      properties: 0,
      memberships: 0,
    };

    // --- Nivel 1: el conjunto ---
    const valueSetIdentifier = boFeeValueSetId();
    if (
      !(await this.existingIds(em, ValueSets, [valueSetIdentifier])).has(
        valueSetIdentifier,
      )
    ) {
      em.create(
        ValueSets,
        {
          id: valueSetIdentifier,
          internalCode: BO_FEE_VALUE_SET,
          name: BO_FEE_VALUE_SET_NAME,
          canonicalUrl: boFeeCanonicalUrl(),
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
    const versionIdentifier = boFeeVersionId();
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
          version: BO_FEE_VERSION,
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

    contadores.procedures += await this.seedConcepts(em, now);
    contadores.properties += await this.seedProperties(em, now);
    contadores.memberships += await this.seedMemberships(em, now);

    const total =
      contadores.valueSets +
      contadores.versions +
      contadores.procedures +
      contadores.properties +
      contadores.memberships;
    if (total > 0) {
      this.logger.info(
        { operation: 'seed.bolivia-fee-schedule', ...contadores },
        'Nomenclador de procedimientos materializado',
      );
    }
    return contadores;
  }

  /** Rompe si el nomenclador declara dos veces el mismo código. */
  private assertUniqueCodes(): void {
    const vistos = new Set<string>();
    for (const procedimiento of BOLIVIA_PROCEDURES) {
      if (vistos.has(procedimiento.code)) {
        throw new Error(
          `El nomenclador declara el código "${procedimiento.code}" más de una vez`,
        );
      }
      vistos.add(procedimiento.code);
    }
  }

  /** Un concepto por procedimiento. */
  private async seedConcepts(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existentes = await this.existingIds(
      em,
      CatalogConcepts,
      BOLIVIA_PROCEDURES.map((p) => boFeeConceptId(p.code)),
    );

    let creados = 0;
    for (const procedimiento of BOLIVIA_PROCEDURES) {
      const id = boFeeConceptId(procedimiento.code);
      if (existentes.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: boFeeConceptCode(procedimiento.code),
          // En castellano y sin designación aparte: el arancel boliviano no
          // tiene versión en inglés que valga la pena persistir, igual que los
          // departamentos y los establecimientos.
          display: procedimiento.nombre,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creados += 1;
      if (creados % TAMANO_DE_BLOQUE === 0) await em.flush();
    }
    await em.flush();
    return creados;
  }

  /** Especialidad, grupo, precio, unidad y la marca de revisión. */
  private async seedProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const declaradas = BOLIVIA_PROCEDURES.flatMap((procedimiento) =>
      this.propertiesOf(procedimiento).map(([propertyCode, value]) => ({
        id: boFeePropertyId(procedimiento.code, propertyCode),
        conceptId: boFeeConceptId(procedimiento.code),
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
          dataType: BO_FEE_PROPERTY_DATA_TYPE,
          valueJson: propiedad.value,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creadas += 1;
      if (creadas % TAMANO_DE_BLOQUE === 0) await em.flush();
    }
    await em.flush();
    return creadas;
  }

  /**
   * Las propiedades que este procedimiento tiene de verdad.
   *
   * `review-needed` sólo se emite cuando hace falta: una propiedad que dijera
   * «false» en cuatro mil filas es ruido, y la ausencia ya significa «no se
   * detectó daño» — que no es lo mismo que «está bien», pero es lo que se sabe.
   */
  private propertiesOf(
    procedimiento: BoliviaProcedureSeed,
  ): [string, string][] {
    const pares: [string, string | null][] = [
      [BO_FEE_PROPERTY_CODES.especialidad, procedimiento.especialidad],
      [BO_FEE_PROPERTY_CODES.grupo, procedimiento.grupo],
      [BO_FEE_PROPERTY_CODES.precio, String(procedimiento.precio)],
      [BO_FEE_PROPERTY_CODES.unidad, procedimiento.unidad],
      [
        BO_FEE_PROPERTY_CODES.revision,
        procedimiento.ocrSospechoso ? 'true' : null,
      ],
    ];
    return pares.filter((par): par is [string, string] => Boolean(par[1]));
  }

  /** La expansión, en el orden del arancel. */
  private async seedMemberships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const versionIdentifier = boFeeVersionId();
    const existentes = await this.existingIds(
      em,
      ValueSetMembers,
      BOLIVIA_PROCEDURES.map((p) => boFeeMemberId(p.code)),
    );

    let creadas = 0;
    let ordinal = 0;
    for (const procedimiento of BOLIVIA_PROCEDURES) {
      const id = boFeeMemberId(procedimiento.code);
      const posicion = ordinal;
      ordinal += 1;
      if (existentes.has(id)) continue;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: boFeeConceptId(procedimiento.code),
          included: true,
          ordinal: posicion,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creadas += 1;
      if (creadas % TAMANO_DE_BLOQUE === 0) await em.flush();
    }
    await em.flush();
    return creadas;
  }

  /**
   * Qué ids de los pedidos ya están en la base.
   *
   * En bloques, porque son más de veinte mil propiedades y una sola cláusula
   * `IN` con todas ellas es una consulta que ningún planificador agradece.
   */
  private async existingIds<T extends object>(
    em: ReturnType<MikroORM['em']['fork']>,
    entity: new () => T,
    ids: string[],
  ): Promise<Set<string>> {
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
