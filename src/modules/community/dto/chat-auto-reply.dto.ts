import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Entre cuánto y cuánto se puede pedir la espera, en minutos. */
export const INACTIVITY_MINUTES_MIN = 1;
export const INACTIVITY_MINUTES_MAX = 1440;

/** Entre cuánto y cuánto puede valer el descanso entre avisos, en horas. */
export const COOLDOWN_HOURS_MIN = 1;
export const COOLDOWN_HOURS_MAX = 168;

/** Lo más largo que puede ser el texto: el mismo tope que un mensaje. */
export const AUTO_REPLY_MAX_LENGTH = 4000;

/**
 * `HH:MM` o `HH:MM:SS`.
 *
 * Postgres devuelve `time` con segundos; el cliente manda sin ellos. Se aceptan
 * las dos formas y se normaliza al guardar, en vez de rechazar a quien manda
 * exactamente lo que la lectura anterior le devolvió.
 */
const HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Cuerpo de `PUT /community/profiles/:profileId/auto-reply` (F4.7).
 *
 * Es un `PUT` idempotente y no un `PATCH`: la configuración es una sola fila
 * por perfil y se manda entera, así que no hace falta saber si ya existía.
 */
export class UpsertChatAutoReplyDto {
  /** Si contestar solo. Apagada, nada de lo demás tiene efecto. */
  @ApiProperty({ description: 'Si la respuesta automática está encendida' })
  @IsBoolean()
  isActive!: boolean;

  /**
   * Cuántos minutos sin actividad tuya hacen falta para que conteste sola.
   */
  @ApiProperty({
    description: 'Minutos de inactividad antes de contestar solo',
    minimum: INACTIVITY_MINUTES_MIN,
    maximum: INACTIVITY_MINUTES_MAX,
  })
  @IsInt()
  @Min(INACTIVITY_MINUTES_MIN)
  @Max(INACTIVITY_MINUTES_MAX)
  inactivityMinutes!: number;

  /** Lo que contesta. */
  @ApiProperty({
    description: 'Texto de la respuesta',
    maxLength: AUTO_REPLY_MAX_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(AUTO_REPLY_MAX_LENGTH)
  bodyText!: string;

  /**
   * Cuántas horas esperar antes de volver a avisarle a la misma conversación.
   */
  @ApiProperty({
    description: 'Horas de descanso antes de repetirle a la misma conversación',
    minimum: COOLDOWN_HOURS_MIN,
    maximum: COOLDOWN_HOURS_MAX,
  })
  @IsInt()
  @Min(COOLDOWN_HOURS_MIN)
  @Max(COOLDOWN_HOURS_MAX)
  cooldownHours!: number;

  /** Si sólo contestar fuera del horario de atención declarado abajo. */
  @ApiProperty({ description: 'Contestar sólo fuera del horario de atención' })
  @IsBoolean()
  onlyOutsideBusinessHours!: boolean;

  /** Desde qué hora atiende, `HH:MM`. */
  @ApiPropertyOptional({
    description: 'Inicio del horario de atención',
    example: '08:00',
  })
  @IsOptional()
  @Matches(HORA, { message: 'businessHoursFrom debe tener formato HH:MM' })
  businessHoursFrom?: string;

  /**
   * Hasta qué hora atiende, `HH:MM`.
   *
   * Puede ser **menor** que el inicio: eso es una franja que cruza la
   * medianoche —el turno noche—, y es válida.
   */
  @ApiPropertyOptional({
    description: 'Fin del horario de atención',
    example: '18:00',
  })
  @IsOptional()
  @Matches(HORA, { message: 'businessHoursTo debe tener formato HH:MM' })
  businessHoursTo?: string;
}

/** La configuración de respuesta automática de un perfil, como viaja al cliente. */
export class ChatAutoReplyDto {
  /** Identificador de la configuración. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** De quién es. */
  @ApiProperty({ format: 'uuid' })
  publicProfileId!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  inactivityMinutes!: number;

  @ApiProperty()
  bodyText!: string;

  @ApiProperty()
  cooldownHours!: number;

  @ApiProperty()
  onlyOutsideBusinessHours!: boolean;

  @ApiPropertyOptional({ nullable: true, example: '08:00' })
  businessHoursFrom?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '18:00' })
  businessHoursTo?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
