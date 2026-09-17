import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
// Las reglas de forma se importan del alta pública en vez de repetirse: es el
// mismo dato sobre la misma clase de persona, y dos copias de un `MaxLength`
// acaban divergiendo el día que alguien ajusta una sola.
import { PERSON_NAME_PART_MAX_LENGTH } from '../../iam/dto/register-patient.dto';
import { DEPENDENT_RELATIONSHIP_CONCEPT_IDS } from '../dependent-relationship';
import { BIRTH_SEX_CODES, type BirthSexCode } from '../profiles.concepts';

/**
 * Cuerpo de `POST /profiles/patients/me/dependents`.
 *
 * ## Qué registra, y qué NO
 *
 * Una persona a cargo del titular: un menor sin documento todavía, una madre
 * tutelada. Crea su persona y su perfil de paciente, y deja al titular como su
 * representante en el portal.
 *
 * **No crea una cuenta.** El dependiente no inicia sesión —ese es justamente el
 * caso: un menor sin teléfono propio—, así que acá no hay correo ni contraseña.
 * El día que quiera entrar por su cuenta se registrará él, y fusionar los dos
 * registros es el trabajo de `POST /profiles/patients/merge`, que ya existe.
 *
 * ## Por qué el documento es opcional
 *
 * Porque un recién nacido no tiene cédula, y exigirla dejaría fuera al
 * dependiente más típico de todos. Cuando viene, se guarda como identificador
 * oficial de la persona y se rechaza si ya es de alguien: un documento repetido
 * son dos historias clínicas de la misma persona.
 */
export class CreateDependentDto {
  /**
   * Nombre de pila del dependiente.
   */
  @ApiProperty({
    description: 'Nombre de pila',
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  name!: string;

  /**
   * Segundo nombre. Mucha gente no tiene.
   */
  @ApiPropertyOptional({
    description: 'Segundo nombre',
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  middleName?: string;

  /**
   * Apellido paterno.
   */
  @ApiProperty({
    description: 'Apellido paterno',
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  lastName!: string;

  /**
   * Apellido materno. No todas las jurisdicciones lo emiten.
   */
  @ApiPropertyOptional({
    description: 'Apellido materno',
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  motherLastName?: string;

  /**
   * Fecha de nacimiento, en `YYYY-MM-DD`.
   *
   * Obligatoria acá aunque en el alta propia no lo sea: la edad es lo que
   * distingue a un menor de un adulto tutelado, y la pantalla la muestra en
   * cada tarjeta. El servicio rechaza además una fecha futura.
   */
  @ApiProperty({
    description: 'Fecha de nacimiento (ISO date, YYYY-MM-DD)',
    format: 'date',
    example: '2018-03-14',
  })
  @IsISO8601({ strict: true })
  birthDate!: string;

  /**
   * Sexo al nacer, por código y no por uuid: el formulario no conoce —ni tiene
   * por qué conocer— los identificadores del catálogo de terminología.
   */
  @ApiPropertyOptional({
    description: 'Sexo asignado al nacer',
    enum: BIRTH_SEX_CODES,
  })
  @IsOptional()
  @IsIn(BIRTH_SEX_CODES)
  sexAtBirth?: BirthSexCode;

  /**
   * Documento de identidad del dependiente, si ya lo tiene.
   */
  @ApiPropertyOptional({
    description: 'Documento de identidad, si el dependiente ya lo tiene',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9.-]+$/, {
    message: 'El documento sólo admite letras, dígitos, punto y guion',
  })
  nationalId?: string;

  /**
   * Departamento que expidió el documento (miembro de `VS_BO_DEPARTMENT`).
   *
   * Sólo tiene sentido junto al documento; el servicio comprueba contra el
   * catálogo que el uuid sea de verdad un departamento, porque la FK acepta
   * cualquier concepto.
   */
  @ApiPropertyOptional({
    description: 'Departamento que expidió el documento (VS_BO_DEPARTMENT)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  issuerAdministrativeAreaConceptId?: string;

  /**
   * Qué es **el titular** para el dependiente: «soy su madre», «soy su hijo».
   *
   * Ese es el sentido de `related_persons.relationship_concept_id` en todas las
   * filas que ya existen —describe a la persona relacionada, no al paciente—, y
   * darlo vuelta acá haría que la misma columna dijera dos cosas distintas
   * según quién la escribió. La lectura es la que invierte la frase para poder
   * decir «Hijo/a» en la tarjeta.
   */
  @ApiProperty({
    description:
      'Qué es el titular para el dependiente (madre, padre, hijo/a, cónyuge o tutor legal)',
    format: 'uuid',
  })
  @IsUUID()
  @IsIn(DEPENDENT_RELATIONSHIP_CONCEPT_IDS, {
    message: 'El parentesco declarado no habilita a representar a otra persona',
  })
  relationshipConceptId!: string;
}
