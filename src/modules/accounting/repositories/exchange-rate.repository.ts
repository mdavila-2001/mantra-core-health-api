import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ExchangeRates } from '../entities';
import { createdBy } from '../../../common';

/** Acceso a tipos de cambio (UC-16-14). */
@Injectable()
export class ExchangeRateRepository {
  /** Tasa vigente para un par de monedas en una fecha (clave lógica única). */
  findForPair(
    em: EntityManager,
    fromCurrencyConceptId: string,
    toCurrencyConceptId: string,
    validOn: Date,
  ): Promise<ExchangeRates | null> {
    return em.findOne(ExchangeRates, {
      fromCurrencyConceptId,
      toCurrencyConceptId,
      validOn,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ExchangeRates`.
   */
  create(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a from currency concept.
       */
      fromCurrencyConceptId: string;
      /**
       * Identificador asociado a to currency concept.
       */
      toCurrencyConceptId: string;
      /**
       * Valor de rate mantenido por la instancia.
       */
      rate: string;
      /**
       * Valor de valid on mantenido por la instancia.
       */
      validOn: Date;
      /**
       * Valor de source mantenido por la instancia.
       */
      source?: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): ExchangeRates {
    return em.create(
      ExchangeRates,
      {
        fromCurrencyConceptId: data.fromCurrencyConceptId,
        toCurrencyConceptId: data.toCurrencyConceptId,
        rate: data.rate,
        validOn: data.validOn,
        source: data.source,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
