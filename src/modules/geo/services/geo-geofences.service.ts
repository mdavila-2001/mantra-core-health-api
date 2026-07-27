import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  GeofencesRepository,
  GeofenceEventsRepository,
  TrackedSubjectsRepository,
} from '../repositories';
import {
  CreateGeofenceDto,
  GeofenceResponseDto,
  RecordGeofenceEventDto,
  GeofenceEventResponseDto,
} from '../dto';
import {
  GEO,
  SHAPE_TYPE_CONCEPT_BY_CODE,
  EVENT_TYPE_CONCEPT_BY_CODE,
} from '../geo.concepts';

/**
 * Casos de uso sobre geofences: definir/activar geofence (UC-13-04) y registrar
 * eventos de entrada/salida generados por el worker de geofencing (UC-13-05).
 */
@Injectable()
export class GeoGeofencesService {
  constructor(
    private readonly em: EntityManager,
    private readonly geofencesRepo: GeofencesRepository,
    private readonly eventsRepo: GeofenceEventsRepository,
    private readonly subjectsRepo: TrackedSubjectsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GeoGeofencesService.name);
  }

  /** UC-13-04: define y activa un geofence (circle o polygon). */
  async define(
    dto: CreateGeofenceDto,
    actor: AuthenticatedUser,
  ): Promise<GeofenceResponseDto> {
    this.logger.info(
      { operation: 'geo.geofence.define', tenantId: dto.tenantId },
      'Defining geofence',
    );

    // Coherencia forma/geometría (422 si falta) — antes de abrir transacción.
    if (dto.shapeType === 'CIRCLE') {
      if (
        dto.radiusM === undefined ||
        dto.centerLat === undefined ||
        dto.centerLng === undefined
      ) {
        throw new PreconditionFailedException(
          'Un geofence circular requiere radiusM, centerLat y centerLng',
          {
            shapeType: dto.shapeType,
          },
        );
      }
    } else if (!dto.geometryJson) {
      throw new PreconditionFailedException(
        'Un geofence poligonal requiere geometryJson',
        {
          shapeType: dto.shapeType,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const clash = await this.geofencesRepo.findByTenantAndName(
        tx,
        dto.tenantId,
        dto.name,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe un geofence con ese nombre en el tenant',
          {
            name: dto.name,
          },
        );
      }

      const geofence = this.geofencesRepo.create(tx, {
        tenantId: dto.tenantId,
        name: dto.name,
        shapeTypeConceptId: SHAPE_TYPE_CONCEPT_BY_CODE[dto.shapeType],
        geometryJson: dto.geometryJson,
        radiusM: dto.radiusM === undefined ? undefined : String(dto.radiusM),
        centerLat:
          dto.centerLat === undefined ? undefined : String(dto.centerLat),
        centerLng:
          dto.centerLng === undefined ? undefined : String(dto.centerLng),
        stateConceptId: GEO.GEOFENCE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'geo.geofence.define', geofenceId: geofence.id },
        'Geofence defined',
      );
      return {
        id: geofence.id,
        tenantId: geofence.tenantId,
        name: geofence.name,
        shapeType: geofence.shapeTypeConceptId,
        state: geofence.stateConceptId,
        createdAt: geofence.createdAt,
      };
    });
  }

  /** UC-13-05: registra un evento ENTER/EXIT append-only, idempotente vs el previo. */
  async recordEvent(
    dto: RecordGeofenceEventDto,
    actor: AuthenticatedUser,
  ): Promise<GeofenceEventResponseDto> {
    this.logger.info(
      {
        operation: 'geo.geofence.event',
        geofenceId: dto.geofenceId,
        eventType: dto.eventType,
      },
      'Recording geofence event',
    );
    return this.em.transactional(async (tx) => {
      const geofence = await this.geofencesRepo.findById(tx, dto.geofenceId);
      if (!geofence)
        throw new ResourceNotFoundException('Geofence no encontrado', {
          geofenceId: dto.geofenceId,
        });
      if (geofence.stateConceptId !== GEO.GEOFENCE_ACTIVE) {
        throw new PreconditionFailedException('El geofence no está activo', {
          geofenceId: dto.geofenceId,
        });
      }

      const subject = await this.subjectsRepo.findById(
        tx,
        dto.trackedSubjectId,
      );
      if (!subject) {
        throw new ResourceNotFoundException('Sujeto rastreado no encontrado', {
          trackedSubjectId: dto.trackedSubjectId,
        });
      }

      const eventTypeConceptId = EVENT_TYPE_CONCEPT_BY_CODE[dto.eventType];

      // Transición idempotente: rechaza el mismo tipo consecutivo (ya dentro/fuera).
      const last = await this.eventsRepo.findLast(
        tx,
        dto.geofenceId,
        dto.trackedSubjectId,
      );
      if (last && last.eventTypeConceptId === eventTypeConceptId) {
        throw new ConflictException(
          'El sujeto ya está en ese estado respecto al geofence',
          {
            eventType: dto.eventType,
          },
        );
      }

      const event = this.eventsRepo.record(tx, {
        geofenceId: dto.geofenceId,
        trackedSubjectId: dto.trackedSubjectId,
        eventTypeConceptId,
        locationPingId: dto.locationPingId,
        occurredAt: dto.occurredAt,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      return {
        id: event.id,
        geofenceId: event.geofenceId,
        trackedSubjectId: event.trackedSubjectId,
        eventType: event.eventTypeConceptId,
        occurredAt: event.occurredAt,
        recordedAt: event.recordedAt,
      };
    });
  }
}
