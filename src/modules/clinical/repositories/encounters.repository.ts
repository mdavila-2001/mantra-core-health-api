import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Appointments,
  Encounters,
  EncounterParticipants,
  EncounterLocations,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create encounter data.
 */
export interface CreateEncounterData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a episode.
   */
  episodeId?: string;
  /**
   * Identificador asociado a branch.
   */
  branchId?: string;
  /**
   * Identificador asociado a primary practitioner.
   */
  primaryPractitionerId?: string;
  /**
   * Identificador asociado a class concept.
   */
  classConceptId?: string;
  /**
   * Identificador asociado a type concept.
   */
  typeConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText?: string;
  /**
   * Identificador asociado a appointment.
   */
  appointmentId?: string;
  /**
   * Valor de start at mantenido por la instancia.
   */
  startAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create participant data.
 */
export interface CreateParticipantData {
  /**
   * Identificador asociado a encounter.
   */
  encounterId: string;
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Identificador asociado a participant role concept.
   */
  participantRoleConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de is responsible mantenido por la instancia.
   */
  isResponsible?: boolean;
  /**
   * Valor de period start mantenido por la instancia.
   */
  periodStart?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create location data.
 */
export interface CreateLocationData {
  /**
   * Identificador asociado a encounter.
   */
  encounterId: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId: string;
  /**
   * Identificador asociado a clinical unit.
   */
  clinicalUnitId?: string;
  /**
   * Identificador asociado a care space.
   */
  careSpaceId?: string;
  /**
   * Identificador asociado a location status concept.
   */
  locationStatusConceptId: string;
  /**
   * Valor de period start mantenido por la instancia.
   */
  periodStart?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de encuentros, participantes y ubicaciones (stateless). */
@Injectable()
export class EncountersRepository {
  /**
   * Encuentros del paciente, del más reciente al más antiguo.
   *
   * Es parte de la cara de lectura del módulo (UC-39-20): sin ella se podían
   * registrar datos clínicos pero no volver a leerlos, así que ninguna pantalla
   * podía mostrar el historial del paciente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente cuyo historial se lee.
   * @param limit - Tope de filas.
   * @returns Filas del paciente, ordenadas de la más reciente a la más antigua.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
    limit: number,
  ): Promise<Encounters[]> {
    return em.find(
      Encounters,
      { patientProfileId },
      { orderBy: { startAt: 'DESC' }, limit },
    );
  }

  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Encounters | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Encounters | null> {
    return em.findOne(Encounters, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Encounters`.
   */
  create(em: EntityManager, data: CreateEncounterData): Encounters {
    return em.create(
      Encounters,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        episodeId: data.episodeId,
        branchId: data.branchId,
        primaryPractitionerId: data.primaryPractitionerId,
        classConceptId: data.classConceptId,
        typeConceptId: data.typeConceptId,
        statusConceptId: data.statusConceptId,
        reasonText: data.reasonText,
        appointmentId: data.appointmentId,
        startAt: data.startAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create participant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create participant conforme al contrato `EncounterParticipants`.
   */
  createParticipant(
    em: EntityManager,
    data: CreateParticipantData,
  ): EncounterParticipants {
    return em.create(
      EncounterParticipants,
      {
        encounterId: data.encounterId,
        practitionerProfileId: data.practitionerProfileId,
        participantRoleConceptId: data.participantRoleConceptId,
        statusConceptId: data.statusConceptId,
        isResponsible: data.isResponsible,
        periodStart: data.periodStart,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create location.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create location conforme al contrato `EncounterLocations`.
   */
  createLocation(
    em: EntityManager,
    data: CreateLocationData,
  ): EncounterLocations {
    return em.create(
      EncounterLocations,
      {
        encounterId: data.encounterId,
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        careSpaceId: data.careSpaceId,
        locationStatusConceptId: data.locationStatusConceptId,
        periodStart: data.periodStart,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Bloquea la cita clínica para serializar los check-in concurrentes que la
   * referencian (D-3 de la subtarea 4.2). Molde:
   * `scheduling-bookings.repository.ts:195-204`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param appointmentId - Identificador de la cita a bloquear.
   * @returns La cita bloqueada, o `null` si no existe.
   */
  findAppointmentForUpdate(
    em: EntityManager,
    appointmentId: string,
  ): Promise<Appointments | null> {
    return em.findOne(
      Appointments,
      { id: appointmentId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Encuentros asociados a una cita clínica, del más reciente al más antiguo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param appointmentId - Identificador de la cita.
   * @returns Filas de la cita, ordenadas de la más reciente a la más antigua.
   */
  findByAppointmentId(
    em: EntityManager,
    appointmentId: string,
  ): Promise<Encounters[]> {
    return em.find(
      Encounters,
      { appointmentId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * El encuentro más reciente de cada cita, indexado por `appointmentId`.
   *
   * En lote y no uno por uno: la agenda proyecta hasta cien reservas por
   * página, y pedir el encuentro de cada una convertiría un listado en cien
   * consultas más. Es el mismo criterio que `AppointmentsRepository.findTypesByIds`.
   *
   * Si una cita tiene más de un encuentro, gana el más reciente por
   * `createdAt` — la misma regla que ya usa el check-in para resolver «el
   * encuentro de esta cita» (ver `findByAppointmentId`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param appointmentIds - Citas cuyo encuentro más reciente se necesita.
   * @returns Mapa `appointmentId` → `encounters.id`.
   */
  async findLatestIdsByAppointmentIds(
    em: EntityManager,
    appointmentIds: readonly string[],
  ): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    if (appointmentIds.length === 0) return mapa;
    const encuentros = await em.find(
      Encounters,
      { appointmentId: { $in: [...appointmentIds] } },
      { orderBy: { createdAt: 'DESC' } },
    );
    for (const encuentro of encuentros) {
      if (encuentro.appointmentId == null) continue;
      if (!mapa.has(encuentro.appointmentId)) {
        mapa.set(encuentro.appointmentId, encuentro.id);
      }
    }
    return mapa;
  }

  /**
   * **Todos** los encuentros de cada cita, indexados por `appointmentId`.
   *
   * Hermano de {@link findLatestIdsByAppointmentIds}, pero sin quedarse con el
   * último: la solicitud de seguro cuelga del encuentro, y si una cita tuvo dos
   * (un check-in repetido, una atención partida), la solicitud puede estar en
   * cualquiera. Mirar sólo el último la escondería. En lote, por lo mismo que
   * el hermano.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param appointmentIds - Citas cuyos encuentros se necesitan.
   * @returns Mapa `appointmentId` → ids de `encounters`, del más nuevo al más viejo.
   */
  async findIdsByAppointmentIds(
    em: EntityManager,
    appointmentIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    const mapa = new Map<string, string[]>();
    if (appointmentIds.length === 0) return mapa;
    const encuentros = await em.find(
      Encounters,
      { appointmentId: { $in: [...appointmentIds] } },
      { orderBy: { createdAt: 'DESC' } },
    );
    for (const encuentro of encuentros) {
      if (encuentro.appointmentId == null) continue;
      const ids = mapa.get(encuentro.appointmentId) ?? [];
      ids.push(encuentro.id);
      mapa.set(encuentro.appointmentId, ids);
    }
    return mapa;
  }

  /**
   * Obtiene find active participants.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param encounterId - Identificador de encounter.
   * @param activeStatusConceptId - Identificador de active status concept.
   * @returns Resultado de find active participants conforme al contrato `Promise<EncounterParticipants[]>`.
   */
  findActiveParticipants(
    em: EntityManager,
    encounterId: string,
    activeStatusConceptId: string,
  ): Promise<EncounterParticipants[]> {
    return em.find(EncounterParticipants, {
      encounterId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /**
   * Obtiene find active locations.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param encounterId - Identificador de encounter.
   * @param activeStatusConceptId - Identificador de active status concept.
   * @returns Resultado de find active locations conforme al contrato `Promise<EncounterLocations[]>`.
   */
  findActiveLocations(
    em: EntityManager,
    encounterId: string,
    activeStatusConceptId: string,
  ): Promise<EncounterLocations[]> {
    return em.find(EncounterLocations, {
      encounterId,
      locationStatusConceptId: activeStatusConceptId,
    });
  }
}
