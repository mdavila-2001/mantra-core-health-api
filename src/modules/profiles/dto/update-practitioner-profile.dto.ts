import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
// Mismas constantes de longitud que el alta y que el PATCH de paciente: son el
// mismo dato declarado por la misma persona.
import {
  EMPLOYER_FREE_TEXT_MAX_LENGTH,
  OCCUPATION_FREE_TEXT_MAX_LENGTH,
} from '../../iam/dto/register-patient.dto';

/**
 * Cuerpo de `PATCH /profiles/practitioners/me`.
 *
 * ## Por qué existe
 *
 * El alta escribía estos campos una sola vez y **no había forma de volver a
 * tocarlos**. Un profesional no podía corregir su propio título, escribir su
 * presentación ni declarar que había dejado de tomar pacientes: para cambiar un
 * dato suyo hacía falta que alguien escribiera en la base.
 *
 * ## Qué NO se puede tocar desde acá, y por qué
 *
 * Ni el estado de verificación, ni el de práctica, ni el código profesional, ni
 * las credenciales. Esos los mueve el trámite que corresponde —la verificación
 * de la matrícula—, y dejarlos editables convertiría un perfil en una
 * declaración jurada de uno mismo. Lo que se edita acá es **cómo se presenta**
 * quien ejerce, no si está habilitado a ejercer.
 *
 * Todos los campos son opcionales: es un `PATCH`, así que lo que no viene no se
 * toca. Mandar `''` en un texto sí lo borra — es una decisión explícita de quien
 * edita, y distinta de omitirlo.
 */
/** Formato aceptado por los cuatro campos telefónicos del perfil. */
const PATRON_TELEFONO = /^[+]?[0-9 ()-]{6,}$/;

/**
 * Si el par de coordenadas viene a **quitar** el punto del mapa.
 *
 * Mismo criterio que en el `PATCH` del paciente: quitar es mandar los dos
 * extremos en `null`, y es distinto de no mandarlos —eso es «no lo toqué»—.
 * Medio `null` no quita nada: la validación de abajo exige entonces que los dos
 * sean números, así que el `null` suelto falla como el dato incoherente que es.
 */
function quitaElPunto(latitud: unknown, longitud: unknown): boolean {
  return latitud === null && longitud === null;
}

/** Mensaje único para los cuatro campos telefónicos del perfil. */
const MENSAJE_TELEFONO =
  'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion';

export class UpdateOwnPractitionerProfileDto {
  /** «Médica cardióloga», «Kinesiólogo». */
  @ApiPropertyOptional({ description: 'Título profesional', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  professionalTitle?: string;

  /** Presentación en prosa. Es lo que hace que un perfil se lea como alguien. */
  @ApiPropertyOptional({
    description: 'Biografía profesional',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  professionalBio?: string;

  /**
   * Si toma pacientes nuevos.
   *
   * Cambia qué se le puede ofrecer a quien busca, así que tiene que poder
   * cambiarlo la propia persona: es un dato que se mueve semana a semana y
   * pedirle a administración que lo actualice garantiza que quede desactualizado.
   */
  @ApiPropertyOptional({ description: 'Si acepta pacientes nuevos' })
  @IsOptional()
  @IsBoolean()
  acceptsNewPatients?: boolean;

  /** Si atiende por telemedicina. */
  @ApiPropertyOptional({ description: 'Si atiende por telemedicina' })
  @IsOptional()
  @IsBoolean()
  telehealthAvailable?: boolean;

  /* --- los datos personales, ahora editables ------------------------------
     El profesional podía corregir su título, su biografía y dos interruptores;
     su nombre, su fecha de nacimiento, su teléfono y su domicilio los declaró
     al registrarse y después no había forma de tocarlos. Mismo alcance que ya
     tiene el paciente en `PATCH /profiles/patients/me`.

     Lo que NO entra: el documento de identidad y el correo. El primero es un
     identificador oficial con su circuito de verificación; el segundo es su
     credencial de acceso y se cambia por el flujo de la cuenta. */

  /**
   * Las cuatro partes del nombre.
   *
   * Una cadena vacía **borra** el dato: es lo que hace falta cuando alguien
   * descubre que no lleva segundo nombre. `displayName` no se edita — lo
   * compone el backend con estas cuatro.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherLastName?: string;

  /**
   * `null` la BORRA, igual que la cadena vacía borra un apellido opcional.
   * `@IsOptional()` deja pasar `null` además de `undefined`, así que el tipo
   * lo dice explícito en vez de dejarlo como un efecto lateral del validador.
   */
  @ApiPropertyOptional({ format: 'date', nullable: true })
  @IsOptional()
  @IsISO8601()
  birthDate?: string | null;

  @ApiPropertyOptional({
    maxLength: 40,
    description:
      'Forma anterior de declarar el teléfono. Preferí workMobilePhone.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(PATRON_TELEFONO, { message: MENSAJE_TELEFONO })
  phone?: string;

  /* --- los cinco contactos que el alta captura por separado ----------------
     Se editan igual que se declararon: cada uno es su propio par sistema × uso
     en `common.contact_points`. Una cadena vacía lo borra, como en el resto del
     PATCH —salvo el correo de trabajo, que es obligatorio—. */

  /**
   * Correo de trabajo: el contacto laboral que se muestra en el perfil.
   *
   * No es la credencial de acceso. El alta lo siembra con el mismo valor que el
   * login, pero la cuenta vive en IAM y no lee esta fila: cambiarlo acá no
   * cambia con qué correo se entra. Es obligatorio en el alta, así que no se
   * puede borrar — por eso `@IsEmail` y no la cadena vacía de los demás.
   */
  @ApiPropertyOptional({ format: 'email', maxLength: 320 })
  @IsOptional()
  @IsEmail({}, { message: 'El correo de trabajo no es un correo válido' })
  @MaxLength(320)
  workEmail?: string;

  /** Correo personal. */
  @ApiPropertyOptional({ format: 'email', maxLength: 320 })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  personalEmail?: string;

  /** Celular personal o privado. */
  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(PATRON_TELEFONO, { message: MENSAJE_TELEFONO })
  mobilePhone?: string;

  /** Celular del lugar de trabajo. */
  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(PATRON_TELEFONO, { message: MENSAJE_TELEFONO })
  workMobilePhone?: string;

  /** Teléfono fijo del lugar de trabajo. */
  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(PATRON_TELEFONO, { message: MENSAJE_TELEFONO })
  workLandline?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Municipio de residencia (VS_BO_MUNICIPALITY)',
  })
  @IsOptional()
  @IsUUID()
  residenceMunicipalityConceptId?: string;

  /** NIT para facturación. Cadena vacía para cerrar el vigente. */
  @ApiPropertyOptional({
    maxLength: 20,
    description: 'NIT para facturación. Cadena vacía para quedarse sin NIT.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;

  /** Nombre o razón social asociada al NIT. */
  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Nombre o razón social del titular del NIT. Cadena vacía para quitarla.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  taxHolderName?: string;

  /* --- el domicilio, ALV-009 ------------------------------------------------
     Mismo contrato que `UpdateOwnPatientProfileDto.homeAddressLines/
     homeLatitude/homeLongitude`: `common.addresses` es la misma tabla, y el
     profesional tenía municipio pero nunca calle ni coordenadas — el front
     pegaba un `POST /common/addresses` suelto que ninguna lectura buscaba. */

  /**
   * Calle y número del domicilio, tal como la persona lo escribe. Vacío para
   * quitarlo — igual que el resto del `PATCH`.
   */
  @ApiPropertyOptional({
    maxLength: 300,
    description:
      'Domicilio, tal como lo escribe la persona. Vacío para quitarlo.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  homeAddressLines?: string;

  /** Latitud del domicilio. Ambos-o-ninguno con {@link homeLongitude}. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @ValidateIf(
    (dto: UpdateOwnPractitionerProfileDto) =>
      !quitaElPunto(dto.homeLatitude, dto.homeLongitude) &&
      (dto.homeLatitude !== undefined || dto.homeLongitude !== undefined),
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  homeLatitude?: number | null;

  /** Longitud del domicilio. Ver {@link homeLatitude}. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @ValidateIf(
    (dto: UpdateOwnPractitionerProfileDto) =>
      !quitaElPunto(dto.homeLatitude, dto.homeLongitude) &&
      (dto.homeLatitude !== undefined || dto.homeLongitude !== undefined),
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  homeLongitude?: number | null;

  /** Dirección del lugar de trabajo. Vacío para quitarla. */
  @ApiPropertyOptional({
    maxLength: 300,
    description: 'Dirección del lugar de trabajo. Vacío para quitarla.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  workAddressLines?: string;

  /** Latitud del trabajo. Ambos-o-ninguno con {@link workLongitude}. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @ValidateIf(
    (dto: UpdateOwnPractitionerProfileDto) =>
      !quitaElPunto(dto.workLatitude, dto.workLongitude) &&
      (dto.workLatitude !== undefined || dto.workLongitude !== undefined),
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  workLatitude?: number | null;

  /** Longitud del trabajo. Ver {@link workLatitude}. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @ValidateIf(
    (dto: UpdateOwnPractitionerProfileDto) =>
      !quitaElPunto(dto.workLatitude, dto.workLongitude) &&
      (dto.workLatitude !== undefined || dto.workLongitude !== undefined),
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  workLongitude?: number | null;

  /* --- ocupación y empleador, con salida a texto libre --------------------
     Mismo contrato y misma regla de exclusión mutua que
     `UpdateOwnPatientProfileDto`: el catálogo (`VS_BO_OCCUPATION`/
     `VS_BO_EMPLOYER`) gana cuando viene junto al texto libre, y `''` borra
     el campo correspondiente sin caer en el `IsUUID`. La escritura la
     aplican `aplicarOcupacion`/`aplicarEmpresa` (`profiles/person-work-fields.ts`),
     compartidas con el DTO de paciente. */

  /**
   * Ocupación del catálogo (VS_BO_OCCUPATION). En blanco, se borra. Si viene,
   * el texto libre se descarta.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Ocupación del catálogo (VS_BO_OCCUPATION). Cadena vacía para borrarla. Si viene, el texto libre se descarta.',
  })
  // `''` no es un uuid mal escrito, es la ausencia de ocupación: sin esto,
  // quitar la del catálogo sería un 400.
  @ValidateIf(
    (dto: UpdateOwnPractitionerProfileDto) => dto.occupationConceptId !== '',
  )
  @IsOptional()
  @IsUUID()
  occupationConceptId?: string;

  /**
   * Ocupación en texto libre. En blanco, se borra. Declararla es decir que no
   * está en el catálogo, así que borra el concepto que hubiera —salvo que el
   * mismo cuerpo traiga uno, y entonces manda el catálogo—.
   */
  @ApiPropertyOptional({
    maxLength: OCCUPATION_FREE_TEXT_MAX_LENGTH,
    description:
      'Ocupación en texto libre, para cuando no está en el catálogo. Cadena vacía para borrarla.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)
  occupationFreeText?: string;

  /**
   * Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER). En blanco, se
   * borra. Mismo criterio que la ocupación: si viene junto al texto libre,
   * gana el catálogo.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Empresa donde trabaja (VS_BO_EMPLOYER). Cadena vacía para borrarla. Si viene, el texto libre se descarta.',
  })
  @ValidateIf(
    (dto: UpdateOwnPractitionerProfileDto) => dto.workEmployerConceptId !== '',
  )
  @IsOptional()
  @IsUUID()
  workEmployerConceptId?: string;

  /**
   * Empresa en texto libre, para cuando no está en el catálogo. En blanco, se
   * borra. Se ignora si el mismo cuerpo trae `workEmployerConceptId`.
   */
  @ApiPropertyOptional({
    maxLength: EMPLOYER_FREE_TEXT_MAX_LENGTH,
    description:
      'Empresa en texto libre. Cadena vacía para borrarla. Se descarta si viene el concepto.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)
  workEmployerFreeText?: string;
}
