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
  @ApiProperty({
    description: 'Conexión que identifica al tenant/proveedor',
    format: 'uuid',
  })
  @IsUUID()
  connectionId!: string;

  @ApiPropertyOptional({
    description: 'Endpoint de integración asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  endpointId?: string;

  @ApiPropertyOptional({
    description: 'Correlación para casar con un mensaje saliente',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  correlationId?: string;

  @ApiProperty({ description: 'Payload entregado por el proveedor' })
  @IsObject()
  payloadJson!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Firma HMAC de la entrega (idempotencia)',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  signature?: string;
}
