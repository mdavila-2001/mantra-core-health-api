import type { BookingActorKind } from './booking-transition';

/**
 * Lo mínimo que la agenda necesita saber de quien actúa. Es estructural: la
 * sesión autenticada (`AuthenticatedUser`) lo satisface sin que el dominio
 * dependa de ella.
 */
export interface AgendaActor {
  readonly roles: readonly string[];
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

/** Si el actor administra agendas ajenas por oficio. */
export function operatesAnyAgenda(actor: AgendaActor): boolean {
  return actor.roles.some((role) => AGENDA_OPERATOR_ROLES.includes(role));
}

/**
 * ¿Este actor tiene forma de paciente?
 *
 * Es quien no opera cualquier agenda —mostrador, administración de agenda,
 * `SUPERADMIN`— y tampoco atiende. La distinción importa porque el candado de
 * `BookingAccess` no puede alcanzar a quien atiende: la agenda del médico y el
 * formulario de cotización listan las citas de sus pacientes por
 * `patientProfileId`, y exigirles apoderamiento rompería las dos pantallas.
 *
 * Que un profesional pueda listar las citas de cualquier paciente es un hueco
 * anterior a esto y sigue abierto; cerrarlo exige decidir contra qué se acota
 * —organización, relación asistencial— y no se resuelve de paso.
 */
export function isPatientActor(actor?: AgendaActor): boolean {
  if (!actor) return false;
  if (operatesAnyAgenda(actor)) return false;
  return actor.practitionerProfileId === undefined;
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
