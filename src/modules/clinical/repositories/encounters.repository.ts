import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
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
