import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Cambio de contraseña de la propia cuenta (ID-24). */
export class ChangePasswordDto {
  /**
   * Contraseña vigente, para confirmar que quien pide el cambio es el titular.
   */
  @ApiProperty({ description: 'Contraseña actual', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  currentPassword!: string;

  /**
   * Contraseña nueva; mismo mínimo que el restablecimiento por correo.
   */
  @ApiProperty({
    description: 'Contraseña nueva',
    minLength: 8,
    maxLength: 200,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  newPassword!: string;
}

/** Resultado del cambio de contraseña. */
export class ChangePasswordResultDto {
  /**
   * Sesiones distintas de la actual que se cerraron.
   */
  @ApiProperty({ description: 'Nº de las otras sesiones que se revocaron' })
  revokedSessions!: number;
}

/** Una sesión abierta de la propia cuenta. */
export class MySessionDto {
  /**
   * Identificador de la sesión (el que se pasa a `revoke`).
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Alta de la sesión.
   */
  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  /**
   * Vencimiento de la sesión.
   */
  @ApiProperty({ format: 'date-time' })
  expiresAt!: Date;

  /**
   * Dirección IP con la que se abrió.
   */
  @ApiPropertyOptional()
  ip?: string;

  /**
   * Si es la sesión desde la que se hace la consulta.
   */
  @ApiProperty()
  current!: boolean;
}

/** Resultado de revocar una sesión propia. */
export class RevokeMySessionResultDto {
  /**
   * `false` si la sesión ya no estaba activa (no es un error).
   */
  @ApiProperty()
  revoked!: boolean;
}
