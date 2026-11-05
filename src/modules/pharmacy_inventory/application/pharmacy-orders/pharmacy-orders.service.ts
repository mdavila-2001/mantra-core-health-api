import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PharmacyOrdersUseCases } from './pharmacy-orders.use-cases';

/** Fachada pública de los casos de uso del ciclo de pedidos de farmacia. */
@Injectable()
export class PharmacyOrdersService {
  constructor(
    private readonly useCases: PharmacyOrdersUseCases,
    logger: PinoLogger,
  ) {
    logger.setContext(PharmacyOrdersService.name);
  }

  create(
    ...args: Parameters<PharmacyOrdersUseCases['create']>
  ): ReturnType<PharmacyOrdersUseCases['create']> {
    return this.useCases.create(...args);
  }

  listMine(
    ...args: Parameters<PharmacyOrdersUseCases['listMine']>
  ): ReturnType<PharmacyOrdersUseCases['listMine']> {
    return this.useCases.listMine(...args);
  }

  getOrder(
    ...args: Parameters<PharmacyOrdersUseCases['getOrder']>
  ): ReturnType<PharmacyOrdersUseCases['getOrder']> {
    return this.useCases.getOrder(...args);
  }

  openConversation(
    ...args: Parameters<PharmacyOrdersUseCases['openConversation']>
  ): ReturnType<PharmacyOrdersUseCases['openConversation']> {
    return this.useCases.openConversation(...args);
  }

  cancel(
    ...args: Parameters<PharmacyOrdersUseCases['cancel']>
  ): ReturnType<PharmacyOrdersUseCases['cancel']> {
    return this.useCases.cancel(...args);
  }

  listForPharmacyTenant(
    ...args: Parameters<PharmacyOrdersUseCases['listForPharmacyTenant']>
  ): ReturnType<PharmacyOrdersUseCases['listForPharmacyTenant']> {
    return this.useCases.listForPharmacyTenant(...args);
  }

  openReview(
    ...args: Parameters<PharmacyOrdersUseCases['openReview']>
  ): ReturnType<PharmacyOrdersUseCases['openReview']> {
    return this.useCases.openReview(...args);
  }

  confirm(
    ...args: Parameters<PharmacyOrdersUseCases['confirm']>
  ): ReturnType<PharmacyOrdersUseCases['confirm']> {
    return this.useCases.confirm(...args);
  }

  acceptSubstitutions(
    ...args: Parameters<PharmacyOrdersUseCases['acceptSubstitutions']>
  ): ReturnType<PharmacyOrdersUseCases['acceptSubstitutions']> {
    return this.useCases.acceptSubstitutions(...args);
  }

  preferOriginal(
    ...args: Parameters<PharmacyOrdersUseCases['preferOriginal']>
  ): ReturnType<PharmacyOrdersUseCases['preferOriginal']> {
    return this.useCases.preferOriginal(...args);
  }

  reject(
    ...args: Parameters<PharmacyOrdersUseCases['reject']>
  ): ReturnType<PharmacyOrdersUseCases['reject']> {
    return this.useCases.reject(...args);
  }

  ready(
    ...args: Parameters<PharmacyOrdersUseCases['ready']>
  ): ReturnType<PharmacyOrdersUseCases['ready']> {
    return this.useCases.ready(...args);
  }

  dispense(
    ...args: Parameters<PharmacyOrdersUseCases['dispense']>
  ): ReturnType<PharmacyOrdersUseCases['dispense']> {
    return this.useCases.dispense(...args);
  }

  expireDue(
    ...args: Parameters<PharmacyOrdersUseCases['expireDue']>
  ): ReturnType<PharmacyOrdersUseCases['expireDue']> {
    return this.useCases.expireDue(...args);
  }
}

export {
  ORDER_TTL_HOURS,
  PICKUP_CODE_ALPHABET,
  PICKUP_CODE_LENGTH,
  PICKUP_CODE_UNIQUE_INDEX,
  ORDER_TERMINAL_STATUS_IDS,
  ORDER_NON_TERMINAL_STATUS_IDS,
  ORDER_STAFF_TRANSITIONS,
} from './pharmacy-orders.use-cases';
