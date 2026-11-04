import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

/** One device the account signed in from (`GET /iam/me/devices`). */
export class MyDeviceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Nombre legible: «Chrome en Windows»' })
  name!: string;

  @ApiPropertyOptional({ enum: ['WEB', 'IOS', 'ANDROID'] })
  platform?: 'WEB' | 'IOS' | 'ANDROID';

  @ApiProperty({ description: 'Verificado por el titular' })
  trusted!: boolean;

  @ApiProperty({ description: 'Es el dispositivo de esta sesión' })
  current!: boolean;

  @ApiProperty({ description: 'Sesiones abiertas desde este dispositivo' })
  activeSessions!: number;

  @ApiPropertyOptional({ format: 'date-time' })
  lastSeenAt?: Date;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

/** `POST /iam/me/devices/:id/confirm` body. */
export class ConfirmDeviceDto {
  /** 8-digit code mailed by `confirm-code`. */
  @ApiPropertyOptional({ minLength: 8, maxLength: 8 })
  @IsOptional()
  @IsString()
  @Length(8, 8)
  code?: string;
}

/** `POST /iam/me/devices/:id/confirm` result. */
export class DeviceConfirmedDto {
  @ApiProperty()
  confirmed!: boolean;

  @ApiProperty({ format: 'uuid' })
  deviceId!: string;
}

/** `POST /iam/me/devices/:id/confirm-code` result. */
export class DeviceCodeRequestedDto {
  @ApiProperty({ description: '`false` si ya era de confianza' })
  sent!: boolean;

  @ApiPropertyOptional({
    description: 'Dirección enmascarada: j***@correo.com',
  })
  sentTo?: string;
}
