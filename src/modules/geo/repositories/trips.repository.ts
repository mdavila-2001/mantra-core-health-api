import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Trips } from '../entities';
import { createdBy } from '../../../common';

/** Datos para iniciar un viaje. */
export interface CreateTripData {
  /**
   * Identificador asociado a tracking session.
   */
  trackingSessionId: string;
  /**
   * Identificador asociado a origin address.
   */
  originAddressId?: string;
  /**
   * Identificador asociado a destination address.
   */
  destinationAddressId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `geo.trips`. Stateless: recibe el `EntityManager` activo.
 */
@Injectable()
export class TripsRepository {
  /** Busca un viaje por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Trips | null> {
    return em.findOne(Trips, { id });
  }

  /**
   * Viaje IN_PROGRESS de una sesión (evita viajes concurrentes). `null` si no hay.
   */
  findInProgressBySession(
    em: EntityManager,
    trackingSessionId: string,
    inProgressStatusConceptId: string,
  ): Promise<Trips | null> {
    return em.findOne(Trips, {
      trackingSessionId,
      statusConceptId: inProgressStatusConceptId,
    });
  }

  /** Nº de viajes de una sesión en un estado dado (guard de cierre de sesión). */
  countBySessionAndStatus(
    em: EntityManager,
    trackingSessionId: string,
    statusConceptId: string,
  ): Promise<number> {
    return em.count(Trips, { trackingSessionId, statusConceptId });
  }

  /** Crea el viaje en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateTripData): Trips {
    return em.create(
      Trips,
      {
        trackingSessionId: data.trackingSessionId,
        originAddressId: data.originAddressId,
        destinationAddressId: data.destinationAddressId,
        statusConceptId: data.statusConceptId,
        startedAt: data.startedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
