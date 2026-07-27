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

  createConsistencyPolicy(
    em: EntityManager,
    data: {
      code: string;
      readConsistency: string;
      writeConsistency: string;
      conflictResolution?: string;
      staleReadToleranceSeconds: number;
      requiresReadYourWrites: boolean;
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

  findConsistencyPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<ConsistencyPolicies | null> {
    return em.findOne(ConsistencyPolicies, { id });
  }

  findConsistencyPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<ConsistencyPolicies | null> {
    return em.findOne(ConsistencyPolicies, { code });
  }

  // --- Residencia (UC-54-05, 10) ---

  createResidencyPolicy(
    em: EntityManager,
    data: {
      code: string;
      allowedCountryCodes?: string[];
      forbiddenCountryCodes?: string[];
      allowedRegionCodes?: string[];
      requiresInCountryBackup: boolean;
      crossBorderTransferBasis?: string;
      state: string;
    },
  ): ResidencyPolicies {
    return em.create(
      ResidencyPolicies,
      {
        code: data.code,
        allowedCountryCodes: data.allowedCountryCodes,
        forbiddenCountryCodes: data.forbiddenCountryCodes,
        allowedRegionCodes: data.allowedRegionCodes,
        requiresInCountryBackup: data.requiresInCountryBackup,
        crossBorderTransferBasis: data.crossBorderTransferBasis,
        state: data.state,
      },
      { partial: true },
    );
  }

  findResidencyPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<ResidencyPolicies | null> {
    return em.findOne(ResidencyPolicies, { id });
  }

  findResidencyPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<ResidencyPolicies | null> {
    return em.findOne(ResidencyPolicies, { code });
  }

  // --- Replicación (UC-54-10, 11) ---

  createReplicationPolicy(
    em: EntityManager,
    data: {
      code: string;
      replicaCount: number;
      replicationMode: string;
      crossRegionEnabled: boolean;
      maxReplicationLagSeconds?: number;
      failoverMode: string;
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

  findReplicationPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<ReplicationPolicies | null> {
    return em.findOne(ReplicationPolicies, { id });
  }

  findReplicationPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<ReplicationPolicies | null> {
    return em.findOne(ReplicationPolicies, { code });
  }

  // --- Retención (UC-54-10) ---

  createRetentionPolicy(
    em: EntityManager,
    data: {
      code: string;
      retentionDays: number;
      archiveAfterDays?: number;
      deletionMode: string;
      legalHoldOverridesDeletion: boolean;
      jurisdictionCode?: string;
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

  findRetentionPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<RetentionPolicies | null> {
    return em.findOne(RetentionPolicies, { code });
  }

  // --- Cifrado y rotación (UC-54-05, 09) ---

  createRotationPolicy(
    em: EntityManager,
    data: {
      code: string;
      rotationIntervalDays: number;
      overlapDays: number;
      reencryptExistingData: boolean;
      emergencyRotationEnabled: boolean;
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

  findRotationPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<KeyRotationPolicies | null> {
    return em.findOne(KeyRotationPolicies, { code });
  }

  createEncryptionProfile(
    em: EntityManager,
    data: {
      code: string;
      algorithm: string;
      keyManagementProvider: string;
      keyReference: string;
      envelopeEncryption: boolean;
      fieldLevelEncryption: boolean;
      deterministicFieldsJson?: unknown;
      rotationPolicyId?: string;
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
      },
      { partial: true },
    );
  }

  findEncryptionProfileById(
    em: EntityManager,
    id: string,
  ): Promise<EncryptionProfiles | null> {
    return em.findOne(EncryptionProfiles, { id });
  }

  findEncryptionProfileByCode(
    em: EntityManager,
    code: string,
  ): Promise<EncryptionProfiles | null> {
    return em.findOne(EncryptionProfiles, { code });
  }
}
