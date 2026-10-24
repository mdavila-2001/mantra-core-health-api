import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  TelemetryGovernanceController,
  TelemetryConsentController,
  TelemetryEventsController,
  TelemetryAnalyticsController,
} from './controllers';
import {
  TelemetryGovernanceService,
  TelemetryConsentService,
  TelemetryEventsService,
  TelemetryWebAnalyticsService,
  TelemetryAnalyticsService,
} from './services';
import { WEB_ANALYTICS_PORT } from './domain/web-analytics.port';
import { DisabledWebAnalyticsAdapter } from './infrastructure/disabled-web-analytics.adapter';
import { GoogleAnalyticsAdapter } from './infrastructure/google-analytics/google-analytics.adapter';
import { GoogleAnalyticsHttpClient } from './infrastructure/google-analytics/google-analytics-http.client';
import { selectWebAnalyticsAdapter } from './infrastructure/web-analytics.factory';
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
} from './repositories';

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
  ],
  exports: [WEB_ANALYTICS_PORT, TelemetryWebAnalyticsService],
})
export class TelemetryModule {}
