import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { HospitalServiceLines } from '../entities';
import { createdBy } from '../../../common';

/** Datos para definir una línea de servicio hospitalaria (UC-22-03). */
export interface CreateServiceLineData {
  /**
   * Identificador asociado a hospital.
   */
  hospitalId: string;
  /**
   * Identificador asociado a clinical unit.
   */
  clinicalUnitId?: string;
  /**
   * Identificador asociado a healthcare service.
   */
  healthcareServiceId?: string;
  /**
   * Identificador asociado a service line concept.
   */
  serviceLineConceptId: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId?: string;
  /**
   * Identificador asociado a acuity level concept.
   */
  acuityLevelConceptId?: string;
  /**
   * Valor de referral required mantenido por la instancia.
   */
  referralRequired?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `organization_extensions.hospital_service_lines`.
 * Stateless: recibe el `EntityManager` activo en cada método.
 */
@Injectable()
export class HospitalServiceLinesRepository {
  /** Busca una línea por id y hospital; `null` si no existe (aísla por hospital). */
  findByIdForHospital(
    em: EntityManager,
    id: string,
    hospitalId: string,
  ): Promise<HospitalServiceLines | null> {
    return em.findOne(HospitalServiceLines, { id, hospitalId });
  }

  /** Crea la línea de servicio en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateServiceLineData): HospitalServiceLines {
    return em.create(
      HospitalServiceLines,
      {
        hospitalId: data.hospitalId,
        clinicalUnitId: data.clinicalUnitId,
        healthcareServiceId: data.healthcareServiceId,
        serviceLineConceptId: data.serviceLineConceptId,
        specialtyConceptId: data.specialtyConceptId,
        acuityLevelConceptId: data.acuityLevelConceptId,
        referralRequired: data.referralRequired,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
