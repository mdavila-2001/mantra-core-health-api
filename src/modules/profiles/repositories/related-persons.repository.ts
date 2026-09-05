import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { RelatedPersons } from '../entities';
import { createdBy } from '../../../common';
import { PROF } from '../profiles.concepts';

/** Datos de una persona relacionada / contacto de emergencia. */
export interface CreateRelatedPersonData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a person.
   */
  personId: string;
  /**
   * Identificador asociado a relationship concept.
   */
  relationshipConceptId: string;
  /**
   * Valor de is emergency contact mantenido por la instancia.
   */
  isEmergencyContact: boolean;
  /**
   * Valor de is legal guardian mantenido por la instancia.
   */
  isLegalGuardian: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.related_persons`. */
@Injectable()
export class RelatedPersonsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<RelatedPersons | null>`.
   */
  findById(em: EntityManager, id: string): Promise<RelatedPersons | null> {
    return em.findOne(RelatedPersons, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `RelatedPersons`.
   */
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

  /**
   * Contactos activos del paciente, para la ficha de filiación.
   *
   * Filtra por estado activo a propósito: los dados de baja se conservan por
   * trazabilidad, pero pintarlos en la ficha como si siguieran vigentes es lo
   * que hace que alguien llame al contacto de emergencia equivocado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Perfil de paciente cuyos contactos se listan.
   * @returns Contactos activos, primero los de emergencia.
   */
  findActiveByPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<RelatedPersons[]> {
    return em.find(
      RelatedPersons,
      { patientProfileId, statusConceptId: PROF.RELATED_ACTIVE },
      { orderBy: { isEmergencyContact: 'DESC', createdAt: 'ASC' } },
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

  /**
   * El tutor o persona autorizada que el paciente declaró (alta o PATCH propio).
   *
   * **No es lo mismo que {@link findActiveGuardian}.** Esa consulta filtra por
   * `isLegalGuardian: true`, y `createGuardianRelatedPerson` —el único código
   * que produce estas filas hoy— siempre las crea con `isLegalGuardian: false`
   * a propósito (nadie verificó la tutela). Filtrar por ese campo nunca
   * encontraría lo que el alta acaba de escribir. El marcador real de «es el
   * tutor declarado por autoservicio» es `isEmergencyContact: true` combinado
   * con `isLegalGuardian: false`, que es exactamente lo que esa función fija.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Perfil de paciente cuyo tutor se busca.
   * @returns El tutor declarado, o `null` si no declaró ninguno.
   */
  findActiveDeclaredGuardian(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<RelatedPersons | null> {
    return em.findOne(
      RelatedPersons,
      {
        patientProfileId,
        isEmergencyContact: true,
        isLegalGuardian: false,
        statusConceptId: PROF.RELATED_ACTIVE,
      },
      { orderBy: { createdAt: 'DESC' } },
    );
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
