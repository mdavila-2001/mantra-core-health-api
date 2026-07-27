import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationContracts } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para definir un contrato de integración (UC-31-01). */
export interface CreateContractData {
  externalProviderId: string;
  contractCode: string;
  capabilityConceptId: string;
  statusConceptId: string;
  dataClassificationConceptId?: string;
  legalBasisConceptId?: string;
  allowedPurposeValueSetId?: string;
  dataUseAgreementId?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `integration_contracts.integration_contracts`.
 *
 * Stateless: cada método recibe el `EntityManager` activo para que el servicio
 * controle la transacción. Solo construye consultas y materializa; ninguna regla
 * de negocio vive aquí.
 */
@Injectable()
export class ContractsRepository {
  /** Busca un contrato por id; `null` si no existe. */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IntegrationContracts | null> {
    return em.findOne(IntegrationContracts, { id });
  }

  /** Busca un contrato por (código, proveedor) para garantizar unicidad. */
  findByCodeAndProvider(
    em: EntityManager,
    contractCode: string,
    externalProviderId: string,
  ): Promise<IntegrationContracts | null> {
    return em.findOne(IntegrationContracts, {
      contractCode,
      externalProviderId,
    });
  }

  /** Crea la entidad de contrato en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateContractData): IntegrationContracts {
    return em.create(
      IntegrationContracts,
      {
        externalProviderId: data.externalProviderId,
        contractCode: data.contractCode,
        capabilityConceptId: data.capabilityConceptId,
        dataClassificationConceptId: data.dataClassificationConceptId,
        legalBasisConceptId: data.legalBasisConceptId,
        allowedPurposeValueSetId: data.allowedPurposeValueSetId,
        dataUseAgreementId: data.dataUseAgreementId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
