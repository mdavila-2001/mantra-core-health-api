import type { BookingActorKind } from './booking-transition';

/**
 * Lo mínimo que la agenda necesita saber de quien actúa. Es estructural: la
 * sesión autenticada (`AuthenticatedUser`) lo satisface sin que el dominio
 * dependa de ella.
 */
export interface AgendaActor {
  readonly roles: readonly string[];
  /** Roles con ámbito de organización: `tenantId → roles`. */
  readonly scopedRoles?: Readonly<Record<string, readonly string[]>>;
  readonly practitionerProfileId?: string;
  readonly patientProfileId?: string;
}

/**
 * Rol de runtime de quien tiene un vínculo de apoyo activo con una organización
 * (secretaria, asistente, recepción…). No lo asigna nadie a mano: el token lo
 * lleva mientras el vínculo esté activo. Dice «tiene vínculo», **no** qué puede
 * hacer: eso lo decide la política de apoyo permiso por permiso.
 */
export const SUPPORT_STAFF_ROLE = 'SUPPORT_STAFF';

/**
 * Roles que actúan del lado del prestador.
 *
 * Son los mismos que los endpoints de operación de cita declaran en sus
 * `@Roles`, más `SUPERADMIN`, que el `RolesGuard` trata como comodín. Se usan
 * para decidir a quién atribuir un cambio (`actorKind`), no para autorizar: eso
 * ya lo hizo el guard antes de llegar acá.
 */
export const PROVIDER_ROLES: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SCHEDULING_AGENT',
  SUPPORT_STAFF_ROLE,
  'PRACTITIONER',
  'CLINICIAN',
  'SUPERADMIN',
];

/**
 * Roles que operan **cualquier** agenda, no solo la propia.
 *
 * Es el oficio de quien atiende el mostrador y de quien administra la agenda de
 * la organización: repartir turnos entre todos los consultorios. Un profesional
 * NO está acá a propósito — opera las citas de su recurso, y eso lo comprueba
 * `loadForOperation` contra el perfil de su token, no contra su rol.
 *
 * `SUPERADMIN` entra porque el `RolesGuard` lo trata como comodín: excluirlo
 * acá le negaría en el servicio lo que el guard ya le concedió.
 */
export const AGENDA_OPERATOR_ROLES: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SCHEDULING_AGENT',
  'SUPERADMIN',
];

/**
 * ¿El actor tiene el rol **en esta organización**? Mismo criterio que el guard
 * de roles: un rol que no figura en `scopedRoles` es global y rige en todas; uno
 * que figura con ámbito rige solo en las organizaciones donde se le asignó. Sin
 * organización indicada se lee el rol sin ámbito (comportamiento anterior).
 */
function hasRoleIn(
  actor: AgendaActor,
  role: string,
  tenantId: string | undefined,
): boolean {
  if (!actor.roles.includes(role)) return false;
  if (tenantId === undefined || !actor.scopedRoles) return true;
  const withScope = Object.entries(actor.scopedRoles)
    .filter(([, codes]) => codes.includes(role))
    .map(([id]) => id);
  if (withScope.length === 0) return true;
  return withScope.includes(tenantId);
}

/**
 * Si el actor es persona de apoyo **en esta organización**: tiene vínculo y no
 * administra agendas por oficio ahí. Quien es administrador de agenda
 * (`SCHEDULING_ADMIN`) o recepción asignada a propósito (`SCHEDULING_AGENT`) en
 * esa organización sigue operando por su rol; la persona de apoyo, en cambio,
 * pasa por la política permiso por permiso. Un rol de agenda de OTRA
 * organización no cuenta: no anula la política aquí.
 *
 * @param actor - Quien actúa.
 * @param tenantId - Organización de la cita o la agenda.
 */
export function isSupportActor(actor: AgendaActor, tenantId?: string): boolean {
  return (
    hasRoleIn(actor, SUPPORT_STAFF_ROLE, tenantId) &&
    !operatesAnyAgenda(actor, tenantId)
  );
}

/**
 * Si el actor administra agendas ajenas por oficio **en esta organización**.
 *
 * @param actor - Quien actúa.
 * @param tenantId - Organización de la cita o la agenda.
 */
export function operatesAnyAgenda(
  actor: AgendaActor,
  tenantId?: string,
): boolean {
  return AGENDA_OPERATOR_ROLES.some((role) => hasRoleIn(actor, role, tenantId));
}

/**
 * Roles que atienden pacientes con una agenda propia (profesional de salud).
 * Son los de `PROVIDER_ROLES` que, además de operar, llevan perfil profesional.
 */
export const ATTENDING_ROLES: readonly string[] = ['PRACTITIONER', 'CLINICIAN'];

/**
 * ¿El actor atiende (profesional con agenda propia) **en esta organización**?
 *
 * SEG V-1: el `practitionerProfileId` del token (`hpid`) es GLOBAL —identifica
 * a la persona, no su oficio en una clínica—; usarlo solo sacaba a quien es
 * médico en A del candado de representación en TODAS las organizaciones, de
 * modo que un médico de A con cuenta de paciente en B listaba y cancelaba
 * citas ajenas de B. El oficio se lee con el mismo criterio que el guard de
 * roles (`hasRoleIn`): un rol con ámbito rige solo donde se asignó. Sin perfil
 * profesional no hay agenda que atender; un perfil sin rol de profesional no
 * exime de nada (falla cerrado).
 *
 * @param actor - Quien actúa.
 * @param tenantId - Organización del recurso (cita, cupo, agenda).
 */
export function attendsIn(actor: AgendaActor, tenantId?: string): boolean {
  return (
    actor.practitionerProfileId !== undefined &&
    ATTENDING_ROLES.some((role) => hasRoleIn(actor, role, tenantId))
  );
}

/**
 * ¿Este actor tiene forma de paciente?
 *
 * Es quien no opera cualquier agenda —mostrador, administración de agenda,
 * `SUPERADMIN`— y tampoco atiende **en esa organización**. La distinción
 * importa porque el candado de `BookingAccess` no puede alcanzar a quien
 * atiende: la agenda del médico y el formulario de cotización listan las citas
 * de sus pacientes por `patientProfileId`, y exigirles apoderamiento rompería
 * las dos pantallas. A quien atiende se le acota por otro camino: solo opera
 * y lee las citas de SU agenda (`BookingAccess.assertMayChangeBooking`,
 * `loadForOperation`, el listado por paciente).
 *
 * SEG A-A1: el oficio (apoyo, mostrador) se lee **en la organización del
 * recurso**. Quien es secretaria del hospital A y además paciente de la clínica
 * B es «paciente» en B: sin `tenantId` el vínculo de A la sacaba del candado de
 * representación en todas las organizaciones. Pasar siempre el `tenantId` de la
 * cita/agenda; sin él rige la lectura global anterior (solo para llamadores sin
 * recurso a la vista).
 *
 * SEG V-1: lo mismo para el oficio de profesional (`attendsIn`); ya no se usa
 * el perfil profesional global del token.
 *
 * @param actor - Quien actúa.
 * @param tenantId - Organización del recurso (cita, cupo, agenda).
 */
export function isPatientActor(
  actor?: AgendaActor,
  tenantId?: string,
): boolean {
  if (!actor) return false;
  if (operatesAnyAgenda(actor, tenantId)) return false;
  if (isSupportActor(actor, tenantId)) return false;
  return !attendsIn(actor, tenantId);
}

/**
 * Desde qué lado del mostrador actúa quien hace el cambio.
 *
 * Se decide por rol y no por la pantalla que llamó: un paciente que cancela su
 * propio turno tiene el rol `PATIENT` y nada más, mientras que quien atiende
 * —profesional, agente de agenda, administración— siempre trae alguno de los
 * roles del prestador. La duda se resuelve del lado del prestador: decirle al
 * paciente «lo cancelaste vos» cuando no fue así es peor que lo contrario.
 */
export function actorKindOf(actor: AgendaActor): BookingActorKind {
  const isProviderSide = actor.roles.some((role) =>
    PROVIDER_ROLES.includes(role),
  );
  return isProviderSide ? 'PROVIDER' : 'PATIENT';
}
