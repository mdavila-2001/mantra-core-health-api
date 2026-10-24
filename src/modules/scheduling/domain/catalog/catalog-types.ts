/** Tipo de recurso agendable. */
export type ResourceType = 'PRACTITIONER' | 'ROOM' | 'EQUIPMENT';

/** Qué admite una franja del horario. */
export type RuleBookingMode = 'CONSULTATIONS' | 'SERVICES' | 'MIXED';

/** Los motivos de una excepción de disponibilidad. */
export type ExceptionType =
  | 'ABSENCE'
  | 'HOLIDAY'
  | 'EXTRA'
  | 'VACATION'
  | 'CONFERENCE'
  | 'ERRAND'
  | 'OTHER';

/** Las tipologías que la agenda sabe pintar. */
export type ActivityType =
  'APPOINTMENT' | 'PROCEDURE' | 'FOLLOW_UP' | 'TELEHEALTH' | 'OTHER';
