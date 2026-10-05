import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

/** Tipos de factor MFA soportados. */
export enum FactorType {
  TOTP = 'TOTP',
  WEBAUTHN = 'WEBAUTHN',
}

/**
 * Cuerpo de `POST /iam/users/:id/mfa-factors` (UC-01-03).
 *
 * Sirve para dos operaciones: enrolar un factor nuevo (`factorType`) o verificar
 * uno existente (`verify: true` + `factorId`). El servicio valida la combinación.
 */
export class MfaFactorDto {
  /**
   * Valor de factor type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de factor a enrolar',
    enum: FactorType,
  })
  @IsOptional()
  @IsEnum(FactorType)
  factorType?: FactorType;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Etiqueta legible del factor' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  /**
   * Valor de verify mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Si es true, verifica el factor indicado',
  })
  @IsOptional()
  @IsBoolean()
  verify?: boolean;

  /**
   * Identificador asociado a factor.
   */
  @ApiPropertyOptional({ description: 'Factor a verificar', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  factorId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Código TOTP de la app autenticadora. Obligatorio cuando verify=true.',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Length(6, 8)
  code?: string;
}
