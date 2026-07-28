import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticPriceSchedules } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de alta de un cronograma de precios (UC-23-06). */
export interface CreatePriceScheduleData {
  /**
   * Identificador asociado a diagnostic unit.
   */
  diagnosticUnitId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Identificador asociado a price schedule type concept.
   */
  priceScheduleTypeConceptId?: string;
  /**
   * Identificador asociado a diagnostic unit site.
   */
  diagnosticUnitSiteId?: string;
  /**
   * Identificador asociado a insurer tenant.
   */
  insurerTenantId?: string;
  /**
   * Identificador asociado a broker tenant.
   */
  brokerTenantId?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Valor de public visibility mantenido por la instancia.
   */
  publicVisibility?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_price_schedules`. */
@Injectable()
export class DiagnosticPriceSchedulesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DiagnosticPriceSchedules | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DiagnosticPriceSchedules`.
   */
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
