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
  /**
   * Obtiene find domain by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find domain by code conforme al contrato `Promise<DataDomains | null>`.
   */
  findDomainByCode(
    em: EntityManager,
    code: string,
  ): Promise<DataDomains | null> {
    return em.findOne(DataDomains, { code });
  }

  /**
   * Crea create domain.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create domain conforme al contrato `DataDomains`.
   */
  createDomain(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Valor de owner team mantenido por la instancia.
       */
      ownerTeam?: string;
      /**
       * Identificador asociado a actor user.
       */
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
  /**
   * Obtiene find classification by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find classification by code conforme al contrato `Promise<SystemOpsDataClassifications | null>`.
   */
  findClassificationByCode(
    em: EntityManager,
    code: string,
  ): Promise<SystemOpsDataClassifications | null> {
    return em.findOne(SystemOpsDataClassifications, { code });
  }

  /**
   * Crea create classification.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create classification conforme al contrato `SystemOpsDataClassifications`.
   */
  createClassification(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Valor de rank mantenido por la instancia.
       */
      rank?: number;
      /**
       * Valor de is pii mantenido por la instancia.
       */
      isPii?: boolean;
      /**
       * Valor de is phi mantenido por la instancia.
       */
      isPhi?: boolean;
      /**
       * Valor de handling rules json mantenido por la instancia.
       */
      handlingRulesJson: unknown;
      /**
       * Identificador asociado a state concept.
       */
      stateConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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
  /**
   * Obtiene find entity by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find entity by id conforme al contrato `Promise<EntityRegistry | null>`.
   */
  findEntityById(
    em: EntityManager,
    id: string,
  ): Promise<EntityRegistry | null> {
    return em.findOne(EntityRegistry, { id });
  }

  /**
   * Crea create entity.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create entity conforme al contrato `EntityRegistry`.
   */
  createEntity(
    em: EntityManager,
    data: {
      /**
       * Valor de schema name mantenido por la instancia.
       */
      schemaName: string;
      /**
       * Valor de table name mantenido por la instancia.
       */
      tableName: string;
      /**
       * Identificador asociado a domain.
       */
      domainId: string;
      /**
       * Identificador asociado a classification.
       */
      classificationId: string;
      /**
       * Valor de is append only mantenido por la instancia.
       */
      isAppendOnly: boolean;
      /**
       * Valor de is soft delete mantenido por la instancia.
       */
      isSoftDelete: boolean;
      /**
       * Valor de has history mantenido por la instancia.
       */
      hasHistory: boolean;
      /**
       * Valor de history table mantenido por la instancia.
       */
      historyTable?: string;
      /**
       * Valor de contains pii mantenido por la instancia.
       */
      containsPii?: boolean;
      /**
       * Valor de contains phi mantenido por la instancia.
       */
      containsPhi?: boolean;
      /**
       * Valor de owner team mantenido por la instancia.
       */
      ownerTeam?: string;
      /**
       * Identificador asociado a state concept.
       */
      stateConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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
  /**
   * Obtiene find field by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find field by id conforme al contrato `Promise<FieldRegistry | null>`.
   */
  findFieldById(em: EntityManager, id: string): Promise<FieldRegistry | null> {
    return em.findOne(FieldRegistry, { id });
  }

  /**
   * Crea create field.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create field conforme al contrato `FieldRegistry`.
   */
  createField(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a entity registry.
       */
      entityRegistryId: string;
      /**
       * Valor de column name mantenido por la instancia.
       */
      columnName: string;
      /**
       * Identificador asociado a classification.
       */
      classificationId?: string;
      /**
       * Valor de is pii mantenido por la instancia.
       */
      isPii?: boolean;
      /**
       * Valor de is phi mantenido por la instancia.
       */
      isPhi?: boolean;
      /**
       * Identificador asociado a masking strategy concept.
       */
      maskingStrategyConceptId?: string;
      /**
       * Valor de notes mantenido por la instancia.
       */
      notes?: string;
      /**
       * Identificador asociado a actor user.
       */
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
  /**
   * Obtiene find write policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find write policy by code conforme al contrato `Promise<WritePolicies | null>`.
   */
  findWritePolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<WritePolicies | null> {
    return em.findOne(WritePolicies, { code });
  }

  /**
   * Obtiene find write policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find write policy by id conforme al contrato `Promise<WritePolicies | null>`.
   */
  findWritePolicyById(
    em: EntityManager,
    id: string,
  ): Promise<WritePolicies | null> {
    return em.findOne(WritePolicies, { id });
  }

  /**
   * Crea create write policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create write policy conforme al contrato `WritePolicies`.
   */
  createWritePolicy(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a insert mode concept.
       */
      insertModeConceptId: string;
      /**
       * Identificador asociado a update mode concept.
       */
      updateModeConceptId: string;
      /**
       * Identificador asociado a delete mode concept.
       */
      deleteModeConceptId: string;
      /**
       * Valor de requires reason mantenido por la instancia.
       */
      requiresReason?: boolean;
      /**
       * Valor de requires approval mantenido por la instancia.
       */
      requiresApproval?: boolean;
      /**
       * Valor de dual control mantenido por la instancia.
       */
      dualControl?: boolean;
      /**
       * Valor de max batch size mantenido por la instancia.
       */
      maxBatchSize?: number;
      /**
       * Identificador asociado a state concept.
       */
      stateConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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
  /**
   * Obtiene find retention policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find retention policy by code conforme al contrato `Promise<SystemOpsRetentionPolicies | null>`.
   */
  findRetentionPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<SystemOpsRetentionPolicies | null> {
    return em.findOne(SystemOpsRetentionPolicies, { code });
  }

  /**
   * Obtiene find retention policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find retention policy by id conforme al contrato `Promise<SystemOpsRetentionPolicies | null>`.
   */
  findRetentionPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<SystemOpsRetentionPolicies | null> {
    return em.findOne(SystemOpsRetentionPolicies, { id });
  }

  /**
   * Crea create retention policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create retention policy conforme al contrato `SystemOpsRetentionPolicies`.
   */
  createRetentionPolicy(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Valor de retention period days mantenido por la instancia.
       */
      retentionPeriodDays?: number;
      /**
       * Identificador asociado a legal basis concept.
       */
      legalBasisConceptId?: string;
      /**
       * Identificador asociado a disposition concept.
       */
      dispositionConceptId?: string;
      /**
       * Identificador asociado a jurisdiction concept.
       */
      jurisdictionConceptId?: string;
      /**
       * Identificador asociado a state concept.
       */
      stateConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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
  /**
   * Obtiene find anonymization rule by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find anonymization rule by code conforme al contrato `Promise<AnonymizationRules | null>`.
   */
  findAnonymizationRuleByCode(
    em: EntityManager,
    code: string,
  ): Promise<AnonymizationRules | null> {
    return em.findOne(AnonymizationRules, { code });
  }

  /**
   * Crea create anonymization rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create anonymization rule conforme al contrato `AnonymizationRules`.
   */
  createAnonymizationRule(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Identificador asociado a technique concept.
       */
      techniqueConceptId: string;
      /**
       * Valor de parameters json mantenido por la instancia.
       */
      parametersJson?: unknown;
      /**
       * Valor de description mantenido por la instancia.
       */
      description?: string;
      /**
       * Identificador asociado a actor user.
       */
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
  /**
   * Ejecuta la operación record change.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record change conforme al contrato `GovernanceChangeLog`.
   */
  recordChange(
    em: EntityManager,
    data: {
      /**
       * Valor de target type mantenido por la instancia.
       */
      targetType: string;
      /**
       * Identificador asociado a target.
       */
      targetId: string;
      /**
       * Identificador asociado a action concept.
       */
      actionConceptId: string;
      /**
       * Identificador asociado a changed by user.
       */
      changedByUserId: string;
      /**
       * Valor de previous snapshot json mantenido por la instancia.
       */
      previousSnapshotJson?: unknown;
      /**
       * Valor de new snapshot json mantenido por la instancia.
       */
      newSnapshotJson?: unknown;
      /**
       * Valor de reason mantenido por la instancia.
       */
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
