import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { Encounters } from '../../clinical/entities';
import { Consents } from '../../consent/entities';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import { PROF } from '../../profiles/profiles.concepts';
import { PatientProfiles, PersonAccountLinks } from '../../profiles/entities';
import { AppointmentBookings } from '../../scheduling/entities';

/** Tenant y paciente de un recurso clínico que respalda un acceso. */
export interface ClinicalResourceScope {
  /** Tenant custodio del recurso (`undefined` si no lo declara). */
  tenantId?: string;
  /** Paciente al que pertenece el recurso. */
  patientProfileId: string;
}

/**
 * Lecturas de alcance que `authz` necesita de otros módulos para probar que un
 * paciente, un encuentro y un consentimiento pertenecen al tenant activo antes de
 * crear un acceso clínico, una relación asistencial o una representación legal.
 * Sólo lee; cada método consulta la tabla propietaria y no infiere nada.
 */
@Injectable()
export class AuthzClinicalScopeRepository {
  /**
   * ¿Existe el perfil de paciente?
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador del perfil.
   * @returns `true` si existe.
   */
  async patientExists(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<boolean> {
    return (
      (await em.count(PatientProfiles, { profileId: patientProfileId })) > 0
    );
  }

  /**
   * ¿Hay evidencia de que el paciente pertenece al tenant?
   *
   * El modelo no guarda el tenant del paciente: el padrón de personas es único
   * para toda la plataforma. La pertenencia se prueba sólo con huellas que **el
   * propio paciente** deja y que un actor del tenant no puede fabricar por sí
   * solo, ambas a través de la cuenta vinculada al paciente:
   *
   * 1. una reserva del tenant hecha por esa cuenta (`booked_by_user_id`), sea cual
   *    sea su estado: reservar, aunque luego se cancele, es un acto del paciente;
   * 2. la membresía activa de esa cuenta en el tenant que no la incorporó un
   *    tercero: la crea el autorregistro del propio paciente (`invited_by_user_id`
   *    nulo) o la cuenta misma. Una membresía que un administrador del tenant dio
   *    de alta con `POST /directory/tenants/:id/memberships` lleva su id en
   *    `invited_by_user_id` y no cuenta.
   *
   * **No cuentan** los encuentros, turnos, reservas hechas por el personal ni los
   * episodios de atención, aunque sean del tenant y del paciente: los crea el
   * personal para cualquier paciente existente, sin autorización previa
   * (`POST /clinical/encounters/check-in`, `POST /clinical/care-episodes`,
   * `POST /scheduling/appointments/direct`, confirmación de retenciones del
   * mostrador), y en cualquier estado —incluido «confirmada» o «atendida»—.
   * Aceptarlos dejaría que un tenant ajeno se fabricara el vínculo y luego
   * concediera accesos sobre una historia que no es suya.
   *
   * Tampoco cuentan las relaciones asistenciales, los accesos clínicos ni las
   * representaciones legales: son justo lo que esta comprobación protege, y
   * aceptarlas dejaría que una fila indebida se justificara a sí misma.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Perfil de paciente.
   * @param tenantId - Tenant activo.
   * @returns `true` si hay al menos una huella del propio paciente en el tenant.
   */
  async patientHasFootprintInTenant(
    em: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<boolean> {
    // «Admisión crea el vínculo» (decisión del usuario 2026-10-31): un ingreso
    // hospitalario auditado deja huella aunque el paciente no tenga cuenta. Sólo
    // la escribe POST /clinical/admissions con permiso de ingreso de nivel sede
    // (tabla append-only clinical.patient_admission_footprints).
    if (await this.hasAdmissionFootprint(em, patientProfileId, tenantId))
      return true;

    // `patient_profiles.profile_id` es el id de la persona: de ahí a su cuenta.
    // Sin cuenta el paciente no ha hecho nada por sí mismo: no hay huella propia.
    const link = await em.findOne(PersonAccountLinks, {
      personId: patientProfileId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    if (!link) return false;

    const bookedBySelf = await em.count(AppointmentBookings, {
      patientProfileId,
      tenantId,
      bookedByUserId: link.userId,
    });
    if (bookedBySelf > 0) return true;

    return (
      (await em.count(TenantMemberships, {
        userId: link.userId,
        tenantId,
        statusConceptId: {
          $in: [DIR.MEMBERSHIP_ACTIVE, CONCEPTS.MEMBERSHIP_ACTIVE],
        },
        $or: [{ invitedByUserId: null }, { invitedByUserId: link.userId }],
      })) > 0
    );
  }

  /** ¿Hay huella de ingreso (Admisión crea el vínculo) del paciente en el tenant? */
  async hasAdmissionFootprint(
    em: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<boolean> {
    const rows = await em.execute<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM clinical.patient_admission_footprints
        WHERE patient_profile_id = ? AND tenant_id = ?`,
      [patientProfileId, tenantId],
      'all',
    );
    return Number(rows[0]?.n ?? 0) > 0;
  }

  /**
   * ¿El paciente tiene huella propia en ALGÚN tenant distinto de `tenantId`?
   * Lo usa el ingreso sin huella previa: un paciente de otra organización no
   * se «adopta» internándolo (404). Recorre tenants ajenos, así que el
   * llamador lo corre en contexto de sistema y sólo recibe el booleano.
   *
   * @param em - Contexto (con `app.system_context` en su transacción).
   * @param patientProfileId - Paciente.
   * @param tenantId - Tenant activo (se excluye).
   */
  async hasFootprintElsewhere(
    em: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<boolean> {
    const rows = await em.execute<{ n: number }[]>(
      `SELECT (
         (SELECT count(*) FROM clinical.patient_admission_footprints
           WHERE patient_profile_id = ? AND tenant_id <> ?)
       + (SELECT count(*) FROM profiles.person_account_links l
            JOIN scheduling.appointment_bookings b
              ON b.booked_by_user_id = l.user_id AND b.patient_profile_id = l.person_id
           WHERE l.person_id = ? AND l.status_concept_id = ? AND b.tenant_id <> ?)
       + (SELECT count(*) FROM profiles.person_account_links l
            JOIN directory.tenant_memberships m ON m.user_id = l.user_id
           WHERE l.person_id = ? AND l.status_concept_id = ? AND m.tenant_id <> ?
             AND m.status_concept_id = ANY(?::uuid[])
             AND (m.invited_by_user_id IS NULL OR m.invited_by_user_id = l.user_id))
       )::int AS n`,
      [
        patientProfileId,
        tenantId,
        patientProfileId,
        PROF.ACCOUNT_LINK_ACTIVE,
        tenantId,
        patientProfileId,
        PROF.ACCOUNT_LINK_ACTIVE,
        tenantId,
        `{${DIR.MEMBERSHIP_ACTIVE},${CONCEPTS.MEMBERSHIP_ACTIVE}}`,
      ],
      'all',
    );
    return Number(rows[0]?.n ?? 0) > 0;
  }

  /**
   * Tenant y paciente de un encuentro.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param encounterId - Identificador del encuentro.
   * @returns El alcance del encuentro, o `null` si no existe.
   */
  async encounterScope(
    em: EntityManager,
    encounterId: string,
  ): Promise<ClinicalResourceScope | null> {
    const encounter = await em.findOne(Encounters, { id: encounterId });
    return encounter
      ? {
          tenantId: encounter.tenantId,
          patientProfileId: encounter.patientProfileId,
        }
      : null;
  }

  /**
   * Tenant y paciente de un consentimiento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param consentId - Identificador del consentimiento.
   * @returns El alcance del consentimiento, o `null` si no existe.
   */
  async consentScope(
    em: EntityManager,
    consentId: string,
  ): Promise<ClinicalResourceScope | null> {
    const consent = await em.findOne(Consents, { id: consentId });
    return consent
      ? {
          tenantId: consent.tenantId,
          patientProfileId: consent.patientProfileId,
        }
      : null;
  }
}
