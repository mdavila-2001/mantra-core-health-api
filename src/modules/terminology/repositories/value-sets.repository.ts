import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ValueSets, ValueSetVersions, ValueSetRules } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar un conjunto de valores. */
export interface CreateValueSetData {
  internalCode: string;
  name: string;
  canonicalUrl: string;
  stateConceptId?: string;
  actorUserId?: string;
}

/** Datos mínimos para materializar una versión de conjunto de valores. */
export interface CreateValueSetVersionData {
  valueSetId: string;
  version: string;
  isDefault?: boolean;
  stateConceptId?: string;
  actorUserId?: string;
}

/** Datos mínimos para materializar una regla de conjunto de valores. */
export interface CreateValueSetRuleData {
  valueSetVersionId: string;
  codeSystemId: string;
  operatorConceptId?: string;
  property?: string;
  value?: string;
  included: boolean;
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.value_sets` y sus tablas hijas (versiones y
 * reglas). Los tres niveles se crean en la misma operación de negocio
 * (ValueSetsService.create), por lo que comparten repositorio. Métodos sin estado
 * que reciben el `EntityManager` activo.
 */
@Injectable()
export class ValueSetsRepository {
  /** Busca un conjunto de valores por su código interno; `null` si no existe. */
  findByInternalCode(em: EntityManager, internalCode: string): Promise<ValueSets | null> {
    return em.findOne(ValueSets, { internalCode });
  }

  /** Crea el conjunto de valores en la unidad de trabajo (sin flush). */
  createValueSet(em: EntityManager, data: CreateValueSetData): ValueSets {
    return em.create(ValueSets, {
      internalCode: data.internalCode,
      name: data.name,
      canonicalUrl: data.canonicalUrl,
      stateConceptId: data.stateConceptId,
      ...createdBy(data.actorUserId),
    }, { partial: true });
  }

  /** Crea la versión del conjunto de valores en la unidad de trabajo (sin flush). */
  createVersion(em: EntityManager, data: CreateValueSetVersionData): ValueSetVersions {
    return em.create(ValueSetVersions, {
      valueSetId: data.valueSetId,
      version: data.version,
      isDefault: data.isDefault,
      stateConceptId: data.stateConceptId,
      ...createdBy(data.actorUserId),
    }, { partial: true });
  }

  /** Crea una regla del conjunto de valores en la unidad de trabajo (sin flush). */
  createRule(em: EntityManager, data: CreateValueSetRuleData): ValueSetRules {
    return em.create(ValueSetRules, {
      valueSetVersionId: data.valueSetVersionId,
      codeSystemId: data.codeSystemId,
      operatorConceptId: data.operatorConceptId,
      property: data.property,
      value: data.value,
      included: data.included,
      ...createdBy(data.actorUserId),
    }, { partial: true });
  }
}
