import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Plataformas de dispositivo soportadas. */
export type DevicePlatform = 'IOS' | 'ANDROID' | 'WEB';

/** Cuerpo de `POST /iam/users/:id/devices` (UC-01-05). */
export class CreateDeviceDto {
  /**
   * Valor de device fingerprint mantenido por la instancia.
   */
  @ApiProperty({ description: 'Huella única del dispositivo' })
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  deviceFingerprint!: string;

  /**
   * Valor de platform mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Plataforma',
    enum: ['IOS', 'ANDROID', 'WEB'],
  })
  @IsOptional()
  @IsIn(['IOS', 'ANDROID', 'WEB'])
  platform?: DevicePlatform;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre legible del dispositivo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  /**
   * Valor de trust mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Marcar el dispositivo como de confianza',
  })
  @IsOptional()
  @IsBoolean()
  trust?: boolean;
}
