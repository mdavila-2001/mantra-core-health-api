import { CONCEPTS } from '../../../../common/constants/concepts';
// Los conceptos de `clinical` son constantes de terminología compartida (kernel
// compartido): se importa el archivo de conceptos, nunca sus servicios.
import { CLIN } from '../../../clinical/clinical.concepts';

/** Por dónde entra una reserva que elige el cliente. */
export type BookingChannel = 'PORTAL' | 'DESK' | 'PHONE';

/** Por qué medio ocurre la atención: presencial, teleconsulta o domicilio. */
export type AppointmentChannel = 'PRESENCIAL' | 'TELECONSULTA' | 'DOMICILIO';

/**
 * Canal de reserva interno: además de los que el cliente puede elegir
 * (`BookingChannel`), el mostrador atómico usa `WALK_IN`, que no es una opción
 * del DTO público — lo decide el servidor, nunca el cuerpo del alta.
 */
export type InternalBookingChannel = BookingChannel | 'WALK_IN';

export const CHANNEL_CONCEPT: Readonly<Record<InternalBookingChannel, string>> =
  {
    PORTAL: CONCEPTS.CHANNEL_PORTAL,
    DESK: CONCEPTS.CHANNEL_DESK,
    PHONE: CONCEPTS.CHANNEL_PHONE,
    WALK_IN: CONCEPTS.CHANNEL_WALK_IN,
  };

/**
 * La modalidad de la atención → su concepto de catálogo.
 *
 * Ojo con el vecino de arriba: `CHANNEL_CONCEPT` es cómo se **pidió** el turno
 * y va en la reserva; éste es por qué medio **ocurre** y va en la cita clínica
 * (`clinical.appointments.channel_concept_id`). Dos ejes, dos columnas.
 *
 * `PRESENCIAL` no se omite aunque sea el valor por defecto: cuando alguien lo
 * elige explícitamente, se guarda: «nadie lo dijo» y «dijeron que es
 * presencial» son cosas distintas, y sólo la primera puede cambiar de
 * significado si mañana el default cambia.
 */
export const APPOINTMENT_CHANNEL_CONCEPT: Readonly<
  Record<AppointmentChannel, string>
> = {
  PRESENCIAL: CLIN.APPOINTMENT_CHANNEL_IN_PERSON,
  TELECONSULTA: CLIN.APPOINTMENT_CHANNEL_TELEHEALTH,
  DOMICILIO: CLIN.APPOINTMENT_CHANNEL_HOME_VISIT,
};
