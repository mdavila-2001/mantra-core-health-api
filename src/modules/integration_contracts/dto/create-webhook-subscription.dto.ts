import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/webhook-subscriptions` (UC-31-04). */
export class CreateWebhookSubscriptionDto {
  @ApiPropertyOptional({ description: 'Concepto de tipo de evento suscrito', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  eventTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'URI de callback con TLS', maxLength: 2048 })
  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['https', 'http'] })
  @MaxLength(2048)
  callbackUri?: string;

  @ApiPropertyOptional({ description: 'Referencia a la clave de firma en secret-manager', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  signingKeyReference?: string;

  @ApiPropertyOptional({ description: 'Referencia al secreto en secret-manager', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  secretReference?: string;

  @ApiPropertyOptional({ description: 'Inicio de validez (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Fin de validez (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}
