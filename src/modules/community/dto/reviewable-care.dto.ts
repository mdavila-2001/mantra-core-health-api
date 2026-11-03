import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** Parámetros de `GET /patients/me/reviewable-care`. */
export class ReviewableCareQueryDto {
  /** La reserva (la atención) cuya posibilidad de reseña se consulta. */
  @ApiProperty({
    format: 'uuid',
    description: 'Reserva de la atención recibida (la misma de la encuesta)',
  })
  @IsUUID()
  appointmentBookingId!: string;
}

/**
 * Si una atención recibida se puede calificar en público y con qué encuentro.
 *
 * Es el puente entre la encuesta —que cuelga de una reserva— y la reseña pública
 * —que exige un encuentro—: el paciente no conoce el uuid del encuentro. Se
 * devuelve únicamente a quien recibió la atención; nada de esto se publica.
 */
export class ReviewableCareDto {
  /** Encuentro que respalda la reseña. `null` si la atención todavía no tiene uno. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  encounterId!: string | null;

  /** La reserva consultada. */
  @ApiProperty({ format: 'uuid' })
  appointmentBookingId!: string;

  /** Nombre público del profesional que atendió. `null` si no tiene vitrina. */
  @ApiProperty({ nullable: true, type: String })
  practitionerDisplayName!: string | null;

  /** Inicio de la atención. `null` si no hay encuentro. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startAt!: Date | null;

  /** Si este paciente ya reseñó este encuentro. */
  @ApiProperty()
  alreadyReviewed!: boolean;

  /**
   * Si `POST /patients/me/reviews` aceptaría una reseña de este encuentro:
   * encuentro terminado, vitrina del profesional que acepta reseñas y sin
   * reseña previa.
   */
  @ApiProperty()
  canReview!: boolean;
}
