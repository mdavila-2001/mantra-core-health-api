import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Tipos de factor MFA soportados. */
export type FactorType = 'TOTP' | 'WEBAUTHN';

/**
 * Cuerpo de `POST /iam/users/:id/mfa-factors` (UC-01-03).
 *
 * Sirve para dos operaciones: enrolar un factor nuevo (`factorType`) o verificar
 * uno existente (`verify: true` + `factorId`). El servicio valida la combinación.
 */
export class MfaFactorDto {
  @ApiPropertyOptional({ description: 'Tipo de factor a enrolar', enum: ['TOTP', 'WEBAUTHN'] })
  @IsOptional()
  @IsIn(['TOTP', 'WEBAUTHN'])
  factorType?: FactorType;

  @ApiPropertyOptional({ description: 'Etiqueta legible del factor' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @ApiPropertyOptional({ description: 'Si es true, verifica el factor indicado' })
  @IsOptional()
  @IsBoolean()
  verify?: boolean;

  @ApiPropertyOptional({ description: 'Factor a verificar', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  factorId?: string;
}
