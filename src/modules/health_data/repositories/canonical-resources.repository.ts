import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import {
  CanonicalHealthResources,
  CanonicalHealthResourceVersions,
  CanonicalResourceIdentifiers,
  CanonicalResourceRelationships,
  CanonicalResourceBindings,
} from '../entities';

/**
 * Describe el contrato estructural de create resource version data.
 */
export interface CreateResourceVersionData {
  /**
   * Identificador asociado a canonical health resource.
   */
  canonicalHealthResourceId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a health ingestion record.
   */
  healthIngestionRecordId?: string;
  /**
   * Valor de effective start at mantenido por la instancia.
   */
  effectiveStartAt?: Date;
  /**
   * Identificador asociado a change type concept.
   */
  changeTypeConceptId: string;
  /**
   * Identificador asociado a payload format concept.
   */
  payloadFormatConceptId?: string;
  /**
   * Valor de normalized payload json mantenido por la instancia.
   */
  normalizedPayloadJson: unknown;
  /**
   * Identificador asociado a original payload file.
   */
  originalPayloadFileId?: string;
  /**
   * Valor de content hash mantenido por la instancia.
   */
  contentHash: string;
  /**
   * Identificador asociado a provenance record.
   */
  provenanceRecordId?: string;
  /**
   * Identificador asociado a supersedes version.
   */
  supersedesVersionId?: string;
}

/**
 * Acceso al recurso canónico de `health_data.*`: recursos, versiones
 * inmutables, identificadores de negocio, relaciones y bindings al dominio.
 */
@Injectable()
export class CanonicalResourcesRepository {
  // --- Recursos (UC-52-03, 04, 05, 06, 07, 13, 14) ---

  /**
   * Crea create resource.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create resource conforme al contrato `CanonicalHealthResources`.
   */
  createResource(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a custodian tenant.
       */
      custodianTenantId?: string;
      /**
       * Identificador asociado a resource type concept.
       */
      resourceTypeConceptId: string;
      /**
       * Valor de logical identifier mantenido por la instancia.
       */
      logicalIdentifier: string;
      /**
       * Identificador asociado a patient profile.
       */
      patientProfileId?: string;
      /**
       * Identificador asociado a encounter.
       */
      encounterId?: string;
      /**
       * Identificador asociado a source system.
       */
      sourceSystemId?: string;
      /**
       * Identificador asociado a lifecycle status concept.
       */
      lifecycleStatusConceptId: string;
      /**
       * Valor de security labels json mantenido por la instancia.
       */
      securityLabelsJson?: unknown;
      /**
       * Valor de purpose restrictions json mantenido por la instancia.
       */
      purposeRestrictionsJson?: unknown;
    },
  ): CanonicalHealthResources {
    return em.create(
      CanonicalHealthResources,
      {
        custodianTenantId: data.custodianTenantId,
        resourceTypeConceptId: data.resourceTypeConceptId,
        logicalIdentifier: data.logicalIdentifier,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        sourceSystemId: data.sourceSystemId,
        lifecycleStatusConceptId: data.lifecycleStatusConceptId,
        securityLabelsJson: data.securityLabelsJson,
        purposeRestrictionsJson: data.purposeRestrictionsJson,
        // Columnas NOT NULL sin default en el esquema.
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find resource by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find resource by id conforme al contrato `Promise<CanonicalHealthResources | null>`.
   */
  findResourceById(
    em: EntityManager,
    id: string,
  ): Promise<CanonicalHealthResources | null> {
    return em.findOne(CanonicalHealthResources, { id });
  }

  /** Todo lo que versiona, cuarentena o retira el recurso lo bloquea. */
  findResourceForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CanonicalHealthResources | null> {
    return em.findOne(
      CanonicalHealthResources,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Clave lógica del recurso dentro del custodio: es el destino del upsert de UC-52-03. */
  findResourceByLogicalIdForUpdate(
    em: EntityManager,
    custodianTenantId: string | undefined,
    resourceTypeConceptId: string,
    logicalIdentifier: string,
  ): Promise<CanonicalHealthResources | null> {
    return em.findOne(
      CanonicalHealthResources,
      { custodianTenantId, resourceTypeConceptId, logicalIdentifier },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Recursos vivos del paciente: es la base del Bundle `$everything`. */
  findResourcesByPatient(
    em: EntityManager,
    custodianTenantId: string | undefined,
    patientProfileIds: string[],
    activeLifecycleConceptId: string,
  ): Promise<CanonicalHealthResources[]> {
    return em.find(CanonicalHealthResources, {
      custodianTenantId,
      patientProfileId: { $in: patientProfileIds },
      lifecycleStatusConceptId: activeLifecycleConceptId,
    });
  }

  // --- Versiones (UC-52-03, 07, 13) ---

  /** Versión inmutable: se inserta y nunca se reescribe. */
  createResourceVersion(
    em: EntityManager,
    data: CreateResourceVersionData,
  ): CanonicalHealthResourceVersions {
    return em.create(
      CanonicalHealthResourceVersions,
      {
        canonicalHealthResourceId: data.canonicalHealthResourceId,
        versionNumber: data.versionNumber,
        healthIngestionRecordId: data.healthIngestionRecordId,
        recordedAt: new Date(),
        effectiveStartAt: data.effectiveStartAt,
        changeTypeConceptId: data.changeTypeConceptId,
        // NOT NULL en el esquema y ningún llamador lo aportaba: lo que el
        // módulo normaliza es JSON FHIR, así que ése es el formato por defecto.
        payloadFormatConceptId:
          data.payloadFormatConceptId ?? CONCEPTS.HD_PAYLOAD_FORMAT_FHIR_JSON,
        normalizedPayloadJson: data.normalizedPayloadJson,
        originalPayloadFileId: data.originalPayloadFileId,
        contentHash: data.contentHash,
        provenanceRecordId: data.provenanceRecordId,
        supersedesVersionId: data.supersedesVersionId,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find version by id conforme al contrato `Promise<CanonicalHealthResourceVersions | null>`.
   */
  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<CanonicalHealthResourceVersions | null> {
    return em.findOne(CanonicalHealthResourceVersions, { id });
  }

  /**
   * Obtiene find latest version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param canonicalHealthResourceId - Identificador de canonical health resource.
   * @returns Resultado de find latest version conforme al contrato `Promise<CanonicalHealthResourceVersions | null>`.
   */
  findLatestVersion(
    em: EntityManager,
    canonicalHealthResourceId: string,
  ): Promise<CanonicalHealthResourceVersions | null> {
    return em.findOne(
      CanonicalHealthResourceVersions,
      { canonicalHealthResourceId },
      { orderBy: { versionNumber: 'DESC' } },
    );
  }

  /**
   * Obtiene find versions by ids.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Valor de ids requerido por la operación.
   * @returns Resultado de find versions by ids conforme al contrato `Promise<CanonicalHealthResourceVersions[]>`.
   */
  findVersionsByIds(
    em: EntityManager,
    ids: string[],
  ): Promise<CanonicalHealthResourceVersions[]> {
    return em.find(CanonicalHealthResourceVersions, { id: { $in: ids } });
  }

  // --- Identificadores (UC-52-04) ---

  /**
   * Crea create identifier.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create identifier conforme al contrato `CanonicalResourceIdentifiers`.
   */
  createIdentifier(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a canonical health resource.
       */
      canonicalHealthResourceId: string;
      /**
       * Valor de identifier system mantenido por la instancia.
       */
      identifierSystem: string;
      /**
       * Valor de identifier value mantenido por la instancia.
       */
      identifierValue: string;
      /**
       * Identificador asociado a identifier type concept.
       */
      identifierTypeConceptId?: string;
      /**
       * Valor de assigning authority mantenido por la instancia.
       */
      assigningAuthority?: string;
      /**
       * Valor de is primary mantenido por la instancia.
       */
      isPrimary: boolean;
      /**
       * Valor de effective from mantenido por la instancia.
       */
      effectiveFrom: Date;
    },
  ): CanonicalResourceIdentifiers {
    return em.create(
      CanonicalResourceIdentifiers,
      {
        canonicalHealthResourceId: data.canonicalHealthResourceId,
        identifierSystem: data.identifierSystem,
        identifierValue: data.identifierValue,
        identifierTypeConceptId: data.identifierTypeConceptId,
        assigningAuthority: data.assigningAuthority,
        isPrimary: data.isPrimary,
        effectiveFrom: data.effectiveFrom,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find identifier.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param canonicalHealthResourceId - Identificador de canonical health resource.
   * @param identifierSystem - Valor de identifier system requerido por la operación.
   * @param identifierValue - Valor de identifier value requerido por la operación.
   * @returns Resultado de find identifier conforme al contrato `Promise<CanonicalResourceIdentifiers | null>`.
   */
  findIdentifier(
    em: EntityManager,
    canonicalHealthResourceId: string,
    identifierSystem: string,
    identifierValue: string,
  ): Promise<CanonicalResourceIdentifiers | null> {
    return em.findOne(CanonicalResourceIdentifiers, {
      canonicalHealthResourceId,
      identifierSystem,
      identifierValue,
    });
  }

  /**
   * Identificador principal vigente del mismo sistema, bloqueado: sólo puede
   * haber uno, y cederlo y tomarlo deben verse en la misma transacción.
   */
  findPrimaryIdentifierForUpdate(
    em: EntityManager,
    canonicalHealthResourceId: string,
    identifierSystem: string,
  ): Promise<CanonicalResourceIdentifiers | null> {
    return em.findOne(
      CanonicalResourceIdentifiers,
      {
        canonicalHealthResourceId,
        identifierSystem,
        isPrimary: true,
        effectiveTo: null,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Relaciones (UC-52-05, 13, 14) ---

  /**
   * Crea create relationship.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create relationship conforme al contrato `CanonicalResourceRelationships`.
   */
  createRelationship(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a source resource.
       */
      sourceResourceId: string;
      /**
       * Identificador asociado a target resource.
       */
      targetResourceId: string;
      /**
       * Identificador asociado a relationship type concept.
       */
      relationshipTypeConceptId: string;
      /**
       * Identificador asociado a relationship role concept.
       */
      relationshipRoleConceptId?: string;
      /**
       * Valor de effective from mantenido por la instancia.
       */
      effectiveFrom: Date;
      /**
       * Valor de confidence score mantenido por la instancia.
       */
      confidenceScore?: string;
    },
  ): CanonicalResourceRelationships {
    return em.create(
      CanonicalResourceRelationships,
      {
        sourceResourceId: data.sourceResourceId,
        targetResourceId: data.targetResourceId,
        relationshipTypeConceptId: data.relationshipTypeConceptId,
        relationshipRoleConceptId: data.relationshipRoleConceptId,
        effectiveFrom: data.effectiveFrom,
        confidenceScore: data.confidenceScore,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Relación vigente del mismo par y tipo: reemplazarla la cierra. */
  findLiveRelationshipForUpdate(
    em: EntityManager,
    sourceResourceId: string,
    targetResourceId: string,
    relationshipTypeConceptId: string,
  ): Promise<CanonicalResourceRelationships | null> {
    return em.findOne(
      CanonicalResourceRelationships,
      {
        sourceResourceId,
        targetResourceId,
        relationshipTypeConceptId,
        effectiveTo: null,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find live relationships for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param sourceResourceId - Identificador de source resource.
   * @returns Resultado de find live relationships for update conforme al contrato `Promise<CanonicalResourceRelationships[]>`.
   */
  findLiveRelationshipsForUpdate(
    em: EntityManager,
    sourceResourceId: string,
  ): Promise<CanonicalResourceRelationships[]> {
    return em.find(
      CanonicalResourceRelationships,
      { sourceResourceId, effectiveTo: null },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find live relationships by sources.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param sourceResourceIds - Valor de source resource ids requerido por la operación.
   * @returns Resultado de find live relationships by sources conforme al contrato `Promise<CanonicalResourceRelationships[]>`.
   */
  findLiveRelationshipsBySources(
    em: EntityManager,
    sourceResourceIds: string[],
  ): Promise<CanonicalResourceRelationships[]> {
    return em.find(CanonicalResourceRelationships, {
      sourceResourceId: { $in: sourceResourceIds },
      effectiveTo: null,
    });
  }

  // --- Bindings al dominio (UC-52-06, 14) ---

  /**
   * Crea create binding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create binding conforme al contrato `CanonicalResourceBindings`.
   */
  createBinding(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a canonical health resource.
       */
      canonicalHealthResourceId: string;
      /**
       * Identificador asociado a domain entity type concept.
       */
      domainEntityTypeConceptId: string;
      /**
       * Identificador asociado a domain entity.
       */
      domainEntityId: string;
      /**
       * Identificador asociado a binding role concept.
       */
      bindingRoleConceptId?: string;
      /**
       * Identificador asociado a binding status concept.
       */
      bindingStatusConceptId: string;
      /**
       * Identificador asociado a mapping version.
       */
      mappingVersionId?: string;
    },
  ): CanonicalResourceBindings {
    return em.create(
      CanonicalResourceBindings,
      {
        canonicalHealthResourceId: data.canonicalHealthResourceId,
        domainEntityTypeConceptId: data.domainEntityTypeConceptId,
        domainEntityId: data.domainEntityId,
        // NOT NULL: un amarre sin papel declarado es el amarre principal del
        // recurso a su entidad de dominio, que es el caso normal.
        bindingRoleConceptId:
          data.bindingRoleConceptId ?? CONCEPTS.HD_TARGET_ROLE_OUTPUT,
        bindingStatusConceptId: data.bindingStatusConceptId,
        mappingVersionId: data.mappingVersionId,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find binding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param canonicalHealthResourceId - Identificador de canonical health resource.
   * @param domainEntityTypeConceptId - Identificador de domain entity type concept.
   * @param domainEntityId - Identificador de domain entity.
   * @param bindingRoleConceptId - Identificador de binding role concept.
   * @returns Resultado de find binding conforme al contrato `Promise<CanonicalResourceBindings | null>`.
   */
  findBinding(
    em: EntityManager,
    canonicalHealthResourceId: string,
    domainEntityTypeConceptId: string,
    domainEntityId: string,
    bindingRoleConceptId?: string,
  ): Promise<CanonicalResourceBindings | null> {
    return em.findOne(CanonicalResourceBindings, {
      canonicalHealthResourceId,
      domainEntityTypeConceptId,
      domainEntityId,
      bindingRoleConceptId,
    });
  }

  /**
   * Obtiene find live bindings for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param canonicalHealthResourceId - Identificador de canonical health resource.
   * @returns Resultado de find live bindings for update conforme al contrato `Promise<CanonicalResourceBindings[]>`.
   */
  findLiveBindingsForUpdate(
    em: EntityManager,
    canonicalHealthResourceId: string,
  ): Promise<CanonicalResourceBindings[]> {
    return em.find(
      CanonicalResourceBindings,
      { canonicalHealthResourceId, endedAt: null },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
