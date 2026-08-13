import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ConsistencyPolicies,
  ResidencyPolicies,
  ReplicationPolicies,
  PolyglotStorageRetentionPolicies as RetentionPolicies,
  EncryptionProfiles,
  KeyRotationPolicies,
} from '../entities';

/**
 * Acceso a las políticas de gobierno de `polyglot_storage.*`: consistencia,
 * residencia, replicación, retención, cifrado y rotación de claves.
 *
 * Van juntas porque son el mismo tipo de objeto —reglas con código único que
 * otras tablas referencian— y porque una colocación las evalúa todas a la vez
 * antes de aprobarse.
 */
@Injectable()
export class StoragePoliciesRepository {
  // --- Consistencia (UC-54-06) ---

  /**
   * Crea create consistency policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create consistency policy conforme al contrato `ConsistencyPolicies`.
   */
  createConsistencyPolicy(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de read consistency mantenido por la instancia.
       */
      readConsistency: string;
      /**
       * Valor de write consistency mantenido por la instancia.
       */
      writeConsistency: string;
      /**
       * Valor de conflict resolution mantenido por la instancia.
       */
      conflictResolution?: string;
      /**
       * Valor de stale read tolerance seconds mantenido por la instancia.
       */
      staleReadToleranceSeconds: number;
      /**
       * Valor de requires read your writes mantenido por la instancia.
       */
      requiresReadYourWrites: boolean;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): ConsistencyPolicies {
    return em.create(
      ConsistencyPolicies,
      {
        code: data.code,
        readConsistency: data.readConsistency,
        writeConsistency: data.writeConsistency,
        conflictResolution: data.conflictResolution,
        staleReadToleranceSeconds: data.staleReadToleranceSeconds,
        requiresReadYourWrites: data.requiresReadYourWrites,
        state: data.state,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find consistency policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find consistency policy by id conforme al contrato `Promise<ConsistencyPolicies | null>`.
   */
  findConsistencyPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<ConsistencyPolicies | null> {
    return em.findOne(ConsistencyPolicies, { id });
  }

  /**
   * Obtiene find consistency policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find consistency policy by code conforme al contrato `Promise<ConsistencyPolicies | null>`.
   */
  findConsistencyPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<ConsistencyPolicies | null> {
    return em.findOne(ConsistencyPolicies, { code });
  }

  // --- Residencia (UC-54-05, 10) ---

  /**
   * Crea create residency policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create residency policy conforme al contrato `ResidencyPolicies`.
   */
  createResidencyPolicy(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de allowed country codes mantenido por la instancia.
       */
      allowedCountryCodes?: string[];
      /**
       * Valor de forbidden country codes mantenido por la instancia.
       */
      forbiddenCountryCodes?: string[];
      /**
       * Valor de allowed region codes mantenido por la instancia.
       */
      allowedRegionCodes?: string[];
      /**
       * Valor de requires in country backup mantenido por la instancia.
       */
      requiresInCountryBackup: boolean;
      /**
       * Valor de cross border transfer basis mantenido por la instancia.
       */
      crossBorderTransferBasis?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): ResidencyPolicies {
    return em.create(
      ResidencyPolicies,
      {
        code: data.code,
        // NOT NULL: una política sin países declarados no permite ninguno, que
        // es el comportamiento cerrado que corresponde a residencia de datos.
        allowedCountryCodes: data.allowedCountryCodes ?? [],
        forbiddenCountryCodes: data.forbiddenCountryCodes,
        allowedRegionCodes: data.allowedRegionCodes,
        requiresInCountryBackup: data.requiresInCountryBackup,
        crossBorderTransferBasis: data.crossBorderTransferBasis,
        state: data.state,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find residency policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find residency policy by id conforme al contrato `Promise<ResidencyPolicies | null>`.
   */
  findResidencyPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<ResidencyPolicies | null> {
    return em.findOne(ResidencyPolicies, { id });
  }

  /**
   * Obtiene find residency policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find residency policy by code conforme al contrato `Promise<ResidencyPolicies | null>`.
   */
  findResidencyPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<ResidencyPolicies | null> {
    return em.findOne(ResidencyPolicies, { code });
  }

  // --- Replicación (UC-54-10, 11) ---

  /**
   * Crea create replication policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create replication policy conforme al contrato `ReplicationPolicies`.
   */
  createReplicationPolicy(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de replica count mantenido por la instancia.
       */
      replicaCount: number;
      /**
       * Valor de replication mode mantenido por la instancia.
       */
      replicationMode: string;
      /**
       * Valor de cross region enabled mantenido por la instancia.
       */
      crossRegionEnabled: boolean;
      /**
       * Valor de max replication lag seconds mantenido por la instancia.
       */
      maxReplicationLagSeconds?: number;
      /**
       * Valor de failover mode mantenido por la instancia.
       */
      failoverMode: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): ReplicationPolicies {
    return em.create(
      ReplicationPolicies,
      {
        code: data.code,
        replicaCount: data.replicaCount,
        replicationMode: data.replicationMode,
        crossRegionEnabled: data.crossRegionEnabled,
        maxReplicationLagSeconds: data.maxReplicationLagSeconds,
        failoverMode: data.failoverMode,
        state: data.state,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find replication policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find replication policy by id conforme al contrato `Promise<ReplicationPolicies | null>`.
   */
  findReplicationPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<ReplicationPolicies | null> {
    return em.findOne(ReplicationPolicies, { id });
  }

  /**
   * Obtiene find replication policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find replication policy by code conforme al contrato `Promise<ReplicationPolicies | null>`.
   */
  findReplicationPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<ReplicationPolicies | null> {
    return em.findOne(ReplicationPolicies, { code });
  }

  // --- Retención (UC-54-10) ---

  /**
   * Crea create retention policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create retention policy conforme al contrato `RetentionPolicies`.
   */
  createRetentionPolicy(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de retention days mantenido por la instancia.
       */
      retentionDays: number;
      /**
       * Valor de archive after days mantenido por la instancia.
       */
      archiveAfterDays?: number;
      /**
       * Valor de deletion mode mantenido por la instancia.
       */
      deletionMode: string;
      /**
       * Valor de legal hold overrides deletion mantenido por la instancia.
       */
      legalHoldOverridesDeletion: boolean;
      /**
       * Valor de jurisdiction code mantenido por la instancia.
       */
      jurisdictionCode?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): RetentionPolicies {
    return em.create(
      RetentionPolicies,
      {
        code: data.code,
        retentionDays: data.retentionDays,
        archiveAfterDays: data.archiveAfterDays,
        deletionMode: data.deletionMode,
        legalHoldOverridesDeletion: data.legalHoldOverridesDeletion,
        jurisdictionCode: data.jurisdictionCode,
        state: data.state,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find retention policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find retention policy by code conforme al contrato `Promise<RetentionPolicies | null>`.
   */
  findRetentionPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<RetentionPolicies | null> {
    return em.findOne(RetentionPolicies, { code });
  }

  // --- Cifrado y rotación (UC-54-05, 09) ---

  /**
   * Crea create rotation policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create rotation policy conforme al contrato `KeyRotationPolicies`.
   */
  createRotationPolicy(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de rotation interval days mantenido por la instancia.
       */
      rotationIntervalDays: number;
      /**
       * Valor de overlap days mantenido por la instancia.
       */
      overlapDays: number;
      /**
       * Valor de reencrypt existing data mantenido por la instancia.
       */
      reencryptExistingData: boolean;
      /**
       * Valor de emergency rotation enabled mantenido por la instancia.
       */
      emergencyRotationEnabled: boolean;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): KeyRotationPolicies {
    return em.create(
      KeyRotationPolicies,
      {
        code: data.code,
        rotationIntervalDays: data.rotationIntervalDays,
        overlapDays: data.overlapDays,
        reencryptExistingData: data.reencryptExistingData,
        emergencyRotationEnabled: data.emergencyRotationEnabled,
        state: data.state,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find rotation policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find rotation policy by code conforme al contrato `Promise<KeyRotationPolicies | null>`.
   */
  findRotationPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<KeyRotationPolicies | null> {
    return em.findOne(KeyRotationPolicies, { code });
  }

  /**
   * Crea create encryption profile.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create encryption profile conforme al contrato `EncryptionProfiles`.
   */
  createEncryptionProfile(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de algorithm mantenido por la instancia.
       */
      algorithm: string;
      /**
       * Valor de key management provider mantenido por la instancia.
       */
      keyManagementProvider: string;
      /**
       * Valor de key reference mantenido por la instancia.
       */
      keyReference: string;
      /**
       * Valor de envelope encryption mantenido por la instancia.
       */
      envelopeEncryption: boolean;
      /**
       * Valor de field level encryption mantenido por la instancia.
       */
      fieldLevelEncryption: boolean;
      /**
       * Valor de deterministic fields json mantenido por la instancia.
       */
      deterministicFieldsJson?: unknown;
      /**
       * Identificador asociado a rotation policy.
       */
      rotationPolicyId?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): EncryptionProfiles {
    return em.create(
      EncryptionProfiles,
      {
        code: data.code,
        algorithm: data.algorithm,
        keyManagementProvider: data.keyManagementProvider,
        keyReference: data.keyReference,
        envelopeEncryption: data.envelopeEncryption,
        fieldLevelEncryption: data.fieldLevelEncryption,
        deterministicFieldsJson: data.deterministicFieldsJson,
        rotationPolicyId: data.rotationPolicyId,
        state: data.state,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find encryption profile by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find encryption profile by id conforme al contrato `Promise<EncryptionProfiles | null>`.
   */
  findEncryptionProfileById(
    em: EntityManager,
    id: string,
  ): Promise<EncryptionProfiles | null> {
    return em.findOne(EncryptionProfiles, { id });
  }

  /**
   * Obtiene find encryption profile by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find encryption profile by code conforme al contrato `Promise<EncryptionProfiles | null>`.
   */
  findEncryptionProfileByCode(
    em: EntityManager,
    code: string,
  ): Promise<EncryptionProfiles | null> {
    return em.findOne(EncryptionProfiles, { code });
  }
}
