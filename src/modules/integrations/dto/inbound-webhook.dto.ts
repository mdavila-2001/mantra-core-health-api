import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /integrations/webhooks/inbound` (UC-12-09). */
export class InboundWebhookDto {
  /**
   * Identificador asociado a connection.
   */
  @ApiProperty({
    description: 'Conexión que identifica al tenant/proveedor',
    format: 'uuid',
  })
  @IsUUID()
  connectionId!: string;

  /**
   * Identificador asociado a endpoint.
   */
  @ApiPropertyOptional({
    description: 'Endpoint de integración asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  endpointId?: string;

  /**
   * Identificador asociado a correlation.
   */
  @ApiPropertyOptional({
    description: 'Correlación para casar con un mensaje saliente',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  correlationId?: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Payload entregado por el proveedor' })
  @IsObject()
  payloadJson!: Record<string, unknown>;

  /**
   * Valor de signature mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Firma HMAC de la entrega (idempotencia)',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  signature?: string;
}
