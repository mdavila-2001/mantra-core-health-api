import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { TripsRepository, TrackingSessionsRepository } from '../repositories';
import { StartTripDto, CloseTripDto, TripResponseDto } from '../dto';
import { GEO } from '../geo.concepts';

/**
 * Casos de uso sobre `geo.trips`: iniciar viaje (UC-13-06) y cerrarlo con
 * distancia/duración (UC-13-07). El servicio controla la transacción y marca
 * `updated_at` en la sesión asociada al iniciar.
 */
@Injectable()
export class GeoTripsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tripsRepo - Valor de trips repo requerido por la operación.
   * @param sessionsRepo - Valor de sessions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tripsRepo: TripsRepository,
    private readonly sessionsRepo: TrackingSessionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GeoTripsService.name);
  }

  /** UC-13-06: inicia un viaje IN_PROGRESS sobre una sesión OPEN sin viaje activo. */
  async start(
    dto: StartTripDto,
    actor: AuthenticatedUser,
  ): Promise<TripResponseDto> {
    this.logger.info(
      {
        operation: 'geo.trip.start',
        trackingSessionId: dto.trackingSessionId,
        actorId: actor.id,
      },
      'Starting trip',
    );
    return this.em.transactional(async (tx) => {
      const session = await this.sessionsRepo.findById(
        tx,
        dto.trackingSessionId,
      );
      if (!session) {
        throw new ResourceNotFoundException(
          'Sesión de tracking no encontrada',
          {
            trackingSessionId: dto.trackingSessionId,
          },
        );
      }
      if (session.statusConceptId !== GEO.SESSION_OPEN) {
        throw new PreconditionFailedException(
          'La sesión de tracking no está abierta',
          {
            trackingSessionId: dto.trackingSessionId,
          },
        );
      }

      const active = await this.tripsRepo.findInProgressBySession(
        tx,
        dto.trackingSessionId,
        GEO.TRIP_IN_PROGRESS,
      );
      if (active) {
        throw new ConflictException('La sesión ya tiene un viaje en progreso', {
          trackingSessionId: dto.trackingSessionId,
        });
      }

      const now = new Date();
      const trip = this.tripsRepo.create(tx, {
        trackingSessionId: dto.trackingSessionId,
        originAddressId: dto.originAddressId,
        destinationAddressId: dto.destinationAddressId,
        statusConceptId: GEO.TRIP_IN_PROGRESS,
        startedAt: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      touch(session, actor.id, now);

      this.logger.info(
        { operation: 'geo.trip.start', tripId: trip.id },
        'Trip started',
      );
      return this.toResponse(trip);
    });
  }

  /** UC-13-07: cierra un viaje IN_PROGRESS -> COMPLETED con distancia/duración. */
  async close(
    tripId: string,
    dto: CloseTripDto,
    actor: AuthenticatedUser,
  ): Promise<TripResponseDto> {
    this.logger.info(
      { operation: 'geo.trip.close', tripId, actorId: actor.id },
      'Closing trip',
    );
    return this.em.transactional(async (tx) => {
      const trip = await this.tripsRepo.findById(tx, tripId);
      if (!trip)
        throw new ResourceNotFoundException('Viaje no encontrado', { tripId });

      if (trip.statusConceptId !== GEO.TRIP_IN_PROGRESS) {
        throw new PreconditionFailedException('El viaje no está en progreso', {
          tripId,
        });
      }

      const now = new Date();
      trip.statusConceptId = GEO.TRIP_COMPLETED;
      trip.endedAt = now;
      if (dto.distanceM !== undefined) trip.distanceM = String(dto.distanceM);
      if (dto.durationS !== undefined) {
        trip.durationS = dto.durationS;
      } else if (trip.startedAt) {
        trip.durationS = Math.max(
          0,
          Math.round((now.getTime() - trip.startedAt.getTime()) / 1000),
        );
      }
      touch(trip, actor.id, now);

      this.logger.info(
        { operation: 'geo.trip.close', tripId },
        'Trip completed',
      );
      return this.toResponse(trip);
    });
  }

  /**
   * Transforma to response.
   *
   * @param trip - Valor de trip requerido por la operación.
   * @returns Resultado de to response conforme al contrato `TripResponseDto`.
   */
  private toResponse(trip: {
    /**
     * Identificador único de la instancia.
     */
    id: string;
    /**
     * Identificador asociado a tracking session.
     */
    trackingSessionId?: string;
    /**
     * Identificador asociado a status concept.
     */
    statusConceptId: string;
    /**
     * Valor de distance m mantenido por la instancia.
     */
    distanceM?: string;
    /**
     * Valor de duration s mantenido por la instancia.
     */
    durationS?: number;
    /**
     * Valor de started at mantenido por la instancia.
     */
    startedAt?: Date;
    /**
     * Valor de ended at mantenido por la instancia.
     */
    endedAt?: Date;
  }): TripResponseDto {
    return {
      id: trip.id,
      trackingSessionId: trip.trackingSessionId,
      status: trip.statusConceptId,
      distanceM: trip.distanceM,
      durationS: trip.durationS,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
    };
  }
}
