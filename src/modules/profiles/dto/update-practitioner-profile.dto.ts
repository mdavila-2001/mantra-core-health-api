import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

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

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @ApiPropertyOptional({ maxLength: 40, description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[+]?[0-9 ()-]{6,}$/, {
    message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion',
  })
  phone?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Municipio de residencia (VS_BO_MUNICIPALITY)',
  })
  @IsOptional()
  @IsUUID()
  residenceMunicipalityConceptId?: string;
}
