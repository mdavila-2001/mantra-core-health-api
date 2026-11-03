import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Cuerpo de `POST /iam/auth/resend-verification`.
 *
 * Se pide el mismo identificador con el que la persona inicia sesión —correo o
 * documento— y no el correo de destino: dejar elegir a dónde se manda el enlace
 * convertiría el formulario en un modo de enviar tokens de una cuenta ajena a
 * una bandeja propia.
 */
export class ResendVerificationDto {
  /**
   * Correo o documento de identidad con el que la persona inicia sesión.
   */
  @ApiProperty({
    description:
      'Correo o documento de identidad con el que la persona inicia sesión',
    maxLength: 320,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(320)
  identifier!: string;
}

/** Respuesta del reenvío: siempre la misma, exista o no la cuenta. */
export class ResendVerificationResponseDto {
  /**
   * Mensaje neutro, idéntico en todos los casos.
   */
  @ApiProperty({
    example:
      'Si el identificador corresponde a una cuenta con correo pendiente de verificar, enviamos un enlace nuevo.',
  })
  message!: string;
}
