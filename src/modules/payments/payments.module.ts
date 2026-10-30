import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  PaymentsIntentsController,
  PaymentsTransactionsController,
  PaymentsOperationsController,
  PaymentsGatewayWebhooksController,
  PaymentsGatewayDispatchesController,
} from './controllers';
import {
  PaymentsIntentsService,
  PaymentsCheckoutService,
  PaymentsTransactionsService,
  PaymentsOperationsService,
  PaymentsGatewayChargeService,
  PaymentsGatewayWebhookService,
  WalletsService,
} from './services';
import {
  PAYMENTS_GATEWAY_CONFIG,
  loadPaymentsGatewayConfig,
} from './gateway/payments-gateway.env';
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
    PaymentsGatewayWebhooksController,
    PaymentsGatewayDispatchesController,
  ],
  providers: [
    // Pasarela como PSP (`payments.via_gateway`, apagado por defecto). Se lee y
    // valida al construir el módulo: con el flag encendido y sin URL, clave o
    // secreto de webhook el proceso no arranca.
    {
      provide: PAYMENTS_GATEWAY_CONFIG,
      useFactory: () => loadPaymentsGatewayConfig(),
    },
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
    PaymentsGatewayChargeService,
    PaymentsGatewayWebhookService,
    WalletsService,
  ],
  // Contrato entre dominios para acreditar saldo sin acceso directo a las tablas
  // de pagos (cierra DIRECT_CROSS_DOMAIN_ACCESS promotions→payments).
  exports: [WalletsService],
})
export class PaymentsModule {}
