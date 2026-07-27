import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ValueSets,
  ValueSetVersions,
  ValueSetRules,
  ValueSetMembers,
} from '../entities';
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
  /** Busca un conjunto de valores por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<ValueSets | null> {
    return em.findOne(ValueSets, { id });
  }

  /** Busca un conjunto de valores por su código interno; `null` si no existe. */
  findByInternalCode(
    em: EntityManager,
    internalCode: string,
  ): Promise<ValueSets | null> {
    return em.findOne(ValueSets, { internalCode });
  }

  /** Crea el conjunto de valores en la unidad de trabajo (sin flush). */
  createValueSet(em: EntityManager, data: CreateValueSetData): ValueSets {
    return em.create(
      ValueSets,
      {
        internalCode: data.internalCode,
        name: data.name,
        canonicalUrl: data.canonicalUrl,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crea la versión del conjunto de valores en la unidad de trabajo (sin flush). */
  createVersion(
    em: EntityManager,
    data: CreateValueSetVersionData,
  ): ValueSetVersions {
    return em.create(
      ValueSetVersions,
      {
        valueSetId: data.valueSetId,
        version: data.version,
        isDefault: data.isDefault,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Crea una regla del conjunto de valores en la unidad de trabajo (sin flush). */
  createRule(em: EntityManager, data: CreateValueSetRuleData): ValueSetRules {
    return em.create(
      ValueSetRules,
      {
        valueSetVersionId: data.valueSetVersionId,
        codeSystemId: data.codeSystemId,
        operatorConceptId: data.operatorConceptId,
        property: data.property,
        value: data.value,
        included: data.included,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Expansión (UC-03-08) ---

  /**
   * Versión del conjunto de valores bloqueada. Expandir borra los miembros previos
   * y reinserta: dos expansiones simultáneas de la misma versión dejarían una
   * mezcla de ambas.
   */
  findVersionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ValueSetVersions | null> {
    return em.findOne(
      ValueSetVersions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Versiones del conjunto marcadas por defecto, bloqueadas. Sólo una puede serlo,
   * así que promover una exige degradar la anterior sin que otra expansión
   * simultánea la reponga.
   */
  findDefaultVersionsForUpdate(
    em: EntityManager,
    valueSetId: string,
  ): Promise<ValueSetVersions[]> {
    return em.find(
      ValueSetVersions,
      { valueSetId, isDefault: true },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Reglas de la versión; son las que se evalúan contra los conceptos. */
  findRulesByVersion(
    em: EntityManager,
    valueSetVersionId: string,
  ): Promise<ValueSetRules[]> {
    return em.find(ValueSetRules, { valueSetVersionId });
  }

  /**
   * Borra los miembros de la versión antes de reexpandir. La expansión es un
   * reemplazo, no una acumulación: conservar los anteriores dejaría dentro
   * conceptos que las reglas ya no seleccionan.
   */
  deleteMembersByVersion(
    em: EntityManager,
    valueSetVersionId: string,
  ): Promise<number> {
    return em.nativeDelete(ValueSetMembers, { valueSetVersionId });
  }

  /** Crea un miembro de la expansión en la unidad de trabajo (sin flush). */
  createMember(
    em: EntityManager,
    data: {
      valueSetVersionId: string;
      conceptId: string;
      included: boolean;
      ordinal: number;
      actorUserId?: string;
    },
  ): ValueSetMembers {
    return em.create(
      ValueSetMembers,
      {
        valueSetVersionId: data.valueSetVersionId,
        conceptId: data.conceptId,
        included: data.included,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Miembros que referencian un concepto, bloqueados. Retirar el concepto los
   * excluye de sus expansiones (UC-03-10): dejarlos dentro haría que un conjunto
   * de valores siguiera ofreciendo un código retirado.
   */
  findMembersByConceptForUpdate(
    em: EntityManager,
    conceptId: string,
  ): Promise<ValueSetMembers[]> {
    return em.find(
      ValueSetMembers,
      { conceptId, included: true },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
