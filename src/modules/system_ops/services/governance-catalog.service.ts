import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { GovernanceRepository } from '../repositories';
import { SYSOPS } from '../system_ops.concepts';
import {
  ApplyRetentionPolicyDto,
  ApplyWritePolicyDto,
  CatalogEntityDto,
  CreateAnonymizationRuleDto,
  CreateRetentionPolicyDto,
  CreateWritePolicyDto,
  EntityRegistryResponseDto,
  IdResultDto,
  StatusResultDto,
  UpdateFieldRegistryDto,
} from '../dto';

/**
 * Casos de uso de catálogo y políticas de gobierno de datos:
 *  - UC-11-01 catalogar entidad + campos (dominio/clasificación UPSERT).
 *  - UC-11-02 definir y aplicar política de escritura.
 *  - UC-11-03 definir y aplicar política de retención (con base legal).
 *  - UC-11-04 definir regla de anonimización y asignarla a un campo PII/PHI.
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre antes de crear hijos: las FK son columnas uuid planas y MikroORM no ordena
 * inserts entre entidades no relacionadas. Cada cambio deja rastro en
 * `system_ops.governance_change_log`.
 */
@Injectable()
export class GovernanceCatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: GovernanceRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GovernanceCatalogService.name);
  }

  /** UC-11-01: registra dominio, clasificación y cataloga la entidad con sus campos. */
  async catalogEntity(
    dto: CatalogEntityDto,
    actor: AuthenticatedUser,
  ): Promise<EntityRegistryResponseDto> {
    this.logger.info(
      {
        operation: 'sysops.governance.catalog',
        table: `${dto.schemaName}.${dto.tableName}`,
      },
      'Cataloging entity',
    );
    return this.em.transactional(async (tx) => {
      // Dominio: UPSERT por code.
      let domain = await this.repo.findDomainByCode(tx, dto.domain.code);
      if (!domain) {
        domain = this.repo.createDomain(tx, {
          code: dto.domain.code,
          name: dto.domain.name,
          ownerTeam: dto.domain.ownerTeam,
          actorUserId: actor.id,
        });
        await tx.flush();
      }

      // Clasificación: UPSERT por code.
      let classification = await this.repo.findClassificationByCode(
        tx,
        dto.classification.code,
      );
      if (!classification) {
        classification = this.repo.createClassification(tx, {
          code: dto.classification.code,
          name: dto.classification.name,
          rank: dto.classification.rank,
          isPii: dto.classification.isPii,
          isPhi: dto.classification.isPhi,
          handlingRulesJson: dto.classification.handlingRulesJson ?? {},
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        await tx.flush();
      }

      // Entidad.
      const entity = this.repo.createEntity(tx, {
        schemaName: dto.schemaName,
        tableName: dto.tableName,
        domainId: domain.id,
        classificationId: classification.id,
        isAppendOnly: dto.isAppendOnly,
        isSoftDelete: dto.isSoftDelete,
        hasHistory: dto.hasHistory,
        historyTable: dto.historyTable,
        containsPii: dto.containsPii,
        containsPhi: dto.containsPhi,
        ownerTeam: dto.ownerTeam,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Campos.
      const fieldIds: string[] = [];
      for (const f of dto.fields) {
        const field = this.repo.createField(tx, {
          entityRegistryId: entity.id,
          columnName: f.columnName,
          classificationId: classification.id,
          isPii: f.isPii,
          isPhi: f.isPhi,
          maskingStrategyConceptId:
            f.maskingStrategyConceptId ?? SYSOPS.MASK_NONE,
          notes: f.notes,
          actorUserId: actor.id,
        });
        fieldIds.push(field.id);
      }
      await tx.flush();

      this.repo.recordChange(tx, {
        targetType: 'entity_registry',
        targetId: entity.id,
        actionConceptId: SYSOPS.ACTION_CREATE,
        changedByUserId: actor.id,
        newSnapshotJson: {
          schemaName: dto.schemaName,
          tableName: dto.tableName,
          fields: dto.fields.length,
        },
      });

      this.logger.info(
        { operation: 'sysops.governance.catalog', entityId: entity.id },
        'Entity catalogued',
      );
      return {
        id: entity.id,
        domainId: domain.id,
        classificationId: classification.id,
        schemaName: entity.schemaName,
        tableName: entity.tableName,
        fieldIds,
      };
    });
  }

  /** UC-11-02: define una política de escritura (code único). */
  async createWritePolicy(
    dto: CreateWritePolicyDto,
    actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.em.transactional(async (tx) => {
      if (await this.repo.findWritePolicyByCode(tx, dto.code)) {
        throw new ConflictException(
          'Ya existe una política de escritura con ese code',
          { code: dto.code },
        );
      }
      const policy = this.repo.createWritePolicy(tx, {
        code: dto.code,
        name: dto.name,
        insertModeConceptId: dto.insertModeConceptId,
        updateModeConceptId: dto.updateModeConceptId,
        deleteModeConceptId: dto.deleteModeConceptId,
        requiresReason: dto.requiresReason,
        requiresApproval: dto.requiresApproval,
        dualControl: dto.dualControl,
        maxBatchSize: dto.maxBatchSize,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.repo.recordChange(tx, {
        targetType: 'write_policies',
        targetId: policy.id,
        actionConceptId: SYSOPS.ACTION_CREATE,
        changedByUserId: actor.id,
        newSnapshotJson: { code: dto.code },
      });
      return { id: policy.id };
    });
  }

  /** UC-11-02: aplica (vincula) una política de escritura a una entidad. */
  async applyWritePolicy(
    entityId: string,
    dto: ApplyWritePolicyDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.em.transactional(async (tx) => {
      const entity = await this.repo.findEntityById(tx, entityId);
      if (!entity)
        throw new ResourceNotFoundException('Entidad no encontrada', {
          entityId,
        });
      const policy = await this.repo.findWritePolicyById(tx, dto.writePolicyId);
      if (!policy) {
        throw new ResourceNotFoundException(
          'Política de escritura no encontrada',
          {
            writePolicyId: dto.writePolicyId,
          },
        );
      }
      const previous = entity.writePolicyId;
      entity.writePolicyId = policy.id;
      touch(entity, actor.id);
      this.repo.recordChange(tx, {
        targetType: 'write_policies',
        targetId: entity.id,
        actionConceptId: SYSOPS.ACTION_UPDATE,
        changedByUserId: actor.id,
        previousSnapshotJson: { writePolicyId: previous },
        newSnapshotJson: { writePolicyId: policy.id },
        reason: dto.reason,
      });
      return { ok: true };
    });
  }

  /** UC-11-03: define una política de retención (code único). */
  async createRetentionPolicy(
    dto: CreateRetentionPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.em.transactional(async (tx) => {
      if (await this.repo.findRetentionPolicyByCode(tx, dto.code)) {
        throw new ConflictException(
          'Ya existe una política de retención con ese code',
          { code: dto.code },
        );
      }
      const policy = this.repo.createRetentionPolicy(tx, {
        code: dto.code,
        name: dto.name,
        retentionPeriodDays: dto.retentionPeriodDays,
        legalBasisConceptId: dto.legalBasisConceptId,
        dispositionConceptId: dto.dispositionConceptId,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.repo.recordChange(tx, {
        targetType: 'retention_policies',
        targetId: policy.id,
        actionConceptId: SYSOPS.ACTION_CREATE,
        changedByUserId: actor.id,
        newSnapshotJson: {
          code: dto.code,
          retentionPeriodDays: dto.retentionPeriodDays,
        },
      });
      return { id: policy.id };
    });
  }

  /** UC-11-03: aplica una política de retención a una entidad (razón obligatoria). */
  async applyRetention(
    entityId: string,
    dto: ApplyRetentionPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.em.transactional(async (tx) => {
      const entity = await this.repo.findEntityById(tx, entityId);
      if (!entity)
        throw new ResourceNotFoundException('Entidad no encontrada', {
          entityId,
        });
      const policy = await this.repo.findRetentionPolicyById(
        tx,
        dto.retentionPolicyId,
      );
      if (!policy) {
        throw new ResourceNotFoundException(
          'Política de retención no encontrada',
          {
            retentionPolicyId: dto.retentionPolicyId,
          },
        );
      }
      const previous = entity.retentionPolicyId;
      entity.retentionPolicyId = policy.id;
      touch(entity, actor.id);
      this.repo.recordChange(tx, {
        targetType: 'retention_policies',
        targetId: entity.id,
        actionConceptId: SYSOPS.ACTION_UPDATE,
        changedByUserId: actor.id,
        previousSnapshotJson: { retentionPolicyId: previous },
        newSnapshotJson: { retentionPolicyId: policy.id },
        reason: dto.reason,
      });
      return { ok: true };
    });
  }

  /** UC-11-04: define una regla de anonimización (code único). */
  async createAnonymizationRule(
    dto: CreateAnonymizationRuleDto,
    actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.em.transactional(async (tx) => {
      if (await this.repo.findAnonymizationRuleByCode(tx, dto.code)) {
        throw new ConflictException(
          'Ya existe una regla de anonimización con ese code',
          { code: dto.code },
        );
      }
      const rule = this.repo.createAnonymizationRule(tx, {
        code: dto.code,
        techniqueConceptId: dto.techniqueConceptId,
        parametersJson: dto.parametersJson,
        description: dto.description,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.repo.recordChange(tx, {
        targetType: 'anonymization_rules',
        targetId: rule.id,
        actionConceptId: SYSOPS.ACTION_CREATE,
        changedByUserId: actor.id,
        newSnapshotJson: { code: dto.code },
      });
      return { id: rule.id };
    });
  }

  /** UC-11-04: asigna una regla de anonimización / masking a un campo. */
  async updateField(
    fieldId: string,
    dto: UpdateFieldRegistryDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.em.transactional(async (tx) => {
      const field = await this.repo.findFieldById(tx, fieldId);
      if (!field)
        throw new ResourceNotFoundException('Campo no encontrado', { fieldId });
      if (dto.anonymizationRuleId !== undefined)
        field.anonymizationRuleId = dto.anonymizationRuleId;
      if (dto.maskingStrategyConceptId !== undefined)
        field.maskingStrategyConceptId = dto.maskingStrategyConceptId;
      if (dto.isPii !== undefined) field.isPii = dto.isPii;
      if (dto.isPhi !== undefined) field.isPhi = dto.isPhi;
      touch(field, actor.id);
      this.repo.recordChange(tx, {
        targetType: 'anonymization_rules',
        targetId: field.id,
        actionConceptId: SYSOPS.ACTION_UPDATE,
        changedByUserId: actor.id,
        newSnapshotJson: { anonymizationRuleId: field.anonymizationRuleId },
      });
      return { ok: true };
    });
  }
}
