import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  TelemetryGovernanceController,
  TelemetryConsentController,
  TelemetryEventsController,
} from './controllers';
import {
  TelemetryGovernanceService,
  TelemetryConsentService,
  TelemetryEventsService,
} from './services';
import {
  TrackingPurposeDefinitionsRepository,
  ActivityEventSchemaDefinitionsRepository,
  TrackingDisclosureVersionsRepository,
  TrackingDisclosureAcceptancesRepository,
  TrackingConsentsRepository,
  AnalyticsSubjectsRepository,
  SessionJourneysRepository,
  UserActivityEventsRepository,
  UserActivityEventPropertiesRepository,
  ClientContextsRepository,
  WebVitalsRepository,
  FunnelDefinitionsRepository,
  FunnelStepsRepository,
  ConversionEventsRepository,
} from './repositories';

/**
 * Módulo Telemetry (28): actividad consent-aware, eventos, sesiones/journeys,
 * Core Web Vitals, funnels y conversiones. Gobernanza de propósitos/disclosures y
 * ciclo de consentimiento de tracking. Las entidades se registran vía
 * `MikroOrmModule.forFeature`; `TokenService`/guards llegan por `AuthModule` global.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    TelemetryGovernanceController,
    TelemetryConsentController,
    TelemetryEventsController,
  ],
  providers: [
    // Repositorios
    TrackingPurposeDefinitionsRepository,
    ActivityEventSchemaDefinitionsRepository,
    TrackingDisclosureVersionsRepository,
    TrackingDisclosureAcceptancesRepository,
    TrackingConsentsRepository,
    AnalyticsSubjectsRepository,
    SessionJourneysRepository,
    UserActivityEventsRepository,
    UserActivityEventPropertiesRepository,
    ClientContextsRepository,
    WebVitalsRepository,
    FunnelDefinitionsRepository,
    FunnelStepsRepository,
    ConversionEventsRepository,
    // Servicios
    TelemetryGovernanceService,
    TelemetryConsentService,
    TelemetryEventsService,
  ],
})
export class TelemetryModule {}
