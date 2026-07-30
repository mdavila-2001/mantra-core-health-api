import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ImmunizationSchedules } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar una dosis de un calendario de inmunización. */
export interface CreateImmunizationScheduleData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a vaccine concept.
   */
  vaccineConceptId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de recommended age days mantenido por la instancia.
   */
  recommendedAgeDays?: number;
  /**
   * Valor de dose number mantenido por la instancia.
   */
  doseNumber?: number;
  /**
   * Valor de interval days mantenido por la instancia.
   */
  intervalDays?: number;
  /**
   * Identificador asociado a jurisdiction concept.
   */
  jurisdictionConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.immunization_schedules`. */
@Injectable()
export class ImmunizationSchedulesRepository {
  /** Calendario activo para una jurisdicción (o global) — base de la proyección. */
  findActive(
    em: EntityManager,
    statusConceptId: string,
    jurisdictionConceptId?: string,
    tenantId?: string,
  ): Promise<ImmunizationSchedules[]> {
    return em.find(
      ImmunizationSchedules,
      {
        statusConceptId,
        ...(jurisdictionConceptId ? { jurisdictionConceptId } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      { orderBy: { doseNumber: 'asc' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ImmunizationSchedules`.
   */
  create(
    em: EntityManager,
    data: CreateImmunizationScheduleData,
  ): ImmunizationSchedules {
    return em.create(
      ImmunizationSchedules,
      {
        tenantId: data.tenantId,
        vaccineConceptId: data.vaccineConceptId,
        name: data.name,
        recommendedAgeDays: data.recommendedAgeDays,
        doseNumber: data.doseNumber,
        intervalDays: data.intervalDays,
        jurisdictionConceptId: data.jurisdictionConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
