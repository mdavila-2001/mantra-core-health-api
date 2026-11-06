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
 * ¿El actor tiene el rol **en esta organización**?
 *
 * Es la regla del `RolesGuard` (`roleAuthorizesInTenant`) sin importar `common`
 * desde el dominio: un rol que no figura en `scopedRoles` es global y rige en
 * todas las organizaciones; uno que figura con ámbito rige sólo en aquellas
 * donde se asignó. Con ámbito y sin organización indicada falla cerrado.
 */
function hasRoleIn(
  actor: AgendaActor,
  role: string,
  tenantId: string | undefined,
): boolean {
  if (!actor.roles.includes(role)) return false;
  const withScope = Object.entries(actor.scopedRoles ?? {})
    .filter(([, codes]) => codes.includes(role))
    .map(([id]) => id);
  if (withScope.length === 0) return true;
  return tenantId !== undefined && withScope.includes(tenantId);
}

/**
 * Si el actor administra agendas ajenas por oficio **en esta organización**.
 *
 * Un rol de agenda asignado en OTRA organización no cuenta: quien es mostrador
 * en B y paciente en A no opera las citas de A.
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
 * El `practitionerProfileId` del token es GLOBAL —identifica a la persona, no
 * su oficio en una clínica—: usarlo solo sacaba a quien es médico en A del
 * candado de representación en TODAS las organizaciones, de modo que un médico
 * de A con cuenta de paciente en B cancelaba y listaba citas ajenas de B. El
 * oficio se lee con el mismo criterio que el guard de roles: un rol con ámbito
 * rige sólo donde se asignó. Sin perfil profesional no hay agenda que atender,
 * y un perfil sin rol de profesional no exime de nada (falla cerrado).
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
 * ¿Este actor tiene forma de paciente **en esta organización**?
 *
 * Es quien no opera cualquier agenda —mostrador, administración de agenda,
 * `SUPERADMIN`— y tampoco atiende ahí. La distinción importa porque el candado
 * de representación de `BookingAccess` no puede alcanzar a quien atiende: la
 * agenda del médico y el formulario de cotización listan las citas de sus
 * pacientes por `patientProfileId`, y exigirles apoderamiento rompería las dos
 * pantallas. A quien atiende se le acota por otro camino: sólo opera y lista
 * las citas de SU agenda, o aquellas donde él o su representado son el paciente
 * (`BookingAccess.assertMayChangeBooking`, el listado por paciente).
 *
 * @param actor - Quien actúa.
 * @param tenantId - Organización del recurso (cita, cupo, agenda). Pasarla
 *   siempre: sin ella un rol con ámbito falla cerrado.
 */
export function isPatientActor(
  actor?: AgendaActor,
  tenantId?: string,
): boolean {
  if (!actor) return false;
  if (operatesAnyAgenda(actor, tenantId)) return false;
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
