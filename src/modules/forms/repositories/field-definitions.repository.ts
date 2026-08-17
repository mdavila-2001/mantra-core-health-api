import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DynamicFieldDefinitions,
  FieldValidationRules,
  FieldDependencies,
  FieldDefinitionLocalizations,
  FieldValueAccessRules,
} from '../entities';
import { createdBy } from '../../../common';

/** Alta de una definición de campo dinámico. */
export interface CreateFieldData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de data type mantenido por la instancia.
   */
  dataType: string;
  /**
   * Identificador asociado a sensitivity concept.
   */
  sensitivityConceptId?: string;
  /**
   * Identificador asociado a semantic concept.
   */
  semanticConceptId?: string;
  /**
   * Identificador asociado a value set.
   */
  valueSetId?: string;
  /**
   * Identificador asociado a unit value set.
   */
  unitValueSetId?: string;
  /**
   * Valor de cardinality min mantenido por la instancia.
   */
  cardinalityMin?: number;
  /**
   * Valor de cardinality max mantenido por la instancia.
   */
  cardinalityMax?: number;
  /**
   * Valor de regex mantenido por la instancia.
   */
  regex?: string;
  /**
   * Valor de schema version mantenido por la instancia.
   */
  schemaVersion?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una regla de validación de campo. */
export interface CreateValidationRuleData {
  /**
   * Identificador asociado a field.
   */
  fieldId: string;
  /**
   * Identificador asociado a rule type concept.
   */
  ruleTypeConceptId: string;
  /**
   * Identificador asociado a operator concept.
   */
  operatorConceptId?: string;
  /**
   * Valor de parameters json mantenido por la instancia.
   */
  parametersJson: unknown;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId?: string;
  /**
   * Valor de error message mantenido por la instancia.
   */
  errorMessage?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Valor de active mantenido por la instancia.
   */
  active?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una dependencia condicional entre campos. */
export interface CreateDependencyData {
  /**
   * Identificador asociado a target field.
   */
  targetFieldId: string;
  /**
   * Identificador asociado a source field.
   */
  sourceFieldId: string;
  /**
   * Identificador asociado a operator concept.
   */
  operatorConceptId: string;
  /**
   * Identificador asociado a behavior concept.
   */
  behaviorConceptId: string;
  /**
   * Valor de comparison value json mantenido por la instancia.
   */
  comparisonValueJson?: unknown;
  /**
   * Valor de logical group mantenido por la instancia.
   */
  logicalGroup?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta / actualización de una localización de campo. */
export interface UpsertLocalizationData {
  /**
   * Identificador asociado a field.
   */
  fieldId: string;
  /**
   * Identificador asociado a language concept.
   */
  languageConceptId: string;
  /**
   * Valor de label mantenido por la instancia.
   */
  label?: string;
  /**
   * Valor de help text mantenido por la instancia.
   */
  helpText?: string;
  /**
   * Valor de placeholder mantenido por la instancia.
   */
  placeholder?: string;
  /**
   * Valor de validation message mantenido por la instancia.
   */
  validationMessage?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una regla de acceso / enmascarado por campo. */
export interface CreateAccessRuleData {
  /**
   * Identificador asociado a field.
   */
  fieldId: string;
  /**
   * Identificador asociado a assignment.
   */
  assignmentId?: string;
  /**
   * Identificador asociado a purpose of use value set.
   */
  purposeOfUseValueSetId: string;
  /**
   * Identificador asociado a read role value set.
   */
  readRoleValueSetId?: string;
  /**
   * Identificador asociado a write role value set.
   */
  writeRoleValueSetId?: string;
  /**
   * Identificador asociado a consent category concept.
   */
  consentCategoryConceptId?: string;
  /**
   * Identificador asociado a mask strategy concept.
   */
  maskStrategyConceptId?: string;
  /**
   * Valor de break glass allowed mantenido por la instancia.
   */
  breakGlassAllowed?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `forms.dynamic_field_definitions` y sus tablas satélite
 * (reglas de validación, dependencias, localizaciones, reglas de acceso).
 */
@Injectable()
export class FieldDefinitionsRepository {
  /**
   * Obtiene find field by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find field by id conforme al contrato `Promise<DynamicFieldDefinitions | null>`.
   */
  findFieldById(
    em: EntityManager,
    id: string,
  ): Promise<DynamicFieldDefinitions | null> {
    return em.findOne(DynamicFieldDefinitions, { id });
  }

  /**
   * Obtiene find field by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find field by code conforme al contrato `Promise<DynamicFieldDefinitions | null>`.
   */
  findFieldByCode(
    em: EntityManager,
    code: string,
  ): Promise<DynamicFieldDefinitions | null> {
    return em.findOne(DynamicFieldDefinitions, { code });
  }

  /**
   * Crea create field.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create field conforme al contrato `DynamicFieldDefinitions`.
   */
  createField(
    em: EntityManager,
    data: CreateFieldData,
  ): DynamicFieldDefinitions {
    const { actorUserId, ...rest } = data;
    return em.create(
      DynamicFieldDefinitions,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create validation rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create validation rule conforme al contrato `FieldValidationRules`.
   */
  createValidationRule(
    em: EntityManager,
    data: CreateValidationRuleData,
  ): FieldValidationRules {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldValidationRules,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Obtiene find dependency.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param targetFieldId - Identificador de target field.
   * @param sourceFieldId - Identificador de source field.
   * @param logicalGroup - Valor de logical group requerido por la operación.
   * @returns Resultado de find dependency conforme al contrato `Promise<FieldDependencies | null>`.
   */
  findDependency(
    em: EntityManager,
    targetFieldId: string,
    sourceFieldId: string,
    logicalGroup?: string,
  ): Promise<FieldDependencies | null> {
    return em.findOne(FieldDependencies, {
      targetFieldId,
      sourceFieldId,
      logicalGroup: logicalGroup ?? null,
    });
  }

  /**
   * Crea create dependency.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dependency conforme al contrato `FieldDependencies`.
   */
  createDependency(
    em: EntityManager,
    data: CreateDependencyData,
  ): FieldDependencies {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldDependencies,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Obtiene find localization.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fieldId - Identificador de field.
   * @param languageConceptId - Identificador de language concept.
   * @returns Resultado de find localization conforme al contrato `Promise<FieldDefinitionLocalizations | null>`.
   */
  findLocalization(
    em: EntityManager,
    fieldId: string,
    languageConceptId: string,
  ): Promise<FieldDefinitionLocalizations | null> {
    return em.findOne(FieldDefinitionLocalizations, {
      fieldId,
      languageConceptId,
    });
  }

  /**
   * Crea create localization.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create localization conforme al contrato `FieldDefinitionLocalizations`.
   */
  createLocalization(
    em: EntityManager,
    data: UpsertLocalizationData,
  ): FieldDefinitionLocalizations {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldDefinitionLocalizations,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create access rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create access rule conforme al contrato `FieldValueAccessRules`.
   */
  createAccessRule(
    em: EntityManager,
    data: CreateAccessRuleData,
  ): FieldValueAccessRules {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldValueAccessRules,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Definiciones de campo por id, en lote: las lecturas resuelven todos los
   * campos de una instancia o un set de una vez, no de a uno (N+1).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids de campo a resolver.
   * @returns Definiciones encontradas.
   */
  findFieldsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<DynamicFieldDefinitions[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(DynamicFieldDefinitions, { id: { $in: [...ids] } });
  }

  /**
   * Reglas de validación de un lote de campos, en su orden de evaluación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fieldIds - Ids de campo a resolver.
   * @returns Reglas de todos los campos pedidos.
   */
  findValidationRulesByFieldIds(
    em: EntityManager,
    fieldIds: readonly string[],
  ): Promise<FieldValidationRules[]> {
    if (fieldIds.length === 0) return Promise.resolve([]);
    return em.find(
      FieldValidationRules,
      { fieldId: { $in: [...fieldIds] } },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  /**
   * Dependencias condicionales que gobiernan un lote de campos destino.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param targetFieldIds - Ids de campo destino a resolver.
   * @returns Dependencias cuyas condiciones controlan los campos pedidos.
   */
  findDependenciesByTargetFieldIds(
    em: EntityManager,
    targetFieldIds: readonly string[],
  ): Promise<FieldDependencies[]> {
    if (targetFieldIds.length === 0) return Promise.resolve([]);
    return em.find(
      FieldDependencies,
      { targetFieldId: { $in: [...targetFieldIds] } },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  /**
   * Localizaciones i18n de un lote de campos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fieldIds - Ids de campo a resolver.
   * @returns Localizaciones de todos los campos pedidos.
   */
  findLocalizationsByFieldIds(
    em: EntityManager,
    fieldIds: readonly string[],
  ): Promise<FieldDefinitionLocalizations[]> {
    if (fieldIds.length === 0) return Promise.resolve([]);
    return em.find(FieldDefinitionLocalizations, {
      fieldId: { $in: [...fieldIds] },
    });
  }

  /**
   * Reglas de acceso activas de un lote de campos.
   *
   * La lectura de valores las consulta para decidir el enmascarado: mientras la
   * semántica de `read_role_value_set_id` no sea evaluable (no existe puente
   * rol→value-set en el sistema), la mera presencia de una regla activa basta
   * para no exponer el valor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fieldIds - Ids de campo a resolver.
   * @param statusConceptId - Concepto del estado activo de la regla.
   * @returns Reglas activas de los campos pedidos.
   */
  findActiveAccessRulesByFieldIds(
    em: EntityManager,
    fieldIds: readonly string[],
    statusConceptId: string,
  ): Promise<FieldValueAccessRules[]> {
    if (fieldIds.length === 0) return Promise.resolve([]);
    return em.find(FieldValueAccessRules, {
      fieldId: { $in: [...fieldIds] },
      statusConceptId,
    });
  }
}
