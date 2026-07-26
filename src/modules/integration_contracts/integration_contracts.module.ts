import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  IntegrationContractsController,
  IntegrationExchangesController,
} from './controllers';
import {
  IntegrationContractsService,
  IntegrationAuthProfilesService,
  IntegrationWebhooksService,
  IntegrationExchangesService,
} from './services';
import {
  ContractsRepository,
  ContractVersionsRepository,
  AuthProfilesRepository,
  WebhookSubscriptionsRepository,
  ExchangeRecordsRepository,
  ExchangeAttemptsRepository,
  IdempotencyRecordsRepository,
  SyncCursorsRepository,
  DeliveryEvidenceRepository,
} from './repositories';

/**
 * Módulo 31 — Governed Backend-to-Backend Contracts: define y gobierna contratos
 * de integración B2B (versiones, perfiles de autenticación sender-constrained,
 * suscripciones de webhook), ejecuta intercambios idempotentes con intentos y
 * reintentos, avanza cursores de sincronización y deja evidencia firmada de
 * entregas de webhook.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [IntegrationContractsController, IntegrationExchangesController],
  providers: [
    // Repositorios
    ContractsRepository,
    ContractVersionsRepository,
    AuthProfilesRepository,
    WebhookSubscriptionsRepository,
    ExchangeRecordsRepository,
    ExchangeAttemptsRepository,
    IdempotencyRecordsRepository,
    SyncCursorsRepository,
    DeliveryEvidenceRepository,
    // Servicios
    IntegrationContractsService,
    IntegrationAuthProfilesService,
    IntegrationWebhooksService,
    IntegrationExchangesService,
  ],
})
export class IntegrationContractsModule {}
