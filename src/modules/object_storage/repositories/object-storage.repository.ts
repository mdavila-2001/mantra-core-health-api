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

/**
 * Describe el contrato estructural de create object version data.
 */
export interface CreateObjectVersionData {
  /**
   * Identificador asociado a object manifest.
   */
  objectManifestId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a provider version.
   */
  providerVersionId: string;
  /**
   * Valor de object key mantenido por la instancia.
   */
  objectKey: string;
  /**
   * Valor de mime type mantenido por la instancia.
   */
  mimeType: string;
  /**
   * Valor de size bytes mantenido por la instancia.
   */
  sizeBytes: string;
  /**
   * Valor de sha256 mantenido por la instancia.
   */
  sha256: string;
  /**
   * Valor de etag mantenido por la instancia.
   */
  etag: string;
  /**
   * Valor de compression mantenido por la instancia.
   */
  compression?: string;
  /**
   * Identificador asociado a supersedes version.
   */
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

  /**
   * Obtiene find namespace by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find namespace by code conforme al contrato `Promise<ObjectNamespaces | null>`.
   */
  findNamespaceByCode(
    em: EntityManager,
    code: string,
  ): Promise<ObjectNamespaces | null> {
    return em.findOne(ObjectNamespaces, { code });
  }

  /**
   * Obtiene find namespace by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find namespace by id conforme al contrato `Promise<ObjectNamespaces | null>`.
   */
  findNamespaceById(
    em: EntityManager,
    id: string,
  ): Promise<ObjectNamespaces | null> {
    return em.findOne(ObjectNamespaces, { id });
  }

  // --- Cargas multiparte (UC-60-01, 02) ---

  /**
   * Crea create upload.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create upload conforme al contrato `MultipartUploads`.
   */
  createUpload(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a namespace.
       */
      namespaceId: string;
      /**
       * Identificador asociado a provider upload.
       */
      providerUploadId: string;
      /**
       * Valor de target object key mantenido por la instancia.
       */
      targetObjectKey: string;
      /**
       * Valor de expected size bytes mantenido por la instancia.
       */
      expectedSizeBytes: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de expires at mantenido por la instancia.
       */
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
        // Una subida multiparte nace sin nada recibido: la columna es NOT NULL
        // y sin ella el alta fallaba con 500.
        receivedSizeBytes: '0',
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
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

  /**
   * Obtiene find upload for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find upload for update conforme al contrato `Promise<MultipartUploads | null>`.
   */
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

  /**
   * Crea create manifest.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create manifest conforme al contrato `ObjectManifests`.
   */
  createManifest(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a namespace.
       */
      namespaceId: string;
      /**
       * Identificador asociado a logical object.
       */
      logicalObjectId: string;
      /**
       * Valor de object type mantenido por la instancia.
       */
      objectType: string;
      /**
       * Identificador asociado a patient profile.
       */
      patientProfileId?: string;
      /**
       * Valor de lifecycle state mantenido por la instancia.
       */
      lifecycleState: string;
      /**
       * Valor de retention policy code mantenido por la instancia.
       */
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
        // Columnas NOT NULL sin default en el esquema.
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find manifest by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find manifest by id conforme al contrato `Promise<ObjectManifests | null>`.
   */
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
   * @returns Resultado de find version by id conforme al contrato `Promise<ObjectVersions | null>`.
   */
  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<ObjectVersions | null> {
    return em.findOne(ObjectVersions, { id });
  }

  /**
   * Obtiene find latest version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param objectManifestId - Identificador de object manifest.
   * @returns Resultado de find latest version conforme al contrato `Promise<ObjectVersions | null>`.
   */
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

  /**
   * Crea create checksum.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create checksum conforme al contrato `ObjectChecksums`.
   */
  createChecksum(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a object version.
       */
      objectVersionId: string;
      /**
       * Valor de algorithm mantenido por la instancia.
       */
      algorithm: string;
      /**
       * Valor de checksum mantenido por la instancia.
       */
      checksum: string;
      /**
       * Valor de source mantenido por la instancia.
       */
      source: string;
      /**
       * Valor de verification status mantenido por la instancia.
       */
      verificationStatus: string;
      /**
       * Valor de verified at mantenido por la instancia.
       */
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

  /**
   * Obtiene find checksum for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param objectVersionId - Identificador de object version.
   * @param algorithm - Valor de algorithm requerido por la operación.
   * @returns Resultado de find checksum for update conforme al contrato `Promise<ObjectChecksums | null>`.
   */
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

  /**
   * Crea create encryption envelope.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create encryption envelope conforme al contrato `ObjectEncryptionEnvelopes`.
   */
  createEncryptionEnvelope(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a object version.
       */
      objectVersionId: string;
      /**
       * Valor de algorithm mantenido por la instancia.
       */
      algorithm: string;
      /**
       * Valor de key management provider mantenido por la instancia.
       */
      keyManagementProvider: string;
      /**
       * Valor de encrypted data key mantenido por la instancia.
       */
      encryptedDataKey: string;
      /**
       * Valor de key version mantenido por la instancia.
       */
      keyVersion: string;
      /**
       * Valor de encryption context hash mantenido por la instancia.
       */
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
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find encryption envelope.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param objectVersionId - Identificador de object version.
   * @returns Resultado de find encryption envelope conforme al contrato `Promise<ObjectEncryptionEnvelopes | null>`.
   */
  findEncryptionEnvelope(
    em: EntityManager,
    objectVersionId: string,
  ): Promise<ObjectEncryptionEnvelopes | null> {
    return em.findOne(ObjectEncryptionEnvelopes, { objectVersionId });
  }

  /**
   * Crea create location.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create location conforme al contrato `ObjectLocations`.
   */
  createLocation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a object version.
       */
      objectVersionId: string;
      /**
       * Identificador asociado a namespace.
       */
      namespaceId: string;
      /**
       * Valor de placement role mantenido por la instancia.
       */
      placementRole: string;
      /**
       * Valor de provider uri mantenido por la instancia.
       */
      providerUri: string;
      /**
       * Valor de storage class mantenido por la instancia.
       */
      storageClass: string;
      /**
       * Valor de replication state mantenido por la instancia.
       */
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

  /**
   * Obtiene find primary location.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param objectVersionId - Identificador de object version.
   * @param primaryRole - Valor de primary role requerido por la operación.
   * @returns Resultado de find primary location conforme al contrato `Promise<ObjectLocations | null>`.
   */
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

  /**
   * Crea create large payload.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create large payload conforme al contrato `LargePayloadManifests`.
   */
  createLargePayload(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Valor de payload type mantenido por la instancia.
       */
      payloadType: string;
      /**
       * Valor de source entity type mantenido por la instancia.
       */
      sourceEntityType: string;
      /**
       * Identificador asociado a source entity.
       */
      sourceEntityId: string;
      /**
       * Identificador asociado a object manifest.
       */
      objectManifestId: string;
      /**
       * Valor de content hash mantenido por la instancia.
       */
      contentHash: string;
      /**
       * Valor de contains phi mantenido por la instancia.
       */
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
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
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
