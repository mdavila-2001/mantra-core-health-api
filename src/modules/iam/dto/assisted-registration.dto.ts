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
  @ApiProperty({ description: 'Nombre visible del paciente', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  @ApiProperty({
    description: 'Identificador verificado (email) que actúa como identidad de login',
    format: 'email',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    description: 'Motivo del registro asistido (queda en la trazabilidad C-18)',
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ description: 'Zona horaria IANA del paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional({
    description:
      'Id de la representación legal formal (authz.patient_legal_representations)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  legalRepresentationId?: string;

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
  @ApiProperty({ description: 'Id de la cuenta creada', format: 'uuid' })
  userId!: string;

  @ApiProperty({
    description:
      'Token de activación de un solo uso (entregar al titular por canal seguro)',
  })
  activationToken!: string;

  @ApiProperty({ description: 'Caducidad del token de activación' })
  activationExpiresAt!: Date;

  @ApiProperty({
    description: 'Estado de la cuenta (pendiente de activación)',
    example: 'PENDING_ACTIVATION',
  })
  status!: string;
}
