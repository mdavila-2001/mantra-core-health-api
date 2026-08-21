import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  ADMIN_GENDER_CODES,
  BIRTH_SEX_CODES,
  type AdministrativeGenderCode,
  type BirthSexCode,
} from '../../profiles/profiles.concepts';

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
  @Matches(/^[A-Za-z0-9.-]+$/, {
    message: 'El documento sólo admite letras, dígitos, punto y guion',
  })
  nationalId!: string;

  /**
   * Departamento que emitió el documento (miembro de `VS_BO_DEPARTMENT`): la
   * terminación LP/CB/SC/... que evita confundir cédulas homónimas de
   * departamentos distintos (backlog T-01).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Departamento emisor del documento (catálogo VS_BO_DEPARTMENT)',
  })
  @IsOptional()
  @IsUUID()
  issuerAdministrativeAreaConceptId?: string;

  /**
   * Valor de password mantenido por la instancia.
   */
  @ApiProperty({ minLength: 8, maxLength: 200 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  /**
   * Nombre de pila.
   *
   * Obligatorio salvo que se envíe `displayName`, que es la forma anterior de
   * declarar el nombre y se sigue aceptando para no romper a quien ya la usa.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Lucía' })
  @ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)
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
  @ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)
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
   * Teléfono de contacto. Se guarda como punto de contacto de la persona; que
   * esté verificado o no es independiente (`iam.users.phone_verified`).
   */
  @ApiPropertyOptional({
    description: 'Teléfono de contacto en formato E.164 o nacional',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[+]?[0-9 ()-]{6,}$/, {
    message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion',
  })
  phone?: string;

  /**
   * Ocupación, miembro de `VS_SEGIP_OCCUPATION` (backlog T-02).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ocupación del catálogo (VS_SEGIP_OCCUPATION)',
  })
  @IsOptional()
  @IsUUID()
  occupationConceptId?: string;

  /**
   * Ocupación en texto libre, para cuando no está en el catálogo. Se ignora
   * si viene `occupationConceptId`.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Ocupación en texto libre, para cuando no está en el catálogo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  occupationFreeText?: string;

  /**
   * Género administrativo por código legible.
   */
  @ApiPropertyOptional({
    enum: ADMIN_GENDER_CODES,
    description: 'Género administrativo (HL7 AdministrativeGender)',
  })
  @IsOptional()
  @IsIn(ADMIN_GENDER_CODES)
  gender?: AdministrativeGenderCode;

  /**
   * Sexo asignado al nacer por código legible. Es un dato clínico distinto del
   * género: condiciona rangos de referencia y tamizajes.
   */
  @ApiPropertyOptional({
    enum: BIRTH_SEX_CODES,
    description: 'Sexo asignado al nacer',
  })
  @IsOptional()
  @IsIn(BIRTH_SEX_CODES)
  sexAtBirth?: BirthSexCode;

  /**
   * Escape hatch para clientes que ya conocen el catálogo de terminología. Si
   * viene, gana sobre `gender`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  administrativeGenderConceptId?: string;

  /**
   * Escape hatch equivalente para el sexo al nacer. Si viene, gana sobre
   * `sexAtBirth`.
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
