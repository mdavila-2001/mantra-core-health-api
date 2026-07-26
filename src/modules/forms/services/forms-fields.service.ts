import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { FieldDefinitionsRepository } from '../repositories';
import {
  CreateFieldDefinitionDto,
  CreateFieldDependencyDto,
  UpsertLocalizationDto,
  CreateAccessRuleDto,
  IdResponseDto,
  OkResultDto,
} from '../dto';
import {
  FORMS,
  DEPENDENCY_BEHAVIOR_BY_CODE,
  OPERATOR_BY_CODE,
  RULE_TYPE_BY_CODE,
  MASK_STRATEGY_BY_CODE,
} from '../forms.concepts';

/** Códigos de idioma soportados por las localizaciones (UC-09-05). */
const LANGUAGE_CONCEPT_BY_CODE: Record<string, string> = {
  es: CONCEPTS.LANG_ES,
  en: CONCEPTS.LANG_EN,
};

/**
 * Definición de campos dinámicos y sus artefactos: declaración con reglas
 * (UC-09-02), dependencias condicionales (UC-09-04), localizaciones i18n
 * (UC-09-05) y reglas de acceso / enmascarado (UC-09-12).
 */
@Injectable()
export class FormsFieldsService {
  constructor(
    private readonly em: EntityManager,
    private readonly fieldsRepo: FieldDefinitionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FormsFieldsService.name);
  }

  /** UC-09-02: declara una definición de campo con sus reglas de validación. */
  async createFieldDefinition(
    dto: CreateFieldDefinitionDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info(
      { operation: 'forms.field.create', code: dto.code },
      'Creating field definition',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.fieldsRepo.findFieldByCode(tx, dto.code);
      if (clash) {
        throw new ConflictException('El código de campo ya existe', { code: dto.code });
      }

      const field = this.fieldsRepo.createField(tx, {
        code: dto.code,
        name: dto.name,
        dataType: dto.dataType,
        sensitivityConceptId: dto.sensitivityConceptId ?? CONCEPTS.SENSITIVITY_NORMAL,
        semanticConceptId: dto.semanticConceptId,
        valueSetId: dto.valueSetId,
        unitValueSetId: dto.unitValueSetId,
        cardinalityMin: dto.cardinalityMin,
        cardinalityMax: dto.cardinalityMax,
        regex: dto.regex,
        schemaVersion: 1,
        stateConceptId: FORMS.FIELD_ACTIVE,
        actorUserId: actor.id,
      });
      // FK planas: persistir el campo antes de sus reglas.
      await tx.flush();

      for (const [i, rule] of (dto.validationRules ?? []).entries()) {
        this.fieldsRepo.createValidationRule(tx, {
          fieldId: field.id,
          ruleTypeConceptId: RULE_TYPE_BY_CODE[rule.ruleType],
          operatorConceptId: rule.operator ? OPERATOR_BY_CODE[rule.operator] : undefined,
          parametersJson: rule.parameters,
          severityConceptId:
            rule.severity === 'WARNING' ? FORMS.SEVERITY_WARNING : FORMS.SEVERITY_ERROR,
          errorMessage: rule.errorMessage,
          ordinal: i,
          active: true,
          actorUserId: actor.id,
        });
      }

      this.logger.info({ operation: 'forms.field.create', fieldId: field.id }, 'Field created');
      return { id: field.id };
    });
  }

  /** UC-09-04: define una dependencia condicional entre dos campos activos. */
  async addDependency(
    targetFieldId: string,
    dto: CreateFieldDependencyDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info(
      { operation: 'forms.field.dependency', targetFieldId, sourceFieldId: dto.sourceFieldId },
      'Defining field dependency',
    );
    return this.em.transactional(async (tx) => {
      if (targetFieldId === dto.sourceFieldId) {
        throw new PreconditionFailedException('Un campo no puede depender de sí mismo', {
          targetFieldId,
        });
      }

      const target = await this.fieldsRepo.findFieldById(tx, targetFieldId);
      if (!target) throw new ResourceNotFoundException('Campo destino no encontrado', { targetFieldId });
      const source = await this.fieldsRepo.findFieldById(tx, dto.sourceFieldId);
      if (!source) {
        throw new ResourceNotFoundException('Campo fuente no encontrado', {
          sourceFieldId: dto.sourceFieldId,
        });
      }

      const dup = await this.fieldsRepo.findDependency(
        tx,
        targetFieldId,
        dto.sourceFieldId,
        dto.logicalGroup,
      );
      if (dup) {
        throw new ConflictException('La dependencia ya existe en ese grupo lógico', {
          targetFieldId,
          sourceFieldId: dto.sourceFieldId,
        });
      }

      const dep = this.fieldsRepo.createDependency(tx, {
        targetFieldId,
        sourceFieldId: dto.sourceFieldId,
        operatorConceptId: OPERATOR_BY_CODE[dto.operator],
        behaviorConceptId: DEPENDENCY_BEHAVIOR_BY_CODE[dto.behavior],
        comparisonValueJson: dto.comparisonValue,
        logicalGroup: dto.logicalGroup,
        ordinal: dto.ordinal,
        actorUserId: actor.id,
      });

      return { id: dep.id };
    });
  }

  /** UC-09-05: crea o actualiza la localización de un campo para un idioma. */
  async upsertLocalization(
    fieldId: string,
    langCode: string,
    dto: UpsertLocalizationDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info(
      { operation: 'forms.field.localize', fieldId, lang: langCode },
      'Upserting field localization',
    );
    const languageConceptId = LANGUAGE_CONCEPT_BY_CODE[langCode.toLowerCase()];
    if (!languageConceptId) {
      throw new PreconditionFailedException('Idioma no soportado', { lang: langCode });
    }
    return this.em.transactional(async (tx) => {
      const field = await this.fieldsRepo.findFieldById(tx, fieldId);
      if (!field) throw new ResourceNotFoundException('Campo no encontrado', { fieldId });

      const existing = await this.fieldsRepo.findLocalization(tx, fieldId, languageConceptId);
      if (existing) {
        existing.label = dto.label ?? existing.label;
        existing.helpText = dto.helpText ?? existing.helpText;
        existing.placeholder = dto.placeholder ?? existing.placeholder;
        existing.validationMessage = dto.validationMessage ?? existing.validationMessage;
        touch(existing, actor.id);
        return { id: existing.id };
      }

      const loc = this.fieldsRepo.createLocalization(tx, {
        fieldId,
        languageConceptId,
        label: dto.label,
        helpText: dto.helpText,
        placeholder: dto.placeholder,
        validationMessage: dto.validationMessage,
        actorUserId: actor.id,
      });
      return { id: loc.id };
    });
  }

  /** UC-09-12: define una regla de acceso / enmascarado para un campo sensible. */
  async createAccessRule(
    fieldId: string,
    dto: CreateAccessRuleDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info(
      { operation: 'forms.field.accessRule', fieldId },
      'Defining field access rule',
    );
    return this.em.transactional(async (tx) => {
      const field = await this.fieldsRepo.findFieldById(tx, fieldId);
      if (!field) throw new ResourceNotFoundException('Campo no encontrado', { fieldId });

      const rule = this.fieldsRepo.createAccessRule(tx, {
        fieldId,
        assignmentId: dto.assignmentId,
        purposeOfUseValueSetId: dto.purposeOfUseValueSetId,
        readRoleValueSetId: dto.readRoleValueSetId,
        writeRoleValueSetId: dto.writeRoleValueSetId,
        consentCategoryConceptId: dto.consentCategoryConceptId,
        maskStrategyConceptId: dto.maskStrategy
          ? MASK_STRATEGY_BY_CODE[dto.maskStrategy]
          : FORMS.MASK_REDACT,
        breakGlassAllowed: dto.breakGlassAllowed ?? false,
        statusConceptId: FORMS.ACCESS_RULE_ACTIVE,
        actorUserId: actor.id,
      });

      return { id: rule.id };
    });
  }
}

/** Reexport para pruebas: mapa de idioma soportado. */
export { LANGUAGE_CONCEPT_BY_CODE };
