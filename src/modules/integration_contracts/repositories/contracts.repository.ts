import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationContracts } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para definir un contrato de integración (UC-31-01). */
export interface CreateContractData {
  /**
   * Tenant propietario del contrato (el del contexto autenticado).
   */
  tenantId: string;
  /**
   * Identificador asociado a external provider.
   */
  externalProviderId: string;
  /**
   * Valor de contract code mantenido por la instancia.
   */
  contractCode: string;
  /**
   * Identificador asociado a capability concept.
   */
  capabilityConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a data classification concept.
   */
  dataClassificationConceptId?: string;
  /**
   * Identificador asociado a legal basis concept.
   */
  legalBasisConceptId?: string;
  /**
   * Identificador asociado a allowed purpose value set.
   */
  allowedPurposeValueSetId?: string;
  /**
   * Identificador asociado a data use agreement.
   */
  dataUseAgreementId?: string;
  /**
   * Identificador asociado a actor user.
   */
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
  /**
   * Busca un contrato por `id + tenantId`; `null` si no existe o es de otro
   * tenant (ambos casos son indistinguibles para el llamador).
   */
  findByIdInTenant(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<IntegrationContracts | null> {
    return em.findOne(IntegrationContracts, { id, tenantId });
  }

  /**
   * Igual que {@link findByIdInTenant} pero bloquea la fila: serializa las
   * transiciones del contrato y los avances de cursor concurrentes.
   */
  findByIdInTenantForUpdate(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<IntegrationContracts | null> {
    return em.findOne(
      IntegrationContracts,
      { id, tenantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Busca un contrato por (tenant, código, proveedor) para garantizar unicidad. */
  findByCodeAndProvider(
    em: EntityManager,
    tenantId: string,
    contractCode: string,
    externalProviderId: string,
  ): Promise<IntegrationContracts | null> {
    return em.findOne(IntegrationContracts, {
      tenantId,
      contractCode,
      externalProviderId,
    });
  }

  /** Crea la entidad de contrato en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateContractData): IntegrationContracts {
    return em.create(
      IntegrationContracts,
      {
        tenantId: data.tenantId,
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
