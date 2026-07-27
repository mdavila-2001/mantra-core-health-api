import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationContractVersions } from '../entities';

/** Datos para publicar una nueva versión de contrato (UC-31-02). */
export interface CreateVersionData {
  integrationContractId: string;
  versionNumber: number;
  statusConceptId: string;
  requestSchemaFileId?: string;
  responseSchemaFileId?: string;
  openapiFileId?: string;
  mappingProfileId?: string;
  contractHash?: string;
  effectiveFrom?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `integration_contracts.integration_contract_versions`. */
@Injectable()
export class ContractVersionsRepository {
  /** Busca una versión por id; `null` si no existe. */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IntegrationContractVersions | null> {
    return em.findOne(IntegrationContractVersions, { id });
  }

  /** Mayor `version_number` publicado para un contrato (0 si no hay ninguno). */
  async maxVersionNumber(
    em: EntityManager,
    contractId: string,
  ): Promise<number> {
    const rows = await em.find(
      IntegrationContractVersions,
      { integrationContractId: contractId },
      {
        fields: ['versionNumber'],
        orderBy: { versionNumber: 'desc' },
        limit: 1,
      },
    );
    return rows.length ? rows[0].versionNumber : 0;
  }

  /** Versión ACTIVE vigente (effective_to nulo) del contrato, si existe. */
  findActiveByContract(
    em: EntityManager,
    contractId: string,
    activeStatusConceptId: string,
  ): Promise<IntegrationContractVersions | null> {
    return em.findOne(IntegrationContractVersions, {
      integrationContractId: contractId,
      statusConceptId: activeStatusConceptId,
      effectiveTo: null,
    });
  }

  /** Versiones ACTIVE del contrato (para transicionar a SUPERSEDED en retiro). */
  findActiveVersions(
    em: EntityManager,
    contractId: string,
    activeStatusConceptId: string,
  ): Promise<IntegrationContractVersions[]> {
    return em.find(IntegrationContractVersions, {
      integrationContractId: contractId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Crea la entidad de versión en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateVersionData,
  ): IntegrationContractVersions {
    return em.create(
      IntegrationContractVersions,
      {
        integrationContractId: data.integrationContractId,
        versionNumber: data.versionNumber,
        requestSchemaFileId: data.requestSchemaFileId,
        responseSchemaFileId: data.responseSchemaFileId,
        openapiFileId: data.openapiFileId,
        mappingProfileId: data.mappingProfileId,
        contractHash: data.contractHash,
        effectiveFrom: data.effectiveFrom,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
