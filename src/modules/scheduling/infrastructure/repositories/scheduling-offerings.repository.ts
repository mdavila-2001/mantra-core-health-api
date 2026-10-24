import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceCatalog } from '../../../billing/entities';
import { createdBy } from '../../../../common';
import {
  BookableSlots,
  PractitionerServiceOfferings,
  SchedulableResources,
} from '../../entities';

/** Datos para crear una oferta de servicio. */
export interface CreateOfferingData {
  practitionerProfileId: string;
  serviceCatalogId: string;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  prepMinutes?: number;
  cleanupMinutes?: number;
  isPatientBookable: boolean;
  requiresApproval: boolean;
  channelConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Una retención viva sobre el tiempo de un profesional. */
export interface LiveHold {
  holdId: string;
  startAt: Date;
  endAt: Date;
}

/** Un turno de servicio vivo, con los colchones de su oferta. */
export interface LiveServiceSpan {
  slotId: string;
  startAt: Date;
  endAt: Date;
  prepMinutes: number;
  cleanupMinutes: number;
}

/**
 * Acceso a datos de las ofertas de servicio y de lo que el motor de disponibilidad
 * necesita leer alrededor de ellas.
 */
@Injectable()
export class SchedulingOfferingsRepository {
  /** Una oferta por su id, o `null`. */
  findOfferingById(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerServiceOfferings | null> {
    return em.findOne(PractitionerServiceOfferings, { id });
  }

  /** La oferta que ya existe de ese profesional para ese servicio, si la hay. */
  findOfferingOf(
    em: EntityManager,
    practitionerProfileId: string,
    serviceCatalogId: string,
  ): Promise<PractitionerServiceOfferings | null> {
    return em.findOne(PractitionerServiceOfferings, {
      practitionerProfileId,
      serviceCatalogId,
    });
  }

  /** Las ofertas de un profesional, las más recientes primero. */
  listOfferings(
    em: EntityManager,
    practitionerProfileId: string,
    filter: { statusConceptId?: string; onlyBookable?: boolean } = {},
  ): Promise<PractitionerServiceOfferings[]> {
    return em.find(
      PractitionerServiceOfferings,
      {
        practitionerProfileId,
        ...(filter.statusConceptId === undefined
          ? {}
          : { statusConceptId: filter.statusConceptId }),
        ...(filter.onlyBookable === true ? { isPatientBookable: true } : {}),
      },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  createOffering(
    em: EntityManager,
    data: CreateOfferingData,
  ): PractitionerServiceOfferings {
    return em.create(
      PractitionerServiceOfferings,
      {
        practitionerProfileId: data.practitionerProfileId,
        serviceCatalogId: data.serviceCatalogId,
        minDurationMinutes: data.minDurationMinutes,
        maxDurationMinutes: data.maxDurationMinutes,
        prepMinutes: data.prepMinutes,
        cleanupMinutes: data.cleanupMinutes,
        isPatientBookable: data.isPatientBookable,
        requiresApproval: data.requiresApproval,
        channelConceptId: data.channelConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Los servicios del catálogo con esos ids (nombre, precio y práctica). */
  findCatalogItems(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<ServiceCatalog[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(ServiceCatalog, { id: { $in: [...ids] } });
  }

  /** Un servicio del catálogo, o `null`. */
  findCatalogItem(
    em: EntityManager,
    id: string,
  ): Promise<ServiceCatalog | null> {
    return em.findOne(ServiceCatalog, { id });
  }

  /** Los recursos (sedes) agendables de un profesional. */
  findResourcesOfProfessional(
    em: EntityManager,
    resourceRefId: string,
  ): Promise<SchedulableResources[]> {
    return em.find(SchedulableResources, { resourceRefId });
  }

  /**
   * Las retenciones vivas del profesional que pisan un rango, cruzando sus sedes.
   *
   * **Es lo que hoy no cuenta la regla madre.** `compromisos()` mira reservas ya
   * confirmadas y tiempo ocupado, pero una retención todavía no es nada de eso: con
   * turnos de largo variable, dos pacientes podrían retener rangos que se pisan y
   * enterarse recién al confirmar. Sólo cuentan las que no vencieron.
   *
   * @param exceptHoldId - Retención que no se compara consigo misma.
   */
  async findLiveHoldsOfProfessional(
    em: EntityManager,
    practitionerProfileId: string,
    from: Date,
    to: Date,
    activeStatusConceptId: string,
    now: Date,
    exceptHoldId?: string,
  ): Promise<LiveHold[]> {
    const rows: {
      holdId: string;
      startAt: Date | string;
      endAt: Date | string;
    }[] = await em.getConnection().execute(
      `SELECT h.id AS "holdId", s.start_at AS "startAt", s.end_at AS "endAt"
         FROM scheduling.slot_holds h
         JOIN scheduling.bookable_slots s ON s.id = h.bookable_slot_id
         JOIN scheduling.schedulable_resources r ON r.id = s.resource_id
        WHERE r.resource_ref_id = ?
          AND r.resource_ref_type IN ('practitioner_profiles', 'health_practitioner_profiles')
          AND h.status_concept_id = ?
          AND h.expires_at > ?
          AND s.start_at < ?
          AND s.end_at   > ?
          AND (? IS NULL OR h.id <> ?)`,
      [
        practitionerProfileId,
        activeStatusConceptId,
        now,
        to,
        from,
        exceptHoldId ?? null,
        exceptHoldId ?? null,
      ],
    );
    // El driver devuelve los `timestamptz` del SQL crudo como texto.
    return rows.map((row) => ({
      holdId: row.holdId,
      startAt: new Date(row.startAt),
      endAt: new Date(row.endAt),
    }));
  }

  /**
   * Los cupos de consulta retraídos del profesional que pisan un rango.
   *
   * Se materializan como entidades porque quien llama los MUTA para reabrirlos.
   */
  async findRetractedSlotsOfProfessional(
    em: EntityManager,
    resourceRefId: string,
    from: Date,
    to: Date,
    retractedStatusConceptId: string,
  ): Promise<BookableSlots[]> {
    const resources = await em.find(SchedulableResources, { resourceRefId });
    if (resources.length === 0) return [];
    return em.find(BookableSlots, {
      resourceId: { $in: resources.map((resource) => resource.id) },
      statusConceptId: retractedStatusConceptId,
      startAt: { $lt: to },
      endAt: { $gt: from },
    });
  }

  /**
   * Los turnos de servicio vivos del profesional que se acercan a un rango, con los
   * colchones de su oferta.
   *
   * «Vivo» es: reservado (`booked`, que cubre pendiente, confirmado y en curso) o
   * retenido **con una retención que todavía no venció**. Un cupo `held` cuya
   * retención ya venció sigue marcado así hasta que el worker lo recicla; contarlo
   * dejaría el horario tomado de más.
   *
   * Los colchones viajan porque el tiempo ocupado de un turno es
   * `[inicio − preparación, fin + limpieza]`: sin ellos, un segundo servicio podría
   * arrancar pegado al fin del primero, pisando su limpieza.
   */
  async findLiveServiceSlotsOfProfessional(
    em: EntityManager,
    practitionerProfileId: string,
    from: Date,
    to: Date,
    ids: {
      bookedStatusConceptId: string;
      heldStatusConceptId: string;
      activeHoldStatusConceptId: string;
    },
    now: Date,
  ): Promise<LiveServiceSpan[]> {
    const rows: {
      slotId: string;
      startAt: Date | string;
      endAt: Date | string;
      prepMinutes: number | string | null;
      cleanupMinutes: number | string | null;
    }[] = await em.getConnection().execute(
      `SELECT s.id AS "slotId",
              s.start_at AS "startAt",
              s.end_at   AS "endAt",
              o.prep_minutes    AS "prepMinutes",
              o.cleanup_minutes AS "cleanupMinutes"
         FROM scheduling.bookable_slots s
         JOIN scheduling.schedulable_resources r ON r.id = s.resource_id
         JOIN scheduling.practitioner_service_offerings o
           ON o.id = s.practitioner_service_offering_id
        WHERE r.resource_ref_id = ?
          AND r.resource_ref_type IN ('practitioner_profiles', 'health_practitioner_profiles')
          AND s.start_at < ?
          AND s.end_at   > ?
          AND (
                s.status_concept_id = ?
             OR (s.status_concept_id = ?
                 AND EXISTS (SELECT 1
                               FROM scheduling.slot_holds h
                              WHERE h.bookable_slot_id = s.id
                                AND h.status_concept_id = ?
                                AND h.expires_at > ?))
              )`,
      [
        practitionerProfileId,
        to,
        from,
        ids.bookedStatusConceptId,
        ids.heldStatusConceptId,
        ids.activeHoldStatusConceptId,
        now,
      ],
    );
    return rows.map((row) => ({
      slotId: row.slotId,
      startAt: new Date(row.startAt),
      endAt: new Date(row.endAt),
      prepMinutes: Number(row.prepMinutes ?? 0),
      cleanupMinutes: Number(row.cleanupMinutes ?? 0),
    }));
  }
}
