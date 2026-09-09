import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
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
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ADMIN_GENDER_CODES,
  BIRTH_SEX_CODES,
  type AdministrativeGenderCode,
  type BirthSexCode,
} from '../../profiles/profiles.concepts';
import {
  EMPLOYER_FREE_TEXT_MAX_LENGTH,
  OCCUPATION_FREE_TEXT_MAX_LENGTH,
} from './register-patient.dto';
// Import de valor (no `import type`): `@Type(() => CreateOwnSiteDto)` necesita
// la clase en runtime para instanciar el anidado antes de validarlo. Se
// importa el archivo hoja, no el barrel de `practice/dto`, para no arrastrar
// DTOs ajenos a este alta.
import { CreateOwnSiteDto } from '../../practice/dto/create-own-site.dto';

/** Formato aceptado por los cuatro campos telefónicos del alta. */
const PHONE_PATTERN = /^[+]?[0-9 ()-]{6,}$/;

/** Mensaje único para los cuatro campos telefónicos del alta. */
const PHONE_PATTERN_MESSAGE =
  'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion';

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
   * Correo de trabajo, con el que el profesional iniciará sesión.
   *
   * Es el **correo de trabajo** y a la vez la identidad de login: así se venía
   * grabando ya (`CONTACT_USE_WORK`) y así lo confirmó el propietario al pedir
   * los dos correos separados. El personal viaja en {@link personalEmail} y no
   * sirve para entrar.
   */
  @ApiProperty({
    description: 'Correo de trabajo; es la identidad de login del profesional',
    format: 'email',
    maxLength: 320,
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Correo personal, distinto del de trabajo con el que se entra.
   */
  @ApiPropertyOptional({
    description: 'Correo personal; no sirve para iniciar sesión',
    format: 'email',
    maxLength: 320,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  personalEmail?: string;

  /**
   * Contraseña en claro; se persiste sólo su hash argon2id.
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
  @ApiPropertyOptional({ maxLength: 100, example: 'Ana' })
  @ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  /**
   * Segundo nombre. Opcional: mucha gente no tiene.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Lucía' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  /**
   * Apellido paterno. Mismo criterio que `name`.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Rojas' })
  @ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  /**
   * Apellido materno. Opcional: no todas las jurisdicciones lo emiten.
   */
  @ApiPropertyOptional({ maxLength: 100, example: 'Paz' })
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
   *
   * Dejó de ser obligatorio. Era el único lugar donde entraba el «segundo
   * número» del alta y por eso terminaba recibiendo lo que no era un título:
   * el registro del SEDES viajaba acá y se archivaba como
   * `CREDENTIAL_TYPE_DEGREE`, así que el perfil lo mostraba como «Título
   * universitario». Para eso está ahora {@link sedesLicenseNumber}; este campo
   * queda para lo que su nombre dice —un título de grado— y sigue aceptándose
   * para no romper a quien ya integró contra este endpoint.
   */
  @ApiPropertyOptional({
    description: 'Número del título profesional que respalda la licencia',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  credentialNumber?: string;

  /**
   * Registro departamental del SEDES — el «T.I. 538/14» del padrón.
   *
   * Es una **habilitación**, no formación: el SEDES autoriza a ejercer en su
   * departamento igual que la matrícula del Ministerio autoriza en todo el
   * país. Por eso nace como una segunda fila de
   * `profiles.jurisdiction_authorizations` con jurisdicción
   * `JURISDICTION_SEDES_SANTA_CRUZ`, y el perfil la muestra al lado de la
   * matrícula nacional en vez de enterrarla en «Formación».
   */
  @ApiPropertyOptional({
    description: 'Número de registro del SEDES departamental',
    maxLength: 100,
    example: 'T.I. 538/14',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sedesLicenseNumber?: string;

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
   * Fecha de inscripción de la matrícula (ISO `YYYY-MM-DD`). Es el `valid_from`
   * de la autorización jurisdiccional: sin esto la única forma de declararla era
   * agregar una segunda autorización después del alta.
   */
  @ApiPropertyOptional({
    description: 'Fecha de inscripción de la matrícula (ISO)',
    format: 'date',
  })
  @IsOptional()
  @IsISO8601()
  licenseIssueDate?: string;

  /**
   * Título profesional visible (p. ej. "Dra.", "Lic.").
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  professionalTitle?: string;

  /**
   * Las especialidades que declara, elegidas EN el alta.
   *
   * El registro del cliente lo pide así (módulo Médico §1.4.2: «3 espacios
   * adicionales a la profesión»), y hasta acá el alta no las aceptaba: la
   * pantalla decía «se elige después, desde el perfil» y la mayoría no volvía —
   * la Guía mostraba profesionales sin especialidad. La primera de la lista
   * queda como principal, igual que en el alta administrativa.
   *
   * Cada uuid se valida contra `VS_MEDICAL_SPECIALTY` dentro de la transacción:
   * la FK acepta cualquier concepto del catálogo, y quién decide cuáles son
   * especialidades es el value set, no el formato.
   */
  @ApiPropertyOptional({
    description:
      'Especialidades declaradas (hasta 3). La primera queda como principal.',
    type: [String],
    format: 'uuid',
    maxItems: 3,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsUUID(undefined, { each: true })
  specialtyConceptIds?: string[];

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
   * Departamento que emitió el documento (miembro de `VS_BO_DEPARTMENT`).
   *
   * Mismo campo, mismo catálogo y mismo destino que en `RegisterPatientDto`: la
   * terminación LP/CB/SC… que distingue cédulas homónimas de departamentos
   * distintos (backlog T-01). Faltaba sólo acá, y el formulario de alta de
   * profesional **ya lo mandaba**: con `forbidNonWhitelisted` la petición volvía
   * `400 property issuerAdministrativeAreaConceptId should not exist`, así que
   * elegir el departamento rompía el alta entera en vez de enriquecerla.
   *
   * Se ignora sin `nationalId`: sin documento no hay identificador al que
   * atarle un departamento de emisión.
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
   * Municipio de residencia (miembro de `VS_BO_MUNICIPALITY`).
   *
   * **Sólo el municipio, sin el departamento.** El código del INE de un
   * municipio lleva adentro el de su departamento, así que el departamento se
   * deriva acá y no se recibe: un par (departamento, municipio) enviado por el
   * cliente puede llegar incoherente —el municipio de un departamento con el
   * departamento de otro— y no habría forma de saber cuál de los dos es el que
   * la persona quiso decir.
   *
   * Es opcional, como el resto del domicilio: nadie queda fuera del alta por no
   * decir dónde vive.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Municipio de residencia (catálogo VS_BO_MUNICIPALITY)',
  })
  @IsOptional()
  @IsUUID()
  residenceMunicipalityConceptId?: string;

  /**
   * Forma anterior de declarar el teléfono del trabajo.
   *
   * Dejó de ser la única forma de declarar un teléfono —ahora son tres campos
   * separados— pero sigue siendo opcional en vez de prohibido: quitarlo de golpe
   * rompería a todo cliente que ya integró contra este endpoint. Se sigue
   * guardando donde siempre (`PHONE` con uso de trabajo), que es el lugar de
   * {@link workLandline}: reinterpretarlo como celular cambiaría el significado
   * de las filas ya escritas. Si llegan los dos, manda el campo nuevo.
   */
  @ApiPropertyOptional({
    description:
      'Forma anterior de declarar el teléfono del trabajo. Preferí workLandline o workMobilePhone.',
    maxLength: 40,
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })
  phone?: string;

  /**
   * Celular personal o privado del profesional.
   */
  @ApiPropertyOptional({
    description: 'Celular personal en formato E.164 o nacional',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })
  mobilePhone?: string;

  /**
   * Celular del lugar de trabajo.
   */
  @ApiPropertyOptional({
    description: 'Celular de trabajo en formato E.164 o nacional',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })
  workMobilePhone?: string;

  /**
   * Teléfono fijo del lugar de trabajo.
   */
  @ApiPropertyOptional({
    description: 'Teléfono fijo del lugar de trabajo',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })
  workLandline?: string;

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
   * Ocupación del catálogo (VS_BO_OCCUPATION).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ocupación del catálogo (VS_BO_OCCUPATION)',
  })
  @IsOptional()
  @IsUUID()
  occupationConceptId?: string;

  /**
   * Ocupación en texto libre, para cuando no está en el catálogo. Se ignora
   * si viene `occupationConceptId`.
   */
  @ApiPropertyOptional({
    maxLength: OCCUPATION_FREE_TEXT_MAX_LENGTH,
    description: 'Ocupación en texto libre, para cuando no está en el catálogo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)
  occupationFreeText?: string;

  /**
   * Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER)',
  })
  @IsOptional()
  @IsUUID()
  workEmployerConceptId?: string;

  /**
   * Empresa en texto libre, para cuando no está en el catálogo. Se ignora
   * si viene `workEmployerConceptId`. Con la salida «Otra empresa»
   * (`employer:bo:OTRA`) del catálogo, el cliente manda sólo este campo.
   */
  @ApiPropertyOptional({
    maxLength: EMPLOYER_FREE_TEXT_MAX_LENGTH,
    description: 'Empresa en texto libre, para cuando no está en el catálogo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)
  workEmployerFreeText?: string;

  /**
   * Zona horaria IANA.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Foto de perfil en formato Base64 (Data URI o base64 plano).
   */
  @ApiPropertyOptional({
    description: 'Foto de perfil en formato Base64 (Data URI o base64 plano)',
  })
  @IsOptional()
  @IsString()
  profilePhotoBase64?: string;

  /**
   * Consultorio propio declarado en el alta (ALV-005/006 · P20).
   *
   * Es **exactamente** el mismo contrato que recibe `POST
   * /practitioners/me/sites` (`CreateOwnSiteDto`): esa ruta exige sesión y el
   * registro termina en el login, sin iniciarla sola, así que quien se
   * registra sin pertenecer a ninguna organización no tiene forma de
   * llamarla. El dato viaja adentro del alta y el servicio reutiliza el
   * mismo caso de uso (`OwnSiteProvisioningService`) dentro de la misma
   * transacción de la cuenta, la persona y el perfil profesional.
   *
   * Opcional entera: omitirlo deja el alta exactamente como era.
   */
  @ApiPropertyOptional({
    type: () => CreateOwnSiteDto,
    description:
      'Consultorio propio a dar de alta en la misma transacción (ALV-005/006 · P20). Mismo contrato que POST /practitioners/me/sites',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOwnSiteDto)
  ownSite?: CreateOwnSiteDto;
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
   * Credencial profesional creada, pendiente de verificación.
   *
   * Se devuelve porque `POST /profiles/credentials/{credentialId}/verify` —el
   * acto que habilita al profesional a ejercer— la exige por id, y no había
   * ninguna otra forma de obtenerla: el alta no la devolvía y `profiles` no
   * expone ningún listado de credenciales. La verificación quedaba fuera de
   * alcance salvo consultando la base de datos a mano.
   *
   * Ausente cuando el alta no declara `credentialNumber`, que dejó de ser
   * obligatorio: sin credencial no hay id que devolver.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  credentialId?: string;

  /**
   * Autorización del SEDES creada, pendiente de verificación.
   *
   * El equivalente de {@link credentialId} para la habilitación departamental:
   * se devuelve para poder verificarla por id sin consultar la base. Ausente
   * cuando el alta no declara `sedesLicenseNumber`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  sedesLicenseId?: string;

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

  /**
   * Identificador del archivo de foto de perfil (FK → common.files), si se subió.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  photoFileId?: string;

  /**
   * Práctica personal creada o reutilizada para el consultorio propio.
   *
   * Ausente cuando el alta no declaró `ownSite`. Se devuelve por el mismo
   * motivo que {@link credentialId}: poder referenciarla por id sin
   * consultar la base.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  ownPracticeId?: string;

  /**
   * Consultorio propio creado a partir de `ownSite`.
   *
   * Ausente cuando el alta no lo declaró. Es el mismo id que devuelve
   * `POST /practitioners/me/sites` y que acepta `GET /practitioners/:id/sites`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  ownSiteId?: string;
}

/**
 * Cuerpo de `POST /iam/users/assisted-practitioner-registration`.
 *
 * ## Por qué no se reutiliza el autorregistro
 *
 * `RegisterPractitionerDto` declara textualmente que «el profesional se da de
 * alta **él mismo**, sin que un administrador lo cree», y está detrás de
 * `@Public()` con un límite de 10 peticiones por minuto — una superficie pensada
 * para frenar automatización contra un formulario abierto, no para que una
 * organización cargue su plantel. Construir el alta administrativa encima de él
 * habría contradicho el contrato en el mismo archivo que lo define.
 *
 * ## Las dos diferencias, y las dos importan
 *
 * 1. **No lleva `password`.** La contraseña la elige el titular al activar la
 *    cuenta, igual que en el alta asistida de paciente: un administrador que
 *    teclea la clave de otro es una credencial compartida desde el minuto cero.
 * 2. **Exige `reason`.** Es la trazabilidad C-18: quién creó esta cuenta y por
 *    qué, que es justamente lo que distingue un alta administrativa de un
 *    autorregistro.
 */
export class AssistedPractitionerRegistrationDto extends OmitType(
  RegisterPractitionerDto,
  ['password'] as const,
) {
  /**
   * Motivo del alta, para la trazabilidad C-18.
   */
  @ApiProperty({
    description: 'Motivo del alta administrativa (trazabilidad C-18)',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  reason!: string;

  /**
   * Roles asistenciales con los que el profesional queda operativo.
   *
   * Sin esto, el alta produce una cuenta que puede iniciar sesión y no puede
   * hacer nada: los endpoints clínicos exigen `@Roles('CLINICIAN')`,
   * `@Roles('SURGEON')`… y esos códigos sólo llegan al token desde
   * `authz.user_role_assignments`. Se conceden aquí, en la misma transacción del
   * alta, porque quien la ejecuta es un `SECURITY_ADMIN` que ya está decidiendo
   * a quién incorpora y con qué función.
   *
   * El autorregistro público **no** admite este campo a propósito: allí no hay
   * nadie validando quién dice ser el solicitante.
   */
  @ApiPropertyOptional({
    description:
      'Roles asistenciales a conceder (códigos de `GET /authz/roles`)',
    isArray: true,
    type: String,
    example: ['CLINICIAN', 'SURGEON'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  clinicalRoles?: string[];
}

/**
 * Respuesta del alta asistida de un profesional.
 *
 * Extiende la del autorregistro con el token de activación de un solo uso —lo
 * único que el administrador entrega al titular por canal seguro— y su
 * caducidad. **Nunca una contraseña.**
 */
export class AssistedPractitionerRegistrationResponseDto extends RegisterPractitionerResponseDto {
  /**
   * Token de activación de un solo uso. Del lado del servidor sólo vive su hash.
   */
  @ApiProperty({
    description: 'Token de un solo uso a entregar al titular por canal seguro',
  })
  activationToken!: string;

  /**
   * Cuándo caduca el token.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  activationExpiresAt!: Date;

  /**
   * Roles asistenciales efectivamente concedidos.
   *
   * Se devuelven para que el administrador vea con qué quedó operativo el
   * profesional sin tener que consultarlo aparte. Si alguno de los pedidos no
   * existía, el alta entera falla, así que esta lista coincide siempre con lo
   * solicitado.
   */
  @ApiPropertyOptional({ isArray: true, type: String })
  clinicalRoles?: string[];
}
