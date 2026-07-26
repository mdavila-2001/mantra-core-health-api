import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { RelatedPersons } from '../entities';
import { createdBy } from '../../../common';
import { PROF } from '../profiles.concepts';

/** Datos de una persona relacionada / contacto de emergencia. */
export interface CreateRelatedPersonData {
  patientProfileId: string;
  personId: string;
  relationshipConceptId: string;
  isEmergencyContact: boolean;
  isLegalGuardian: boolean;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.related_persons`. */
@Injectable()
export class RelatedPersonsRepository {
  findById(em: EntityManager, id: string): Promise<RelatedPersons | null> {
    return em.findOne(RelatedPersons, { id });
  }

  create(em: EntityManager, data: CreateRelatedPersonData): RelatedPersons {
    return em.create(
      RelatedPersons,
      {
        patientProfileId: data.patientProfileId,
        personId: data.personId,
        relationshipConceptId: data.relationshipConceptId,
        isEmergencyContact: data.isEmergencyContact,
        isLegalGuardian: data.isLegalGuardian,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Tutor legal activo del paciente (regla: un solo tutor legal activo). */
  findActiveGuardian(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<RelatedPersons | null> {
    return em.findOne(RelatedPersons, {
      patientProfileId,
      isLegalGuardian: true,
      statusConceptId: PROF.RELATED_ACTIVE,
    });
  }

  /** Reasigna los contactos de un paciente al sobreviviente durante una fusión. */
  reassignPatientProfile(
    em: EntityManager,
    fromPatientProfileId: string,
    toPatientProfileId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      RelatedPersons,
      { patientProfileId: fromPatientProfileId },
      { patientProfileId: toPatientProfileId, updatedAt: now },
    );
  }
}
