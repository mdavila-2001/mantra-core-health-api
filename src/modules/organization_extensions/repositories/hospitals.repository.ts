import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Hospitals } from '../entities';
import { createdBy } from '../../../common';

/** Datos para especializar un practice/tenant como hospital (UC-22-01). */
export interface CreateHospitalData {
  tenantId: string;
  practiceId: string;
  hospitalTypeConceptId: string;
  careLevelConceptId?: string;
  ownershipTypeConceptId?: string;
  teachingStatusConceptId?: string;
  emergencyCapabilityConceptId?: string;
  licensedBedCapacity?: number;
  operationalBedCapacity?: number;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `organization_extensions.hospitals`.
 *
 * Repositorio stateless: cada método recibe el `EntityManager` activo para que el
 * servicio controle la transacción. Ninguna regla de negocio vive aquí.
 */
@Injectable()
export class HospitalsRepository {
  /** Busca un hospital por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Hospitals | null> {
    return em.findOne(Hospitals, { id });
  }

  /**
   * Busca un hospital ya especializado sobre el mismo tenant o practice (la
   * especialización es 1:1 por ambos ejes). Sirve para el guard de unicidad.
   */
  findByTenantOrPractice(
    em: EntityManager,
    tenantId: string,
    practiceId: string,
  ): Promise<Hospitals | null> {
    return em.findOne(Hospitals, { $or: [{ tenantId }, { practiceId }] });
  }

  /** Crea la entidad hospital en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateHospitalData): Hospitals {
    return em.create(
      Hospitals,
      {
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        hospitalTypeConceptId: data.hospitalTypeConceptId,
        careLevelConceptId: data.careLevelConceptId,
        ownershipTypeConceptId: data.ownershipTypeConceptId,
        teachingStatusConceptId: data.teachingStatusConceptId,
        emergencyCapabilityConceptId: data.emergencyCapabilityConceptId,
        licensedBedCapacity: data.licensedBedCapacity,
        operationalBedCapacity: data.operationalBedCapacity,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
