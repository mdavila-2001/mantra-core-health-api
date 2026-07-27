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
  code: string;
  name: string;
  dataType: string;
  sensitivityConceptId?: string;
  semanticConceptId?: string;
  valueSetId?: string;
  unitValueSetId?: string;
  cardinalityMin?: number;
  cardinalityMax?: number;
  regex?: string;
  schemaVersion?: number;
  stateConceptId?: string;
  actorUserId?: string;
}

/** Alta de una regla de validación de campo. */
export interface CreateValidationRuleData {
  fieldId: string;
  ruleTypeConceptId: string;
  operatorConceptId?: string;
  parametersJson: unknown;
  severityConceptId?: string;
  errorMessage?: string;
  ordinal?: number;
  active?: boolean;
  actorUserId?: string;
}

/** Alta de una dependencia condicional entre campos. */
export interface CreateDependencyData {
  targetFieldId: string;
  sourceFieldId: string;
  operatorConceptId: string;
  behaviorConceptId: string;
  comparisonValueJson?: unknown;
  logicalGroup?: string;
  ordinal?: number;
  actorUserId?: string;
}

/** Alta / actualización de una localización de campo. */
export interface UpsertLocalizationData {
  fieldId: string;
  languageConceptId: string;
  label?: string;
  helpText?: string;
  placeholder?: string;
  validationMessage?: string;
  actorUserId?: string;
}

/** Alta de una regla de acceso / enmascarado por campo. */
export interface CreateAccessRuleData {
  fieldId: string;
  assignmentId?: string;
  purposeOfUseValueSetId: string;
  readRoleValueSetId?: string;
  writeRoleValueSetId?: string;
  consentCategoryConceptId?: string;
  maskStrategyConceptId?: string;
  breakGlassAllowed?: boolean;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `forms.dynamic_field_definitions` y sus tablas satélite
 * (reglas de validación, dependencias, localizaciones, reglas de acceso).
 */
@Injectable()
export class FieldDefinitionsRepository {
  findFieldById(
    em: EntityManager,
    id: string,
  ): Promise<DynamicFieldDefinitions | null> {
    return em.findOne(DynamicFieldDefinitions, { id });
  }

  findFieldByCode(
    em: EntityManager,
    code: string,
  ): Promise<DynamicFieldDefinitions | null> {
    return em.findOne(DynamicFieldDefinitions, { code });
  }

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
}
