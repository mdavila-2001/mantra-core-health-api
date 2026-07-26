import { Injectable } from '@nestjs/common';
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
  createDesignation(em: EntityManager, data: CreateConceptDesignationData): ConceptDesignations {
    return em.create(ConceptDesignations, {
      conceptId: data.conceptId,
      value: data.value,
      languageConceptId: data.languageConceptId,
      designationTypeConceptId: data.designationTypeConceptId,
      preferred: data.preferred,
      ...createdBy(data.actorUserId),
    }, { partial: true });
  }

  /** Crea la propiedad en la unidad de trabajo (sin flush). */
  createProperty(em: EntityManager, data: CreateConceptPropertyData): ConceptProperties {
    return em.create(ConceptProperties, {
      conceptId: data.conceptId,
      propertyCode: data.propertyCode,
      valueJson: data.valueJson,
      dataType: data.dataType,
      ...createdBy(data.actorUserId),
    }, { partial: true });
  }
}
