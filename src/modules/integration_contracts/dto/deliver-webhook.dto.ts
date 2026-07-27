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
  @ApiPropertyOptional({
    description: 'Resultado de la entrega (por defecto DELIVERED)',
    enum: ['DELIVERED', 'FAILED'],
  })
  @IsOptional()
  @IsIn(['DELIVERED', 'FAILED'])
  outcome?: DeliveryOutcome;

  @ApiPropertyOptional({
    description: 'Algoritmo de firma HMAC',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  signatureAlgorithm?: string;

  @ApiPropertyOptional({
    description: 'true si la firma se verificó correctamente',
  })
  @IsOptional()
  @IsBoolean()
  signatureVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Correlación con el evento de negocio',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  @ApiPropertyOptional({
    description: 'Hash del payload entregado',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  requestHash?: string;

  @ApiPropertyOptional({
    description: 'true si el receptor confirmó la recepción (ACK)',
  })
  @IsOptional()
  @IsBoolean()
  acknowledged?: boolean;
}
