import type { EntityManager } from '@mikro-orm/postgresql';
import { DIR } from '../../directory/directory.concepts';

/**
 * ¿El paciente tiene relación con la organización? Es la frontera que evita que
 * una persona de CUALQUIER organización use un UUID de paciente ajeno como
 * oráculo (existencia, banderas, edad, cobertura): SEG A-M6, A-B7 y B-B4.
 *
 * Hay relación si el paciente tiene una cita, una representación legal, una
 * relación asistencial o una bandeja de restricciones en la organización, o si
 * lo registró alguien con membresía vigente en ella. Es la misma noción de
 * «vinculado a la organización» que usa el registro de duplicados de apoyo.
 *
 * @param em - Contexto o transacción activa (con RLS, ya en la organización).
 * @param tenantId - Organización de quien consulta.
 * @param patientProfileId - Paciente.
 * @returns `true` si hay relación.
 */
export async function isPatientLinkedToTenant(
  em: EntityManager,
  tenantId: string,
  patientProfileId: string,
): Promise<boolean> {
  const rows = await em.execute<{ ok: number }[]>(
    `/* patient_tenant_link */
     select 1 as ok
      where exists (select 1 from scheduling.appointment_bookings b
                     where b.tenant_id = ? and b.patient_profile_id = ?)
         or exists (select 1 from authz.patient_legal_representations r
                     where r.tenant_id = ? and r.patient_profile_id = ?)
         or exists (select 1 from authz.care_relationships c
                     where c.tenant_id = ? and c.patient_profile_id = ?)
         or exists (select 1 from delegated_access.patient_restriction_flags f
                     where f.tenant_id = ? and f.patient_profile_id = ?)
         or exists (select 1 from profiles.persons p
                      join directory.tenant_memberships m
                        on m.user_id = p.created_by_user_id
                     where p.id = ?
                       and m.tenant_id = ?
                       and m.status_concept_id = ?
                       and m.start_date <= now()
                       and (m.end_date is null or m.end_date > now()))
      limit 1`,
    [
      tenantId,
      patientProfileId,
      tenantId,
      patientProfileId,
      tenantId,
      patientProfileId,
      tenantId,
      patientProfileId,
      patientProfileId,
      tenantId,
      DIR.MEMBERSHIP_ACTIVE,
    ],
  );
  return rows.length > 0;
}
