import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceRequests } from '../entities';
import { createdBy } from '../../../common';

export interface CreateServiceRequestData {
  custodianTenantId: string;
  patientProfileId: string;
  encounterId?: string;
  codeConceptId: string;
  categoryConceptId?: string;
  intentConceptId?: string;
  priorityConceptId?: string;
  statusConceptId: string;
  requesterProfileId?: string;
  performerTenantId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical.service_requests` (stateless). */
@Injectable()
export class ServiceRequestsRepository {
  findById(em: EntityManager, id: string): Promise<ServiceRequests | null> {
    return em.findOne(ServiceRequests, { id });
  }

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
