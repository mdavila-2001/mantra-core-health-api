import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Cuerpo de `POST /surveys/invitations`.
 *
 * Emite las invitaciones que correspondan a una reserva **completada**. Se
 * expone como comando de este módulo y no como un efecto dentro del cierre de
 * la cita a propósito: el cierre vive en `scheduling`, que es dominio de otro
 * carril, y el protocolo de carriles prohíbe invadirlo a ciegas. La nota de
 * integración para automatizarlo está en el README del módulo.
 */
export class IssueInvitationsDto {
  /**
   * Identificador asociado a appointment booking.
   */
  @ApiProperty({
    description: 'Reserva completada que habilita las invitaciones',
    format: 'uuid',
  })
  @IsUUID()
  appointmentBookingId!: string;
}
