import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { createdBy, touch } from '../../../../common';
import {
  PatientPrimaryPractitioners,
  PatientProfiles,
  Persons,
} from '../../entities';
import { composePersonDisplayName } from '../../domain/person-name';
import { findPractitionerNames } from '../read-models/practitioner-names';

/** Un paciente que eligió al profesional como médico de cabecera. */
export interface PrimaryPatientRow {
  readonly patientProfileId: string;
  /** Vacío si la persona no tiene ninguna pieza de nombre cargada. */
  readonly displayName?: string;
  readonly patientCode?: string;
  readonly since: Date;
}

/**
 * Acceso a datos de `profiles.patient_primary_practitioners` (v4.2.65).
 *
 * «Vigente» es `valid_to` nulo. Que haya a lo sumo una vigente por paciente lo
 * garantiza `uq_patient_primary_practitioners_current` en la base, no este
 * repositorio.
 */
@Injectable()
export class PatientPrimaryPractitionersRepository {
  /** La elección vigente del paciente, o `null` si no eligió a nadie. */
  findCurrentByPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PatientPrimaryPractitioners | null> {
    return em.findOne(PatientPrimaryPractitioners, {
      patientProfileId,
      validTo: null,
    });
  }

  /** Abre una elección nueva, vigente desde `now`. */
  open(
    em: EntityManager,
    data: {
      patientProfileId: string;
      practitionerProfileId: string;
      actorUserId: string;
    },
    now: Date,
  ): PatientPrimaryPractitioners {
    return em.create(PatientPrimaryPractitioners, {
      patientProfileId: data.patientProfileId,
      practitionerProfileId: data.practitionerProfileId,
      validFrom: now,
      ...createdBy(data.actorUserId, now),
    } as PatientPrimaryPractitioners);
  }

  /** Cierra la elección: deja de ser vigente pero no se borra. */
  close(
    row: PatientPrimaryPractitioners,
    now: Date,
    actorUserId: string,
  ): void {
    row.validTo = now;
    touch(row, actorUserId, now);
  }

  /** El nombre visible del profesional, o `undefined` si no tiene ninguno. */
  async findPractitionerName(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<string | undefined> {
    const names = await findPractitionerNames(em, [practitionerProfileId]);
    return names.get(practitionerProfileId);
  }

  /**
   * Los pacientes vigentes de un profesional, los que lo eligieron más
   * recientemente primero, con su nombre y su código de paciente.
   *
   * @returns La página pedida y el total de vigentes, para paginar.
   */
  async listCurrentPatients(
    em: EntityManager,
    practitionerProfileId: string,
    page: { limit: number; offset: number },
  ): Promise<{ rows: PrimaryPatientRow[]; total: number }> {
    const [elecciones, total] = await em.findAndCount(
      PatientPrimaryPractitioners,
      { practitionerProfileId, validTo: null },
      {
        orderBy: { validFrom: 'desc', id: 'asc' },
        limit: page.limit,
        offset: page.offset,
      },
    );
    if (elecciones.length === 0) return { rows: [], total };

    const ids = elecciones.map((e) => e.patientProfileId);
    // `patient_profiles.profile_id` es el id de la persona: el nombre está en
    // `persons` y el código en el perfil de paciente.
    const [personas, perfiles] = await Promise.all([
      em.find(Persons, { id: { $in: ids } }),
      em.find(
        PatientProfiles,
        { profileId: { $in: ids } },
        { fields: ['profileId', 'patientCode'] },
      ),
    ]);
    const nombre = new Map(personas.map((p) => [p.id, nameOf(p)]));
    const codigo = new Map(perfiles.map((p) => [p.profileId, p.patientCode]));

    return {
      rows: elecciones.map((e) => ({
        patientProfileId: e.patientProfileId,
        displayName: nombre.get(e.patientProfileId),
        patientCode: codigo.get(e.patientProfileId),
        since: e.validFrom,
      })),
      total,
    };
  }
}

/** El nombre declarado para mostrar, o el compuesto a partir de sus piezas. */
function nameOf(persona: Persons): string | undefined {
  if (persona.displayName !== undefined && persona.displayName !== '') {
    return persona.displayName;
  }
  return composePersonDisplayName(persona);
}
