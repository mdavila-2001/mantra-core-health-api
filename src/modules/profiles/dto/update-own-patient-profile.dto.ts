import { ApiPropertyOptional } from '@nestjs/swagger';
import {
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
// Las reglas de forma se importan del alta en vez de repetirse: son el mismo
// dato declarado por la misma persona, y dos copias de un `MaxLength` acaban
// divergiendo el día que alguien ajusta una sola.
import {
  OCCUPATION_FREE_TEXT_MAX_LENGTH,
  PERSON_NAME_PART_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  PHONE_PATTERN,
  PHONE_PATTERN_MESSAGE,
} from '../../iam/dto/register-patient.dto';
import { BIRTH_SEX_CODES, type BirthSexCode } from '../profiles.concepts';

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
 * El **documento de identidad** y su departamento emisor, porque son el
 * identificador con el que la cuenta inicia sesión y lo que la verificación de
 * identidad contrasta: cambiarlos por autoservicio convertiría el trámite en una
 * declaración de uno mismo. El **correo** y la **contraseña**, porque tienen su
 * propio circuito con verificación. El **código de paciente** y los estados,
 * porque los emite y los mueve el sistema. Y el **género administrativo**, que
 * hoy sólo se declara en el alta y no forma parte de esta pantalla.
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
    description: 'Domicilio, tal como lo escribe la persona. Vacío para quitarlo.',
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
}
