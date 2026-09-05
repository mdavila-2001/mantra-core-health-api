import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConceptDesignations, ConceptProperties } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar una designación de concepto. */
export interface CreateConceptDesignationData {
  /**
   * Identificador asociado a concept.
   */
  conceptId: string;
  /**
   * Valor de value mantenido por la instancia.
   */
  value: string;
  /**
   * Identificador asociado a language concept.
   */
  languageConceptId?: string;
  /**
   * Identificador asociado a designation type concept.
   */
  designationTypeConceptId?: string;
  /**
   * Valor de preferred mantenido por la instancia.
   */
  preferred?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos mínimos para materializar una propiedad de concepto. */
export interface CreateConceptPropertyData {
  /**
   * Identificador asociado a concept.
   */
  conceptId: string;
  /**
   * Valor de property code mantenido por la instancia.
   */
  propertyCode: string;
  /**
   * Valor de value json mantenido por la instancia.
   */
  valueJson: unknown;
  /**
   * Valor de data type mantenido por la instancia.
   */
  dataType: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.concept_designations` y `concept_properties`.
 *
 * Ambas tablas cuelgan de un mismo concepto y se alimentan desde la misma
 * operación de negocio (ConceptsService.addDesignation), por lo que comparten
 * repositorio. Métodos sin estado que reciben el `EntityManager` activo.
 */
@Injectable()
export class ConceptDesignationsRepository {
  /** Crea la designación en la unidad de trabajo (sin flush). */
  createDesignation(
    em: EntityManager,
    data: CreateConceptDesignationData,
  ): ConceptDesignations {
    return em.create(
      ConceptDesignations,
      {
        conceptId: data.conceptId,
        value: data.value,
        languageConceptId: data.languageConceptId,
        designationTypeConceptId: data.designationTypeConceptId,
        preferred: data.preferred,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crea la propiedad en la unidad de trabajo (sin flush). */
  createProperty(
    em: EntityManager,
    data: CreateConceptPropertyData,
  ): ConceptProperties {
    return em.create(
      ConceptProperties,
      {
        conceptId: data.conceptId,
        propertyCode: data.propertyCode,
        valueJson: data.valueJson,
        dataType: data.dataType,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Designaciones del concepto en un idioma, bloqueadas. El caso de uso exige que
   * haya **una sola preferida por idioma**, y sin bloquearlas dos altas
   * simultáneas dejarían dos.
   */
  findByLanguageForUpdate(
    em: EntityManager,
    conceptId: string,
    languageConceptId: string,
  ): Promise<ConceptDesignations[]> {
    return em.find(
      ConceptDesignations,
      { conceptId, languageConceptId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Todas las designaciones del concepto; las devuelve `$lookup` (UC-03-11). */
  findByConcept(
    em: EntityManager,
    conceptId: string,
  ): Promise<ConceptDesignations[]> {
    return em.find(ConceptDesignations, { conceptId });
  }

  /**
   * Propiedad por su clave natural `(concepto, código)`. El caso de uso declara
   * `concept_properties — UPSERT`, así que hay que poder reencontrarla.
   */
  findProperty(
    em: EntityManager,
    conceptId: string,
    propertyCode: string,
  ): Promise<ConceptProperties | null> {
    return em.findOne(ConceptProperties, { conceptId, propertyCode });
  }

  /** Todas las propiedades del concepto; las devuelve `$lookup` (UC-03-11). */
  findPropertiesByConcept(
    em: EntityManager,
    conceptId: string,
  ): Promise<ConceptProperties[]> {
    return em.find(ConceptProperties, { conceptId });
  }

  /**
   * La designación preferida de cada concepto en un idioma, indexada por
   * concepto.
   *
   * Es lo que traduce un listado: la búsqueda devuelve hasta cincuenta conceptos
   * y todos hay que mostrarlos en el idioma de quien mira. Pedirlos con
   * `$lookup` de a uno serían cincuenta llamadas para pintar una pantalla, que
   * es exactamente lo que el plan del carril prohíbe.
   *
   * Un concepto puede tener varias designaciones en el mismo idioma (la
   * preferida y sus sinónimos), así que se filtra por `preferred`. Si aun así
   * hubiera dos —el modelo lo impide por operación, no por restricción de
   * base—, gana la primera y el resultado sigue siendo estable dentro de la
   * misma consulta.
   *
   * @param em - Contexto de persistencia.
   * @param conceptIds - Conceptos a traducir.
   * @param languageConceptId - Idioma pedido.
   * @returns Mapa `conceptId -> designación`; los que no tengan no aparecen.
   */
  async findPreferredByLanguageForConcepts(
    em: EntityManager,
    conceptIds: string[],
    languageConceptId: string,
  ): Promise<Map<string, ConceptDesignations>> {
    if (conceptIds.length === 0) return new Map();
    const rows = await em.find(ConceptDesignations, {
      conceptId: { $in: conceptIds },
      languageConceptId,
      preferred: true,
    });

    const porConcepto = new Map<string, ConceptDesignations>();
    for (const row of rows) {
      if (!porConcepto.has(row.conceptId)) porConcepto.set(row.conceptId, row);
    }
    return porConcepto;
  }

  /**
   * Una propiedad concreta de un conjunto de conceptos. La regla `prop` de una
   * expansión (UC-03-08) filtra por el valor de una propiedad, y resolverla
   * concepto a concepto emitiría una query por cada uno del catálogo.
   */
  findPropertyForConcepts(
    em: EntityManager,
    conceptIds: string[],
    propertyCode: string,
  ): Promise<ConceptProperties[]> {
    if (conceptIds.length === 0) return Promise.resolve([]);
    return em.find(ConceptProperties, {
      conceptId: { $in: conceptIds },
      propertyCode,
    });
  }

  /**
   * **Todas** las propiedades de un conjunto de conceptos, en una consulta.
   *
   * `findPropertyForConcepts` resuelve una propiedad concreta —lo que necesita
   * la regla `prop` de una expansión—. Esto resuelve el caso contrario: quién
   * quiere pintar una grilla necesita todas las propiedades de cada fila y no
   * sabe de antemano cuáles hay.
   *
   * ## Por qué hacía falta
   *
   * Hasta acá, las propiedades sólo salían por el **detalle de un concepto**.
   * El nomenclador de procedimientos son **4 408 conceptos** con su
   * especialidad, su precio de referencia y su unidad guardados justamente como
   * propiedades: pintarlo obligaba a pedir 4 408 detalles, uno por fila. No es
   * una ineficiencia, es una pantalla que no se puede construir.
   *
   * @param em - Contexto de persistencia.
   * @param conceptIds - Conceptos cuyas propiedades se necesitan.
   * @returns Mapa `conceptId -> { propertyCode: valor }`. Un concepto sin
   * propiedades **no aparece**: quien consulta distingue «no tiene» de «no
   * existe» por su cuenta, igual que en las demás lecturas en lote del módulo.
   */
  async findPropertiesForConcepts(
    em: EntityManager,
    conceptIds: string[],
  ): Promise<Map<string, Record<string, unknown>>> {
    const porConcepto = new Map<string, Record<string, unknown>>();
    if (conceptIds.length === 0) return porConcepto;

    const rows = await em.find(ConceptProperties, {
      conceptId: { $in: conceptIds },
    });
    for (const row of rows) {
      const actuales = porConcepto.get(row.conceptId) ?? {};
      // Indexado por código y no como lista: quien lo consume lo lee por
      // nombre (`properties.specialty`), nunca recorriéndolo. Es la misma
      // forma que ya devuelve el detalle de un concepto.
      actuales[row.propertyCode] = row.valueJson;
      porConcepto.set(row.conceptId, actuales);
    }
    return porConcepto;
  }
}
