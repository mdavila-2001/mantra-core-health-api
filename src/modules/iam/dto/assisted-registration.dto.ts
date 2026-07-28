import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /iam/users/assisted-registration` (C-18 / CAN-IDENT).
 *
 * Un clínico/organización crea la cuenta de un paciente que no puede hacerlo por
 * sí mismo. NO se envía ninguna contraseña: el titular la fijará al activar. El
 * `email` actúa como identificador verificado para evitar duplicados.
 */
export class AssistedRegistrationDto {
  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre visible del paciente', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  /**
   * Valor de email mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Identificador verificado (email) que actúa como identidad de login',
    format: 'email',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Motivo del registro asistido (queda en la trazabilidad C-18)',
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Zona horaria IANA del paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Identificador asociado a legal representation.
   */
  @ApiPropertyOptional({
    description:
      'Id de la representación legal formal (authz.patient_legal_representations)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  legalRepresentationId?: string;

  /**
   * Identificador asociado a legal representative user.
   */
  @ApiPropertyOptional({
    description:
      'Id del usuario representante legal (dato mínimo si no hay representación formal)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  legalRepresentativeUserId?: string;
}

/**
 * Respuesta de `POST /iam/users/assisted-registration`. Devuelve el token de
 * activación de un solo uso para entregarlo al titular por un canal seguro.
 * NUNCA contiene una contraseña.
 */
export class AssistedRegistrationResponseDto {
  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ description: 'Id de la cuenta creada', format: 'uuid' })
  userId!: string;

  /**
   * Valor de activation token mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Token de activación de un solo uso (entregar al titular por canal seguro)',
  })
  activationToken!: string;

  /**
   * Valor de activation expires at mantenido por la instancia.
   */
  @ApiProperty({ description: 'Caducidad del token de activación' })
  activationExpiresAt!: Date;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado de la cuenta (pendiente de activación)',
    example: 'PENDING_ACTIVATION',
  })
  status!: string;
}
