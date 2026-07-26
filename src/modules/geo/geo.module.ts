import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  GeoTrackedSubjectsController,
  GeoTrackingSessionsController,
  GeoGeofencesController,
  GeoTripsController,
} from './controllers';
import {
  GeoTrackedSubjectsService,
  GeoTrackingSessionsService,
  GeoGeofencesService,
  GeoTripsService,
} from './services';
import {
  TrackedSubjectsRepository,
  TrackingSessionsRepository,
  LocationPingsRepository,
  GeofencesRepository,
  GeofenceEventsRepository,
  TripsRepository,
} from './repositories';

/**
 * Módulo Geo (13): geolocalización y tracking móvil — sujetos rastreados,
 * sesiones de tracking, pings de ubicación, geofences con sus eventos y viajes.
 * La autenticación llega vía `AuthModule` (global).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    GeoTrackedSubjectsController,
    GeoTrackingSessionsController,
    GeoGeofencesController,
    GeoTripsController,
  ],
  providers: [
    // Repositorios
    TrackedSubjectsRepository,
    TrackingSessionsRepository,
    LocationPingsRepository,
    GeofencesRepository,
    GeofenceEventsRepository,
    TripsRepository,
    // Servicios
    GeoTrackedSubjectsService,
    GeoTrackingSessionsService,
    GeoGeofencesService,
    GeoTripsService,
  ],
})
export class GeoModule {}
