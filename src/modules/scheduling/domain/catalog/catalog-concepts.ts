import type {
  ActivityType,
  ExceptionType,
  ResourceType,
  RuleBookingMode,
} from './catalog-types';
import { CLIN } from '../../../clinical/clinical.concepts';
import { CONCEPTS } from '../../../../common/constants/concepts';
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
 * Tipos de referencia admitidos para un recurso agendable, con el esquema al que
 * pertenece cada tabla (lista CERRADA).
 *
 * `resourceRefType` es una referencia polimórfica que llega del cliente. Quien la valida
 * (¿es un espacio? ¿hay que aplicar la regla estricta del quirófano?) y quien la consume
 * después (reservas, plantillas, excepciones, disponibilidad, `CHECK` de la base) tienen
 * que ver **el mismo texto**: si el validador normaliza y el almacén guarda lo crudo, un
 * `« Care_Spaces »` esquivaba la validación y quedaba guardado como algo que otro módulo
 * lee como espacio (diferencial de analizador). Por eso hay UN solo punto de
 * normalización, {@link normalizeRefType}, que decide el camino y produce el valor que se
 * persiste; lo que no esté en esta lista se rechaza (422), no se guarda.
 */
export const RESOURCE_REF_TYPE_SCHEMAS: Readonly<Record<string, string>> = {
  health_practitioner_profiles: 'profiles',
  care_spaces: 'practice',
  practice_sites: 'practice',
  diagnostic_equipment: 'diagnostic_units',
};

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

/** Un identificador de PostgreSQL sin comillas: minúsculas, dígitos y guion bajo. */
const IDENTIFIER = /^[a-z][a-z0-9_]*$/;

/**
 * Normaliza un `resourceRefType` del cliente al valor canónico, o `null` si no es uno
 * admitido.
 *
 * Pasos, en este orden y sin atajos: `NFKC` (las variantes de ancho completo caen a
 * ASCII), `trim`, minúsculas, un único prefijo de esquema opcional que debe ser el esquema
 * real de la tabla (`practice.care_spaces` sí; `otro.care_spaces` no), alias
 * (`practitioner_profiles`) y pertenencia a {@link RESOURCE_REF_TYPE_SCHEMAS}. Cualquier
 * carácter fuera de `[a-z0-9_]` en el identificador (comillas, espacios internos, ceros de
 * ancho, punto y coma) lo descarta.
 *
 * @param raw - El valor tal como llegó.
 * @returns El tipo canónico, o `null` si no está admitido.
 */
export function normalizeRefType(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.normalize('NFKC').trim().toLowerCase();
  const parts = cleaned.split('.');
  if (parts.length > 2) return null;
  const table = parts[parts.length - 1];
  const schema = parts.length === 2 ? parts[0] : undefined;
  if (
    !IDENTIFIER.test(table) ||
    (schema !== undefined && !IDENTIFIER.test(schema))
  ) {
    return null;
  }
  const canonical = TABLE_ALIAS[table] ?? table;
  const expectedSchema = RESOURCE_REF_TYPE_SCHEMAS[canonical];
  if (expectedSchema === undefined) return null;
  if (schema !== undefined && schema !== expectedSchema) return null;
  return canonical;
}

/**
 * El valor que se persiste para un `resourceRefType`: el canónico si es admitido; si no, el
 * texto recortado y en minúsculas (nunca el crudo). Las rutas que escriben pasan antes por
 * {@link normalizeRefType} y rechazan lo que devuelve `null`; esta función sólo existe para
 * las comparaciones de acceso, que deben usar el mismo texto que el almacén.
 */
export function canonicalRefType(refType: string): string {
  return (
    normalizeRefType(refType) ?? refType.normalize('NFKC').trim().toLowerCase()
  );
}

/**
 * `resourceRefType` canónico de un recurso que apunta a un espacio de infraestructura
 * (`practice.care_spaces`). Un recurso así lleva además la FK real `care_space_id`
 * (R0 de F4, INV-40) y se crea por otro camino que el resto: ver `SpaceResourceLinker`.
 */
export const CARE_SPACES_REF_TYPE = 'care_spaces';

/** ¿El recurso que se pide apunta a un espacio de infraestructura? (mismo analizador que el almacén) */
export function refersToCareSpace(refType: string): boolean {
  return normalizeRefType(refType) === CARE_SPACES_REF_TYPE;
}

/** Quién creó una excepción de disponibilidad, como lo lee el cliente. */
export type ExceptionSourceKind =
  'MANUAL' | 'CARE_SPACE_BLOCK' | 'EQUIPMENT_STATUS';

/** El origen de una excepción desde su concepto. Ausente (filas anteriores a F5d) ≡ manual. */
export function exceptionSourceKind(
  conceptId: string | null | undefined,
): ExceptionSourceKind {
  if (conceptId === SCHED.EXC_SRC_CARE_SPACE_BLOCK) return 'CARE_SPACE_BLOCK';
  if (conceptId === SCHED.EXC_SRC_EQUIPMENT_STATUS) return 'EQUIPMENT_STATUS';
  return 'MANUAL';
}

/** ¿La crea una persona? Sólo ésas se editan y se borran desde la agenda. */
export function isManualException(
  conceptId: string | null | undefined,
): boolean {
  return exceptionSourceKind(conceptId) === 'MANUAL';
}

/** `resourceRefType` canónico de un recurso que apunta a un equipo de diagnóstico (F5a). */
export const EQUIPMENT_REF_TYPE = 'diagnostic_equipment';

/** `resourceRefType` canónico de un recurso que apunta a una sede. */
export const PRACTICE_SITES_REF_TYPE = 'practice_sites';

/**
 * A qué tablas puede apuntar cada tipo de recurso (F5a/F5d, INV-40): la referencia deja de ser
 * libre. Una sala apunta a un espacio (o, en el modelo anterior, a una sede); un equipo, a un
 * equipo de diagnóstico; un profesional, a su perfil.
 */
export const REF_TYPES_BY_RESOURCE: Readonly<
  Record<ResourceType, readonly string[]>
> = {
  PRACTITIONER: ['health_practitioner_profiles'],
  ROOM: [CARE_SPACES_REF_TYPE, PRACTICE_SITES_REF_TYPE],
  EQUIPMENT: [EQUIPMENT_REF_TYPE],
};
