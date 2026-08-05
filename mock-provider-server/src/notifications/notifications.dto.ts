import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Cuerpo de `POST /notifications/send`. Refleja lo que un gateway real
 * recibe — `channel` es texto libre (no un enum cerrado) porque el worker
 * real (`NotificationDeliveryJob`) sólo conoce el `channelId` (uuid de
 * `messaging.message_channels`) del mensaje, no su tipo; forzar aquí un
 * enum SMS/EMAIL/PUSH exigiría resolverlo primero, y este emulador no tiene
 * ese catálogo.
 */
export class SendNotificationDto {
  @ApiProperty({
    description:
      'Tipo o id de canal (SMS, EMAIL, o el channelId real del worker)',
  })
  @IsString()
  @MaxLength(200)
  channel!: string;

  @ApiProperty({
    description:
      'Dirección del destinatario (teléfono, email, device token, ...)',
  })
  @IsString()
  @MaxLength(500)
  to!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ description: 'Cuerpo ya renderizado del mensaje' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({
    description:
      'Metadatos libres que el caller quiera ver reflejados en la respuesta',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SendNotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['SENT', 'FAILED'] })
  outcome!: 'SENT' | 'FAILED';

  @ApiPropertyOptional()
  providerMessageRef?: string;

  @ApiPropertyOptional()
  errorCode?: string;

  @ApiPropertyOptional()
  errorText?: string;
}
