import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { HealthcareServices } from '../entities';
import { createdBy } from '../../../common';

/** Datos para publicar un servicio de salud. */
export interface CreateHealthcareServiceData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId?: string;
  /**
   * Identificador asociado a clinical unit.
   */
  clinicalUnitId?: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId?: string;
  /**
   * Valor de referral required mantenido por la instancia.
   */
  referralRequired?: boolean;
  /**
   * Valor de appointment required mantenido por la instancia.
   */
  appointmentRequired?: boolean;
  /**
   * Valor de telehealth available mantenido por la instancia.
   */
  telehealthAvailable?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `practice.healthcare_services` (stateless). */
@Injectable()
export class HealthcareServicesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<HealthcareServices | null>`.
   */
  findById(em: EntityManager, id: string): Promise<HealthcareServices | null> {
    return em.findOne(HealthcareServices, { id });
  }

  /**
   * Obtiene find by site.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Identificador de practice site.
   * @returns Resultado de find by site conforme al contrato `Promise<HealthcareServices[]>`.
   */
  findBySite(
    em: EntityManager,
    practiceSiteId: string,
  ): Promise<HealthcareServices[]> {
    return em.find(HealthcareServices, { practiceSiteId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `HealthcareServices`.
   */
  create(
    em: EntityManager,
    data: CreateHealthcareServiceData,
  ): HealthcareServices {
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
