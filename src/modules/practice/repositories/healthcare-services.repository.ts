import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { HealthcareServices } from '../entities';
import { createdBy } from '../../../common';

/** Datos para publicar un servicio de salud. */
export interface CreateHealthcareServiceData {
  /**
   * Tenant dueño del servicio: el de la práctica. La columna es NOT NULL desde
   * F1c y la FK compuesta `(tenant_id, practice_id)` exige que coincidan.
   */
  tenantId: string;
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
   * Ítem de `billing.service_catalog` que fija el precio en la sede.
   */
  serviceCatalogId?: string;
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
   * El servicio que una sede ya ofrece para un procedimiento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Sede.
   * @param serviceConceptId - Procedimiento.
   * @returns El servicio, o `null` si la sede no lo ofrece.
   */
  findBySiteAndConcept(
    em: EntityManager,
    practiceSiteId: string,
    serviceConceptId: string,
  ): Promise<HealthcareServices | null> {
    return em.findOne(HealthcareServices, { practiceSiteId, serviceConceptId });
  }

  /**
   * Los servicios con sede de una práctica, en el orden en que se publicaron.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Práctica.
   * @param practiceSiteId - Si viene, solo los de esa sede.
   * @returns Los servicios; los que no tienen sede no son una oferta y no figuran.
   */
  listByPractice(
    em: EntityManager,
    practiceId: string,
    practiceSiteId?: string,
  ): Promise<HealthcareServices[]> {
    return em.find(
      HealthcareServices,
      practiceSiteId === undefined
        ? { practiceId, practiceSiteId: { $ne: null } }
        : { practiceId, practiceSiteId },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
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
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        serviceConceptId: data.serviceConceptId,
        specialtyConceptId: data.specialtyConceptId,
        referralRequired: data.referralRequired,
        appointmentRequired: data.appointmentRequired,
        telehealthAvailable: data.telehealthAvailable,
        serviceCatalogId: data.serviceCatalogId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
