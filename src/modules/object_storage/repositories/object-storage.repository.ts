import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ObjectNamespaces,
  MultipartUploads,
  ObjectManifests,
  ObjectVersions,
  ObjectChecksums,
  ObjectEncryptionEnvelopes,
  ObjectLocations,
  LargePayloadManifests,
} from '../entities';

export interface CreateObjectVersionData {
  objectManifestId: string;
  versionNumber: number;
  providerVersionId: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: string;
  sha256: string;
  etag: string;
  compression?: string;
  supersedesVersionId?: string;
}

/**
 * Acceso al núcleo de `object_storage.*`: espacios de nombres, cargas
 * multiparte, manifiestos de objeto con sus versiones inmutables, checksums,
 * sobres de cifrado, ubicaciones y payloads grandes.
 */
@Injectable()
export class ObjectStorageRepository {
  // --- Espacios de nombres (UC-60-01, 02, 03) ---

  findNamespaceByCode(
    em: EntityManager,
    code: string,
  ): Promise<ObjectNamespaces | null> {
    return em.findOne(ObjectNamespaces, { code });
  }

  findNamespaceById(
    em: EntityManager,
    id: string,
  ): Promise<ObjectNamespaces | null> {
    return em.findOne(ObjectNamespaces, { id });
  }

  // --- Cargas multiparte (UC-60-01, 02) ---

  createUpload(
    em: EntityManager,
    data: {
      tenantId?: string;
      namespaceId: string;
      providerUploadId: string;
      targetObjectKey: string;
      expectedSizeBytes: string;
      status: string;
      expiresAt?: Date;
    },
  ): MultipartUploads {
    return em.create(
      MultipartUploads,
      {
        tenantId: data.tenantId,
        namespaceId: data.namespaceId,
        providerUploadId: data.providerUploadId,
        targetObjectKey: data.targetObjectKey,
        expectedSizeBytes: data.expectedSizeBytes,
        status: data.status,
        expiresAt: data.expiresAt,
      },
      { partial: true },
    );
  }

  /** La carga del proveedor no se inicia dos veces en el mismo espacio. */
  findUploadByProviderId(
    em: EntityManager,
    namespaceId: string,
    providerUploadId: string,
  ): Promise<MultipartUploads | null> {
    return em.findOne(MultipartUploads, { namespaceId, providerUploadId });
  }

  findUploadForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<MultipartUploads | null> {
    return em.findOne(
      MultipartUploads,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Manifiestos de objeto (UC-60-02 … 12) ---

  createManifest(
    em: EntityManager,
    data: {
      tenantId?: string;
      namespaceId: string;
      logicalObjectId: string;
      objectType: string;
      patientProfileId?: string;
      lifecycleState: string;
      retentionPolicyCode?: string;
    },
  ): ObjectManifests {
    return em.create(
      ObjectManifests,
      {
        tenantId: data.tenantId,
        namespaceId: data.namespaceId,
        logicalObjectId: data.logicalObjectId,
        objectType: data.objectType,
        patientProfileId: data.patientProfileId,
        lifecycleState: data.lifecycleState,
        retentionPolicyCode: data.retentionPolicyCode,
      },
      { partial: true },
    );
  }

  findManifestById(
    em: EntityManager,
    id: string,
  ): Promise<ObjectManifests | null> {
    return em.findOne(ObjectManifests, { id });
  }

  /** Todo lo que versiona, retiene, archiva o borra el objeto lo bloquea. */
  findManifestForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ObjectManifests | null> {
    return em.findOne(
      ObjectManifests,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Clave lógica del objeto dentro de su espacio: destino del upsert de UC-60-02. */
  findManifestByLogicalIdForUpdate(
    em: EntityManager,
    namespaceId: string,
    logicalObjectId: string,
  ): Promise<ObjectManifests | null> {
    return em.findOne(
      ObjectManifests,
      { namespaceId, logicalObjectId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Versiones (UC-60-02, 03, 07 … 12) ---

  /** Versión inmutable: se inserta y nunca se reescribe. */
  createVersion(
    em: EntityManager,
    data: CreateObjectVersionData,
  ): ObjectVersions {
    return em.create(
      ObjectVersions,
      {
        objectManifestId: data.objectManifestId,
        versionNumber: data.versionNumber,
        providerVersionId: data.providerVersionId,
        objectKey: data.objectKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        sha256: data.sha256,
        etag: data.etag,
        compression: data.compression,
        supersedesVersionId: data.supersedesVersionId,
      },
      { partial: true },
    );
  }

  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<ObjectVersions | null> {
    return em.findOne(ObjectVersions, { id });
  }

  findLatestVersion(
    em: EntityManager,
    objectManifestId: string,
  ): Promise<ObjectVersions | null> {
    return em.findOne(
      ObjectVersions,
      { objectManifestId },
      { orderBy: { versionNumber: 'DESC' } },
    );
  }

  /** Mismo contenido ya versionado: no se crea una versión que no cambia nada. */
  findVersionBySha(
    em: EntityManager,
    objectManifestId: string,
    sha256: string,
  ): Promise<ObjectVersions | null> {
    return em.findOne(ObjectVersions, { objectManifestId, sha256 });
  }

  // --- Checksums, cifrado y ubicaciones ---

  createChecksum(
    em: EntityManager,
    data: {
      objectVersionId: string;
      algorithm: string;
      checksum: string;
      source: string;
      verificationStatus: string;
      verifiedAt?: Date;
    },
  ): ObjectChecksums {
    return em.create(
      ObjectChecksums,
      {
        objectVersionId: data.objectVersionId,
        algorithm: data.algorithm,
        checksum: data.checksum,
        source: data.source,
        verificationStatus: data.verificationStatus,
        verifiedAt: data.verifiedAt,
      },
      { partial: true },
    );
  }

  findChecksumForUpdate(
    em: EntityManager,
    objectVersionId: string,
    algorithm: string,
  ): Promise<ObjectChecksums | null> {
    return em.findOne(
      ObjectChecksums,
      { objectVersionId, algorithm },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createEncryptionEnvelope(
    em: EntityManager,
    data: {
      objectVersionId: string;
      algorithm: string;
      keyManagementProvider: string;
      encryptedDataKey: string;
      keyVersion: string;
      encryptionContextHash?: string;
    },
  ): ObjectEncryptionEnvelopes {
    return em.create(
      ObjectEncryptionEnvelopes,
      {
        objectVersionId: data.objectVersionId,
        algorithm: data.algorithm,
        keyManagementProvider: data.keyManagementProvider,
        encryptedDataKey: data.encryptedDataKey,
        keyVersion: data.keyVersion,
        encryptionContextHash: data.encryptionContextHash,
      },
      { partial: true },
    );
  }

  findEncryptionEnvelope(
    em: EntityManager,
    objectVersionId: string,
  ): Promise<ObjectEncryptionEnvelopes | null> {
    return em.findOne(ObjectEncryptionEnvelopes, { objectVersionId });
  }

  createLocation(
    em: EntityManager,
    data: {
      objectVersionId: string;
      namespaceId: string;
      placementRole: string;
      providerUri: string;
      storageClass: string;
      replicationState: string;
    },
  ): ObjectLocations {
    return em.create(
      ObjectLocations,
      {
        objectVersionId: data.objectVersionId,
        namespaceId: data.namespaceId,
        placementRole: data.placementRole,
        providerUri: data.providerUri,
        storageClass: data.storageClass,
        replicationState: data.replicationState,
      },
      { partial: true },
    );
  }

  /** Ubicación primaria de la versión: la que se sirve y la que se degrada al archivar. */
  findPrimaryLocationForUpdate(
    em: EntityManager,
    objectVersionId: string,
    primaryRole: string,
  ): Promise<ObjectLocations | null> {
    return em.findOne(
      ObjectLocations,
      { objectVersionId, placementRole: primaryRole },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findPrimaryLocation(
    em: EntityManager,
    objectVersionId: string,
    primaryRole: string,
  ): Promise<ObjectLocations | null> {
    return em.findOne(ObjectLocations, {
      objectVersionId,
      placementRole: primaryRole,
    });
  }

  // --- Payloads grandes (UC-60-06) ---

  createLargePayload(
    em: EntityManager,
    data: {
      tenantId?: string;
      payloadType: string;
      sourceEntityType: string;
      sourceEntityId: string;
      objectManifestId: string;
      contentHash: string;
      containsPhi: boolean;
    },
  ): LargePayloadManifests {
    return em.create(
      LargePayloadManifests,
      {
        tenantId: data.tenantId,
        payloadType: data.payloadType,
        sourceEntityType: data.sourceEntityType,
        sourceEntityId: data.sourceEntityId,
        objectManifestId: data.objectManifestId,
        contentHash: data.contentHash,
        containsPhi: data.containsPhi,
      },
      { partial: true },
    );
  }

  /** Un payload por origen y tipo: el mismo export no se registra dos veces. */
  findLargePayloadBySource(
    em: EntityManager,
    tenantId: string | undefined,
    sourceEntityType: string,
    sourceEntityId: string,
    payloadType: string,
  ): Promise<LargePayloadManifests | null> {
    return em.findOne(LargePayloadManifests, {
      tenantId,
      sourceEntityType,
      sourceEntityId,
      payloadType,
    });
  }
}
