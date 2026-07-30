import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/webhook-subscriptions` (UC-31-04). */
export class CreateWebhookSubscriptionDto {
  /**
   * Identificador asociado a event type concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de tipo de evento suscrito',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  eventTypeConceptId?: string;

  /**
   * Valor de callback uri mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'URI de callback con TLS',
    maxLength: 2048,
  })
  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['https', 'http'] })
  @MaxLength(2048)
  callbackUri?: string;

  /**
   * Valor de signing key reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia a la clave de firma en secret-manager',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  signingKeyReference?: string;

  /**
   * Valor de secret reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia al secreto en secret-manager',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  secretReference?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Inicio de validez (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de validez (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}
