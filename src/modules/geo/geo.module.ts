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
import { ReverseGeocodingController } from './reverse-geocoding/reverse-geocoding.controller';
import { ReverseGeocodingService } from './reverse-geocoding/reverse-geocoding.service';

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
    ReverseGeocodingController,
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
    ReverseGeocodingService,
  ],
})
export class GeoModule {}
