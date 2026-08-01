import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Solicitud de restablecimiento (UC-01-13).
 *
 * El identificador es el mismo que se usa para entrar: correo o documento. Se
 * acepta uno solo y sin discriminar cuál, porque la respuesta es idéntica en
 * todos los casos y no hace falta ramificar el contrato para algo que el
 * servidor resuelve mirando la credencial.
 */
export class ForgotPasswordDto {
  /**
   * Identificador de acceso con el que se pide el restablecimiento.
   */
  @ApiProperty({
    description: 'Correo o documento con el que la persona inicia sesión',
    maxLength: 320,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  identifier!: string;
}

/**
 * Respuesta de la solicitud.
 *
 * Deliberadamente **no dice si la cuenta existe**. Un «no encontramos ese
 * correo» convierte el formulario de recuperación en un oráculo que confirma
 * qué direcciones están registradas en una plataforma de salud, que es
 * exactamente el dato que no se debe regalar.
 */
export class ForgotPasswordResponseDto {
  /**
   * Mensaje que el cliente muestra tal cual.
   */
  @ApiProperty({
    description:
      'Mensaje neutro, idéntico exista o no la cuenta, para no confirmar registros',
  })
  message!: string;
}

/** Consumo del token recibido por correo (UC-01-13). */
export class ResetPasswordDto {
  /**
   * Token en claro, tal como llegó en el correo.
   */
  @ApiProperty({ description: 'Token recibido por correo', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token!: string;

  /**
   * Contraseña nueva.
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

/** Resultado del restablecimiento. */
export class ResetPasswordResponseDto {
  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid', description: 'Usuario cuya clave cambió' })
  userId!: string;

  /**
   * Sesiones que se cerraron al cambiar la contraseña.
   */
  @ApiProperty({
    description:
      'Sesiones revocadas: cambiar la clave cierra todas las sesiones abiertas',
  })
  revokedSessions!: number;
}
