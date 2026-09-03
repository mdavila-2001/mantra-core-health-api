import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
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
 * Reglas de forma de los datos que el paciente declara sobre sí mismo.
 *
 * Están extraídas y exportadas porque el alta ya no es el único formulario que
 * las aplica: `PATCH /profiles/patients/me` edita exactamente los mismos campos
 * y tiene que aceptar exactamente lo mismo. Repetidos como literales en dos
 * archivos, el día que uno se ajuste el otro se queda atrás y el paciente puede
 * registrar un valor que después no puede corregir —o al revés—.
 */

/**
 * Tope de cada parte del nombre (`profiles.persons.name` y sus hermanas).
 */
export const PERSON_NAME_PART_MAX_LENGTH = 100;

/**
 * Tope de la ocupación en texto libre
 * (`profiles.persons.occupation_free_text`).
 */
export const OCCUPATION_FREE_TEXT_MAX_LENGTH = 200;

/**
 * Largo máximo del nombre de empresa escrito a mano.
 *
 * El mismo que el de la ocupación: es una razón social, no una descripción, y
 * doscientos caracteres cubren hasta las más largas con su sigla.
 */
export const EMPLOYER_FREE_TEXT_MAX_LENGTH = 200;

/** Tope del teléfono, tal como lo guarda `common.contact_points.value`. */
export const PHONE_MAX_LENGTH = 40;

/**
 * Forma admitida de un teléfono: E.164 o nacional, con los separadores que la
 * gente escribe. Deliberadamente laxo — no valida que el número exista, sólo
 * impide que el campo se use para meter texto libre.
 */
export const PHONE_PATTERN = /^[+]?[0-9 ()-]{6,}$/;

/** Mensaje de {@link PHONE_PATTERN}, para que los dos formularios digan lo mismo. */
export const PHONE_PATTERN_MESSAGE =
  'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion';

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
   * Municipio de residencia (miembro de `VS_BO_MUNICIPALITY`).
   *
   * **Sólo el municipio, sin el departamento.** El código del INE de un
   * municipio lleva adentro el de su departamento, así que el departamento se
   * deriva acá y no se recibe: un par (departamento, municipio) enviado por el
   * cliente puede llegar incoherente —el municipio de un departamento con el
   * departamento de otro— y no habría forma de saber cuál de los dos es el que
   * la persona quiso decir.
   *
   * **Obligatorio desde la TAREA 03 (AC-03-3)**, y es la única parte del
   * domicilio que lo es: la calle, la zona y las coordenadas siguen siendo
   * opcionales. La localidad es lo que decide qué farmacias, laboratorios y
   * consultorios se le muestran a la persona, y sin ella el producto no puede
   * hacer lo que promete.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Municipio de residencia (catálogo VS_BO_MUNICIPALITY)',
  })
  @IsUUID()
  residenceMunicipalityConceptId!: string;

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
  @ApiPropertyOptional({
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
    example: 'Lucía',
  })
  @ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  name?: string;

  /**
   * Segundo nombre. Opcional: mucha gente no tiene.
   */
  @ApiPropertyOptional({
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
    example: 'Andrea',
  })
  @IsOptional()
  @IsString()
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  middleName?: string;

  /**
   * Apellido paterno. Mismo criterio que `name`.
   */
  @ApiPropertyOptional({
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
    example: 'Mamani',
  })
  @ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  lastName?: string;

  /**
   * Apellido materno. Opcional: no todas las jurisdicciones lo emiten.
   */
  @ApiPropertyOptional({
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
    example: 'Quispe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
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
   * Correo de la persona. **Obligatorio desde la TAREA 03 (AC-03-3).**
   *
   * ## Qué decisión invierte, y por qué se deja escrito
   *
   * Era opcional **a propósito**: el paciente entra con su documento —ése es su
   * `username`— y el alta se diseñó para no dejar afuera a quien no tiene
   * correo. El propietario lo pidió obligatorio y esa razón deja de valer, pero
   * no deja de ser cierta: quien se registre sin correo ya no puede.
   *
   * Lo que **no** cambia es quién es el identificador de acceso: sigue siendo
   * el documento. El correo es por dónde se recupera la cuenta y por dónde
   * llegan los avisos, y sin él una contraseña perdida no tiene camino de
   * vuelta. Sigue emitiéndose el token de verificación cuando llega.
   *
   * Queda abierta P-03-2 de la ficha —la contraseña no aparece en la lista de
   * obligatorios del propietario, ni como opcional—: acá sigue siendo
   * obligatoria porque es con lo que se entra.
   */
  @ApiProperty({ format: 'email', maxLength: 320 })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Fecha de nacimiento. **Obligatoria desde la TAREA 03 (AC-03-3).**
   *
   * No es un dato administrativo: de la edad salen las dosis, los valores de
   * referencia del laboratorio y qué tamizajes corresponden. Un alta sin ella
   * crea una historia clínica que no se puede interpretar.
   */
  @ApiProperty({ format: 'date' })
  @IsISO8601()
  birthDate!: string;

  /**
   * Teléfono de contacto. **Obligatorio desde la TAREA 03 (AC-03-3).**
   *
   * Se guarda como punto de contacto de la persona; que esté verificado o no es
   * independiente (`iam.users.phone_verified`). Es por donde se avisa de un
   * turno o de un resultado, que es lo que el correo no resuelve para quien
   * mira poco el correo — que en Bolivia es la mayoría.
   */
  @ApiProperty({
    // La forma admitida se repite en la descripción a propósito: el validador la
    // toma de `PHONE_PATTERN`, y una constante compartida no se puede leer desde
    // el contrato publicado, que es lo único que tiene delante quien integra.
    description:
      'Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres',
    maxLength: PHONE_MAX_LENGTH,
  })
  @IsString()
  @MaxLength(PHONE_MAX_LENGTH)
  @Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })
  phone!: string;

  /**
   * Ocupación, miembro de `VS_BO_OCCUPATION`.
   *
   * **El código es `VS_BO_OCCUPATION`, no `VS_SEGIP_OCCUPATION`.** Acá decía lo
   * segundo desde el 21/08; la nota de entidad de `profiles.persons` del modelo
   * (v4.1.8, 22/08) lo fijó como el primero, y es la que manda: un catálogo
   * tiene un solo dueño, y sembrar los dos habría dejado dos conjuntos con las
   * mismas ocupaciones sin forma de saber cuál mira cada pantalla. Lo siembra
   * `BoOccupationsSeedService`, en esta API.
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
   * Empresa donde trabaja, como miembro de `VS_BO_EMPLOYER`.
   *
   * **Reemplazó a la ubicación del trabajo** en el alta pública: municipio,
   * calle y coordenadas del trabajo eran tres campos para un dato que casi
   * nadie completaba. La empresa es una sola pregunta, se sabe de memoria, y
   * es la que agrupa —salud ocupacional, convenios corporativos—.
   *
   * Lo siembra `BoEmployersSeedService`, en esta API, que es su único dueño.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER)',
  })
  @IsOptional()
  @IsUUID()
  workEmployerConceptId?: string;

  /**
   * Empresa en texto libre, para cuando no está en el catálogo. Se ignora si
   * viene `workEmployerConceptId`.
   *
   * Acá el respaldo pesa más que en la ocupación: el catálogo de empresas no
   * puede ser exhaustivo —el SEPREC no publica su base empresarial y son unas
   * 394.000 unidades económicas—, así que «no está en la lista» es el caso
   * normal, no la excepción. Ver `bo-employers.catalog.ts`.
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
  /**
   * Sexo asignado al nacer. **Obligatorio desde la TAREA 03 (AC-03-3).**
   *
   * Es dato clínico, no cortesía: cambia dosis, valores de referencia y
   * tamizajes. `gender` —el administrativo— sigue siendo opcional y son cosas
   * distintas: el alta pública manda éste y no aquél.
   */
  @ApiProperty({
    enum: BIRTH_SEX_CODES,
    description: 'Sexo asignado al nacer',
  })
  @IsIn(BIRTH_SEX_CODES)
  sexAtBirth!: BirthSexCode;

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

  /**
   * Calle y número del domicilio, tal como la persona lo escribe.
   *
   * La columna `common.addresses.lines` es un varchar único, no un arreglo: acá
   * viaja el texto entero, sin partirlo en líneas.
   */
  @ApiPropertyOptional({
    maxLength: 500,
    description: 'Calle y número del domicilio',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  homeAddressLines?: string;

  /**
   * Latitud del domicilio.
   *
   * El par de coordenadas es **ambos o ninguno**: el `ValidateIf` mira las dos
   * propiedades, así que mandar una sola hace caer a la que falta en su
   * `@IsNumber` y la petición termina en 400. Media coordenada no ubica nada.
   */
  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @ValidateIf(
    (dto: RegisterPatientDto) =>
      dto.homeLatitude !== undefined || dto.homeLongitude !== undefined,
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  homeLatitude?: number;

  /** Longitud del domicilio. Ver {@link RegisterPatientDto.homeLatitude}. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @ValidateIf(
    (dto: RegisterPatientDto) =>
      dto.homeLatitude !== undefined || dto.homeLongitude !== undefined,
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  homeLongitude?: number;

  /**
   * Municipio donde trabaja (miembro de `VS_BO_MUNICIPALITY`).
   *
   * Mismo criterio que el municipio de residencia: el departamento se deriva del
   * código del INE y no se recibe del cliente.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Municipio del trabajo (catálogo VS_BO_MUNICIPALITY)',
  })
  @IsOptional()
  @IsUUID()
  workMunicipalityConceptId?: string;

  /** Calle y número del trabajo. */
  @ApiPropertyOptional({
    maxLength: 500,
    description: 'Calle y número del lugar de trabajo',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  workAddressLines?: string;

  /** Latitud del trabajo. Mismo par ambos-o-ninguno que el domicilio. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @ValidateIf(
    (dto: RegisterPatientDto) =>
      dto.workLatitude !== undefined || dto.workLongitude !== undefined,
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  workLatitude?: number;

  /** Longitud del trabajo. Ver {@link RegisterPatientDto.workLatitude}. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @ValidateIf(
    (dto: RegisterPatientDto) =>
      dto.workLatitude !== undefined || dto.workLongitude !== undefined,
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  workLongitude?: number;

  /**
   * Nombre del tutor o persona autorizada.
   *
   * Es quien acompaña a un menor de edad o a un adulto a su cargo. Se guarda
   * como persona relacionada del paciente, no como usuario de la plataforma.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Nombre del tutor o persona autorizada',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  guardianName?: string;

  /**
   * Teléfono del tutor o persona autorizada.
   *
   * Que no se pueda mandar sin `guardianName` lo comprueba el servicio, no un
   * `ValidateIf`: saltear los validadores dejaría entrar un teléfono sin dueño.
   */
  @ApiPropertyOptional({
    maxLength: 40,
    description: 'Teléfono del tutor, en formato E.164 o nacional',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[+]?[0-9 ()-]{6,}$/, {
    message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion',
  })
  guardianPhone?: string;

  /**
   * Plan de salud privado que la persona declara tener.
   *
   * Viaja el **plan**, no la aseguradora: `insurance.patient_coverages` apunta a
   * `insurance_plan_id`, y varias compañías publican más de un plan. Para las
   * que tienen uno solo, elegir la compañía en la pantalla ya elige su plan.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plan de la aseguradora privada declarada',
  })
  @IsOptional()
  @IsUUID()
  privateInsurancePlanId?: string;

  /**
   * Plan del seguro público que la persona declara tener (CNS, CPS, SUS…).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plan del seguro público declarado',
  })
  @IsOptional()
  @IsUUID()
  publicInsurancePlanId?: string;

  /**
   * NIT para las facturas que la persona recibe de las instituciones.
   *
   * Sólo el número: la razón social no tiene hoy dónde vivir en el modelo, así
   * que no se pide un dato que se perdería.
   */
  @ApiPropertyOptional({
    description: 'NIT para facturación (sólo el número)',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{4,20}$/, {
    message: 'El NIT sólo admite dígitos',
  })
  billingTaxId?: string;
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
