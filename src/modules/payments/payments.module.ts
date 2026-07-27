import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  PaymentsIntentsController,
  PaymentsTransactionsController,
  PaymentsOperationsController,
} from './controllers';
import {
  PaymentsIntentsService,
  PaymentsCheckoutService,
  PaymentsTransactionsService,
  PaymentsOperationsService,
} from './services';
import {
  PaymentIntentsRepository,
  PaymentFlowRepository,
  PaymentTransactionsRepository,
  PaymentOperationsRepository,
} from './repositories';

/**
 * Módulo de pagos: intenciones, checkout, transacciones de gateway, reembolsos,
 * anulaciones, tarifas, liquidaciones, payouts y conciliación (UC-42-01 … 14).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    PaymentsIntentsController,
    PaymentsTransactionsController,
    PaymentsOperationsController,
  ],
  providers: [
    // Repositorios
    PaymentIntentsRepository,
    PaymentFlowRepository,
    PaymentTransactionsRepository,
    PaymentOperationsRepository,
    // Servicios
    PaymentsIntentsService,
    PaymentsCheckoutService,
    PaymentsTransactionsService,
    PaymentsOperationsService,
  ],
})
export class PaymentsModule {}
