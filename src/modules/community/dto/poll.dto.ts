import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /community/posts/{postId}/polls`. Bootstrap: crea la encuesta y
 * sus opciones sobre un post existente (padre de UC-19-12).
 */
export class CreatePollDto {
  /**
   * Valor de question mantenido por la instancia.
   */
  @ApiProperty({ description: 'Pregunta', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  question!: string;

  /**
   * Valor de options mantenido por la instancia.
   */
  @ApiProperty({ description: 'Opciones de la encuesta', type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  options!: string[];

  /**
   * Valor de allows multiple mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Permite selección múltiple' })
  @IsOptional()
  @IsBoolean()
  allowsMultiple?: boolean;

  /**
   * Valor de closes at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fecha de cierre', type: String })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  closesAt?: Date;
}

/** Cuerpo de `POST /community/polls/{pollId}/votes` (UC-19-12). */
export class CreateVoteDto {
  /**
   * Identificador asociado a poll option.
   */
  @ApiProperty({ description: 'Opción elegida', format: 'uuid' })
  @IsUUID()
  pollOptionId!: string;

  /**
   * Identificador asociado a voter profile.
   */
  @ApiProperty({ description: 'Perfil votante', format: 'uuid' })
  @IsUUID()
  voterProfileId!: string;
}
