import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /accounting/exchange-rates` (UC-16-14). */
export class RegisterExchangeRateDto {
  /**
   * Identificador asociado a from currency concept.
   */
  @ApiProperty({ description: 'Moneda origen', format: 'uuid' })
  @IsUUID()
  fromCurrencyConceptId!: string;

  /**
   * Identificador asociado a to currency concept.
   */
  @ApiProperty({ description: 'Moneda destino', format: 'uuid' })
  @IsUUID()
  toCurrencyConceptId!: string;

  /**
   * Valor de rate mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tasa de conversión', example: '3.75' })
  @IsNumberString()
  rate!: string;

  /**
   * Valor de valid on mantenido por la instancia.
   */
  @ApiProperty({ format: 'date', example: '2026-01-31' })
  @IsDateString()
  validOn!: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;
}

/** Respuesta con la tasa registrada (upsert). */
export class ExchangeRateResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de rate mantenido por la instancia.
   */
  @ApiProperty() rate!: string;
  /**
   * Valor de valid on mantenido por la instancia.
   */
  @ApiProperty() validOn!: Date;
  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: '¿Se creó (true) o actualizó (false)?' })
  created!: boolean;
}
