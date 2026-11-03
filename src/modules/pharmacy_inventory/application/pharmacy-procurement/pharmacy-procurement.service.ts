import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PharmacyProcurementUseCases } from './pharmacy-procurement.use-cases';

/** Fachada pública de proveedores, órdenes de compra y recepciones. */
@Injectable()
export class PharmacyProcurementService {
  constructor(
    private readonly useCases: PharmacyProcurementUseCases,
    logger: PinoLogger,
  ) {
    logger.setContext(PharmacyProcurementService.name);
  }

  createSupplier(
    ...args: Parameters<PharmacyProcurementUseCases['createSupplier']>
  ): ReturnType<PharmacyProcurementUseCases['createSupplier']> {
    return this.useCases.createSupplier(...args);
  }

  createPurchaseOrder(
    ...args: Parameters<PharmacyProcurementUseCases['createPurchaseOrder']>
  ): ReturnType<PharmacyProcurementUseCases['createPurchaseOrder']> {
    return this.useCases.createPurchaseOrder(...args);
  }

  receiveGoods(
    ...args: Parameters<PharmacyProcurementUseCases['receiveGoods']>
  ): ReturnType<PharmacyProcurementUseCases['receiveGoods']> {
    return this.useCases.receiveGoods(...args);
  }
}
