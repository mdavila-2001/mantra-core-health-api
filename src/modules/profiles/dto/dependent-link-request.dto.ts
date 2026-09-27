import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

/**
 * Cuerpo de `POST /profiles/patients/me/dependent-requests`.
 *
 * Sólo el documento: a quién se le pide lo resuelve el servidor, y la respuesta
 * no dice de quién es para no servir de buscador de personas por CI.
 */
export class RequestDependentLinkDto {
  /**
   * Documento de identidad de la persona a representar.
   *
   * Admite espacios alrededor —es lo que queda al pegar un CI— y el servicio
   * los quita; por dentro, las mismas reglas que el alta de un dependiente.
   */
  @ApiProperty({
    description: 'Documento de identidad de la persona a representar',
    example: '7654321',
    maxLength: 60,
  })
  @IsString()
  @MaxLength(60)
  @Matches(/^\s*[A-Za-z0-9.-]{4,40}\s*$/, {
    message:
      'El documento tiene entre 4 y 40 caracteres: letras, dígitos, punto y guion',
  })
  nationalId!: string;
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

/** Respuesta a aceptar o rechazar una solicitud. */
export class DependentLinkRequestDecisionDto {
  /** Identificador de la solicitud. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Lo que se decidió. */
  @ApiProperty({ enum: ['ACCEPTED', 'REJECTED'] })
  status!: 'ACCEPTED' | 'REJECTED';
}
