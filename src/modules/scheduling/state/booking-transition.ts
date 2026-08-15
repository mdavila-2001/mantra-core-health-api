import { PreconditionFailedException } from '../../../common';

/**
 * Lo que se guarda de cada cambio en la vida de una cita
 * (`audit.appointment_bookings_history.data_snapshot`).
 *
 * ## Por qué el motivo vive acá y no en una columna
 *
 * Ni `booking_cancellations` ni `booking_reschedules` tienen columna de texto
 * libre: las dos declaran un `reason_concept_id` de catálogo, que dice *de qué
 * clase* es el motivo —lo canceló el paciente, lo canceló el profesional, fue
 * una inasistencia— pero no lo que la persona escribió. La corrección #14 pide
 * exactamente lo segundo, y agregar una columna exigiría el ciclo completo del
 * modelo (`.puml` → `gen_ddl.py` → `SQL/patches/` → base), que no es alcance de
 * este carril y que este repositorio no puede hacer por sí solo.
 *
 * El historial de auditoría **ya** existe para esto: es append-only, guarda
 * quién y cuándo, y su `data_snapshot` es `jsonb`. Poner ahí el motivo no es un
 * atajo — es el lugar donde el modelo ya declara que vive la razón de un cambio
 * de estado. Y como es la misma escritura que ya registraba la transición, no
 * cuesta una fila más.
 */
export interface BookingTransitionSnapshot {
  /** La cita a la que pertenece la transición. */
  bookingId: string;
  /** Estado del que venía, cuando el cambio es de estado. */
  fromStateConceptId?: string;
  /** Estado al que pasó. */
  toStateConceptId?: string;
  /** Cupo que deja, cuando el cambio es una reprogramación. */
  fromSlotId?: string;
  /** Cupo al que se mueve. */
  toSlotId?: string;
  /**
   * Lo que escribió quien hizo el cambio.
   *
   * Obligatorio al cancelar, rechazar y reprogramar (corrección #14); ausente
   * en las transiciones que no lo piden, como el check-in.
   */
  reasonText?: string;
  /**
   * Quién lo hizo, en términos del negocio y no de la sesión.
   *
   * `PATIENT` o `PROVIDER`. Es lo que permite decir «tu médico canceló» en vez
   * de «la cita fue cancelada»: el `changed_by_user_id` del historial identifica
   * la cuenta, no el papel que jugaba.
   */
  actorKind?: BookingActorKind;
  /**
   * Qué resolvió el prestador sobre una solicitud (UC-41-17, carril 11).
   *
   * Viaja en el mismo snapshot que la transición y no en una tabla aparte
   * porque **es** el porqué de esa transición: sin él, el historial dice que la
   * cita pasó a cancelada y no que el prestador la rechazó. Presente sólo en
   * las transiciones que nacen de una decisión.
   */
  decision?: string;
  /** Qué documentación se pidió, cuando la decisión fue pedirla. */
  infoRequested?: string;
  /** Lo que el prestador le escribió al paciente al decidir. */
  message?: string;
}

/** Desde qué lado del mostrador se hizo el cambio. */
export type BookingActorKind = 'PATIENT' | 'PROVIDER';

/**
 * Largo mínimo de un motivo para que se considere escrito.
 *
 * Cinco caracteres: alcanza para «gripe» y no para «.» ni «ok». No es una regla
 * de estilo — es lo que separa un motivo de un trámite para saltarse el campo.
 */
export const MIN_REASON_LENGTH = 5;

/** Tope, el mismo que declara el DTO y que aguanta la columna del snapshot. */
export const MAX_REASON_LENGTH = 500;

/**
 * Textos que la gente escribe para saltarse un campo obligatorio.
 *
 * Se comparan en minúscula y sin acentos, contra el motivo entero, no como
 * subcadena: «no aplica el tratamiento» es un motivo legítimo y no puede caer
 * por empezar con «no aplica».
 */
const PLACEHOLDERS: ReadonlySet<string> = new Set([
  'na',
  'n/a',
  'no aplica',
  'nada',
  'ninguno',
  'ninguna',
  'sin motivo',
  'motivo',
  'test',
  'prueba',
  'asdf',
  'aaaa',
  'xxxx',
  'otro',
  'otros',
]);

/**
 * Marcas diacríticas que `normalize('NFD')` separa de su letra.
 *
 * Se declara con escapes Unicode y no con los caracteres literales porque un
 * rango de marcas combinantes escrito a mano es invisible en el editor y
 * cualquier reencodeo del archivo lo rompe en silencio.
 */
const DIACRITICOS = /[\u0300-\u036f]/g;

/**
 * Deja el motivo como se va a guardar: sin espacios de sobra ni saltos de línea
 * repetidos. No cambia lo que dice, solo cómo está escrito.
 */
export function normalizeReason(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/**
 * Exige un motivo de verdad y lo devuelve normalizado (corrección #14).
 *
 * **La validación es del servidor, no de la pantalla.** El DTO ya rechaza el
 * campo ausente o corto con un 400, pero eso solo cubre a quien manda el
 * formulario; esta comprobación cubre a cualquiera que llame a la API, y es la
 * que descarta el relleno («na», «prueba», «...»), que un `@MinLength` no ve.
 *
 * @param raw - Lo que llegó en el cuerpo.
 * @param accion - Qué se estaba haciendo, para que el error lo diga.
 * @returns El motivo listo para persistir.
 * @throws PreconditionFailedException si está vacío, es demasiado corto o es
 * relleno.
 */
export function requireReason(raw: string | undefined, accion: string): string {
  const motivo = normalizeReason(raw ?? '');

  if (motivo.length < MIN_REASON_LENGTH) {
    throw new PreconditionFailedException(
      `Indique el motivo para ${accion}: es obligatorio y debe explicar el cambio.`,
      { failureCode: 'REASON_REQUIRED', minLength: MIN_REASON_LENGTH },
    );
  }

  if (esRelleno(motivo)) {
    throw new PreconditionFailedException(
      `El motivo para ${accion} no puede ser un texto de relleno: escriba la razón real.`,
      { failureCode: 'REASON_PLACEHOLDER' },
    );
  }

  return motivo;
}

/**
 * Si el texto es de los que se escriben para saltarse el campo.
 *
 * Además de la lista, cae cualquier motivo de un solo carácter repetido
 * («....», «----», «xxxxx»): son infinitos y no vale la pena enumerarlos.
 */
function esRelleno(motivo: string): boolean {
  const plano = motivo.toLowerCase().normalize('NFD').replace(DIACRITICOS, '');

  if (PLACEHOLDERS.has(plano)) {
    return true;
  }

  const sinEspacios = plano.replace(/\s/g, '');
  return sinEspacios.length > 0 && new Set(sinEspacios).size === 1;
}
