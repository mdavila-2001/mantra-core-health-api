import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Un caso de verificación esperando la decisión de un revisor.
 *
 * Lleva lo que la cola necesita para priorizar y abrir el caso, no el
 * expediente entero: el detalle se consulta por id.
 */
export class QueuedCaseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @ApiProperty({ format: 'uuid' })
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject entity.
   */
  @ApiProperty({ format: 'uuid' })
  subjectEntityId!: string;

  /**
   * Identificador asociado a identity verification policy.
   */
  @ApiProperty({ format: 'uuid' })
  identityVerificationPolicyId!: string;

  /**
   * Valor de risk score mantenido por la instancia.
   */
  @ApiPropertyOptional()
  riskScore?: string;

  /**
   * Valor de opened at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  openedAt?: Date;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  expiresAt?: Date;
}

/** Cola de casos que esperan una decisión de revisión (UC-27-08/09). */
export class CaseQueueResponseDto {
  /**
   * Valor de cases mantenido por la instancia.
   */
  @ApiProperty({ type: [QueuedCaseDto] })
  cases!: QueuedCaseDto[];
}
