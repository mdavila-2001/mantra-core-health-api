import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Immunizations } from '../entities';
import { createdBy } from '../../../common';

export interface CreateImmunizationData {
  custodianTenantId: string;
  patientProfileId: string;
  vaccineConceptId: string;
  statusConceptId: string;
  doseNumber?: number;
  lotNumber?: string;
  routeConceptId?: string;
  administeredAt?: Date;
  administeredByProfileId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical.immunizations` (stateless). */
@Injectable()
export class ImmunizationsRepository {
  findById(em: EntityManager, id: string): Promise<Immunizations | null> {
    return em.findOne(Immunizations, { id });
  }

  /** Dosis ya registrada para el mismo paciente+vacuna+número (evita doble dosis). */
  findByPatientVaccineDose(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    vaccineConceptId: string,
    doseNumber: number | undefined,
  ): Promise<Immunizations | null> {
    return em.findOne(Immunizations, {
      custodianTenantId,
      patientProfileId,
      vaccineConceptId,
      doseNumber: doseNumber ?? null,
    });
  }

  create(em: EntityManager, data: CreateImmunizationData): Immunizations {
    return em.create(
      Immunizations,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        vaccineConceptId: data.vaccineConceptId,
        statusConceptId: data.statusConceptId,
        doseNumber: data.doseNumber,
        lotNumber: data.lotNumber,
        routeConceptId: data.routeConceptId,
        administeredAt: data.administeredAt,
        administeredByProfileId: data.administeredByProfileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
