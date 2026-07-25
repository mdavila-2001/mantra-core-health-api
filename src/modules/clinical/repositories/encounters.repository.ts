import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Encounters,
  EncounterParticipants,
  EncounterLocations,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateEncounterData {
  patientProfileId: string;
  tenantId: string;
  episodeId?: string;
  branchId?: string;
  primaryPractitionerId?: string;
  classConceptId?: string;
  typeConceptId?: string;
  statusConceptId: string;
  reasonText?: string;
  appointmentId?: string;
  startAt?: Date;
  actorUserId?: string;
}

export interface CreateParticipantData {
  encounterId: string;
  practitionerProfileId: string;
  participantRoleConceptId: string;
  statusConceptId: string;
  isResponsible?: boolean;
  periodStart?: Date;
  actorUserId?: string;
}

export interface CreateLocationData {
  encounterId: string;
  practiceSiteId: string;
  clinicalUnitId?: string;
  careSpaceId?: string;
  locationStatusConceptId: string;
  periodStart?: Date;
  actorUserId?: string;
}

/** Acceso a datos de encuentros, participantes y ubicaciones (stateless). */
@Injectable()
export class EncountersRepository {
  findById(em: EntityManager, id: string): Promise<Encounters | null> {
    return em.findOne(Encounters, { id });
  }

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

  createParticipant(em: EntityManager, data: CreateParticipantData): EncounterParticipants {
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

  createLocation(em: EntityManager, data: CreateLocationData): EncounterLocations {
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
