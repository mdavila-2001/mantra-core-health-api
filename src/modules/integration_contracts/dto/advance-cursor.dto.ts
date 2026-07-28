import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /integration/contracts/{id}/sync-cursors/{scope}/advance` (UC-31-08). */
export class AdvanceCursorDto {
  /**
   * Valor de cursor value mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nuevo valor del cursor (debe avanzar hacia adelante)',
    maxLength: 4096,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  cursorValue!: string;

  /**
   * Valor de watermark at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Marca de agua del avance (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  watermarkAt?: string;

  /**
   * Identificador asociado a last successful exchange.
   */
  @ApiPropertyOptional({
    description: 'Último intercambio exitoso que valida el avance',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  lastSuccessfulExchangeId?: string;
}
