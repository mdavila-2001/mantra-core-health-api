import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticStudyPrices } from '../entities';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de una nueva versión de precio (append-only, UC-23-07). */
export interface CreatePriceData {
  /**
   * Identificador asociado a price schedule.
   */
  priceScheduleId: string;
  /**
   * Identificador asociado a diagnostic study offering.
   */
  diagnosticStudyOfferingId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Valor de base amount mantenido por la instancia.
   */
  baseAmount: string;
  /**
   * Valor de patient amount mantenido por la instancia.
   */
  patientAmount?: string;
  /**
   * Valor de insurer amount mantenido por la instancia.
   */
  insurerAmount?: string;
  /**
   * Valor de tax amount mantenido por la instancia.
   */
  taxAmount?: string;
  /**
   * Valor de discount factor mantenido por la instancia.
   */
  discountFactor?: string;
  /**
   * Valor de pricing rule json mantenido por la instancia.
   */
  pricingRuleJson?: unknown;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `diagnostic_units.diagnostic_study_prices`. Tabla versionada
 * append-only: nunca se hace DELETE ni se reescribe un importe publicado; solo se
 * inserta una versión nueva y se cierra la anterior (`effective_to` + estado).
 */
@Injectable()
export class DiagnosticStudyPricesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DiagnosticStudyPrices | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DiagnosticStudyPrices | null> {
    return em.findOne(DiagnosticStudyPrices, { id });
  }

  /** Versión ACTIVA vigente del par (schedule, offering), o `null`. */
  findActive(
    em: EntityManager,
    priceScheduleId: string,
    diagnosticStudyOfferingId: string,
  ): Promise<DiagnosticStudyPrices | null> {
    return em.findOne(DiagnosticStudyPrices, {
      priceScheduleId,
      diagnosticStudyOfferingId,
      statusConceptId: DUNIT.PRICE_ACTIVE,
    });
  }

  /** Mayor version_number registrado del par (schedule, offering). */
  async maxVersion(
    em: EntityManager,
    priceScheduleId: string,
    diagnosticStudyOfferingId: string,
  ): Promise<number> {
    const rows = await em.find(
      DiagnosticStudyPrices,
      { priceScheduleId, diagnosticStudyOfferingId },
      {
        fields: ['versionNumber'],
        orderBy: { versionNumber: 'DESC' },
        limit: 1,
      },
    );
    return rows.length ? rows[0].versionNumber : 0;
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DiagnosticStudyPrices`.
   */
  create(em: EntityManager, data: CreatePriceData): DiagnosticStudyPrices {
    return em.create(
      DiagnosticStudyPrices,
      {
        priceScheduleId: data.priceScheduleId,
        diagnosticStudyOfferingId: data.diagnosticStudyOfferingId,
        versionNumber: data.versionNumber,
        baseAmount: data.baseAmount,
        patientAmount: data.patientAmount,
        insurerAmount: data.insurerAmount,
        taxAmount: data.taxAmount,
        discountFactor: data.discountFactor,
        pricingRuleJson: data.pricingRuleJson,
        effectiveFrom: data.effectiveFrom,
        statusConceptId: DUNIT.PRICE_ACTIVE,
        recordedAt: new Date(),
        recordedByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
