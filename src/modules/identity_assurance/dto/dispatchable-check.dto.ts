import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Un check que el worker debe atender, junto con lo que necesita para hacerlo
 * sin volver a consultar la API.
 */
export class DispatchableCheckDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a identity verification case.
   */
  @ApiProperty({ format: 'uuid' })
  identityVerificationCaseId!: string;

  /**
   * Identificador asociado a check type concept.
   */
  @ApiProperty({ format: 'uuid' })
  checkTypeConceptId!: string;

  /**
   * Código legible del tipo de comprobación, tal como lo espera la autoridad
   * externa (`IDENTITY_CARD`, `MEDICAL_LICENSE`, `INSTITUTION_DOCUMENT`).
   *
   * Se resuelve aquí y no en el worker para que el worker no tenga que conocer
   * el catálogo de conceptos: su trabajo es hablar con el proveedor, no
   * traducir identificadores internos.
   */
  @ApiProperty()
  checkTypeCode!: string;

  /**
   * Identificador asociado al endpoint de autoridad que atiende este check.
   */
  @ApiProperty({ format: 'uuid' })
  identityAuthorityEndpointId!: string;

  /**
   * Si ya se despachó y se está esperando el veredicto de la autoridad.
   */
  @ApiProperty({
    description: 'true si ya hay un intento en curso pendiente de veredicto',
  })
  awaitingVerdict!: boolean;
}

/** Lote de checks que el worker debe atender en este tick. */
export class DispatchableChecksResponseDto {
  /**
   * Valor de checks mantenido por la instancia.
   */
  @ApiProperty({ type: [DispatchableCheckDto] })
  checks!: DispatchableCheckDto[];
}

/** Resultado de encolar un check contra la autoridad externa. */
export class DispatchCheckResultDto {
  /**
   * Identificador asociado a check.
   */
  @ApiProperty({ format: 'uuid' })
  checkId!: string;

  /**
   * Identificador asociado a attempt.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  attemptId?: string;
}
