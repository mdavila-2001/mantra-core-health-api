import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ADMIN_GENDER_CODES,
  BIRTH_SEX_CODES,
  type AdministrativeGenderCode,
  type BirthSexCode,
} from '../../profiles/profiles.concepts';

/**
 * Cuerpo de `POST /iam/auth/register-practitioner`.
 *
 * El profesional se da de alta **él mismo**, sin que un administrador lo cree:
 * aporta su cuenta, sus datos de persona y los de su licencia. La licencia nace
 * PENDIENTE de verificación —igual que la organización en su propio auto-registro—
 * así que registrarse no equivale a estar habilitado para ejercer: es la
 * plataforma la que valida la matrícula antes de que el perfil pueda atender.
 *
 * El identificador de login es el **correo**, como en el alta del owner de una
 * organización. El documento de identidad es opcional y se guarda como
 * identificador oficial de la persona.
 */
export class RegisterPractitionerDto {
  /**
   * Correo con el que el profesional iniciará sesión.
   */
  @ApiProperty({
    description: 'Correo que actúa como identidad de login',
    format: 'email',
    maxLength: 320,
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Contraseña en claro; se persiste sólo su hash argon2id.
   */
  @ApiProperty({ minLength: 8, maxLength: 200 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  /**
   * Nombre visible de la cuenta y de la persona.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  /**
   * Número de matrícula/licencia profesional.
   */
  @ApiProperty({
    description: 'Número de licencia o matrícula profesional',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  licenseNumber!: string;

  /**
   * Número del título o credencial que respalda la licencia.
   */
  @ApiProperty({
    description: 'Número del título profesional que respalda la licencia',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  credentialNumber!: string;

  /**
   * Autoridad que emitió la licencia (colegio, ministerio, junta).
   */
  @ApiPropertyOptional({
    description: 'Autoridad reguladora que emitió la licencia',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  regulatoryAuthority?: string;

  /**
   * Título profesional visible (p. ej. "Dra.", "Lic.").
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  professionalTitle?: string;

  /**
   * Documento de identidad. Opcional: se guarda como identificador oficial de
   * la persona, no como credencial de login.
   */
  @ApiPropertyOptional({
    description:
      'Documento de identidad (se guarda como identificador oficial)',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9.-]+$/, {
    message: 'El documento sólo admite letras, dígitos, punto y guion',
  })
  nationalId?: string;

  /**
   * Teléfono de contacto profesional.
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
   * Fecha de nacimiento en ISO-8601.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

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
   * Sexo asignado al nacer por código legible.
   */
  @ApiPropertyOptional({
    enum: BIRTH_SEX_CODES,
    description: 'Sexo asignado al nacer',
  })
  @IsOptional()
  @IsIn(BIRTH_SEX_CODES)
  sexAtBirth?: BirthSexCode;

  /**
   * Categoría profesional del catálogo (médico, enfermería, …). Si falta, se
   * usa la categoría general.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerCategoryConceptId?: string;

  /**
   * Jurisdicción de la licencia. Si falta, se asume la nacional.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Tipo de credencial aportada. Si falta, se asume título de grado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  credentialTypeConceptId?: string;

  /**
   * Idioma de atención. Si falta, se asume español.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  languageConceptId?: string;

  /**
   * Si el profesional acepta pacientes nuevos de entrada. Por defecto `false`:
   * hasta que su licencia se verifique no debería aparecer como disponible.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  acceptsNewPatients?: boolean;

  /**
   * Zona horaria IANA.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}

/** Resultado del auto-registro de un profesional de salud. */
export class RegisterPractitionerResponseDto {
  /**
   * Cuenta creada, con la que ya puede iniciar sesión.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Persona creada para el profesional.
   */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /**
   * Perfil profesional (comparte id con la persona).
   */
  @ApiProperty({ format: 'uuid' })
  practitionerProfileId!: string;

  /**
   * Código interno asignado al profesional.
   */
  @ApiProperty()
  practitionerCode!: string;

  /**
   * Licencia registrada, pendiente de verificación por la plataforma.
   */
  @ApiProperty({ format: 'uuid' })
  licenseId!: string;

  /**
   * Estado de verificación del perfil al terminar el alta. Siempre PENDING:
   * registrarse no habilita a ejercer.
   */
  @ApiProperty({ example: 'PENDING' })
  verificationStatus!: string;

  /**
   * Si se pudo encolar el correo de verificación.
   */
  @ApiProperty()
  emailVerificationSent!: boolean;
}
