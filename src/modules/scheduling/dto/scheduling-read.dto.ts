import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Un hueco de la agenda tal como lo ve quien va a reservar (UC-41-14).
 *
 * `available` viene calculado y no se deja deducir del estado: un slot puede
 * seguir marcado como abierto con el cupo tomado por un hold vivo, y ofrecerlo
 * llevaría al paciente a un 409 al confirmar.
 */
export class BookableSlotItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({
    format: 'uuid',
    description:
      'Id del slot; es lo que se manda a `POST /scheduling/slots/:id/holds`',
  })
  id!: string;

  /**
   * Identificador asociado a resource.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  resourceId?: string;

  /**
   * Identificador asociado a schedule template.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  scheduleTemplateId?: string;

  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  serviceConceptId?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  startAt!: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  endAt!: Date;

  /**
   * Valor de capacity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cupos totales del slot' })
  capacity!: number;

  /**
   * Valor de remaining capacity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cupos libres ahora mismo' })
  remainingCapacity!: number;

  /**
   * Valor de available mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Si queda cupo. Derivado: no requiere resolver terminología',
  })
  available!: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  statusConceptId?: string;
}

/** Agenda de un recurso en la ventana pedida. */
export class ResourceAgendaResponseDto {
  /**
   * Identificador asociado a resource.
   */
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  /**
   * Valor de from mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  from!: Date;

  /**
   * Valor de to mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  to!: Date;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [BookableSlotItemDto] })
  items!: BookableSlotItemDto[];

  /**
   * Número de elementos devueltos.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty()
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Si la ventana tenía más slots que el tope pedido. Se declara en vez de recortar en silencio: una agenda a la que le faltan huecos sin avisar se lee como una agenda llena',
  })
  truncated!: boolean;
}

/**
 * Por qué la cita cambió de estado, tal como se le muestra a la otra parte.
 *
 * Sale del historial de auditoría de la reserva
 * (`audit.appointment_bookings_history`), que es donde se persiste el motivo:
 * ver `state/booking-transition.ts` para por qué ahí y no en una columna.
 */
export class BookingStatusReasonDto {
  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Lo que escribió quien hizo el cambio' })
  reasonText!: string;

  /**
   * Valor de actor kind mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: ['PATIENT', 'PROVIDER'],
    description:
      'Desde qué lado se hizo el cambio. Permite decir «tu médico canceló» en vez de «la cita fue cancelada».',
  })
  actorKind?: 'PATIENT' | 'PROVIDER';

  /**
   * Identificador asociado a status concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Estado al que llevó el cambio, si fue una transición',
  })
  toStateConceptId?: string;

  /**
   * Valor de changed at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  changedAt!: Date;
}

/**
 * La demora informada por el profesional sobre una cita (P8).
 *
 * Se devuelve junto a la cita —y no sólo como notificación— porque el aviso
 * in-app puede no llegar: sin cuenta de portal, con la preferencia en contra o
 * con la campana sin abrir. El turno tiene que poder explicarse solo.
 */
export class BookingDelayNoticeDto {
  /**
   * Minutos de demora que informó el profesional.
   */
  @ApiProperty({ description: 'Minutos de demora informados' })
  delayMinutes!: number;

  /**
   * Lo que escribió el profesional, si escribió algo.
   */
  @ApiPropertyOptional({ description: 'Mensaje del profesional' })
  message?: string;

  /**
   * Cuándo se informó.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  announcedAt!: Date;
}

/** Una cita, tal como la devuelven el listado y el detalle (UC-41-15). */
export class BookingItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  patientProfileId?: string;

  /**
   * Identificador asociado a resource.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  resourceId?: string;

  /**
   * Identificador asociado a bookable slot.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  bookableSlotId?: string;

  /**
   * Cita clínica que respalda la reserva (`clinical.appointments`).
   *
   * El dato vivía en la entidad y no salía por ninguna lectura, y esa omisión
   * cortaba una cadena entera: `CheckInEncounterDto.appointmentId` apunta a esta
   * misma tabla, así que sin exponerlo el portal no tenía forma de decir «este
   * encuentro corresponde a este turno». Mandar el `id` de la reserva en su
   * lugar violaría la clave foránea.
   *
   * `null` cuando la reserva no tiene cita clínica detrás, que hoy es el caso
   * corriente: la reserva se crea desde la agenda y la cita clínica es un
   * registro posterior. Quien lo consuma tiene que tratar la ausencia como
   * normal, no como error.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'Cita clínica que respalda la reserva. Es el valor que acepta POST /clinical/encounters/check-in en su `appointmentId`.',
  })
  appointmentId?: string | null;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description:
      'Instante de la cita, tomado del slot. `null` si la cita quedó sin slot',
  })
  startAt?: Date | null;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endAt?: Date | null;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  serviceConceptId?: string;

  /**
   * Identificador asociado a booking channel concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  bookingChannelConceptId?: string;

  /**
   * Valor de confirmed at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  confirmedAt?: Date;

  /**
   * Valor de checked in at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  checkedInAt?: Date;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  reasonText?: string;

  /**
   * Nombre del paciente.
   *
   * Viaja con la **misma regla que el motivo de consulta**: lo ve el titular y
   * el profesional que atiende en esa agenda, y no la vista de la organización.
   * El médico necesita saber a quién espera —la agenda del día sin nombres es
   * una lista de identificadores— y la organización ya opera con el perfil.
   */
  @ApiPropertyOptional()
  patientName?: string;

  /**
   * De cuándo se movió, si la cita se reprogramó.
   *
   * Ausente cuando nunca se movió — que es distinto de «se movió y no sé
   * desde cuándo». Es el instante ORIGINAL, no el id del cupo: la tarjeta dice
   * «reprogramada desde el 20/08 a las 15:30», y resolverlo en la pantalla
   * costaría una petición por cita para pintar una línea.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  rescheduledFrom?: Date;

  /**
   * Por qué la cita está como está, cuando el último cambio lo explicó.
   *
   * Es la mitad que le faltaba a la cancelación y a la reprogramación
   * (corrección #14): la cita decía que estaba cancelada y no decía por qué, así
   * que el paciente se enteraba del cambio pero no de la razón. Llega ausente
   * cuando el último cambio no exigía motivo —una confirmación, un check-in— y
   * en las citas anteriores a esta versión, que no lo registraron.
   */
  @ApiPropertyOptional({
    type: () => BookingStatusReasonDto,
    nullable: true,
    description:
      'Motivo del último cambio que lo exigía (cancelación, rechazo o reprogramación), con quién lo hizo y cuándo.',
  })
  statusReason?: BookingStatusReasonDto | null;

  /**
   * La última demora informada sobre esta cita (P8), si la hay.
   */
  @ApiPropertyOptional({
    type: () => BookingDelayNoticeDto,
    nullable: true,
    description:
      'Última demora informada por el profesional, con sus minutos y su mensaje.',
  })
  delayNotice?: BookingDelayNoticeDto | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Listado de citas. */
export class SearchBookingsResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [BookingItemDto] })
  items!: BookingItemDto[];

  /**
   * Número de elementos devueltos.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty()
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Si había más citas que el tope pedido',
  })
  truncated!: boolean;
}
