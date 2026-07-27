import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticPriceSchedules } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de alta de un cronograma de precios (UC-23-06). */
export interface CreatePriceScheduleData {
  diagnosticUnitId: string;
  code: string;
  priceScheduleTypeConceptId?: string;
  diagnosticUnitSiteId?: string;
  insurerTenantId?: string;
  brokerTenantId?: string;
  currencyConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  publicVisibility?: boolean;
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_price_schedules`. */
@Injectable()
export class DiagnosticPriceSchedulesRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DiagnosticPriceSchedules | null> {
    return em.findOne(DiagnosticPriceSchedules, { id });
  }

  /** Cronograma por (unidad, code): la UK que evita duplicados. */
  findByCode(
    em: EntityManager,
    diagnosticUnitId: string,
    code: string,
  ): Promise<DiagnosticPriceSchedules | null> {
    return em.findOne(DiagnosticPriceSchedules, { diagnosticUnitId, code });
  }

  create(
    em: EntityManager,
    data: CreatePriceScheduleData,
  ): DiagnosticPriceSchedules {
    return em.create(
      DiagnosticPriceSchedules,
      {
        diagnosticUnitId: data.diagnosticUnitId,
        diagnosticUnitSiteId: data.diagnosticUnitSiteId,
        code: data.code,
        priceScheduleTypeConceptId:
          data.priceScheduleTypeConceptId ?? DUNIT.PRICE_SCHEDULE_STANDARD,
        insurerTenantId: data.insurerTenantId,
        brokerTenantId: data.brokerTenantId,
        currencyConceptId: data.currencyConceptId ?? DUNIT.CURRENCY_PEN,
        validFrom: data.validFrom,
        validTo: data.validTo,
        publicVisibility: data.publicVisibility,
        statusConceptId: DUNIT.SCHEDULE_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
