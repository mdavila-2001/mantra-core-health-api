import type {
  ActivityType,
  ExceptionType,
  ResourceType,
  RuleBookingMode,
} from './catalog-types';
import { CLIN } from '../../../clinical/clinical.concepts';
import { CONCEPTS } from '../../../../common';
import { SCHED } from '../scheduling.concepts';

/** Constantes y mapas de terminología del catálogo de agenda. */
/**
 * Roles que administran el catálogo de agendas de terceros por oficio.
 *
 * Un `PRACTITIONER` NO está acá a propósito: puede publicar y operar **su
 * propia** agenda —eso decide `isOwnProfile`—, nunca la de otro. Antes ni eso:
 * toda la cadena exigía `SCHEDULING_ADMIN`, así que un profesional recién
 * registrado no tenía forma de volverse reservable — el asistente de alta de
 * agenda moría con 403 en el primer paso, y la única vía era pedirle a un
 * administrador que corriera las cuatro llamadas a mano (o el seeder de demo,
 * que es exactamente lo que hacía que "solo aparezcan los doctores de prueba").
 *
 * `SUPERADMIN` entra porque el `RolesGuard` lo trata como comodín: excluirlo
 * acá le negaría en el servicio lo que el guard ya le concedió — mismo criterio
 * que `AGENDA_OPERATOR_ROLES` en `scheduling-bookings.service.ts`. Sin él, el admin
 * de arranque (sin perfil profesional en el token) caía al camino de
 * autoservicio, que exige `hpid`, y recibía 403 en toda la cadena
 * recurso → políticas → plantillas → cupos.
 */
export const CATALOG_ADMIN_ROLES: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SUPERADMIN',
];

/** El modo de una franja a su concepto. Ausente ≡ sin concepto (sólo consultas). */
export function bandMode(
  mode: RuleBookingMode | undefined,
): string | undefined {
  if (mode === undefined) return undefined;
  return {
    CONSULTATIONS: SCHED.RULE_MODE_CONSULTATIONS,
    SERVICES: SCHED.RULE_MODE_SERVICES,
    MIXED: SCHED.RULE_MODE_MIXED,
  }[mode];
}

/** Y de vuelta: el concepto guardado, a lo que entiende el cliente. */
export function modeOfConcept(conceptId: string): RuleBookingMode | undefined {
  const byConcept: Record<string, RuleBookingMode> = {
    [SCHED.RULE_MODE_CONSULTATIONS]: 'CONSULTATIONS',
    [SCHED.RULE_MODE_SERVICES]: 'SERVICES',
    [SCHED.RULE_MODE_MIXED]: 'MIXED',
  };
  return byConcept[conceptId];
}

export const RESOURCE_TYPE_CONCEPT: Readonly<Record<ResourceType, string>> = {
  PRACTITIONER: CONCEPTS.RESOURCE_PRACTITIONER,
  ROOM: CONCEPTS.RESOURCE_ROOM,
  EQUIPMENT: CONCEPTS.RESOURCE_EQUIPMENT,
};

/** La tipología raíz de una actividad, a su concepto de `clinical`. */
export const ACTIVITY_TYPE_CONCEPT: Readonly<Record<ActivityType, string>> = {
  APPOINTMENT: CLIN.ACTIVITY_APPOINTMENT,
  PROCEDURE: CLIN.ACTIVITY_PROCEDURE,
  FOLLOW_UP: CLIN.ACTIVITY_FOLLOW_UP,
  TELEHEALTH: CLIN.ACTIVITY_TELEHEALTH,
  OTHER: CLIN.ACTIVITY_OTHER,
};

/** Cómo se llama cada tipología en pantalla. */
export const ACTIVITY_TYPE_LABEL: Readonly<Record<ActivityType, string>> = {
  APPOINTMENT: 'Consulta',
  PROCEDURE: 'Operación o procedimiento',
  FOLLOW_UP: 'Control',
  TELEHEALTH: 'Teleconsulta',
  OTHER: 'Otra actividad',
};

/**
 * El tono de cada tipología.
 *
 * `error` NO se usa: está reservado para los bloqueos, que el propietario pidió
 * «con rojo». Una actividad pintada como un bloqueo diría que el rato está
 * cerrado cuando no lo está.
 */
export const ACTIVITY_TYPE_TONE: Readonly<Record<ActivityType, string>> = {
  APPOINTMENT: 'primary',
  PROCEDURE: 'warning',
  FOLLOW_UP: 'info',
  TELEHEALTH: 'secondary',
  OTHER: 'success',
};

export const EXCEPTION_TYPE_CONCEPT: Readonly<Record<ExceptionType, string>> = {
  ABSENCE: CONCEPTS.EXCEPTION_ABSENCE,
  HOLIDAY: CONCEPTS.EXCEPTION_HOLIDAY,
  EXTRA: CONCEPTS.EXCEPTION_EXTRA,
  VACATION: CONCEPTS.EXCEPTION_VACATION,
  CONFERENCE: CONCEPTS.EXCEPTION_CONFERENCE,
  ERRAND: CONCEPTS.EXCEPTION_ERRAND,
  OTHER: CONCEPTS.EXCEPTION_OTHER,
};

/**
 * Cómo se llama cada motivo en pantalla.
 *
 * En castellano porque es prosa que ve el usuario, y acá y no en el front
 * porque el catálogo es del servidor: una lista que crece no puede exigir un
 * despliegue del front para mostrarse.
 */
export const EXCEPTION_TYPE_LABEL: Readonly<Record<ExceptionType, string>> = {
  ABSENCE: 'Ausencia',
  HOLIDAY: 'Feriado',
  VACATION: 'Vacaciones',
  CONFERENCE: 'Congreso o capacitación',
  ERRAND: 'Trámite personal',
  EXTRA: 'Atención extraordinaria',
  OTHER: 'Otro',
};

/**
 * El motivo que exige explicación.
 *
 * «Otro» sin texto no dice nada: es la única opción de la lista que no se
 * explica sola, y dejarla pasar vacía convertiría el catálogo en una casilla
 * de escape silenciosa.
 */
export const REASON_REQUIRING_TEXT: ExceptionType = 'OTHER';

export const DEFAULT_SLOT_MINUTES = 30;

export const DEFAULT_SLOT_CAPACITY = 1;

/**
 * Estados en los que una cita todavía compromete al profesional.
 *
 * Los mismos dos que usa `SchedulingBookingsService` y que ahora hace cumplir
 * la restricción `ex_appointments_practitioner_time` en la base. Una solicitud
 * pendiente no entra: nadie se comprometió todavía.
 */
/**
 * El tope de la consulta cuando lo que acota son los ids y no la ventana.
 *
 * `findSlotsOfResourceForUpdate` pide un rango; cerrar cupos los nombra uno por
 * uno, así que el rango tiene que dejar pasar cualquiera. Un año 9999 es más
 * honesto que un `undefined` que obligaría a que la consulta tenga dos formas.
 */
export const END_OF_TIME = new Date('9999-12-31T00:00:00.000Z');

/**
 * Cuántas citas comprometidas se nombran en el aviso de borrado.
 *
 * Un tope y no todas: el aviso existe para que el médico sepa qué resolver, y
 * una lista de doscientos ids no ayuda a nadie. El total viaja aparte, así que
 * la pantalla puede decir «y 190 más».
 */
export const MAX_BOOKINGS_IN_NOTICE = 10;

/** Tope de slots por ejecución: evita que una ventana enorme genere un lote inmanejable. */
export const MAX_SLOTS_PER_RUN = 2000;

/**
 * Alias conocidos de una misma tabla, colapsados a su nombre real.
 *
 * `resourceRefType` es texto libre —el recurso puede apuntar a un profesional, a
 * una sala o a un equipo, y esas tablas viven en módulos distintos— así que
 * nada impedía que dos clientes escribieran dos nombres para lo mismo. Y pasó:
 * el ejemplo del contrato dice `health_practitioner_profiles` —el nombre real de
 * la tabla— y los recursos sembrados traían `practitioner_profiles`.
 *
 * La consecuencia no era cosmética. Quien cruza el recurso con un perfil
 * profesional —el portal, para saber cuál agenda es la del médico que entró; la
 * confirmación de una reserva, para poner el profesional en la cita clínica—
 * tiene que comparar **tabla e identificador**, y con dos nombres en circulación
 * la mitad de los recursos no coincidía con ninguno.
 *
 * Se normaliza al escribir en vez de tolerar al leer, que es donde el arreglo
 * dura: lo que entra queda canónico y los consumidores nuevos no heredan la
 * ambigüedad. Las filas anteriores se siguen tolerando en lectura hasta que se
 * regeneren los seeds.
 */
export const TABLE_ALIAS: Readonly<Record<string, string>> = {
  practitioner_profiles: 'health_practitioner_profiles',
};

export function canonicalRefType(refType: string): string {
  return TABLE_ALIAS[refType] ?? refType;
}
