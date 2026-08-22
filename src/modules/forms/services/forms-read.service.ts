import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { Encounters } from '../../clinical/entities';
import {
  DefinitionSetsRepository,
  FieldDefinitionsRepository,
  AssignmentsRepository,
  FormInstancesRepository,
  FieldValuesRepository,
} from '../repositories';
import type {
  DynamicFieldDefinitions,
  FieldDefinitionSets,
  FieldValues,
  FormInstances,
} from '../entities';
import {
  DefinitionSetItemDto,
  DefinitionSetListResponseDto,
  DefinitionSetDetailResponseDto,
  FieldSchemaDto,
  FormInstanceItemDto,
  FormInstanceListResponseDto,
  FormInstanceDetailResponseDto,
  FieldValueItemDto,
  FieldAssignmentListResponseDto,
  ExtensionBudgetResponseDto,
  MyFormInstanceListResponseDto,
} from '../dto';
import { FORMS } from '../forms.concepts';

/**
 * Columna `value_*` que corresponde leer para cada tipo técnico: el inverso de
 * `buildValueColumns()`. `url` no figura en la escritura pero la columna existe;
 * se resuelve acá para no perder un dato ya persistido.
 */
const VALUE_GETTER_BY_TYPE: Record<string, (v: FieldValues) => unknown> = {
  string: (v) => v.valueString,
  text: (v) => v.valueText,
  integer: (v) => v.valueInteger,
  decimal: (v) => v.valueDecimal,
  boolean: (v) => v.valueBoolean,
  date: (v) => v.valueDate,
  datetime: (v) => v.valueDatetime,
  time: (v) => v.valueTime,
  url: (v) => v.valueUrl,
  code: (v) => v.valueConceptId,
  reference: (v) => v.valueReferenceId,
  uuid: (v) => v.valueReferenceId,
  binary: (v) => v.fileId,
  json: (v) => v.valueJson,
};

/**
 * Orden de rastreo cuando la definición del campo ya no existe y no hay
 * `dataType` que decida: se devuelve la primera columna con contenido, que en
 * un modelo value[x] exclusivo es la única.
 */
const VALUE_FALLBACK_ORDER: ((v: FieldValues) => unknown)[] = [
  (v) => v.valueString,
  (v) => v.valueText,
  (v) => v.valueInteger,
  (v) => v.valueDecimal,
  (v) => v.valueBoolean,
  (v) => v.valueDate,
  (v) => v.valueDatetime,
  (v) => v.valueTime,
  (v) => v.valueUrl,
  (v) => v.valueConceptId,
  (v) => v.valueReferenceId,
  (v) => v.fileId,
  (v) => v.valueJson,
];

/**
 * Cara de lectura del módulo forms (Fase 1 del carril de consulta).
 *
 * El módulo era íntegramente de escritura: se podían definir sets, abrir
 * instancias y capturar valores, pero ninguna operación permitía volver a leer
 * nada de eso —quien cerraba un formulario solo lo reencontraba si guardó el id
 * del alta—. Esta cara agrega las lecturas que el frontend necesita para
 * renderizar formularios dirigidos por datos y re-pintar los ya respondidos.
 *
 * Sigue el patrón de `ChartReadService`: sólo lectura, sin transacción, sobre
 * un `fork` del `EntityManager`; lotes `$in` en vez de N+1; se pide una fila de
 * más por listado para declarar el recorte.
 *
 * ## Aislamiento de instancias
 *
 * `form_instances` no tiene columna de tenant utilizable (`tenant_context_id`
 * apunta a `system_context`, lo elige el cliente y nadie lo valida), así que la
 * propiedad se ancla en el recurso: las instancias reales se abren con
 * `resourceId` = encuentro (decisión del carril), y `clinical.encounters` sí
 * tiene `tenant_id` obligatorio. La lectura carga el encuentro y exige que
 * pertenezca al tenant del contexto. Si el recurso no resuelve a un encuentro,
 * la instancia no puede anclarse de forma segura y se responde 404 —fail
 * closed—, igual que para lo ajeno: confirmar que existe algo de otro ya
 * filtra información (mismo criterio que las lecturas de surveys).
 *
 * ## Enmascarado deny-by-default
 *
 * Las `field_value_access_rules` se escriben pero ningún componente del
 * sistema las evalúa, y su semántica de roles (`read_role_value_set_id`)
 * requiere un puente rol→value-set que no existe. Mientras tanto, un campo con
 * regla activa responde `masked: true` y sin valor: fallar cerrado, nunca
 * abierto.
 */
@Injectable()
export class FormsReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param setsRepo - Acceso a sets de definiciones, versiones y miembros.
   * @param fieldsRepo - Acceso a definiciones de campo y sus satélites.
   * @param assignmentsRepo - Acceso a asignaciones y secciones.
   * @param instancesRepo - Acceso a instancias de formulario.
   * @param valuesRepo - Acceso a valores capturados.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly setsRepo: DefinitionSetsRepository,
    private readonly fieldsRepo: FieldDefinitionsRepository,
    private readonly assignmentsRepo: AssignmentsRepository,
    private readonly instancesRepo: FormInstancesRepository,
    private readonly valuesRepo: FieldValuesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FormsReadService.name);
  }

  /**
   * Lista los sets de definiciones visibles: los globales y los del tenant.
   *
   * @param tenantId - Tenant del actor, si el contexto lo fijó.
   * @param limit - Tope del listado.
   * @returns Sets visibles, con el recorte declarado.
   */
  async listDefinitionSets(
    tenantId: string | undefined,
    limit: number,
  ): Promise<DefinitionSetListResponseDto> {
    this.logger.info(
      { operation: 'forms.read.sets', limit },
      'Listando sets de definiciones',
    );
    const em = this.em.fork();
    const rows = await this.setsRepo.findSets(em, tenantId, limit + 1);
    const truncated = rows.length > limit;
    return {
      items: rows.slice(0, limit).map((set) => this.toSetItem(set)),
      limit,
      truncated,
    };
  }

  /**
   * El detalle de un set: versiones con sus miembros, y cada campo con la
   * información completa para render dirigido por datos.
   *
   * @param id - Identificador del set.
   * @param tenantId - Tenant del actor, si el contexto lo fijó.
   * @returns El set con versiones, campos y secciones resueltos.
   * @throws ResourceNotFoundException si no existe o pertenece a otro tenant.
   */
  async getDefinitionSet(
    id: string,
    tenantId: string | undefined,
  ): Promise<DefinitionSetDetailResponseDto> {
    this.logger.info(
      { operation: 'forms.read.set', setId: id },
      'Leyendo set de definiciones',
    );
    const em = this.em.fork();

    const set = await this.setsRepo.findSetById(em, id);
    // 404 también para el set de otro tenant: confirmar que existe ya filtra.
    if (!set || (set.ownerTenantId && set.ownerTenantId !== tenantId)) {
      throw new ResourceNotFoundException('Set de definiciones no encontrado', {
        setId: id,
      });
    }

    const versions = await this.setsRepo.findVersionsBySet(em, set.id);
    const members = await this.setsRepo.findMembersByVersions(
      em,
      versions.map((version) => version.id),
    );

    const fieldIds = [...new Set(members.map((member) => member.fieldId))];
    const sectionIds = [
      ...new Set(
        members
          .map((member) => member.sectionId)
          .filter((sectionId): sectionId is string => Boolean(sectionId)),
      ),
    ];

    // Cuatro lotes independientes: satélites de los campos y las secciones.
    const [fields, rules, dependencies, localizations, sections] =
      await Promise.all([
        this.fieldsRepo.findFieldsByIds(em, fieldIds),
        this.fieldsRepo.findValidationRulesByFieldIds(em, fieldIds),
        this.fieldsRepo.findDependenciesByTargetFieldIds(em, fieldIds),
        this.fieldsRepo.findLocalizationsByFieldIds(em, fieldIds),
        this.assignmentsRepo.findSectionsByIds(em, sectionIds),
      ]);

    const membersByVersion = new Map<string, typeof members>();
    for (const member of members) {
      const bucket = membersByVersion.get(member.definitionSetVersionId) ?? [];
      bucket.push(member);
      membersByVersion.set(member.definitionSetVersionId, bucket);
    }

    return {
      ...this.toSetItem(set),
      versions: versions.map((version) => ({
        id: version.id,
        semanticVersion: version.semanticVersion,
        schemaHash: version.schemaHash,
        publicationStatusConceptId: version.publicationStatusConceptId,
        compatibilityConceptId: version.compatibilityConceptId,
        effectiveFrom: version.effectiveFrom,
        effectiveTo: version.effectiveTo,
        recordedAt: version.recordedAt,
        members: (membersByVersion.get(version.id) ?? []).map((member) => ({
          fieldId: member.fieldId,
          sectionId: member.sectionId,
          required: member.required,
          ordinal: member.ordinal,
        })),
      })),
      fields: fields.map((field) =>
        this.toFieldSchema(field, rules, dependencies, localizations),
      ),
      sections: sections.map((section) => ({
        id: section.id,
        code: section.code,
        name: section.name,
        parentSectionId: section.parentSectionId,
        ordinal: section.ordinal,
      })),
    };
  }

  /**
   * Las instancias de formulario de un encuentro.
   *
   * @param encounterId - Encuentro cuyos formularios se listan.
   * @param limit - Tope del listado.
   * @returns Instancias del encuentro, con el recorte declarado.
   * @throws ResourceNotFoundException si el encuentro no existe o es de otro tenant.
   */
  async listInstancesByEncounter(
    encounterId: string,
    limit: number,
  ): Promise<FormInstanceListResponseDto> {
    this.logger.info(
      { operation: 'forms.read.instances', encounterId, limit },
      'Listando instancias del encuentro',
    );
    const em = this.em.fork();
    await this.loadOwnEncounter(em, encounterId);

    const rows = await this.instancesRepo.findByResourceId(
      em,
      encounterId,
      limit + 1,
    );
    const truncated = rows.length > limit;
    return {
      encounterId,
      items: rows.slice(0, limit).map((row) => this.toInstanceItem(row)),
      limit,
      truncated,
    };
  }

  /**
   * El detalle de una instancia con sus valores vigentes, cada uno con su
   * columna `value_*` resuelta según el tipo del campo.
   *
   * @param id - Identificador de la instancia.
   * @returns La instancia y sus valores.
   * @throws ResourceNotFoundException si no existe, no ancla a un encuentro o es ajena.
   */
  async getInstance(id: string): Promise<FormInstanceDetailResponseDto> {
    this.logger.info(
      { operation: 'forms.read.instance', instanceId: id },
      'Leyendo instancia de formulario',
    );
    const em = this.em.fork();

    const instance = await this.instancesRepo.findById(em, id);
    if (!instance) {
      throw new ResourceNotFoundException('Instancia no encontrada', {
        instanceId: id,
      });
    }
    // El ancla de propiedad es el encuentro del recurso; sin él no se sirve.
    await this.loadOwnEncounter(em, instance.resourceId, id);

    return this.composeInstanceDetail(em, instance);
  }

  /**
   * Los formularios del paciente de la sesión, de todos sus encuentros del
   * tenant activo (autoservicio, Fase 3 del carril).
   *
   * El perfil de paciente **no se acepta por parámetro**: sale del claim de la
   * sesión, igual que en las lecturas de surveys. La propiedad se demuestra por
   * el mismo ancla que el resto de las lecturas: los encuentros del paciente en
   * el tenant, y las instancias adjuntas a esos encuentros.
   *
   * @param actor - Sujeto autenticado; debe tener perfil de paciente.
   * @param limit - Tope del listado.
   * @returns Las instancias del paciente, con el recorte declarado.
   */
  async listMyInstances(
    actor: AuthenticatedUser,
    limit: number,
  ): Promise<MyFormInstanceListResponseDto> {
    const patientProfileId = this.requirePatientProfile(actor);
    const tenantId = requireTenantId();
    this.logger.info(
      { operation: 'forms.read.myInstances', limit },
      'Listando los formularios del paciente de la sesión',
    );
    const em = this.em.fork();

    // Primero los encuentros propios; las instancias se buscan por lote sobre
    // sus ids, nunca una consulta por encuentro.
    const encounters = await em.find(Encounters, {
      patientProfileId,
      tenantId,
    });
    const rows = await this.instancesRepo.findByResourceIds(
      em,
      encounters.map((encounter) => encounter.id),
      limit + 1,
    );
    const truncated = rows.length > limit;
    return {
      items: rows.slice(0, limit).map((row) => this.toInstanceItem(row)),
      limit,
      truncated,
    };
  }

  /**
   * El detalle de una instancia del propio paciente, con sus valores vigentes.
   *
   * Mismo 404 para lo inexistente, lo de otro paciente, lo de otro tenant y lo
   * que no ancla a un encuentro: confirmar cuál de esas cosas pasó ya filtra
   * información.
   *
   * @param id - Identificador de la instancia.
   * @param actor - Sujeto autenticado; debe tener perfil de paciente.
   * @returns La instancia y sus valores, con el enmascarado aplicado.
   * @throws ResourceNotFoundException si la instancia no es alcanzable por el actor.
   */
  async getMyInstance(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<FormInstanceDetailResponseDto> {
    const patientProfileId = this.requirePatientProfile(actor);
    const tenantId = requireTenantId();
    this.logger.info(
      { operation: 'forms.read.myInstance', instanceId: id },
      'Leyendo un formulario del paciente de la sesión',
    );
    const em = this.em.fork();

    const instance = await this.instancesRepo.findById(em, id);
    if (!instance) {
      throw new ResourceNotFoundException('Instancia no encontrada', {
        instanceId: id,
      });
    }
    const encounter = await em.findOne(Encounters, {
      id: instance.resourceId,
    });
    if (
      !encounter ||
      encounter.tenantId !== tenantId ||
      encounter.patientProfileId !== patientProfileId
    ) {
      throw new ResourceNotFoundException('Instancia no encontrada', {
        instanceId: id,
      });
    }

    return this.composeInstanceDetail(em, instance);
  }

  /**
   * Las asignaciones de campo visibles, con sus secciones resueltas.
   *
   * @param filtro - Acotaciones opcionales por target, campo o sección.
   * @param tenantId - Tenant del actor, si el contexto lo fijó.
   * @param limit - Tope del listado.
   * @returns Asignaciones visibles, con el recorte declarado.
   */
  async listAssignments(
    filtro: {
      /** Target al que se asignaron los campos. */
      targetResourceConceptId?: string;
      /** Campo asignado. */
      fieldId?: string;
      /** Sección que aloja las asignaciones. */
      sectionId?: string;
    },
    tenantId: string | undefined,
    limit: number,
  ): Promise<FieldAssignmentListResponseDto> {
    this.logger.info(
      { operation: 'forms.read.assignments', limit },
      'Listando asignaciones de campo',
    );
    const em = this.em.fork();
    const rows = await this.assignmentsRepo.findAssignments(
      em,
      filtro,
      tenantId,
      limit + 1,
    );
    const truncated = rows.length > limit;
    const page = rows.slice(0, limit);

    const sections = await this.assignmentsRepo.findSectionsByIds(em, [
      ...new Set(page.map((assignment) => assignment.sectionId)),
    ]);

    return {
      items: page.map((assignment) => ({
        id: assignment.id,
        fieldId: assignment.fieldId,
        targetResourceConceptId: assignment.targetResourceConceptId,
        profileTypeConceptId: assignment.profileTypeConceptId,
        tenantId: assignment.tenantId,
        branchId: assignment.branchId,
        sectionId: assignment.sectionId,
        required: assignment.required,
        visible: assignment.visible,
        editable: assignment.editable,
        ordinal: assignment.ordinal,
        validFrom: assignment.validFrom,
        validTo: assignment.validTo,
        stateConceptId: assignment.stateConceptId,
      })),
      sections: sections.map((section) => ({
        id: section.id,
        code: section.code,
        name: section.name,
        parentSectionId: section.parentSectionId,
        ordinal: section.ordinal,
      })),
      limit,
      truncated,
    };
  }

  /**
   * Cuánto puede extender este tenant un formulario estándar.
   *
   * Devuelve la política **como la aplica la escritura**, no como está escrita:
   * la del tenant le gana a la global, y sin política activa el presupuesto es
   * cero y `allowTenantFields` es falso. Si dijera otra cosa, la pantalla
   * ofrecería un botón que el `POST` va a rechazar.
   *
   * @param targetResourceConceptId - Target cuyo presupuesto se consulta.
   * @param tenantId - Tenant del actor, si el contexto lo fijó.
   * @returns Tope, consumo y resto.
   */
  async getExtensionBudget(
    targetResourceConceptId: string,
    tenantId: string | undefined,
  ): Promise<ExtensionBudgetResponseDto> {
    const em = this.em.fork();
    const policy = await this.assignmentsRepo.findActivePolicyForTenant(
      em,
      targetResourceConceptId,
      CONCEPTS.STATE_ACTIVE,
      tenantId,
    );
    const used = await this.assignmentsRepo.countActiveAssignments(
      em,
      targetResourceConceptId,
      FORMS.ASSIGNMENT_ACTIVE,
      tenantId,
    );
    const maximumFields = policy?.maximumFields ?? undefined;
    return {
      targetResourceConceptId,
      allowTenantFields: policy?.allowTenantFields === true,
      ...(maximumFields === undefined ? {} : { maximumFields }),
      used,
      ...(maximumFields === undefined
        ? {}
        : { remaining: Math.max(0, maximumFields - used) }),
    };
  }

  /**
   * Compone el detalle de una instancia **ya autorizada**: sus valores
   * vigentes, cada uno con la columna `value_*` resuelta según el tipo del
   * campo y el enmascarado deny-by-default aplicado.
   *
   * La autorización es del llamador a propósito: la lectura clínica ancla en el
   * tenant y el autoservicio ancla además en el paciente, pero lo que se sirve
   * después es idéntico — dos composiciones divergirían en el primer cambio.
   *
   * @param em - Contexto de persistencia de la lectura.
   * @param instance - Instancia cuya propiedad ya se comprobó.
   * @returns La instancia y sus valores.
   */
  private async composeInstanceDetail(
    em: EntityManager,
    instance: FormInstances,
  ): Promise<FormInstanceDetailResponseDto> {
    const values = await this.valuesRepo.findCurrentByInstance(
      em,
      instance.id,
      FORMS.VALUE_SUPERSEDED,
    );

    const fieldIds = [...new Set(values.map((value) => value.fieldId))];
    const [fields, accessRules] = await Promise.all([
      this.fieldsRepo.findFieldsByIds(em, fieldIds),
      this.fieldsRepo.findActiveAccessRulesByFieldIds(
        em,
        fieldIds,
        FORMS.ACCESS_RULE_ACTIVE,
      ),
    ]);
    const fieldById = new Map(fields.map((field) => [field.id, field]));
    const maskedFields = new Set(accessRules.map((rule) => rule.fieldId));

    return {
      ...this.toInstanceItem(instance),
      values: values.map((value) =>
        this.toValueItem(value, fieldById, maskedFields),
      ),
    };
  }

  /**
   * Exige que la sesión tenga perfil de paciente.
   *
   * Es lo que impide que un profesional o un administrador entren por la
   * puerta del autoservicio, y el identificador no se acepta por parámetro
   * justamente para que nadie pida los formularios de otro (mismo criterio que
   * el autoservicio de surveys).
   *
   * @param actor - Sujeto autenticado.
   * @returns El perfil de paciente del claim.
   * @throws PreconditionFailedException si la cuenta no tiene perfil de paciente.
   */
  private requirePatientProfile(actor: AuthenticatedUser): string {
    if (!actor.patientProfileId) {
      throw new PreconditionFailedException(
        'La sesión no tiene perfil de paciente asociado',
        { userId: actor.id },
      );
    }
    return actor.patientProfileId;
  }

  /**
   * Carga el encuentro y exige que pertenezca al tenant del contexto.
   *
   * 404 y no 403 para lo ajeno o lo inexistente, y también cuando el recurso
   * no resuelve a un encuentro: sin ancla de tenant no hay lectura segura.
   *
   * @param em - Contexto de persistencia de la lectura.
   * @param encounterId - Encuentro que ancla la propiedad.
   * @param instanceId - Instancia que motivó la carga, para el detalle del error.
   * @returns El encuentro, ya verificado.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  private async loadOwnEncounter(
    em: EntityManager,
    encounterId: string,
    instanceId?: string,
  ): Promise<Encounters> {
    const tenantId = requireTenantId();
    const encounter = await em.findOne(Encounters, { id: encounterId });
    if (!encounter || encounter.tenantId !== tenantId) {
      throw new ResourceNotFoundException(
        instanceId ? 'Instancia no encontrada' : 'Encuentro no encontrado',
        instanceId ? { instanceId } : { encounterId },
      );
    }
    return encounter;
  }

  /**
   * Proyecta un set a su forma de listado.
   *
   * @param set - Entidad leída.
   * @returns El item del listado.
   */
  private toSetItem(set: FieldDefinitionSets): DefinitionSetItemDto {
    return {
      id: set.id,
      namespaceUri: set.namespaceUri,
      code: set.code,
      name: set.name,
      ownerTenantId: set.ownerTenantId,
      targetDomainConceptId: set.targetDomainConceptId,
      statusConceptId: set.statusConceptId,
      createdAt: set.createdAt,
    };
  }

  /**
   * Proyecta una instancia a su forma de listado.
   *
   * @param instance - Entidad leída.
   * @returns El item del listado.
   */
  private toInstanceItem(instance: FormInstances): FormInstanceItemDto {
    return {
      id: instance.id,
      resourceId: instance.resourceId,
      resourceTypeConceptId: instance.resourceTypeConceptId,
      schemaVersion: instance.schemaVersion,
      stateConceptId: instance.stateConceptId,
      closedAt: instance.closedAt,
      createdAt: instance.createdAt,
    };
  }

  /**
   * Compone el esquema completo de un campo desde sus satélites ya leídos.
   *
   * @param field - Definición del campo.
   * @param rules - Reglas de validación de todos los campos del lote.
   * @param dependencies - Dependencias de todos los campos del lote.
   * @param localizations - Localizaciones de todos los campos del lote.
   * @returns El esquema del campo, listo para render.
   */
  private toFieldSchema(
    field: DynamicFieldDefinitions,
    rules: Awaited<
      ReturnType<FieldDefinitionsRepository['findValidationRulesByFieldIds']>
    >,
    dependencies: Awaited<
      ReturnType<FieldDefinitionsRepository['findDependenciesByTargetFieldIds']>
    >,
    localizations: Awaited<
      ReturnType<FieldDefinitionsRepository['findLocalizationsByFieldIds']>
    >,
  ): FieldSchemaDto {
    return {
      id: field.id,
      code: field.code,
      name: field.name,
      dataType: field.dataType,
      valueSetId: field.valueSetId,
      unitValueSetId: field.unitValueSetId,
      cardinalityMin: field.cardinalityMin,
      cardinalityMax: field.cardinalityMax,
      lengthMin: field.lengthMin,
      lengthMax: field.lengthMax,
      regex: field.regex,
      defaultValueJson: field.defaultValueJson,
      stateConceptId: field.stateConceptId,
      localizations: localizations
        .filter((loc) => loc.fieldId === field.id)
        .map((loc) => ({
          languageConceptId: loc.languageConceptId,
          label: loc.label,
          helpText: loc.helpText,
          placeholder: loc.placeholder,
          validationMessage: loc.validationMessage,
        })),
      validationRules: rules
        .filter((rule) => rule.fieldId === field.id)
        .map((rule) => ({
          id: rule.id,
          ruleTypeConceptId: rule.ruleTypeConceptId,
          operatorConceptId: rule.operatorConceptId,
          parametersJson: rule.parametersJson,
          errorMessage: rule.errorMessage,
          severityConceptId: rule.severityConceptId,
          ordinal: rule.ordinal,
          active: rule.active,
        })),
      dependencies: dependencies
        .filter((dep) => dep.targetFieldId === field.id)
        .map((dep) => ({
          id: dep.id,
          targetFieldId: dep.targetFieldId,
          sourceFieldId: dep.sourceFieldId,
          operatorConceptId: dep.operatorConceptId,
          behaviorConceptId: dep.behaviorConceptId,
          comparisonValueJson: dep.comparisonValueJson,
          logicalGroup: dep.logicalGroup,
          ordinal: dep.ordinal,
        })),
    };
  }

  /**
   * Proyecta un valor: resuelve la columna `value_*` según el tipo del campo y
   * aplica el enmascarado deny-by-default.
   *
   * `fieldName` viaja también cuando el valor está enmascarado: lo protegido es
   * el contenido, no la existencia del campo — la pantalla imprime la etiqueta
   * junto al marcador.
   *
   * @param value - Fila de valor vigente.
   * @param fieldById - Definición por campo, de las definiciones leídas.
   * @param maskedFields - Campos con regla de acceso activa.
   * @returns El item de valor de la respuesta.
   */
  private toValueItem(
    value: FieldValues,
    fieldById: Map<string, DynamicFieldDefinitions>,
    maskedFields: Set<string>,
  ): FieldValueItemDto {
    const field = fieldById.get(value.fieldId);
    const dataType = field?.dataType;
    const masked = maskedFields.has(value.fieldId);
    return {
      id: value.id,
      fieldId: value.fieldId,
      dataType,
      fieldName: field?.name,
      value: masked ? null : this.resolveValue(value, dataType),
      unitConceptId: value.unitConceptId,
      valueStatusConceptId: value.valueStatusConceptId,
      valueVersion: value.valueVersion,
      ordinal: value.ordinal,
      effectiveFrom: value.effectiveFrom,
      masked,
    };
  }

  /**
   * El contenido de la única columna `value_*` que el tipo determina; si la
   * definición del campo ya no existe, la primera columna con contenido.
   *
   * @param value - Fila de valor vigente.
   * @param dataType - Tipo técnico del campo, si se conoce.
   * @returns El valor único de la fila, o null si no hay ninguno.
   */
  private resolveValue(value: FieldValues, dataType?: string): unknown {
    const getter = dataType ? VALUE_GETTER_BY_TYPE[dataType] : undefined;
    if (getter) {
      return getter(value) ?? null;
    }
    for (const candidate of VALUE_FALLBACK_ORDER) {
      const contenido = candidate(value);
      if (contenido !== undefined && contenido !== null) {
        return contenido;
      }
    }
    return null;
  }
}
