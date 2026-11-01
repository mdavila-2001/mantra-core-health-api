import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  roleAuthorizesInTenant,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { AccountingErrorReason } from '../accounting.error-reasons';
import { ExchangeRateRepository } from '../repositories';
import { RegisterExchangeRateDto, ExchangeRateResponseDto } from '../dto';

/**
 * UC-16-14: registra (upsert) el tipo de cambio de un par de monedas para una
 * fecha. Si ya existe una tasa para `(from, to, validOn)`, la actualiza; en caso
 * contrario la crea. La consume UC-16-01 para `fx_rate`/`amount_base`.
 *
 * `accounting.exchange_rates` no lleva `tenant_id` ni práctica: es una tabla de
 * plataforma compartida por todas las organizaciones. Por eso sólo la escribe un
 * actor de plataforma global (`SUPERADMIN` o `SYSTEM` sin ámbito en
 * `scopedRoles`); un administrador de tenant sobrescribiría la tasa que usan
 * los demás (ACC-01). Aislar la tasa por tenant exige una columna `tenant_id`
 * en el modelo.
 */
@Injectable()
export class ExchangeRateService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ratesRepo - Valor de rates repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly ratesRepo: ExchangeRateRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExchangeRateService.name);
  }

  /**
   * Crea register rate.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de register rate conforme al contrato `Promise<ExchangeRateResponseDto>`.
   */
  async registerRate(
    dto: RegisterExchangeRateDto,
    actor: AuthenticatedUser,
  ): Promise<ExchangeRateResponseDto> {
    this.assertPlatformActor(actor);
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
        return {
          id: existing.id,
          rate: existing.rate,
          validOn: existing.validOn,
          created: false,
        };
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
      return {
        id: rate.id,
        rate: rate.rate,
        validOn: rate.validOn,
        created: true,
      };
    });
  }

  /**
   * Exige un actor de plataforma: la tabla de tipos de cambio es global.
   *
   * @param actor - Usuario autenticado que registra la tasa.
   * @throws InsufficientRoleException (403) si el actor está acotado a un tenant.
   */
  private assertPlatformActor(actor: AuthenticatedUser): void {
    // Tabla sin tenant: sólo el rol global, también para `SUPERADMIN` (#1241).
    if (
      roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined) ||
      roleAuthorizesInTenant(actor, 'SYSTEM', undefined)
    ) {
      return;
    }
    throw new InsufficientRoleException(
      'El tipo de cambio es un dato de plataforma',
      undefined,
      AccountingErrorReason.EXCHANGE_RATE_PLATFORM_ONLY,
    );
  }
}
