import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  AssignmentsRepository,
  FieldDefinitionsRepository,
  FieldValuesRepository,
} from '../repositories';
import {
  CreateFieldDefinitionDto,
  CreateFieldDependencyDto,
  UpsertLocalizationDto,
  CreateAccessRuleDto,
  IdResponseDto,
  OkResultDto,
  UpdateFieldDefinitionDto,
} from '../dto';

/** Roles que administran los campos sin techo de tenant (CL-69). */
const ROLES_DE_GOBIERNO: readonly string[] = ['SECURITY_ADMIN', 'SUPERADMIN'];
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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fieldsRepo - Valor de fields repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param assignmentsRepo - De quién es un campo: por dónde está colgado (CL-69).
   * @param valuesRepo - Si un campo ya tiene valores capturados (CL-69).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly fieldsRepo: FieldDefinitionsRepository,
    private readonly logger: PinoLogger,
    private readonly assignmentsRepo: AssignmentsRepository,
    private readonly valuesRepo: FieldValuesRepository,
  ) {
    this.logger.setContext(FormsFieldsService.name);
  }

  /**
   * CL-61 / CL-69: corrige nombre o tipo de un campo **propio**.
   *
   * La definición es global (`dynamic_field_definitions` no tiene `tenant_id`),
   * así que «propio» se decide por dónde está colgado: todas sus asignaciones
   * tienen que ser del tenant del actor. Un campo colgado del estándar (alguna
   * asignación global) o de otro tenant responde 403; quien gobierna no tiene
   * techo. Cambiar el tipo con valores ya capturados reescribiría la historia
   * clínica: 409.
   */
  async updateFieldDefinition(
    fieldId: string,
    dto: UpdateFieldDefinitionDto,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.em.transactional(async (tx) => {
      const field = await this.fieldsRepo.findFieldById(tx, fieldId);
      if (!field) {
        throw new ResourceNotFoundException('Campo no encontrado', {
          fieldId,
        });
      }

      const gobierna = actor.roles.some((rol) =>
        ROLES_DE_GOBIERNO.includes(rol),
      );
      if (!gobierna) {
        const tenantId = requireTenantId();
        const assignments = await this.assignmentsRepo.findAssignmentsByField(
          tx,
          fieldId,
        );
        const ajeno = assignments.some(
          (a) => !a.tenantId || a.tenantId !== tenantId,
        );
        if (ajeno) {
          throw new ForbiddenException(
            'Sólo se pueden corregir los campos propios de la organización; los del estándar no se editan desde acá',
          );
        }
      }

      if (dto.dataType !== undefined && dto.dataType !== field.dataType) {
        const captured = await this.valuesRepo.countByField(tx, fieldId);
        if (captured > 0) {
          throw new ConflictException(
            'El campo ya tiene valores capturados: cambiar su tipo reescribiría la historia',
            { fieldId, captured },
          );
        }
        field.dataType = dto.dataType;
      }
      if (dto.name !== undefined) field.name = dto.name;
      touch(field, actor.id);

      this.logger.info(
        { operation: 'forms.field.update', fieldId },
        'Field definition updated',
      );
      return { ok: true };
    });
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
        throw new ConflictException('El código de campo ya existe', {
          code: dto.code,
        });
      }

      const field = this.fieldsRepo.createField(tx, {
        code: dto.code,
        name: dto.name,
        dataType: dto.dataType,
        sensitivityConceptId:
          dto.sensitivityConceptId ?? CONCEPTS.SENSITIVITY_NORMAL,
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
          operatorConceptId: rule.operator
            ? OPERATOR_BY_CODE[rule.operator]
            : undefined,
          parametersJson: rule.parameters,
          severityConceptId:
            rule.severity === 'WARNING'
              ? FORMS.SEVERITY_WARNING
              : FORMS.SEVERITY_ERROR,
          errorMessage: rule.errorMessage,
          ordinal: i,
          active: true,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        { operation: 'forms.field.create', fieldId: field.id },
        'Field created',
      );
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
      {
        operation: 'forms.field.dependency',
        targetFieldId,
        sourceFieldId: dto.sourceFieldId,
      },
      'Defining field dependency',
    );
    return this.em.transactional(async (tx) => {
      if (targetFieldId === dto.sourceFieldId) {
        throw new PreconditionFailedException(
          'Un campo no puede depender de sí mismo',
          {
            targetFieldId,
          },
        );
      }

      const target = await this.fieldsRepo.findFieldById(tx, targetFieldId);
      if (!target)
        throw new ResourceNotFoundException('Campo destino no encontrado', {
          targetFieldId,
        });
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
        throw new ConflictException(
          'La dependencia ya existe en ese grupo lógico',
          {
            targetFieldId,
            sourceFieldId: dto.sourceFieldId,
          },
        );
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
      throw new PreconditionFailedException('Idioma no soportado', {
        lang: langCode,
      });
    }
    return this.em.transactional(async (tx) => {
      const field = await this.fieldsRepo.findFieldById(tx, fieldId);
      if (!field)
        throw new ResourceNotFoundException('Campo no encontrado', { fieldId });

      const existing = await this.fieldsRepo.findLocalization(
        tx,
        fieldId,
        languageConceptId,
      );
      if (existing) {
        existing.label = dto.label ?? existing.label;
        existing.helpText = dto.helpText ?? existing.helpText;
        existing.placeholder = dto.placeholder ?? existing.placeholder;
        existing.validationMessage =
          dto.validationMessage ?? existing.validationMessage;
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
      if (!field)
        throw new ResourceNotFoundException('Campo no encontrado', { fieldId });

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
