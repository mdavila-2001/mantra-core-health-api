import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../common';
import { ExchangeRateRepository } from '../repositories';
import { RegisterExchangeRateDto, ExchangeRateResponseDto } from '../dto';

/**
 * UC-16-14: registra (upsert) el tipo de cambio de un par de monedas para una
 * fecha. Si ya existe una tasa para `(from, to, validOn)`, la actualiza; en caso
 * contrario la crea. La consume UC-16-01 para `fx_rate`/`amount_base`.
 */
@Injectable()
export class ExchangeRateService {
  constructor(
    private readonly em: EntityManager,
    private readonly ratesRepo: ExchangeRateRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExchangeRateService.name);
  }

  async registerRate(
    dto: RegisterExchangeRateDto,
    actor: AuthenticatedUser,
  ): Promise<ExchangeRateResponseDto> {
    this.logger.info(
      {
        operation: 'accounting.fx.register',
        from: dto.fromCurrencyConceptId,
        to: dto.toCurrencyConceptId,
        validOn: dto.validOn,
      },
      'Registering exchange rate',
    );
    return this.em.transactional(async (tx) => {
      const validOn = new Date(dto.validOn);
      const existing = await this.ratesRepo.findForPair(
        tx,
        dto.fromCurrencyConceptId,
        dto.toCurrencyConceptId,
        validOn,
      );

      if (existing) {
        existing.rate = dto.rate;
        existing.source = dto.source;
        touch(existing, actor.id);
        await tx.flush();
        return { id: existing.id, rate: existing.rate, validOn: existing.validOn, created: false };
      }

      const rate = this.ratesRepo.create(tx, {
        fromCurrencyConceptId: dto.fromCurrencyConceptId,
        toCurrencyConceptId: dto.toCurrencyConceptId,
        rate: dto.rate,
        validOn,
        source: dto.source,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: rate.id, rate: rate.rate, validOn: rate.validOn, created: true };
    });
  }
}
