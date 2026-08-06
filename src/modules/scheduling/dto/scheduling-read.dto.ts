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

/** Una cita, tal como la lista la agenda o el portal del paciente. */
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
