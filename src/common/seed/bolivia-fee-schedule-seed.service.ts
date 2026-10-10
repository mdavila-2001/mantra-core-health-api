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
  /**
   * Filas ya existentes que el seed corrigió: nombres con el OCR enmendado,
   * propiedades con otro valor y marcas de revisión que dejaron de aplicar.
   */
  reconciled: number;
}

/** Cuántos ids se consultan por vuelta contra la base. */
const BLOCK_SIZE = 500;

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
 * Desde el 2026-10-01 el extractor (`tools/bolivia-datasets/ocr_es.py`) corrige
 * SÓLO LETRAS y sólo cuando el resultado es una palabra de un léxico oficial en
 * castellano (CIE-10-ES, MedlinePlus, fichas técnicas de CIMA): «Resecci6n» →
 * «Resección», «quirdrgico» → «quirúrgico». El importe nunca se toca, el código
 * sigue saliendo del texto original (los ids no cambian) y lo que no se resuelve
 * con certeza conserva la marca. Inventar la corrección seguiría siendo peor: un
 * nombre plausible pero falso no se distingue del bueno.
 *
 * Como el seed antes sólo insertaba, una base viva se quedaba con el texto viejo
 * para siempre. `reconcile` alinea las filas existentes con el dataset: nombre,
 * propiedades y marca de revisión.
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
    const counters: BoliviaFeeScheduleResult = {
      valueSets: 0,
      versions: 0,
      procedures: 0,
      properties: 0,
      memberships: 0,
      reconciled: 0,
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
      counters.valueSets += 1;
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
      counters.versions += 1;
    }
    await em.flush();

    counters.procedures += await this.seedConcepts(em, now);
    counters.properties += await this.seedProperties(em, now);
    counters.memberships += await this.seedMemberships(em, now);
    counters.reconciled += await this.reconcile(em, now);

    const total =
      counters.valueSets +
      counters.versions +
      counters.procedures +
      counters.properties +
      counters.memberships +
      counters.reconciled;
    if (total > 0) {
      this.logger.info(
        { operation: 'seed.bolivia-fee-schedule', ...counters },
        'Nomenclador de procedimientos materializado',
      );
    }
    return counters;
  }

  /**
   * Alinea con el dataset las filas que ya estaban en la base: el nombre del
   * procedimiento, el valor de cada propiedad declarada, y borra las propiedades
   * que el dataset ya no declara (la marca de revisión de una fila que quedó
   * limpia, el grupo que resultó ser una fila pegada).
   *
   * @param em - Contexto de persistencia.
   * @param now - Instante de la corrida.
   * @returns Cuántas filas cambió o borró.
   */
  private async reconcile(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    let changes = 0;
    const names = new Map(
      BOLIVIA_PROCEDURES.map((p) => [boFeeConceptId(p.code), p.nombre]),
    );
    const declared = new Map(
      BOLIVIA_PROCEDURES.flatMap((p) =>
        this.propertiesOf(p).map(
          ([code, value]) =>
            [boFeePropertyId(p.code, code), value] as const,
        ),
      ),
    );
    const ownCodes = Object.values(BO_FEE_PROPERTY_CODES);
    const ids = [...names.keys()];
    for (let i = 0; i < ids.length; i += BLOCK_SIZE) {
      const block = ids.slice(i, i + BLOCK_SIZE);
      for (const concept of await em.find(CatalogConcepts, {
        id: { $in: block },
      })) {
        const name = names.get(concept.id);
        if (name !== undefined && concept.display !== name) {
          concept.display = name;
          concept.updatedAt = now;
          changes += 1;
        }
      }
      const properties = await em.find(ConceptProperties, {
        conceptId: { $in: block },
        propertyCode: { $in: ownCodes },
      });
      for (const property of properties) {
        const value = declared.get(property.id);
        if (value === undefined) {
          em.remove(property);
          changes += 1;
        } else if (property.valueJson !== value) {
          property.valueJson = value;
          property.updatedAt = now;
          changes += 1;
        }
      }
      await em.flush();
    }
    return changes;
  }

  /** Rompe si el nomenclador declara dos veces el mismo código. */
  private assertUniqueCodes(): void {
    const seen = new Set<string>();
    for (const procedure of BOLIVIA_PROCEDURES) {
      if (seen.has(procedure.code)) {
        throw new Error(
          `El nomenclador declara el código "${procedure.code}" más de una vez`,
        );
      }
      seen.add(procedure.code);
    }
  }

  /** Un concepto por procedimiento. */
  private async seedConcepts(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const existing = await this.existingIds(
      em,
      CatalogConcepts,
      BOLIVIA_PROCEDURES.map((p) => boFeeConceptId(p.code)),
    );

    let created = 0;
    for (const procedure of BOLIVIA_PROCEDURES) {
      const id = boFeeConceptId(procedure.code);
      if (existing.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: boFeeConceptCode(procedure.code),
          // En castellano y sin designación aparte: el arancel boliviano no
          // tiene versión en inglés que valga la pena persistir, igual que los
          // departamentos y los establecimientos.
          display: procedure.nombre,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
      if (created % BLOCK_SIZE === 0) await em.flush();
    }
    await em.flush();
    return created;
  }

  /** Especialidad, grupo, precio, unidad y la marca de revisión. */
  private async seedProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const declared = BOLIVIA_PROCEDURES.flatMap((procedure) =>
      this.propertiesOf(procedure).map(([propertyCode, value]) => ({
        id: boFeePropertyId(procedure.code, propertyCode),
        conceptId: boFeeConceptId(procedure.code),
        propertyCode,
        value,
      })),
    );

    const existing = await this.existingIds(
      em,
      ConceptProperties,
      declared.map((p) => p.id),
    );

    let created = 0;
    for (const property of declared) {
      if (existing.has(property.id)) continue;
      em.create(
        ConceptProperties,
        {
          id: property.id,
          conceptId: property.conceptId,
          propertyCode: property.propertyCode,
          dataType: BO_FEE_PROPERTY_DATA_TYPE,
          valueJson: property.value,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
      if (created % BLOCK_SIZE === 0) await em.flush();
    }
    await em.flush();
    return created;
  }

  /**
   * Las propiedades que este procedimiento tiene de verdad.
   *
   * `review-needed` sólo se emite cuando hace falta: una propiedad que dijera
   * «false» en cuatro mil filas es ruido, y la ausencia ya significa «no se
   * detectó daño» — que no es lo mismo que «está bien», pero es lo que se sabe.
   */
  private propertiesOf(procedure: BoliviaProcedureSeed): [string, string][] {
    const pairs: [string, string | null][] = [
      [BO_FEE_PROPERTY_CODES.especialidad, procedure.especialidad],
      [BO_FEE_PROPERTY_CODES.grupo, procedure.grupo],
      [BO_FEE_PROPERTY_CODES.precio, String(procedure.precio)],
      [BO_FEE_PROPERTY_CODES.unidad, procedure.unidad],
      [BO_FEE_PROPERTY_CODES.revision, procedure.ocrSospechoso ? 'true' : null],
    ];
    return pairs.filter((par): par is [string, string] => Boolean(par[1]));
  }

  /** La expansión, en el orden del arancel. */
  private async seedMemberships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const versionIdentifier = boFeeVersionId();
    const existing = await this.existingIds(
      em,
      ValueSetMembers,
      BOLIVIA_PROCEDURES.map((p) => boFeeMemberId(p.code)),
    );

    let created = 0;
    let ordinal = 0;
    for (const procedure of BOLIVIA_PROCEDURES) {
      const id = boFeeMemberId(procedure.code);
      const position = ordinal;
      ordinal += 1;
      if (existing.has(id)) continue;
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: versionIdentifier,
          conceptId: boFeeConceptId(procedure.code),
          included: true,
          ordinal: position,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
      if (created % BLOCK_SIZE === 0) await em.flush();
    }
    await em.flush();
    return created;
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
    const found = new Set<string>();
    for (let i = 0; i < ids.length; i += BLOCK_SIZE) {
      const block = ids.slice(i, i + BLOCK_SIZE);
      const rows = await em.find(
        entity,
        { id: { $in: block } },
        { fields: ['id'] as never },
      );
      for (const row of rows) found.add((row as { id: string }).id);
    }
    return found;
  }
}
