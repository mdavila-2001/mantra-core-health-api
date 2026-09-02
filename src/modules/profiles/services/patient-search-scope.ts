import { requireTenantId, type AuthenticatedUser } from '../../../common';
import type { PatientSearchScope } from '../repositories/patient-profiles.repository';

/**
 * Roles que atienden y, por eso, pueden buscar a la persona que tienen enfrente.
 *
 * Son los mismos dos que `ClinicalReadService.ROLES_QUE_ATIENDEN` reconoce para
 * leer una historia: si el producto acepta que estas dos personas lean el
 * expediente cuando corresponde, aceptar que encuentren a su titular es la
 * misma frontera, no una más ancha.
 */
export const ROLES_QUE_ATIENDEN = ['CLINICIAN', 'PRACTITIONER'] as const;

/** Roles que administran el padrón completo de personas. */
const ROLES_QUE_ADMINISTRAN = ['SECURITY_ADMIN', 'SUPERADMIN'] as const;

/**
 * Hasta dónde llega la búsqueda de pacientes de quien pregunta (UC-05-13).
 *
 * ## Por qué existe
 *
 * Hasta la TAREA-07 el listado era exclusivo de `SECURITY_ADMIN`, y el motivo
 * estaba escrito en la pantalla: «la lista de todas las historias de una
 * organización es exactamente el dato que no debe existir como pantalla». El
 * propietario pidió lo contrario —que quien atiende pueda buscar por nombre o
 * por documento— y la decisión se tomó el 2026-09-02 **con una condición**: el
 * rol clínico no ve el padrón entero, ve **a la gente de su organización**.
 *
 * ## Por qué el alcance es por ACTIVIDAD y no por una columna
 *
 * `profiles.persons`, `person_profiles` y `patient_profiles` **no tienen
 * `tenant_id`**: son identidad maestra, una persona es la misma en todas las
 * organizaciones y ese es justamente el punto del modelo. Así que «los
 * pacientes de mi organización» no se puede leer de una columna; se deriva de
 * lo único que ata una persona a un tenant: haber sido atendida ahí. Eso son
 * las reservas de agenda (`scheduling.appointment_bookings.tenant_id`) y las
 * relaciones asistenciales (`authz.care_relationships.tenant_id`), las dos
 * tablas que el propio `ClinicalReadService` ya trata como la verdad.
 *
 * Consecuencia que hay que decir en voz alta: **un paciente que nunca pisó la
 * organización no aparece**, aunque exista. Es deliberado. Si el propietario
 * quiere que aparezca, es otra decisión de privacidad (P-07-10) y se toma
 * arriba, no acá.
 *
 * @param actor - Usuario autenticado que pregunta.
 * @returns El alcance con el que hay que resolver la consulta.
 */
export function resolvePatientSearchScope(
  actor: AuthenticatedUser,
): PatientSearchScope {
  const administra = actor.roles.some((rol) =>
    (ROLES_QUE_ADMINISTRAN as readonly string[]).includes(rol),
  );
  if (administra) {
    return { kind: 'unrestricted' };
  }

  // Quien atiende busca dentro de su organización. `requireTenantId()` falla si
  // no hay tenant en contexto, que es lo correcto: sin organización no hay
  // alcance que aplicar, y devolver «todo» sería exactamente el descuido que
  // esta política existe para evitar.
  return { kind: 'tenant-activity', tenantId: requireTenantId() };
}
