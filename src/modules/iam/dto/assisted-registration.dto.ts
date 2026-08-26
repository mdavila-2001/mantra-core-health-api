import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * Cuerpo de `POST /iam/users/assisted-registration` (C-18 / CAN-IDENT).
 *
 * Un clínico/organización crea la cuenta de un paciente que no puede hacerlo por
 * sí mismo. NO se envía ninguna contraseña: el titular la fijará al activar. El
 * `email` actúa como identificador verificado para evitar duplicados.
 *
 * El nombre se declara en partes, como en el resto de las altas. Ojo: esta vía
 * crea la cuenta y nada más —no hay fila en `profiles.persons`—, así que las
 * partes sólo sobreviven compuestas en `iam.users.display_name`; la persona se
 * registra después, cuando el titular completa su perfil.
 */
export class AssistedRegistrationDto {
  /**
   * Nombre de pila del paciente.
   *
   * Obligatorio salvo que se envíe `displayName`, que es la forma anterior de
   * declarar el nombre y se sigue aceptando para no romper a quien ya la usa.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Lucía' })
  @ValidateIf((dto: AssistedRegistrationDto) => dto.displayName === undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  /**
   * Segundo nombre. Opcional: mucha gente no tiene.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Andrea' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  /**
   * Apellido paterno. Mismo criterio que `name`.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Mamani' })
  @ValidateIf((dto: AssistedRegistrationDto) => dto.displayName === undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  /**
   * Apellido materno. Opcional: no todas las jurisdicciones lo emiten.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Quispe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLastName?: string;

  /**
   * Nombre ya compuesto, para mostrar.
   *
   * Dejó de ser la forma de declarar el nombre —ahora se envían sus partes— pero
   * sigue siendo opcional en vez de prohibido: quitarlo de golpe rompería a todo
   * cliente que ya integró contra este endpoint. Si viene, manda tal cual; si no,
   * se compone con las partes.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Forma anterior de declarar el nombre. Preferí name/lastName.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName?: string;

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
