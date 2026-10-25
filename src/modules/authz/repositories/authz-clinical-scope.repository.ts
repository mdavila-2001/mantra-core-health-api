import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import {
  Appointments,
  CareEpisodes,
  Encounters,
} from '../../clinical/entities';
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
   * para toda la plataforma. La pertenencia se prueba con lo que sí es de un
   * tenant, de más específico a más general: un encuentro, un turno, una reserva
   * o un episodio de atención de ese tenant con el paciente, o la membresía activa
   * de la cuenta del paciente en ese tenant (el autorregistro la crea).
   *
   * No cuentan las relaciones asistenciales, los accesos clínicos ni las
   * representaciones legales: son justo lo que esta comprobación protege, y
   * aceptarlas dejaría que una fila indebida se justificara a sí misma.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Perfil de paciente.
   * @param tenantId - Tenant activo.
   * @returns `true` si hay al menos una huella del paciente en el tenant.
   */
  async patientHasFootprintInTenant(
    em: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<boolean> {
    const filter = { patientProfileId, tenantId };
    if ((await em.count(Encounters, filter)) > 0) return true;
    if ((await em.count(Appointments, filter)) > 0) return true;
    if ((await em.count(AppointmentBookings, filter)) > 0) return true;
    if ((await em.count(CareEpisodes, filter)) > 0) return true;

    // `patient_profiles.profile_id` es el id de la persona: de ahí a su cuenta.
    const link = await em.findOne(PersonAccountLinks, {
      personId: patientProfileId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    if (!link) return false;
    return (
      (await em.count(TenantMemberships, {
        userId: link.userId,
        tenantId,
        statusConceptId: {
          $in: [DIR.MEMBERSHIP_ACTIVE, CONCEPTS.MEMBERSHIP_ACTIVE],
        },
      })) > 0
    );
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
