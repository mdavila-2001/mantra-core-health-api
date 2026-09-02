import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS } from '../../../common';
import type { ContactPointsRepository } from '../../common/repositories';
import type {
  PersonsRepository,
  RelatedPersonsRepository,
} from '../repositories';
import { PROF } from '../profiles.concepts';

/** Lo que hace falta para registrar al tutor declarado en el alta. */
export interface GuardianData {
  /** Perfil del paciente que declara al tutor. */
  readonly patientProfileId: string;
  /** Nombre del tutor, tal como lo escribió el paciente. */
  readonly name?: string;
  /** Teléfono del tutor; opcional incluso habiendo nombre. */
  readonly phone?: string;
  /** Quién escribe las filas, para la auditoría. */
  readonly actorUserId: string;
}

/**
 * Registra al tutor o persona autorizada que el paciente declara al registrarse.
 *
 * ## Por qué una persona y no un usuario
 *
 * `authz.patient_legal_representations` exige un `representative_user_id`, o
 * sea una cuenta de la plataforma. El tutor que acompaña a un menor casi nunca
 * la tiene todavía, así que exigirla dejaría el dato afuera. `related_persons`
 * sí admite a alguien que solo existe como persona.
 *
 * ## Por qué `isLegalGuardian` queda en `false`
 *
 * Porque nadie verificó la tutela. Marcarla en el alta sería afirmar un vínculo
 * legal a partir de un campo de texto que cualquiera completa. Queda como
 * contacto de emergencia —que es lo que el dato realmente es hoy— y la tutela
 * la declara después quien pueda respaldarla.
 *
 * ## Por qué el teléfono cuelga de `OWNER_PERSON`
 *
 * `common.contact_points` identifica a su dueño con un par
 * (`owner_type`, `owner_id`) sin FK. Colgar el teléfono del tutor de
 * `OWNER_PATIENT` —como hace el del titular— haría que toda consulta que
 * asuma «OWNER_PATIENT ⇒ alguien con perfil de paciente» devuelva a una persona
 * que no lo es.
 *
 * @param repos - Repositorios de personas, personas relacionadas y contactos.
 * @param tx - Contexto transaccional del alta.
 * @param data - Perfil del paciente, nombre y teléfono del tutor, y actor.
 * @returns `true` si registró al tutor.
 * @throws BadRequestException si llega un teléfono sin nombre: sería un contacto
 *   sin dueño, imposible de mostrar y de corregir.
 */
export async function createGuardianRelatedPerson(
  repos: {
    readonly persons: PersonsRepository;
    readonly relatedPersons: RelatedPersonsRepository;
    readonly contactPoints: ContactPointsRepository;
  },
  tx: EntityManager,
  data: GuardianData,
): Promise<boolean> {
  if (!data.name) {
    if (data.phone) {
      throw new BadRequestException(
        'Para guardar el teléfono del tutor hace falta también su nombre',
      );
    }
    return false;
  }

  const guardian = repos.persons.create(tx, {
    displayName: data.name,
    personStatusConceptId: PROF.PERSON_ACTIVE,
    vitalStatusConceptId: PROF.VITAL_ALIVE,
    actorUserId: data.actorUserId,
  });
  // La persona relacionada apunta al tutor por FK, así que su fila tiene que
  // existir en la base antes de nombrarla.
  await tx.flush();

  repos.relatedPersons.create(tx, {
    patientProfileId: data.patientProfileId,
    personId: guardian.id,
    relationshipConceptId: PROF.RELATIONSHIP_GUARDIAN,
    isEmergencyContact: true,
    isLegalGuardian: false,
    statusConceptId: PROF.RELATED_ACTIVE,
    actorUserId: data.actorUserId,
  });

  if (data.phone) {
    repos.contactPoints.create(tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
      ownerId: guardian.id,
      systemConceptId: CONCEPTS.CONTACT_PHONE,
      value: data.phone,
      useConceptId: CONCEPTS.CONTACT_USE_HOME,
      actorUserId: data.actorUserId,
    });
  }

  return true;
}
