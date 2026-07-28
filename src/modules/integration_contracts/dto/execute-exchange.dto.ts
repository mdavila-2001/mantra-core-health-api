import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Cuerpo de `POST /integration/contracts/{id}/exchanges` (UC-31-05).
 *
 * La clave de idempotencia se toma preferentemente del header `idempotency-key`;
 * si el cliente no puede fijar headers, se acepta `idempotencyKey` en el cuerpo.
 */
export class ExecuteExchangeDto {
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Clave de idempotencia (alternativa al header idempotency-key)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotencyKey?: string;

  /**
   * Identificador asociado a message type concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de tipo de mensaje',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  messageTypeConceptId?: string;

  /**
   * Valor de business identifier mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Identificador de negocio del mensaje',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessIdentifier?: string;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({
    description: 'Correlación con otro flujo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de tipo de sujeto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  subjectTypeConceptId?: string;

  /**
   * Identificador asociado a subject entity.
   */
  @ApiPropertyOptional({
    description: 'Id de la entidad sujeto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  subjectEntityId?: string;

  /**
   * Valor de request hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del request para detectar mismatch de payload',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  requestHash?: string;

  /**
   * Identificador asociado a payload file.
   */
  @ApiPropertyOptional({
    description: 'Archivo de payload archivado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  payloadFileId?: string;
}
