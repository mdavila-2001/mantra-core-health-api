import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, ConflictException, type AuthenticatedUser } from '../../../common';
import { GovernanceRepository, ResidencyRepository } from '../repositories';
import { SYSOPS } from '../system_ops.concepts';
import {
  CreateCrossBorderTransferDto,
  CreateResidencyPolicyDto,
  CreateTenantResidencyBindingDto,
  IdResultDto,
} from '../dto';

/**
 * UC-11-06 (residencia de datos) y UC-11-07 (transferencia transfronteriza).
 *
 * La transferencia es append-only y valida contra una política de residencia
 * vigente para la clasificación (include UC-11-06); `transfer_reference` da
 * idempotencia para evitar doble registro.
 */
@Injectable()
export class ResidencyService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ResidencyRepository,
    private readonly governanceRepo: GovernanceRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ResidencyService.name);
  }

  /** UC-11-06: define una política de residencia (code único). */
  async createResidencyPolicy(
    dto: CreateResidencyPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.em.transactional(async (tx) => {
      if (await this.repo.findPolicyByCode(tx, dto.code)) {
        throw new ConflictException('Ya existe una política de residencia con ese code', { code: dto.code });
      }
      const policy = this.repo.createPolicy(tx, {
        code: dto.code,
        jurisdictionConceptId: dto.jurisdictionConceptId,
        dataClassificationId: dto.dataClassificationId,
        allowedStorageRegionValueSetId: dto.allowedStorageRegionValueSetId,
        allowedProcessingRegionValueSetId: dto.allowedProcessingRegionValueSetId,
        crossBorderTransferBasisConceptId: dto.crossBorderTransferBasisConceptId,
        transferImpactAssessmentRequired: dto.transferImpactAssessmentRequired,
        encryptionKeyRegionLocked: dto.encryptionKeyRegionLocked,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.governanceRepo.recordChange(tx, {
        targetType: 'data_residency_policies',
        targetId: policy.id,
        actionConceptId: SYSOPS.ACTION_CREATE,
        changedByUserId: actor.id,
        newSnapshotJson: { code: dto.code },
      });
      return { id: policy.id };
    });
  }

  /** UC-11-06: vincula un tenant a una política de residencia. */
  async createBinding(
    dto: CreateTenantResidencyBindingDto,
    actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.em.transactional(async (tx) => {
      const binding = this.repo.createBinding(tx, {
        tenantId: dto.tenantId,
        residencyPolicyId: dto.residencyPolicyId,
        primaryRegionConceptId: dto.primaryRegionConceptId,
        disasterRecoveryRegionConceptId: dto.disasterRecoveryRegionConceptId,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: binding.id };
    });
  }

  /** UC-11-07: registra una transferencia transfronteriza (append-only, idempotente). */
  async recordTransfer(
    dto: CreateCrossBorderTransferDto,
    actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.repo.findTransferByReference(tx, dto.transferReference);
      if (existing) {
        throw new ConflictException('La referencia de transferencia ya fue registrada', {
          transferReference: dto.transferReference,
        });
      }
      const event = this.repo.createTransfer(tx, {
        tenantId: dto.tenantId,
        dataCategoryConceptId: dto.dataCategoryConceptId,
        sourceRegionConceptId: dto.sourceRegionConceptId,
        destinationRegionConceptId: dto.destinationRegionConceptId,
        transferBasisConceptId: dto.transferBasisConceptId,
        recipientTenantId: dto.recipientTenantId,
        transferReference: dto.transferReference,
        approvedByUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        { operation: 'sysops.residency.transfer', transferId: event.id },
        'Cross-border transfer recorded',
      );
      return { id: event.id };
    });
  }
}
