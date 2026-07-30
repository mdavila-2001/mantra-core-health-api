import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceRequests } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create service request data.
 */
export interface CreateServiceRequestData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a code concept.
   */
  codeConceptId: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
  /**
   * Identificador asociado a intent concept.
   */
  intentConceptId?: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a requester profile.
   */
  requesterProfileId?: string;
  /**
   * Identificador asociado a performer tenant.
   */
  performerTenantId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.service_requests` (stateless). */
@Injectable()
export class ServiceRequestsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ServiceRequests | null>`.
   */
  findById(em: EntityManager, id: string): Promise<ServiceRequests | null> {
    return em.findOne(ServiceRequests, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ServiceRequests`.
   */
  create(em: EntityManager, data: CreateServiceRequestData): ServiceRequests {
    return em.create(
      ServiceRequests,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        codeConceptId: data.codeConceptId,
        categoryConceptId: data.categoryConceptId,
        intentConceptId: data.intentConceptId,
        priorityConceptId: data.priorityConceptId,
        statusConceptId: data.statusConceptId,
        requesterProfileId: data.requesterProfileId,
        performerTenantId: data.performerTenantId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
