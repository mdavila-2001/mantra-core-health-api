import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Respuesta estándar de creación: solo el identificador del recurso nuevo. */
export class CreatedResourceDto {
  /**
   * Identificador del recurso creado.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Respuesta de una transición de estado sobre un recurso existente. */
export class TransitionResultDto {
  /**
   * Identificador del recurso afectado.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Concepto del estado en que quedó el recurso.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Resultado de una desvinculación: qué se revocó, además del cambio de estado. */
export class UnlinkResultDto extends TransitionResultDto {
  /**
   * Sesiones cerradas por la desvinculación.
   */
  @ApiProperty({ description: 'Sesiones activas cerradas' })
  revokedSessions!: number;

  /**
   * Tokens de refresco revocados.
   */
  @ApiProperty({ description: 'Tokens de refresco revocados' })
  revokedRefreshTokens!: number;

  /**
   * Solicitudes de visita pendientes que quedaron canceladas.
   */
  @ApiPropertyOptional({ description: 'Solicitudes pendientes canceladas' })
  cancelledVisitRequests?: number;
}
