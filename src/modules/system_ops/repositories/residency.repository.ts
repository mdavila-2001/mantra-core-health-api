import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CrossBorderTransferEvents,
  DataResidencyPolicies,
  TenantResidencyBindings,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Acceso a datos de residencia de datos (UC-11-06) y transferencias
 * transfronterizas (UC-11-07). Las transferencias son append-only (sin created_at).
 */
@Injectable()
export class ResidencyRepository {
  /**
   * Obtiene find policy by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find policy by code conforme al contrato `Promise<DataResidencyPolicies | null>`.
   */
  findPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<DataResidencyPolicies | null> {
    return em.findOne(DataResidencyPolicies, { code });
  }

  /**
   * Obtiene find policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find policy by id conforme al contrato `Promise<DataResidencyPolicies | null>`.
   */
  findPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<DataResidencyPolicies | null> {
    return em.findOne(DataResidencyPolicies, { id });
  }

  /**
   * Crea create policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create policy conforme al contrato `DataResidencyPolicies`.
   */
  createPolicy(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Identificador asociado a jurisdiction concept.
       */
      jurisdictionConceptId: string;
      /**
       * Identificador asociado a data classification.
       */
      dataClassificationId: string;
      /**
       * Identificador asociado a allowed storage region value set.
       */
      allowedStorageRegionValueSetId: string;
      /**
       * Identificador asociado a allowed processing region value set.
       */
      allowedProcessingRegionValueSetId?: string;
      /**
       * Identificador asociado a cross border transfer basis concept.
       */
      crossBorderTransferBasisConceptId?: string;
      /**
       * Valor de transfer impact assessment required mantenido por la instancia.
       */
      transferImpactAssessmentRequired?: boolean;
      /**
       * Valor de encryption key region locked mantenido por la instancia.
       */
      encryptionKeyRegionLocked?: boolean;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de valid from mantenido por la instancia.
       */
      validFrom: Date;
      /**
       * Valor de valid to mantenido por la instancia.
       */
      validTo?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): DataResidencyPolicies {
    const { actorUserId, ...rest } = data;
    return em.create(
      DataResidencyPolicies,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create binding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create binding conforme al contrato `TenantResidencyBindings`.
   */
  createBinding(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a residency policy.
       */
      residencyPolicyId: string;
      /**
       * Identificador asociado a primary region concept.
       */
      primaryRegionConceptId: string;
      /**
       * Identificador asociado a disaster recovery region concept.
       */
      disasterRecoveryRegionConceptId?: string;
      /**
       * Valor de effective from mantenido por la instancia.
       */
      effectiveFrom?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): TenantResidencyBindings {
    const { actorUserId, ...rest } = data;
    return em.create(
      TenantResidencyBindings,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Obtiene find transfer by reference.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param transferReference - Valor de transfer reference requerido por la operación.
   * @returns Resultado de find transfer by reference conforme al contrato `Promise<CrossBorderTransferEvents | null>`.
   */
  findTransferByReference(
    em: EntityManager,
    transferReference: string,
  ): Promise<CrossBorderTransferEvents | null> {
    return em.findOne(CrossBorderTransferEvents, { transferReference });
  }

  /**
   * Crea create transfer.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create transfer conforme al contrato `CrossBorderTransferEvents`.
   */
  createTransfer(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a data category concept.
       */
      dataCategoryConceptId: string;
      /**
       * Identificador asociado a source region concept.
       */
      sourceRegionConceptId: string;
      /**
       * Identificador asociado a destination region concept.
       */
      destinationRegionConceptId: string;
      /**
       * Identificador asociado a transfer basis concept.
       */
      transferBasisConceptId: string;
      /**
       * Identificador asociado a recipient tenant.
       */
      recipientTenantId?: string;
      /**
       * Valor de transfer reference mantenido por la instancia.
       */
      transferReference: string;
      /**
       * Identificador asociado a approved by user.
       */
      approvedByUserId?: string;
    },
  ): CrossBorderTransferEvents {
    return em.create(
      CrossBorderTransferEvents,
      { ...data, recordedAt: new Date() },
      { partial: true },
    );
  }
}
