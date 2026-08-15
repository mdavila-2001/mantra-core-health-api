import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import {
  HealthPractitionerProfiles,
  PersonAccountLinks,
  PersonProfiles,
} from '../../profiles/entities';
import {
  BookableSlots,
  CalendarAbsences,
  SchedulableResources,
} from '../../scheduling/entities';
import { ProcedureCases } from '../../procedures_perioperative/entities';

/** Motivo por el que un tramo de la agenda del doctor no admite una visita. */
export interface CalendarConflict {
  /** Qué ocupa el tramo: `consulta`, `intervención` o `bloqueo`. */
  kind: 'consultation' | 'procedure' | 'absence';
  /** Inicio del tramo ocupado. */
  startAt: Date;
  /** Fin del tramo ocupado. */
  endAt: Date;
}

/**
 * Lectura de la agenda clínica del doctor para impedir que una visita médica se
 * superponga con consultas, intervenciones o bloqueos (spec 5408-5412).
 *
 * Vive en este módulo y no en `scheduling` porque es una **consulta**, no una
 * regla de agenda de pacientes: `scheduling` no debe aprender qué es una visita
 * de laboratorio, y este carril no debe reescribir la agenda clínica. Lee las
 * tablas de los módulos que ya son dueños de ese dato y no escribe ninguna.
 */
@Injectable()
export class DoctorCalendarRepository {
  /**
   * Resuelve el perfil profesional de una cuenta.
   *
   * La cadena `usuario → persona → perfil → perfil profesional` es la que el
   * modelo del sistema declara; no hay atajo de `iam.users` a
   * `health_practitioner_profiles`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorUserId - Cuenta del doctor.
   * @returns El identificador del perfil profesional, o `null` si la cuenta no
   *   tiene uno (por ejemplo, una cuenta administrativa).
   */
  async findPractitionerProfileId(
    em: EntityManager,
    doctorUserId: string,
  ): Promise<string | null> {
    const link = await em.findOne(PersonAccountLinks, {
      userId: doctorUserId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    if (!link) return null;
    const profiles = await em.find(PersonProfiles, { personId: link.personId });
    if (profiles.length === 0) return null;
    const practitioner = await em.findOne(HealthPractitionerProfiles, {
      profileId: { $in: profiles.map((profile) => profile.id) },
    });
    return practitioner?.profileId ?? null;
  }

  /**
   * Lista los tramos de la agenda clínica del doctor que chocan con un intervalo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param doctorUserId - Cuenta del doctor.
   * @param startAt - Inicio del intervalo propuesto.
   * @param endAt - Fin del intervalo propuesto.
   * @returns Los conflictos encontrados; vacío si el tramo está libre.
   */
  async findConflicts(
    em: EntityManager,
    doctorUserId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<CalendarConflict[]> {
    const conflicts: CalendarConflict[] = [];

    // Bloqueos de calendario del propio doctor (vacaciones, ausencias…).
    const absences = await em.find(CalendarAbsences, {
      userId: doctorUserId,
      blocksScheduling: true,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });
    for (const absence of absences) {
      conflicts.push({
        kind: 'absence',
        startAt: absence.startAt,
        endAt: absence.endAt,
      });
    }

    const profileId = await this.findPractitionerProfileId(em, doctorUserId);
    if (!profileId) return conflicts;

    // Consultas de pacientes: los cupos del recurso «este profesional» que ya
    // tienen capacidad tomada.
    const resources = await em.find(SchedulableResources, {
      resourceRefType: 'health_practitioner_profiles',
      resourceRefId: profileId,
    });
    if (resources.length > 0) {
      const slots = await em.find(BookableSlots, {
        resourceId: { $in: resources.map((resource) => resource.id) },
        startAt: { $lt: endAt },
        endAt: { $gt: startAt },
      });
      for (const slot of slots) {
        conflicts.push({
          kind: 'consultation',
          startAt: slot.startAt,
          endAt: slot.endAt,
        });
      }
    }

    // Intervenciones quirúrgicas programadas con este profesional como cirujano.
    const cases = await em.find(ProcedureCases, {
      primarySurgeonProfileId: profileId,
      scheduledStartAt: { $ne: null, $lt: endAt },
      scheduledEndAt: { $ne: null, $gt: startAt },
    });
    for (const procedureCase of cases) {
      if (!procedureCase.scheduledStartAt || !procedureCase.scheduledEndAt) {
        continue;
      }
      conflicts.push({
        kind: 'procedure',
        startAt: procedureCase.scheduledStartAt,
        endAt: procedureCase.scheduledEndAt,
      });
    }

    return conflicts;
  }
}
