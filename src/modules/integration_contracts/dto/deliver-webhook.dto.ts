import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Resultados posibles de una entrega de webhook. */
export type DeliveryOutcome = 'DELIVERED' | 'FAILED';

/** Cuerpo de `POST /integration/webhooks/{subscriptionId}/deliveries` (UC-31-09). */
export class DeliverWebhookDto {
  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Resultado de la entrega (por defecto DELIVERED)',
    enum: ['DELIVERED', 'FAILED'],
  })
  @IsOptional()
  @IsIn(['DELIVERED', 'FAILED'])
  outcome?: DeliveryOutcome;

  /**
   * Valor de signature algorithm mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Algoritmo de firma HMAC',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  signatureAlgorithm?: string;

  /**
   * Valor de signature verified mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'true si la firma se verificó correctamente',
  })
  @IsOptional()
  @IsBoolean()
  signatureVerified?: boolean;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({
    description: 'Correlación con el evento de negocio',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  /**
   * Valor de request hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del payload entregado',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  requestHash?: string;

  /**
   * Valor de acknowledged mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'true si el receptor confirmó la recepción (ACK)',
  })
  @IsOptional()
  @IsBoolean()
  acknowledged?: boolean;
}
