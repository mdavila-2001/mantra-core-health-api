import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsIn,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  registerDecorator,
  ValidateIf,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { DEPENDENT_RELATIONSHIP_CONCEPT_IDS } from '../dependent-relationship';

/**
 * La propiedad no puede venir junto con otra: el cliente señala a la persona
 * por una sola vía.
 *
 * @param other - La propiedad con la que no puede coexistir.
 * @param options - Opciones de validación (mensaje).
 * @returns El decorador de propiedad.
 */
function IsExclusiveWith(
  other: string,
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isExclusiveWith',
      target: target.constructor,
      propertyName: propertyName.toString(),
      constraints: [other],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === undefined) return true;
          const otherValue = (args.object as Record<string, unknown>)[other];
          return otherValue === undefined;
        },
      },
    });
  };
}

/**
 * Cuerpo de `POST /profiles/patients/me/dependent-requests`.
 *
 * Se señala a la persona por su documento **o** por el perfil que devolvió la
 * búsqueda por nombre (`dependent-candidates`): una vía u otra, nunca las dos
 * ni ninguna. A quién se le pide lo resuelve el servidor, y la respuesta no
 * dice de quién es para no servir de buscador de personas por CI.
 */
export class RequestDependentLinkDto {
  /**
   * Documento de identidad de la persona a representar.
   *
   * Admite espacios alrededor —es lo que queda al pegar un CI— y el servicio
   * los quita; por dentro, las mismas reglas que el alta de un dependiente.
   * Es obligatorio salvo que se mande `patientProfileId`.
   */
  @ApiPropertyOptional({
    description:
      'Documento de identidad de la persona a representar. Obligatorio si no se manda `patientProfileId`',
    example: '7654321',
    maxLength: 60,
  })
  @ValidateIf(
    (dto: RequestDependentLinkDto) =>
      dto.nationalId !== undefined || dto.patientProfileId === undefined,
  )
  @IsString()
  @MaxLength(60)
  @Matches(/^\s*[A-Za-z0-9.-]{4,40}\s*$/, {
    message:
      'El documento tiene entre 4 y 40 caracteres: letras, dígitos, punto y guion',
  })
  nationalId?: string;

  /**
   * Perfil de paciente elegido de `dependent-candidates`.
   *
   * Es la alternativa al documento para quien encontró a la persona por su
   * nombre y no conoce su CI.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Perfil de paciente devuelto por `dependent-candidates`. Alternativa a `nationalId`: se manda uno u otro',
  })
  @ValidateIf(
    (dto: RequestDependentLinkDto) => dto.patientProfileId !== undefined,
  )
  @IsExclusiveWith('nationalId', {
    message: 'Mande el documento o el perfil elegido, no los dos',
  })
  @IsUUID()
  patientProfileId?: string;
}

/** Filtros de `GET /profiles/patients/me/dependent-candidates`. */
export class DependentCandidatesQueryDto {
  /**
   * Lo que escribió la persona: parte del nombre de quien busca.
   *
   * Sin texto, o con menos de tres letras, la respuesta es vacía: la ruta
   * encuentra a alguien por su nombre, no lista el padrón.
   */
  @ApiPropertyOptional({
    description:
      'Parte del nombre de la persona. Con menos de tres letras la respuesta es vacía',
    example: 'ana per',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

/** Una cuenta a la que se le puede pedir que deje representarla. */
export class DependentCandidateDto {
  /** Perfil de paciente, el que se manda a `dependent-requests`. */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /** Nombre visible de la persona. */
  @ApiProperty({ description: 'Nombre visible de la persona' })
  displayName!: string;

  /**
   * Documento con sólo las últimas cifras a la vista.
   *
   * Alcanza para distinguir a dos homónimos y no sirve para averiguar el
   * documento de nadie. Ausente si la persona no declaró documento.
   */
  @ApiPropertyOptional({
    description: 'Documento enmascarado: sólo las últimas tres cifras',
    example: '••••321',
  })
  maskedNationalId?: string;
}

/** Respuesta del pedido: la solicitud quedó esperando a la otra persona. */
export class DependentLinkRequestSentDto {
  /** Identificador de la solicitud (el del apoderamiento pendiente). */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Siempre `PENDING`: el vínculo nace recién cuando la otra persona acepta. */
  @ApiProperty({ enum: ['PENDING'] })
  status!: 'PENDING';
}

/** Una solicitud que otra cuenta le hizo a ésta, pendiente de respuesta. */
export class IncomingDependentLinkRequestDto {
  /** Identificador de la solicitud. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Quién pide representarla. Vacío si su cuenta ya no tiene persona. */
  @ApiProperty({ description: 'Nombre de quien pide representarla' })
  requesterDisplayName!: string;

  /** Cuándo lo pidió. */
  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/** Cuerpo al aceptar que otra cuenta represente a esta persona. */
export class AcceptDependentLinkRequestDto {
  /**
   * Qué relación tiene quien hizo la solicitud con quien la acepta.
   *
   * Es opcional sólo por compatibilidad con clientes anteriores; si falta, el
   * servicio conserva el vínculo como «Otra relación».
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Parentesco de quien representará al paciente',
  })
  @IsOptional()
  @IsUUID()
  @IsIn(DEPENDENT_RELATIONSHIP_CONCEPT_IDS)
  relationshipConceptId?: string;
}

/** Respuesta a aceptar o rechazar una solicitud. */
export class DependentLinkRequestDecisionDto {
  /** Identificador de la solicitud. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Lo que se decidió. */
  @ApiProperty({ enum: ['ACCEPTED', 'REJECTED'] })
  status!: 'ACCEPTED' | 'REJECTED';
}
