import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /integrations/providers/{id}/webhook-subscriptions` (UC-12-11). */
@ApiSchema({ name: 'IntegrationsCreateWebhookSubscriptionDto' })
export class CreateWebhookSubscriptionDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant al que aplica la suscripción',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de event type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de evento suscrito', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  eventType!: string;

  /**
   * Valor de callback url mantenido por la instancia.
   */
  @ApiProperty({ description: 'URL de callback (HTTPS obligatoria)' })
  @Matches(/^https:\/\//i, { message: 'callbackUrl debe ser una URL HTTPS' })
  @MaxLength(2048)
  callbackUrl!: string;

  /**
   * Valor de secret ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia al secreto de verificación de firma',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  secretRef?: string;
}
