import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  TelemetryGovernanceController,
  TelemetryConsentController,
  TelemetryEventsController,
  TelemetryAnalyticsController,
} from './presentation/controllers';
import { TelemetryOnboardingAnalyticsController } from './presentation/controllers/telemetry-onboarding-analytics.controller';
import {
  TelemetryGovernanceService,
  TelemetryConsentService,
  TelemetryEventsService,
  TelemetryWebAnalyticsService,
  TelemetryAnalyticsService,
} from './application/services';
import { TelemetryOnboardingAnalyticsService } from './application/services/telemetry-onboarding-analytics.service';
import { WEB_ANALYTICS_PORT } from './domain/web-analytics.port';
import { DisabledWebAnalyticsAdapter } from './infrastructure/adapters/disabled-web-analytics.adapter';
import { GoogleAnalyticsAdapter } from './infrastructure/adapters/google-analytics/google-analytics.adapter';
import { GoogleAnalyticsHttpClient } from './infrastructure/adapters/google-analytics/google-analytics-http.client';
import { selectWebAnalyticsAdapter } from './infrastructure/adapters/web-analytics.factory';
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
  TelemetryAnalyticsRepository,
  ActorSessionsRepository,
} from './infrastructure/repositories';

/**
 * Módulo Telemetry (28): actividad consent-aware, eventos, sesiones/journeys,
 * Core Web Vitals, funnels y conversiones. Gobernanza de propósitos/disclosures y
 * ciclo de consentimiento de tracking. Las entidades se registran vía
 * `MikroOrmModule.forFeature`; `TokenService`/guards llegan por `AuthModule` global.
 *
 * El reenvío a una analítica web externa se resuelve aquí, en un único punto:
 * `WEB_ANALYTICS_PORT` publica el adaptador que elige
 * `TELEMETRY_WEB_ANALYTICS_PROVIDER`, y con el reenvío apagado —el valor por
 * defecto— se cablea el adaptador `disabled`, que no habla con nadie.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    TelemetryGovernanceController,
    TelemetryConsentController,
    TelemetryEventsController,
    TelemetryAnalyticsController,
    TelemetryOnboardingAnalyticsController,
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
    TelemetryAnalyticsRepository,
    ActorSessionsRepository,
    // Analítica web externa: adaptadores concretos y selección por entorno.
    DisabledWebAnalyticsAdapter,
    GoogleAnalyticsHttpClient,
    GoogleAnalyticsAdapter,
    {
      provide: WEB_ANALYTICS_PORT,
      useFactory: (
        disabled: DisabledWebAnalyticsAdapter,
        googleAnalytics: GoogleAnalyticsAdapter,
      ) => selectWebAnalyticsAdapter({ disabled, googleAnalytics }),
      inject: [DisabledWebAnalyticsAdapter, GoogleAnalyticsAdapter],
    },
    // Servicios
    TelemetryGovernanceService,
    TelemetryConsentService,
    TelemetryWebAnalyticsService,
    TelemetryEventsService,
    TelemetryAnalyticsService,
    TelemetryOnboardingAnalyticsService,
  ],
  exports: [
    WEB_ANALYTICS_PORT,
    TelemetryWebAnalyticsService,
    TelemetryOnboardingAnalyticsService,
  ],
})
export class TelemetryModule {}
