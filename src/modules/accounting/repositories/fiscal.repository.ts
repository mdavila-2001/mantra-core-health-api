import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FiscalYears, FiscalPeriods } from '../entities';
import { createdBy } from '../../../common';

/** Acceso a ejercicios y periodos fiscales (UC-16-04 / UC-16-05). */
@Injectable()
export class FiscalRepository {
  /**
   * Obtiene find year by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find year by id conforme al contrato `Promise<FiscalYears | null>`.
   */
  findYearById(em: EntityManager, id: string): Promise<FiscalYears | null> {
    return em.findOne(FiscalYears, { id });
  }

  /**
   * Obtiene find year by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find year by code conforme al contrato `Promise<FiscalYears | null>`.
   */
  findYearByCode(
    em: EntityManager,
    practiceId: string,
    code: string,
  ): Promise<FiscalYears | null> {
    return em.findOne(FiscalYears, { practiceId, code });
  }

  /**
   * Crea create year.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create year conforme al contrato `FiscalYears`.
   */
  createYear(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a practice.
       */
      practiceId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de start date mantenido por la instancia.
       */
      startDate: Date;
      /**
       * Valor de end date mantenido por la instancia.
       */
      endDate: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): FiscalYears {
    return em.create(
      FiscalYears,
      {
        practiceId: data.practiceId,
        code: data.code,
        startDate: data.startDate,
        endDate: data.endDate,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create period.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create period conforme al contrato `FiscalPeriods`.
   */
  createPeriod(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a fiscal year.
       */
      fiscalYearId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de start date mantenido por la instancia.
       */
      startDate: Date;
      /**
       * Valor de end date mantenido por la instancia.
       */
      endDate: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): FiscalPeriods {
    return em.create(
      FiscalPeriods,
      {
        fiscalYearId: data.fiscalYearId,
        code: data.code,
        startDate: data.startDate,
        endDate: data.endDate,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find period by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find period by id conforme al contrato `Promise<FiscalPeriods | null>`.
   */
  findPeriodById(em: EntityManager, id: string): Promise<FiscalPeriods | null> {
    return em.findOne(FiscalPeriods, { id });
  }
}
