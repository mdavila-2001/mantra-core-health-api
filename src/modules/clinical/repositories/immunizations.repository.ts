import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Immunizations } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create immunization data.
 */
export interface CreateImmunizationData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a vaccine concept.
   */
  vaccineConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de dose number mantenido por la instancia.
   */
  doseNumber?: number;
  /**
   * Valor de lot number mantenido por la instancia.
   */
  lotNumber?: string;
  /**
   * Identificador asociado a route concept.
   */
  routeConceptId?: string;
  /**
   * Valor de administered at mantenido por la instancia.
   */
  administeredAt?: Date;
  /**
   * Identificador asociado a administered by profile.
   */
  administeredByProfileId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.immunizations` (stateless). */
@Injectable()
export class ImmunizationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Immunizations | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Immunizations`.
   */
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
