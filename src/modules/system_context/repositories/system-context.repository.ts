import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DynamicEnumDefinitions,
  DynamicEnumVersions,
  DynamicEnumOptions,
  DynamicEnumBindings,
  SystemContexts,
  SystemContextVersions,
  SystemContextInputs,
  SystemContextRefreshRuns,
  SystemContextBindings,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateEnumDefinitionData {
  code: string;
  name: string;
  description?: string;
  valueSetId: string;
  scopeTypeConceptId: string;
  tenantId?: string;
  countryConceptId?: string;
  selectionModeConceptId: string;
  allowTenantExtension: boolean;
  allowCustomValue: boolean;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateEnumOptionData {
  dynamicEnumVersionId: string;
  conceptId: string;
  code: string;
  display: string;
  ordinal: number;
  isDefault: boolean;
  enabled: boolean;
  metadataJson?: unknown;
  recordedByUserId?: string;
}

export interface CreateContextVersionData {
  systemContextId: string;
  versionNumber: number;
  refreshRunId?: string;
  schemaVersion: string;
  contextJson: unknown;
  contentHash: string;
  generatedByAgentId?: string;
  effectiveFrom?: Date;
  expiresAt?: Date;
  statusConceptId: string;
  recordedByUserId?: string;
}

/**
 * Acceso a `system_context.*`: definiciones, versiones, opciones y bindings de
 * enumeraciones dinámicas; contextos de sistema con sus versiones, entradas,
 * corridas de refresco y bindings de consumo.
 */
@Injectable()
export class SystemContextRepository {
  // --- Definiciones de enum (UC-45-01, 11) ---

  createEnumDefinition(
    em: EntityManager,
    data: CreateEnumDefinitionData,
  ): DynamicEnumDefinitions {
    return em.create(
      DynamicEnumDefinitions,
      {
        code: data.code,
        name: data.name,
        description: data.description,
        valueSetId: data.valueSetId,
        scopeTypeConceptId: data.scopeTypeConceptId,
        tenantId: data.tenantId,
        countryConceptId: data.countryConceptId,
        selectionModeConceptId: data.selectionModeConceptId,
        allowTenantExtension: data.allowTenantExtension,
        allowCustomValue: data.allowCustomValue,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findEnumDefinitionById(
    em: EntityManager,
    id: string,
  ): Promise<DynamicEnumDefinitions | null> {
    return em.findOne(DynamicEnumDefinitions, { id });
  }

  /**
   * Definición bloqueada. Redactar una versión la serializa: `version_number`
   * sale de un máximo, y dos redacciones simultáneas darían el mismo número.
   */
  findEnumDefinitionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<DynamicEnumDefinitions | null> {
    return em.findOne(
      DynamicEnumDefinitions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findEnumDefinitionByCode(
    em: EntityManager,
    code: string,
  ): Promise<DynamicEnumDefinitions | null> {
    return em.findOne(DynamicEnumDefinitions, { code });
  }

  // --- Versiones de enum (UC-45-02, 03) ---

  createEnumVersion(
    em: EntityManager,
    data: {
      dynamicEnumDefinitionId: string;
      versionNumber: number;
      valueSetVersionId?: string;
      schemaVersion?: string;
      statusConceptId: string;
      recordedByUserId?: string;
    },
  ): DynamicEnumVersions {
    return em.create(
      DynamicEnumVersions,
      {
        dynamicEnumDefinitionId: data.dynamicEnumDefinitionId,
        versionNumber: data.versionNumber,
        valueSetVersionId: data.valueSetVersionId,
        schemaVersion: data.schemaVersion,
        statusConceptId: data.statusConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  findEnumVersion(
    em: EntityManager,
    dynamicEnumDefinitionId: string,
    versionNumber: number,
  ): Promise<DynamicEnumVersions | null> {
    return em.findOne(DynamicEnumVersions, {
      dynamicEnumDefinitionId,
      versionNumber,
    });
  }

  findEnumVersionForUpdate(
    em: EntityManager,
    dynamicEnumDefinitionId: string,
    versionNumber: number,
  ): Promise<DynamicEnumVersions | null> {
    return em.findOne(
      DynamicEnumVersions,
      { dynamicEnumDefinitionId, versionNumber },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findLatestEnumVersion(
    em: EntityManager,
    dynamicEnumDefinitionId: string,
  ): Promise<DynamicEnumVersions | null> {
    return em.findOne(
      DynamicEnumVersions,
      { dynamicEnumDefinitionId },
      { orderBy: { versionNumber: 'DESC' } },
    );
  }

  /**
   * Versión publicada y vigente de la definición, bloqueada: publicar otra la
   * supersede, y sólo puede haber una sin `effective_to`.
   */
  findPublishedEnumVersionForUpdate(
    em: EntityManager,
    dynamicEnumDefinitionId: string,
    publishedStatusConceptId: string,
  ): Promise<DynamicEnumVersions | null> {
    return em.findOne(
      DynamicEnumVersions,
      {
        dynamicEnumDefinitionId,
        statusConceptId: publishedStatusConceptId,
        effectiveTo: null,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findPublishedEnumVersion(
    em: EntityManager,
    dynamicEnumDefinitionId: string,
    publishedStatusConceptId: string,
  ): Promise<DynamicEnumVersions | null> {
    return em.findOne(DynamicEnumVersions, {
      dynamicEnumDefinitionId,
      statusConceptId: publishedStatusConceptId,
      effectiveTo: null,
    });
  }

  // --- Opciones de enum (UC-45-02, 05) ---

  /** Snapshot inmutable: las opciones de una versión no se reescriben. */
  createEnumOption(
    em: EntityManager,
    data: CreateEnumOptionData,
  ): DynamicEnumOptions {
    return em.create(
      DynamicEnumOptions,
      {
        dynamicEnumVersionId: data.dynamicEnumVersionId,
        conceptId: data.conceptId,
        code: data.code,
        display: data.display,
        ordinal: data.ordinal,
        isDefault: data.isDefault,
        enabled: data.enabled,
        metadataJson: data.metadataJson,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  findEnumOptions(
    em: EntityManager,
    dynamicEnumVersionId: string,
  ): Promise<DynamicEnumOptions[]> {
    return em.find(
      DynamicEnumOptions,
      { dynamicEnumVersionId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  countEnabledOptions(
    em: EntityManager,
    dynamicEnumVersionId: string,
  ): Promise<number> {
    return em.count(DynamicEnumOptions, {
      dynamicEnumVersionId,
      enabled: true,
    });
  }

  // --- Bindings de enum (UC-45-04, 05, 11) ---

  createEnumBinding(
    em: EntityManager,
    data: {
      dynamicEnumDefinitionId: string;
      targetSchemaName: string;
      targetEntityName: string;
      targetFieldName: string;
      systemContextId?: string;
      required: boolean;
      fallbackConceptId?: string;
      validationModeConceptId: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): DynamicEnumBindings {
    return em.create(
      DynamicEnumBindings,
      {
        dynamicEnumDefinitionId: data.dynamicEnumDefinitionId,
        targetSchemaName: data.targetSchemaName,
        targetEntityName: data.targetEntityName,
        targetFieldName: data.targetFieldName,
        systemContextId: data.systemContextId,
        required: data.required,
        fallbackConceptId: data.fallbackConceptId,
        validationModeConceptId: data.validationModeConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Un campo destino no puede tener dos enums gobernándolo a la vez. */
  findEnumBindingByTarget(
    em: EntityManager,
    targetSchemaName: string,
    targetEntityName: string,
    targetFieldName: string,
    activeStatusConceptId: string,
  ): Promise<DynamicEnumBindings | null> {
    return em.findOne(DynamicEnumBindings, {
      targetSchemaName,
      targetEntityName,
      targetFieldName,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Bindings activos de la definición, bloqueados: retirarla los deshabilita. */
  findEnumBindingsForUpdate(
    em: EntityManager,
    dynamicEnumDefinitionId: string,
    activeStatusConceptId: string,
  ): Promise<DynamicEnumBindings[]> {
    return em.find(
      DynamicEnumBindings,
      { dynamicEnumDefinitionId, statusConceptId: activeStatusConceptId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Contextos de sistema (UC-45-06, 09, 12) ---

  createContext(
    em: EntityManager,
    data: {
      code: string;
      name: string;
      description?: string;
      contextTypeConceptId: string;
      scopeTypeConceptId: string;
      tenantId?: string;
      countryConceptId?: string;
      localeConceptId?: string;
      refreshPolicyConceptId?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): SystemContexts {
    return em.create(
      SystemContexts,
      {
        code: data.code,
        name: data.name,
        description: data.description,
        contextTypeConceptId: data.contextTypeConceptId,
        scopeTypeConceptId: data.scopeTypeConceptId,
        tenantId: data.tenantId,
        countryConceptId: data.countryConceptId,
        localeConceptId: data.localeConceptId,
        refreshPolicyConceptId: data.refreshPolicyConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findContextById(
    em: EntityManager,
    id: string,
  ): Promise<SystemContexts | null> {
    return em.findOne(SystemContexts, { id });
  }

  /** Todo lo que mueve `current_version_id` bloquea el contexto. */
  findContextForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<SystemContexts | null> {
    return em.findOne(
      SystemContexts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findContextByCode(
    em: EntityManager,
    code: string,
  ): Promise<SystemContexts | null> {
    return em.findOne(SystemContexts, { code });
  }

  // --- Versiones de contexto (UC-45-06, 07, 09, 12) ---

  createContextVersion(
    em: EntityManager,
    data: CreateContextVersionData,
  ): SystemContextVersions {
    return em.create(
      SystemContextVersions,
      {
        systemContextId: data.systemContextId,
        versionNumber: data.versionNumber,
        refreshRunId: data.refreshRunId,
        schemaVersion: data.schemaVersion,
        contextJson: data.contextJson,
        contentHash: data.contentHash,
        generatedByAgentId: data.generatedByAgentId,
        effectiveFrom: data.effectiveFrom,
        expiresAt: data.expiresAt,
        statusConceptId: data.statusConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  findContextVersionById(
    em: EntityManager,
    id: string,
  ): Promise<SystemContextVersions | null> {
    return em.findOne(SystemContextVersions, { id });
  }

  findContextVersionForUpdate(
    em: EntityManager,
    systemContextId: string,
    versionNumber: number,
  ): Promise<SystemContextVersions | null> {
    return em.findOne(
      SystemContextVersions,
      { systemContextId, versionNumber },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findLatestContextVersion(
    em: EntityManager,
    systemContextId: string,
  ): Promise<SystemContextVersions | null> {
    return em.findOne(
      SystemContextVersions,
      { systemContextId },
      { orderBy: { versionNumber: 'DESC' } },
    );
  }

  /** Versión vigente del contexto, bloqueada: activar otra la supersede. */
  findActiveContextVersionForUpdate(
    em: EntityManager,
    systemContextId: string,
    activeStatusConceptId: string,
  ): Promise<SystemContextVersions | null> {
    return em.findOne(
      SystemContextVersions,
      {
        systemContextId,
        statusConceptId: activeStatusConceptId,
        effectiveTo: null,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Entradas de la versión (UC-45-08) ---

  /** Procedencia append-only: la entrada snapshotea la fuente tal como estaba. */
  createContextInput(
    em: EntityManager,
    data: {
      systemContextVersionId: string;
      sourceTypeConceptId: string;
      sourceSchemaName?: string;
      sourceEntityName?: string;
      sourceRecordId?: string;
      sourceVersionId?: string;
      sourceContentHash?: string;
      sourceFreshnessAt?: Date;
      precedence: number;
      required: boolean;
      recordedByUserId?: string;
    },
  ): SystemContextInputs {
    return em.create(
      SystemContextInputs,
      {
        systemContextVersionId: data.systemContextVersionId,
        sourceTypeConceptId: data.sourceTypeConceptId,
        sourceSchemaName: data.sourceSchemaName,
        sourceEntityName: data.sourceEntityName,
        sourceRecordId: data.sourceRecordId,
        sourceVersionId: data.sourceVersionId,
        sourceContentHash: data.sourceContentHash,
        sourceFreshnessAt: data.sourceFreshnessAt,
        precedence: data.precedence,
        required: data.required,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  findContextInputs(
    em: EntityManager,
    systemContextVersionId: string,
  ): Promise<SystemContextInputs[]> {
    return em.find(
      SystemContextInputs,
      { systemContextVersionId },
      { orderBy: { precedence: 'ASC' } },
    );
  }

  // --- Corridas de refresco (UC-45-07) ---

  createRefreshRun(
    em: EntityManager,
    data: {
      systemContextId: string;
      idempotencyKey: string;
      triggerConceptId: string;
      statusConceptId: string;
      recordedByUserId?: string;
    },
  ): SystemContextRefreshRuns {
    return em.create(
      SystemContextRefreshRuns,
      {
        systemContextId: data.systemContextId,
        idempotencyKey: data.idempotencyKey,
        triggerConceptId: data.triggerConceptId,
        statusConceptId: data.statusConceptId,
        startedAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /** Clave de idempotencia del worker: reintentar no vuelve a refrescar. */
  findRefreshRunByKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<SystemContextRefreshRuns | null> {
    return em.findOne(SystemContextRefreshRuns, { idempotencyKey });
  }

  // --- Bindings de consumo (UC-45-10) ---

  createContextBinding(
    em: EntityManager,
    data: {
      systemContextId: string;
      consumerTypeConceptId: string;
      consumerId: string;
      tenantId?: string;
      countryConceptId?: string;
      activationRuleJson?: unknown;
      priority: number;
      validFrom?: Date;
      validTo?: Date;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): SystemContextBindings {
    return em.create(
      SystemContextBindings,
      {
        systemContextId: data.systemContextId,
        consumerTypeConceptId: data.consumerTypeConceptId,
        consumerId: data.consumerId,
        tenantId: data.tenantId,
        countryConceptId: data.countryConceptId,
        activationRuleJson: data.activationRuleJson,
        priority: data.priority,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Bindings vivos del mismo consumidor: la ventana no puede solaparse. */
  findContextBindingsForConsumer(
    em: EntityManager,
    systemContextId: string,
    consumerTypeConceptId: string,
    consumerId: string,
    activeStatusConceptId: string,
  ): Promise<SystemContextBindings[]> {
    return em.find(SystemContextBindings, {
      systemContextId,
      consumerTypeConceptId,
      consumerId,
      statusConceptId: activeStatusConceptId,
    });
  }
}
