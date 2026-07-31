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
  WalletsService,
} from './services';
import {
  PaymentIntentsRepository,
  PaymentFlowRepository,
  PaymentTransactionsRepository,
  PaymentOperationsRepository,
  PaymentsWalletsRepository,
  PaymentsSubscriptionPlansRepository,
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
    PaymentsWalletsRepository,
    PaymentsSubscriptionPlansRepository,
    // Servicios
    PaymentsIntentsService,
    PaymentsCheckoutService,
    PaymentsTransactionsService,
    PaymentsOperationsService,
    WalletsService,
  ],
  // Contrato entre dominios para acreditar saldo sin acceso directo a las tablas
  // de pagos (cierra DIRECT_CROSS_DOMAIN_ACCESS promotions→payments).
  exports: [WalletsService],
})
export class PaymentsModule {}
