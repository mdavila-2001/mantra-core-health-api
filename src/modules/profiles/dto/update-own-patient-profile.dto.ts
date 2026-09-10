import { ApiPropertyOptional } from '@nestjs/swagger';
import {
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
// Las reglas de forma se importan del alta en vez de repetirse: son el mismo
// dato declarado por la misma persona, y dos copias de un `MaxLength` acaban
// divergiendo el día que alguien ajusta una sola.
import {
  EMPLOYER_FREE_TEXT_MAX_LENGTH,
  OCCUPATION_FREE_TEXT_MAX_LENGTH,
  PERSON_NAME_PART_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  PHONE_PATTERN,
  PHONE_PATTERN_MESSAGE,
} from '../../iam/dto/register-patient.dto';
import { BIRTH_SEX_CODES, type BirthSexCode } from '../profiles.concepts';

/**
 * Si el par de coordenadas viene a **quitar** el punto del mapa.
 *
 * Quitar es mandar los dos extremos en `null`, y es una afirmación distinta de
 * no mandarlos —eso es «no lo toqué»—. Sin esta distinción no había forma de
 * borrar una ubicación mal puesta: el servicio conserva la anterior cuando no
 * llega ninguna, así que un punto equivocado quedaba para siempre.
 *
 * **Medio `null` no quita nada.** Si sólo uno viene en `null`, esto devuelve
 * `false` y la validación de más abajo exige que los dos sean números, así que
 * el `null` suelto falla como el dato incoherente que es.
 */
function quitaElPunto(latitud: unknown, longitud: unknown): boolean {
  return latitud === null && longitud === null;
}

/**
 * Cuerpo de `PATCH /profiles/patients/me`.
 *
 * ## Por qué existe
 *
 * El auto-registro escribía estos datos una sola vez y no había forma de volver
 * a tocarlos. Quien se equivocaba tipeando su apellido, cambiaba de número o se
 * mudaba quedaba con el dato viejo para siempre, salvo que alguien escribiera en
 * la base por él.
 *
 * ## Qué NO se puede tocar desde acá, y por qué
 *
 * El **documento de identidad** en sí, porque son los dígitos con los que la
 * cuenta inicia sesión (`external_subject`) y lo que la verificación de
 * identidad contrasta: cambiarlos por autoservicio convertiría el trámite en una
 * declaración de uno mismo. Su **departamento de emisión** sí se puede corregir
 * —es metadato de la misma fila, no toca el número con el que se entra—. El
 * **correo** y la **contraseña**, porque tienen su propio circuito con
 * verificación. El **código de paciente** y los estados, porque los emite y los
 * mueve el sistema. Y el **género administrativo**, que hoy sólo se declara en
 * el alta y no forma parte de esta pantalla.
 *
 * ## Lo que se agregó para igualar el alta (registro de procesos · PACIENTE)
 *
 * GPS de domicilio y de trabajo, municipio de trabajo, empresa (§1.10-§1.11),
 * tutor o persona autorizada (§1.7) y seguro declarado (§1.13-§1.14). Todos
 * opcionales y todos con el mismo criterio de «vacío borra» que ya rige acá,
 * **salvo el tutor y el seguro**: `profiles.related_persons` y
 * `insurance.patient_coverages` no tienen hoy un estado de baja, así que
 * quitarlos por completo no es una operación soportada — ver el JSDoc de cada
 * campo.
 *
 * Todos los campos son opcionales: es un `PATCH`, así que lo que no viene no se
 * toca. Un cuerpo vacío es válido y devuelve el perfil sin cambios.
 *
 * Omitir un campo y mandarlo en blanco son cosas distintas: omitirlo lo deja
 * como estaba, y mandarlo en blanco **lo borra**. Vale para el segundo nombre,
 * el apellido materno, la ocupación y el teléfono, que son los que alguien puede
 * dejar de tener. El nombre y el apellido paterno no: exigen al menos un
 * carácter, porque una persona sin nombre no es un dato, es una ficha rota.
 */
export class UpdateOwnPatientProfileDto {
  /**
   * Nombre de pila.
   *
   * Cambiar cualquier parte del nombre recompone `displayName` con la misma
   * regla del alta: no se edita el compuesto, se editan sus partes.
   */
  @ApiPropertyOptional({
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
    example: 'Lucía',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  name?: string;

  /**
   * Segundo nombre. En blanco, se borra.
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
   * Apellido paterno.
   */
  @ApiPropertyOptional({
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
    example: 'Mamani',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  lastName?: string;

  /**
   * Apellido materno. En blanco, se borra.
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
   * Fecha de nacimiento.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  birthDate?: string | null;

  /**
   * Sexo asignado al nacer, por código legible. El servidor lo traduce al
   * concepto que persiste la columna; el formulario no conoce los uuid del
   * catálogo de terminología.
   */
  @ApiPropertyOptional({
    enum: BIRTH_SEX_CODES,
    description: 'Sexo asignado al nacer',
  })
  @IsOptional()
  @IsIn(BIRTH_SEX_CODES)
  sexAtBirth?: BirthSexCode;

  /**
   * Ocupación del catálogo (miembro de `VS_BO_OCCUPATION`). En blanco, se borra.
   *
   * Existe porque el alta ya la guarda así: quien eligió la suya del desplegable
   * tiene el concepto y no el texto, y sin este campo el formulario de edición le
   * mostraba la ocupación vacía y sólo podía volver a declararla como texto
   * libre, degradando un dato del catálogo a uno suelto.
   *
   * **El catálogo gana**, igual que en el alta: cuando viene un concepto el texto
   * libre queda en `NULL`, aunque el mismo cuerpo traiga los dos. El texto libre
   * es la salida para lo que no está en la lista, así que tener ambos declararía
   * dos ocupaciones para la misma persona.
   *
   * Un uuid que no sea de ningún concepto responde **422**: la columna es FK a
   * `terminology.catalog_concepts` y la base lo rechaza. Que sea del conjunto
   * correcto no se comprueba acá —el alta tampoco lo hace—, y las opciones
   * válidas salen de `GET /terminology/value-sets?code=VS_BO_OCCUPATION` y su
   * expansión, las dos públicas.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Ocupación del catálogo (VS_BO_OCCUPATION). Cadena vacía para borrarla. Si viene, el texto libre se descarta.',
  })
  // Mismo motivo que el teléfono: `''` no es un uuid mal escrito, es la ausencia
  // de ocupación. Sin esto, quitar la del catálogo sería un 400.
  @ValidateIf(
    (dto: UpdateOwnPatientProfileDto) => dto.occupationConceptId !== '',
  )
  @IsOptional()
  @IsUUID()
  occupationConceptId?: string;

  /**
   * Ocupación en texto libre. En blanco, se borra.
   *
   * Declararla como texto es decir que no está en el catálogo, así que borra el
   * concepto que hubiera —salvo que el mismo cuerpo traiga uno, y entonces manda
   * el catálogo y este texto se descarta—.
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
   * Teléfono de contacto. En blanco, se queda sin teléfono.
   *
   * Reemplazar el número no pisa la fila anterior: se le pone fin de vigencia y
   * se crea una nueva, porque por el número viejo se llamó a esta persona.
   * Quitarlo cierra la vigente y no crea ninguna.
   */
  @ApiPropertyOptional({
    // La forma admitida se repite en la descripción a propósito: el validador la
    // toma de `PHONE_PATTERN`, y una constante compartida no se puede leer desde
    // el contrato publicado, que es lo único que tiene delante quien integra.
    description:
      'Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres. Cadena vacía para quedarse sin teléfono.',
    maxLength: PHONE_MAX_LENGTH,
  })
  // `''` se salta el patrón a propósito: la cadena vacía no es un número mal
  // escrito, es la ausencia de número. Sin esto, quitarse el teléfono sería un
  // 400 y no habría forma de hacerlo.
  @ValidateIf((dto: UpdateOwnPatientProfileDto) => dto.phone !== '')
  @IsOptional()
  @IsString()
  @MaxLength(PHONE_MAX_LENGTH)
  @Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })
  phone?: string;

  /**
   * Municipio de residencia (miembro de `VS_BO_MUNICIPALITY`).
   *
   * **Sólo el municipio, sin el departamento**, por lo mismo que en el alta: el
   * código del INE de un municipio lleva adentro el de su departamento, y
   * recibir los dos abriría la puerta a un par incoherente.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Municipio de residencia (catálogo VS_BO_MUNICIPALITY)',
  })
  @IsOptional()
  @IsUUID()
  residenceMunicipalityConceptId?: string;

  /**
   * NIT para facturación (registro de procesos · PACIENTE §1.15.2).
   *
   * Se podía declarar al registrarse y después no había forma de corregirlo: el
   * perfil lo mostraba y el editor no lo ofrecía. Cadena vacía para quitarlo —
   * mismo criterio que el teléfono: `''` no es un NIT mal escrito, es la
   * ausencia de NIT.
   */
  @ApiPropertyOptional({
    maxLength: 20,
    description: 'NIT para facturación. Cadena vacía para quedarse sin NIT.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;

  /**
   * A nombre de quién sale el comprobante (registro · PACIENTE §1.15.1).
   *
   * El registro pide «Nombre o Razón social» **y** «Número de NIT»: hasta ahora
   * sólo existía el número, y la ficha mostraba un NIT sin decir de quién era.
   *
   * Viaja **con** el NIT: son el mismo hecho, y separarlos dejaría una razón
   * social colgada de un número que ya no existe. Mandar sólo una de las dos
   * conserva la otra.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Nombre o razón social del titular del NIT. Cadena vacía para quitarla.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  taxHolderName?: string;

  /**
   * Domicilio (§1.8) y dirección de trabajo (§1.10), con su ubicación.
   *
   * Van como texto libre y coordenadas opcionales porque eso es lo que
   * `common.addresses` guarda, y porque una dirección boliviana real —«Av.
   * Prolongación Beni #5100, esq. 6to anillo»— no entra en un catálogo. El
   * municipio sí sale del catálogo, y viaja aparte en
   * `residenceMunicipalityConceptId`.
   *
   * Editarlas **cierra la vigente y abre otra**: `common.addresses` lleva
   * `valid_to`, así que mudarse no borra dónde vivías cuando te atendieron.
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

  @ApiPropertyOptional({
    maxLength: 300,
    description: 'Dirección de trabajo. Vacío para quitarla.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  workAddressLines?: string;

  /**
   * Departamento que emitió el documento (miembro de `VS_BO_DEPARTMENT`).
   *
   * A diferencia del número del documento, esto **sí** se corrige: es un dato
   * descriptivo de la fila de `common.identifiers` y no toca `external_subject`,
   * que es lo único que la sesión usa para reconocer la cuenta.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Departamento que emitió el documento (VS_BO_DEPARTMENT)',
  })
  @IsOptional()
  @IsUUID()
  issuerAdministrativeAreaConceptId?: string;

  /**
   * Latitud del domicilio. Mismo par ambos-o-ninguno que en el alta.
   */
  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @ValidateIf(
    (dto: UpdateOwnPatientProfileDto) =>
      !quitaElPunto(dto.homeLatitude, dto.homeLongitude) &&
      (dto.homeLatitude !== undefined || dto.homeLongitude !== undefined),
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  homeLatitude?: number | null;

  /** Longitud del domicilio. Ver {@link UpdateOwnPatientProfileDto.homeLatitude}. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @ValidateIf(
    (dto: UpdateOwnPatientProfileDto) =>
      !quitaElPunto(dto.homeLatitude, dto.homeLongitude) &&
      (dto.homeLatitude !== undefined || dto.homeLongitude !== undefined),
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  homeLongitude?: number | null;

  /**
   * Municipio del lugar de trabajo (miembro de `VS_BO_MUNICIPALITY`).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Municipio del trabajo (catálogo VS_BO_MUNICIPALITY)',
  })
  @IsOptional()
  @IsUUID()
  workMunicipalityConceptId?: string;

  /** Latitud del trabajo. Mismo par ambos-o-ninguno que el domicilio. */
  @ApiPropertyOptional({ minimum: -90, maximum: 90 })
  @ValidateIf(
    (dto: UpdateOwnPatientProfileDto) =>
      !quitaElPunto(dto.workLatitude, dto.workLongitude) &&
      (dto.workLatitude !== undefined || dto.workLongitude !== undefined),
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  workLatitude?: number | null;

  /** Longitud del trabajo. Ver {@link UpdateOwnPatientProfileDto.workLatitude}. */
  @ApiPropertyOptional({ minimum: -180, maximum: 180 })
  @ValidateIf(
    (dto: UpdateOwnPatientProfileDto) =>
      !quitaElPunto(dto.workLatitude, dto.workLongitude) &&
      (dto.workLatitude !== undefined || dto.workLongitude !== undefined),
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  workLongitude?: number | null;

  /**
   * Empresa donde trabaja, como miembro de `VS_BO_EMPLOYER`. En blanco, se
   * borra. Mismo criterio que la ocupación: si viene junto al texto libre, gana
   * el catálogo.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Empresa donde trabaja (VS_BO_EMPLOYER). Cadena vacía para borrarla. Si viene, el texto libre se descarta.',
  })
  @ValidateIf(
    (dto: UpdateOwnPatientProfileDto) => dto.workEmployerConceptId !== '',
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

  /**
   * Nombre del tutor o persona autorizada (registro · PACIENTE §1.7).
   *
   * **Sin soporte de borrado.** `profiles.related_persons` no tiene un estado
   * de baja —sólo existe `RELATED_ACTIVE`—, así que a diferencia del teléfono o
   * el NIT, no hay una forma honesta de «quitar» al tutor ya declarado por
   * autoservicio: inventar un estado inactivo sin que el modelo lo declare es
   * justo lo que la regla del proyecto prohíbe (00.1/00.4). Mandar este campo
   * declara o corrige al tutor; no mandarlo lo deja como está.
   */
  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Nombre del tutor o persona autorizada. No hay forma de quitarlo, sólo de declararlo o corregirlo.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  guardianName?: string;

  /**
   * Teléfono del tutor o persona autorizada.
   *
   * Igual que en el alta, un teléfono sin nombre —ni el que llega en este
   * cuerpo ni el ya declarado— lo rechaza el servicio, no este validador: sería
   * un contacto sin dueño.
   */
  @ApiPropertyOptional({
    maxLength: 40,
    description: 'Teléfono del tutor, en formato E.164 o nacional',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })
  guardianPhone?: string;

  /**
   * Qué es esa persona del paciente: madre, cónyuge, amistad… Miembro del
   * conjunto dinámico `related-person-relationship`.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Parentesco del tutor o contacto de emergencia (conjunto related-person-relationship)',
  })
  @IsOptional()
  @IsUUID()
  guardianRelationshipConceptId?: string;

  /**
   * Plan de salud privado que la persona declara tener (registro · PACIENTE
   * §1.13).
   *
   * **Sin soporte de reemplazo.** `insurance.patient_coverages` no tiene hoy un
   * estado de baja —sólo `COVERAGE_ACTIVE`—, así que este campo **declara** una
   * cobertura si la persona no tenía ninguna de este sector; si ya había una
   * declarada, mandar un plan distinto no la reemplaza (el servicio lo deja sin
   * efecto en vez de duplicar la fila o inventar una baja que el modelo no
   * declara).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Plan de la aseguradora privada declarada. Sólo si la persona no tenía ninguna ya.',
  })
  @IsOptional()
  @IsUUID()
  privateInsurancePlanId?: string;

  /**
   * Plan del seguro público que la persona declara tener (CNS, CPS, SUS…).
   * Mismo criterio de sólo-declaración que {@link privateInsurancePlanId}.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Plan del seguro público declarado. Sólo si la persona no tenía ninguno ya.',
  })
  @IsOptional()
  @IsUUID()
  publicInsurancePlanId?: string;
}
