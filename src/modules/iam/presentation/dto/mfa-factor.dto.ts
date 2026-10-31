import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
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
  /**
   * Valor de factor type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de factor a enrolar',
    enum: ['TOTP', 'WEBAUTHN'],
  })
  @IsOptional()
  @IsIn(['TOTP', 'WEBAUTHN'])
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

  /**
   * Reautenticación al dar de alta un factor PROPIO: la contraseña actual. Con un
   * token robado nadie añade su propio segundo factor sin conocerla (o sin un
   * código de un factor ya verificado, `mfaCode`).
   */
  @ApiPropertyOptional({
    description:
      'Contraseña actual (o `mfaCode`): obligatoria para dar de alta un factor propio',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;

  /** Código vigente de un factor YA verificado, como alternativa a la contraseña. */
  @ApiPropertyOptional({
    description:
      'Código de un factor ya verificado (o `currentPassword`): reautentica el alta de un factor propio',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Length(6, 8)
  mfaCode?: string;
}
