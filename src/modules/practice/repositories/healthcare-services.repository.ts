import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { HealthcareServices } from '../entities';
import { createdBy } from '../../../common';

/** Datos para publicar un servicio de salud. */
export interface CreateHealthcareServiceData {
  practiceId: string;
  serviceConceptId: string;
  statusConceptId: string;
  practiceSiteId?: string;
  clinicalUnitId?: string;
  specialtyConceptId?: string;
  referralRequired?: boolean;
  appointmentRequired?: boolean;
  telehealthAvailable?: boolean;
  actorUserId?: string;
}

/** Acceso a datos de `practice.healthcare_services` (stateless). */
@Injectable()
export class HealthcareServicesRepository {
  findById(em: EntityManager, id: string): Promise<HealthcareServices | null> {
    return em.findOne(HealthcareServices, { id });
  }

  findBySite(em: EntityManager, practiceSiteId: string): Promise<HealthcareServices[]> {
    return em.find(HealthcareServices, { practiceSiteId });
  }

  create(em: EntityManager, data: CreateHealthcareServiceData): HealthcareServices {
    return em.create(
      HealthcareServices,
      {
        practiceId: data.practiceId,
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        serviceConceptId: data.serviceConceptId,
        specialtyConceptId: data.specialtyConceptId,
        referralRequired: data.referralRequired,
        appointmentRequired: data.appointmentRequired,
        telehealthAvailable: data.telehealthAvailable,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
