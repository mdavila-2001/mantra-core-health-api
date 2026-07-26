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

  create(
    em: EntityManager,
    data: {
      fromCurrencyConceptId: string;
      toCurrencyConceptId: string;
      rate: string;
      validOn: Date;
      source?: string;
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
