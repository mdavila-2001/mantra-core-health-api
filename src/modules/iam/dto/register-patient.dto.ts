import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /iam/auth/register-patient`.
 *
 * El identificador de la cuenta es el **documento de identidad**, no el correo:
 * el correo es opcional y sólo sirve para poder contactar al titular y, si lo
 * aporta, verificarlo. No verificarlo no bloquea nada.
 */
export class RegisterPatientDto {
  /**
   * Documento de identidad (CI) con el que el paciente iniciará sesión.
   */
  @ApiProperty({
    description: 'Documento de identidad con el que se iniciará sesión',
    maxLength: 40,
  })
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  // Sólo caracteres de un documento: dígitos, letras y separadores habituales.
  // Evita que el identificador de login acepte espacios o control.
  @Matches(/^[A-Za-z0-9.\-]+$/, {
    message: 'El documento sólo admite letras, dígitos, punto y guion',
  })
  nationalId!: string;

  /**
   * Valor de password mantenido por la instancia.
   */
  @ApiProperty({ minLength: 8, maxLength: 200 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  /**
   * Correo opcional. Si viene, se emite un token de verificación.
   */
  @ApiPropertyOptional({ format: 'email', maxLength: 320 })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  /**
   * Valor de birth date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  /**
   * Identificador asociado a administrative gender concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  administrativeGenderConceptId?: string;

  /**
   * Identificador asociado a sex at birth concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sexAtBirthConceptId?: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}

/** Resultado del auto-registro de un paciente. */
export class RegisterPatientResponseDto {
  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Identificador asociado a person.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Código de paciente generado para el perfil.
   */
  @ApiProperty()
  patientCode!: string;

  /**
   * Si se encoló un correo de verificación. `false` cuando no se aportó correo.
   */
  @ApiProperty({
    description:
      'Si se encoló el correo de verificación. La cuenta es usable igual.',
  })
  emailVerificationSent!: boolean;
}

/** Cuerpo de `POST /iam/auth/verify-email`. */
export class VerifyEmailDto {
  /**
   * Token recibido por correo.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  token!: string;
}

/** Resultado de consumir un token de verificación de correo. */
export class VerifyEmailResponseDto {
  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Valor de email verified mantenido por la instancia.
   */
  @ApiProperty()
  emailVerified!: boolean;
}
