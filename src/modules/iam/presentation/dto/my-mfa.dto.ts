import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** Cuerpo de `POST /iam/me/mfa/totp`: empieza el alta de la app autenticadora. */
export class StartMyTotpDto {
  /** Nombre del factor para reconocerlo después («Teléfono personal»). */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  /**
   * Reautenticación: contraseña actual. Hace falta ella o `mfaCode`; sin
   * ninguna, 422 `MFA_REAUTH_REQUIRED`.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;

  /** Reautenticación: código vigente de un factor YA verificado. */
  @ApiPropertyOptional({ example: '123456', minLength: 6, maxLength: 8 })
  @IsOptional()
  @IsString()
  @Length(6, 8)
  mfaCode?: string;
}

/** Cuerpo de `POST /iam/me/mfa/:factorId/revoke`: reautentica el retiro de un factor. */
export class RevokeMyMfaDto {
  /** Reautenticación: contraseña actual. Hace falta ella o `mfaCode`. */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;

  /** Reautenticación: código vigente de un factor YA verificado. */
  @ApiPropertyOptional({ example: '123456', minLength: 6, maxLength: 8 })
  @IsOptional()
  @IsString()
  @Length(6, 8)
  mfaCode?: string;
}

/** Resultado de retirar un factor propio. */
export class RevokeMyMfaResultDto {
  /** Siempre `true`. */
  @ApiProperty()
  revoked!: boolean;

  /** ¿Le quedan factores confirmados? Sin ninguno, el segundo paso queda apagado. */
  @ApiProperty()
  remainingVerified!: number;
}

/** Cuerpo de `POST /iam/me/mfa/totp/:factorId/confirm`. */
export class ConfirmMyTotpDto {
  /** Código vigente de la app autenticadora. */
  @ApiProperty({ example: '123456', minLength: 6, maxLength: 8 })
  @IsString()
  @Length(6, 8)
  code!: string;
}

/** Un factor de segundo paso de la propia cuenta; nunca incluye el secreto. */
export class MyMfaFactorDto {
  /** Identificador del factor. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** `TOTP` o `WEBAUTHN`. */
  @ApiProperty({ enum: ['TOTP', 'WEBAUTHN', 'UNKNOWN'] })
  type!: string;

  /** `PENDING` (sin confirmar), `VERIFIED` o `REVOKED`. */
  @ApiProperty({ enum: ['PENDING', 'VERIFIED', 'REVOKED', 'UNKNOWN'] })
  state!: string;

  /** Nombre del factor. */
  @ApiPropertyOptional()
  label?: string;

  /** Cuándo se confirmó. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  verifiedAt?: Date;

  /** Cuándo se dio de alta. */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Estado del segundo paso de la propia cuenta. */
export class MyMfaStatusDto {
  /** ¿Alguna política de sus organizaciones le exige el segundo paso? */
  @ApiProperty()
  required!: boolean;

  /** ¿Tiene al menos un factor confirmado? */
  @ApiProperty()
  enrolled!: boolean;

  /** `required` sin `enrolled`: debe dar de alta un factor. */
  @ApiProperty()
  enrollmentRequired!: boolean;

  /** Sus factores, de más reciente a más antiguo. */
  @ApiProperty({ type: [MyMfaFactorDto] })
  factors!: MyMfaFactorDto[];
}

/** Resultado de confirmar un factor. */
export class ConfirmMyTotpResultDto {
  /** Siempre `true`: con un código inválido la respuesta es 422. */
  @ApiProperty()
  verified!: boolean;

  /** Factor confirmado. */
  @ApiProperty({ format: 'uuid' })
  factorId!: string;

  /** Cuándo se confirmó. */
  @ApiProperty({ type: String, format: 'date-time' })
  verifiedAt!: Date;
}
