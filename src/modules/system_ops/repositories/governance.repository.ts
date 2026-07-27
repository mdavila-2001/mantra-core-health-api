import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AnonymizationRules,
  DataDomains,
  EntityRegistry,
  FieldRegistry,
  GovernanceChangeLog,
  SystemOpsDataClassifications,
  SystemOpsRetentionPolicies,
  WritePolicies,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Acceso a datos del catálogo de gobierno (dominios, clasificaciones, registro de
 * entidades/campos) y de sus políticas (escritura, retención, anonimización) más
 * la bitácora de cambios de gobierno.
 *
 * Repositorio STATELESS: cada método recibe el `EntityManager` activo, de modo que
 * el servicio controla la transacción y el flush por niveles (las FK son columnas
 * uuid planas y MikroORM no ordena inserts entre entidades no relacionadas).
 */
@Injectable()
export class GovernanceRepository {
  // --- Dominios de datos (UPSERT por code) ---
  findDomainByCode(
    em: EntityManager,
    code: string,
  ): Promise<DataDomains | null> {
    return em.findOne(DataDomains, { code });
  }

  createDomain(
    em: EntityManager,
    data: {
      code: string;
      name: string;
      ownerTeam?: string;
      actorUserId?: string;
    },
  ): DataDomains {
    return em.create(
      DataDomains,
      {
        code: data.code,
        name: data.name,
        ownerTeam: data.ownerTeam,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Clasificaciones de datos (UPSERT por code) ---
  findClassificationByCode(
    em: EntityManager,
    code: string,
  ): Promise<SystemOpsDataClassifications | null> {
    return em.findOne(SystemOpsDataClassifications, { code });
  }

  createClassification(
    em: EntityManager,
    data: {
      code: string;
      name: string;
      rank?: number;
      isPii?: boolean;
      isPhi?: boolean;
      handlingRulesJson: unknown;
      stateConceptId: string;
      actorUserId?: string;
    },
  ): SystemOpsDataClassifications {
    return em.create(
      SystemOpsDataClassifications,
      {
        code: data.code,
        name: data.name,
        rank: data.rank,
        isPii: data.isPii,
        isPhi: data.isPhi,
        handlingRulesJson: data.handlingRulesJson,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Registro de entidad ---
  findEntityById(
    em: EntityManager,
    id: string,
  ): Promise<EntityRegistry | null> {
    return em.findOne(EntityRegistry, { id });
  }

  createEntity(
    em: EntityManager,
    data: {
      schemaName: string;
      tableName: string;
      domainId: string;
      classificationId: string;
      isAppendOnly: boolean;
      isSoftDelete: boolean;
      hasHistory: boolean;
      historyTable?: string;
      containsPii?: boolean;
      containsPhi?: boolean;
      ownerTeam?: string;
      stateConceptId: string;
      actorUserId?: string;
    },
  ): EntityRegistry {
    const { actorUserId, ...rest } = data;
    return em.create(
      EntityRegistry,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  // --- Registro de campo ---
  findFieldById(em: EntityManager, id: string): Promise<FieldRegistry | null> {
    return em.findOne(FieldRegistry, { id });
  }

  createField(
    em: EntityManager,
    data: {
      entityRegistryId: string;
      columnName: string;
      classificationId?: string;
      isPii?: boolean;
      isPhi?: boolean;
      maskingStrategyConceptId?: string;
      notes?: string;
      actorUserId?: string;
    },
  ): FieldRegistry {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldRegistry,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  // --- Políticas de escritura ---
  findWritePolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<WritePolicies | null> {
    return em.findOne(WritePolicies, { code });
  }

  findWritePolicyById(
    em: EntityManager,
    id: string,
  ): Promise<WritePolicies | null> {
    return em.findOne(WritePolicies, { id });
  }

  createWritePolicy(
    em: EntityManager,
    data: {
      code: string;
      name: string;
      insertModeConceptId: string;
      updateModeConceptId: string;
      deleteModeConceptId: string;
      requiresReason?: boolean;
      requiresApproval?: boolean;
      dualControl?: boolean;
      maxBatchSize?: number;
      stateConceptId: string;
      actorUserId?: string;
    },
  ): WritePolicies {
    const { actorUserId, ...rest } = data;
    return em.create(
      WritePolicies,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  // --- Políticas de retención ---
  findRetentionPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<SystemOpsRetentionPolicies | null> {
    return em.findOne(SystemOpsRetentionPolicies, { code });
  }

  findRetentionPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<SystemOpsRetentionPolicies | null> {
    return em.findOne(SystemOpsRetentionPolicies, { id });
  }

  createRetentionPolicy(
    em: EntityManager,
    data: {
      code: string;
      name: string;
      retentionPeriodDays?: number;
      legalBasisConceptId?: string;
      dispositionConceptId?: string;
      jurisdictionConceptId?: string;
      stateConceptId: string;
      actorUserId?: string;
    },
  ): SystemOpsRetentionPolicies {
    const { actorUserId, ...rest } = data;
    return em.create(
      SystemOpsRetentionPolicies,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  // --- Reglas de anonimización ---
  findAnonymizationRuleByCode(
    em: EntityManager,
    code: string,
  ): Promise<AnonymizationRules | null> {
    return em.findOne(AnonymizationRules, { code });
  }

  createAnonymizationRule(
    em: EntityManager,
    data: {
      code: string;
      techniqueConceptId: string;
      parametersJson?: unknown;
      description?: string;
      actorUserId?: string;
    },
  ): AnonymizationRules {
    const { actorUserId, ...rest } = data;
    return em.create(
      AnonymizationRules,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  // --- Bitácora de cambios de gobierno (append-only) ---
  recordChange(
    em: EntityManager,
    data: {
      targetType: string;
      targetId: string;
      actionConceptId: string;
      changedByUserId: string;
      previousSnapshotJson?: unknown;
      newSnapshotJson?: unknown;
      reason?: string;
    },
  ): GovernanceChangeLog {
    return em.create(
      GovernanceChangeLog,
      {
        ...data,
        recordedAt: new Date(),
        recordedByUserId: data.changedByUserId,
      },
      { partial: true },
    );
  }
}
