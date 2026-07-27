import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ICON } from '../integration_contracts.concepts';
import {
  ContractsRepository,
  ContractVersionsRepository,
} from '../repositories';
import {
  ActivateVersionDto,
  ContractResponseDto,
  ContractVersionResponseDto,
  CreateContractDto,
  CreateContractVersionDto,
  RetireContractDto,
  StatusResultDto,
} from '../dto';

/**
 * Gobierno del ciclo de vida de contratos B2B: definición (UC-31-01), publicación
 * de versiones (UC-31-02), activación de versión con transición de estado
 * (UC-31-10) y retiro del contrato (UC-31-11).
 *
 * El servicio posee la unidad de trabajo: usa `em.transactional` y hace `flush`
 * del padre antes de crear hijos (las FK son columnas uuid; MikroORM no ordena
 * inserts entre entidades no relacionadas).
 */
@Injectable()
export class IntegrationContractsService {
  constructor(
    private readonly em: EntityManager,
    private readonly contractsRepo: ContractsRepository,
    private readonly versionsRepo: ContractVersionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IntegrationContractsService.name);
  }

  /** UC-31-01: define un contrato de integración en estado DRAFT. */
  async createContract(
    dto: CreateContractDto,
    actor: AuthenticatedUser,
  ): Promise<ContractResponseDto> {
    this.logger.info(
      {
        operation: 'integration.contract.create',
        actorId: actor.id,
        contractCode: dto.contractCode,
      },
      'Defining integration contract',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.contractsRepo.findByCodeAndProvider(
        tx,
        dto.contractCode,
        dto.externalProviderId,
      );
      if (clash) {
        this.logger.warn(
          {
            operation: 'integration.contract.create',
            reason: 'duplicate-code',
          },
          'Rejected contract: code already used for provider',
        );
        throw new ConflictException(
          'El código de contrato ya existe para el proveedor',
          {
            contractCode: dto.contractCode,
          },
        );
      }

      const contract = this.contractsRepo.create(tx, {
        externalProviderId: dto.externalProviderId,
        contractCode: dto.contractCode,
        capabilityConceptId: dto.capabilityConceptId ?? ICON.CAPABILITY_GENERIC,
        dataClassificationConceptId: dto.dataClassificationConceptId,
        legalBasisConceptId: dto.legalBasisConceptId,
        allowedPurposeValueSetId: dto.allowedPurposeValueSetId,
        dataUseAgreementId: dto.dataUseAgreementId,
        statusConceptId: ICON.CONTRACT_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'integration.contract.create', contractId: contract.id },
        'Integration contract defined',
      );
      return this.toContractResponse(contract);
    });
  }

  /** UC-31-02: publica una nueva versión (version_number = max+1) en DRAFT. */
  async publishVersion(
    contractId: string,
    dto: CreateContractVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ContractVersionResponseDto> {
    this.logger.info(
      {
        operation: 'integration.version.publish',
        contractId,
        actorId: actor.id,
      },
      'Publishing contract version',
    );
    return this.em.transactional(async (tx) => {
      const contract = await this.contractsRepo.findById(tx, contractId);
      if (!contract) {
        throw new ResourceNotFoundException('Contrato no encontrado', {
          contractId,
        });
      }
      if (
        contract.statusConceptId !== ICON.CONTRACT_DRAFT &&
        contract.statusConceptId !== ICON.CONTRACT_ACTIVE
      ) {
        throw new PreconditionFailedException(
          'Solo se pueden publicar versiones en contratos DRAFT o ACTIVE',
          { contractId, status: contract.statusConceptId },
        );
      }

      const next =
        (await this.versionsRepo.maxVersionNumber(tx, contractId)) + 1;
      const version = this.versionsRepo.create(tx, {
        integrationContractId: contractId,
        versionNumber: next,
        requestSchemaFileId: dto.requestSchemaFileId,
        responseSchemaFileId: dto.responseSchemaFileId,
        openapiFileId: dto.openapiFileId,
        mappingProfileId: dto.mappingProfileId,
        contractHash: dto.contractHash,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : undefined,
        statusConceptId: ICON.VERSION_DRAFT,
        actorUserId: actor.id,
      });

      touch(contract, actor.id);
      await tx.flush();

      this.logger.info(
        {
          operation: 'integration.version.publish',
          contractId,
          versionId: version.id,
          versionNumber: next,
        },
        'Contract version published',
      );
      return this.toVersionResponse(version);
    });
  }

  /** UC-31-10: activa una versión DRAFT y transiciona el estado del contrato. */
  async activateVersion(
    contractId: string,
    versionId: string,
    dto: ActivateVersionDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      {
        operation: 'integration.version.activate',
        contractId,
        versionId,
        actorId: actor.id,
      },
      'Activating contract version',
    );
    return this.em.transactional(async (tx) => {
      const contract = await this.contractsRepo.findById(tx, contractId);
      if (!contract) {
        throw new ResourceNotFoundException('Contrato no encontrado', {
          contractId,
        });
      }
      const version = await this.versionsRepo.findById(tx, versionId);
      if (!version || version.integrationContractId !== contractId) {
        throw new ResourceNotFoundException(
          'Versión no encontrada para el contrato',
          {
            contractId,
            versionId,
          },
        );
      }
      if (version.statusConceptId !== ICON.VERSION_DRAFT) {
        throw new PreconditionFailedException(
          'Solo se puede activar una versión DRAFT',
          {
            versionId,
            status: version.statusConceptId,
          },
        );
      }

      const now = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();

      // Supersede la versión ACTIVE vigente (si existe) para mantener una sola activa.
      const current = await this.versionsRepo.findActiveByContract(
        tx,
        contractId,
        ICON.VERSION_ACTIVE,
      );
      if (current && current.id !== version.id) {
        current.statusConceptId = ICON.VERSION_SUPERSEDED;
        current.effectiveTo = now;
      }

      version.statusConceptId = ICON.VERSION_ACTIVE;
      version.effectiveFrom = now;
      version.effectiveTo = undefined;

      if (contract.statusConceptId === ICON.CONTRACT_DRAFT) {
        contract.statusConceptId = ICON.CONTRACT_ACTIVE;
      }
      touch(contract, actor.id);
      await tx.flush();

      this.logger.info(
        { operation: 'integration.version.activate', contractId, versionId },
        'Contract version activated',
      );
      return { ok: true };
    });
  }

  /** UC-31-11: retira el contrato (soft-delete lógico) y supersede sus versiones. */
  async retireContract(
    contractId: string,
    dto: RetireContractDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      {
        operation: 'integration.contract.retire',
        contractId,
        actorId: actor.id,
      },
      'Retiring integration contract',
    );
    return this.em.transactional(async (tx) => {
      const contract = await this.contractsRepo.findById(tx, contractId);
      if (!contract) {
        throw new ResourceNotFoundException('Contrato no encontrado', {
          contractId,
        });
      }
      if (contract.statusConceptId === ICON.CONTRACT_RETIRED) {
        throw new PreconditionFailedException('El contrato ya está retirado', {
          contractId,
        });
      }

      const now = new Date();
      const activeVersions = await this.versionsRepo.findActiveVersions(
        tx,
        contractId,
        ICON.VERSION_ACTIVE,
      );
      for (const v of activeVersions) {
        v.statusConceptId = ICON.VERSION_SUPERSEDED;
        v.effectiveTo = now;
      }

      contract.statusConceptId = ICON.CONTRACT_RETIRED;
      touch(contract, actor.id);
      await tx.flush();

      this.logger.info(
        {
          operation: 'integration.contract.retire',
          contractId,
          reason: dto.reason,
        },
        'Integration contract retired',
      );
      return { ok: true };
    });
  }

  private toContractResponse(c: {
    id: string;
    contractCode: string;
    externalProviderId: string;
    statusConceptId: string;
    createdAt: Date;
  }): ContractResponseDto {
    return {
      id: c.id,
      contractCode: c.contractCode,
      externalProviderId: c.externalProviderId,
      status: c.statusConceptId,
      createdAt: c.createdAt,
    };
  }

  private toVersionResponse(v: {
    id: string;
    integrationContractId: string;
    versionNumber: number;
    statusConceptId: string;
    effectiveFrom?: Date;
  }): ContractVersionResponseDto {
    return {
      id: v.id,
      integrationContractId: v.integrationContractId,
      versionNumber: v.versionNumber,
      status: v.statusConceptId,
      effectiveFrom: v.effectiveFrom,
    };
  }
}
