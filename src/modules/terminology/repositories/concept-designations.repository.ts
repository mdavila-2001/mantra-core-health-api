import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConceptDesignations, ConceptProperties } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar una designación de concepto. */
export interface CreateConceptDesignationData {
  conceptId: string;
  value: string;
  languageConceptId?: string;
  designationTypeConceptId?: string;
  preferred?: boolean;
  actorUserId?: string;
}

/** Datos mínimos para materializar una propiedad de concepto. */
export interface CreateConceptPropertyData {
  conceptId: string;
  propertyCode: string;
  valueJson: unknown;
  dataType: string;
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
}
