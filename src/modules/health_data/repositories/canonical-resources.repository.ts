import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CanonicalHealthResources,
  CanonicalHealthResourceVersions,
  CanonicalResourceIdentifiers,
  CanonicalResourceRelationships,
  CanonicalResourceBindings,
} from '../entities';

export interface CreateResourceVersionData {
  canonicalHealthResourceId: string;
  versionNumber: number;
  healthIngestionRecordId?: string;
  effectiveStartAt?: Date;
  changeTypeConceptId: string;
  payloadFormatConceptId?: string;
  normalizedPayloadJson: unknown;
  originalPayloadFileId?: string;
  contentHash: string;
  provenanceRecordId?: string;
  supersedesVersionId?: string;
}

/**
 * Acceso al recurso canónico de `health_data.*`: recursos, versiones
 * inmutables, identificadores de negocio, relaciones y bindings al dominio.
 */
@Injectable()
export class CanonicalResourcesRepository {
  // --- Recursos (UC-52-03, 04, 05, 06, 07, 13, 14) ---

  createResource(
    em: EntityManager,
    data: {
      custodianTenantId?: string;
      resourceTypeConceptId: string;
      logicalIdentifier: string;
      patientProfileId?: string;
      encounterId?: string;
      sourceSystemId?: string;
      lifecycleStatusConceptId: string;
      securityLabelsJson?: unknown;
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
      },
      { partial: true },
    );
  }

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
        payloadFormatConceptId: data.payloadFormatConceptId,
        normalizedPayloadJson: data.normalizedPayloadJson,
        originalPayloadFileId: data.originalPayloadFileId,
        contentHash: data.contentHash,
        provenanceRecordId: data.provenanceRecordId,
        supersedesVersionId: data.supersedesVersionId,
      },
      { partial: true },
    );
  }

  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<CanonicalHealthResourceVersions | null> {
    return em.findOne(CanonicalHealthResourceVersions, { id });
  }

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

  findVersionsByIds(
    em: EntityManager,
    ids: string[],
  ): Promise<CanonicalHealthResourceVersions[]> {
    return em.find(CanonicalHealthResourceVersions, { id: { $in: ids } });
  }

  // --- Identificadores (UC-52-04) ---

  createIdentifier(
    em: EntityManager,
    data: {
      canonicalHealthResourceId: string;
      identifierSystem: string;
      identifierValue: string;
      identifierTypeConceptId?: string;
      assigningAuthority?: string;
      isPrimary: boolean;
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
      },
      { partial: true },
    );
  }

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

  createRelationship(
    em: EntityManager,
    data: {
      sourceResourceId: string;
      targetResourceId: string;
      relationshipTypeConceptId: string;
      relationshipRoleConceptId?: string;
      effectiveFrom: Date;
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

  createBinding(
    em: EntityManager,
    data: {
      canonicalHealthResourceId: string;
      domainEntityTypeConceptId: string;
      domainEntityId: string;
      bindingRoleConceptId?: string;
      bindingStatusConceptId: string;
      mappingVersionId?: string;
    },
  ): CanonicalResourceBindings {
    return em.create(
      CanonicalResourceBindings,
      {
        canonicalHealthResourceId: data.canonicalHealthResourceId,
        domainEntityTypeConceptId: data.domainEntityTypeConceptId,
        domainEntityId: data.domainEntityId,
        bindingRoleConceptId: data.bindingRoleConceptId,
        bindingStatusConceptId: data.bindingStatusConceptId,
        mappingVersionId: data.mappingVersionId,
      },
      { partial: true },
    );
  }

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
