import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /accounting/exchange-rates` (UC-16-14). */
export class RegisterExchangeRateDto {
  @ApiProperty({ description: 'Moneda origen', format: 'uuid' })
  @IsUUID()
  fromCurrencyConceptId!: string;

  @ApiProperty({ description: 'Moneda destino', format: 'uuid' })
  @IsUUID()
  toCurrencyConceptId!: string;

  @ApiProperty({ description: 'Tasa de conversión', example: '3.75' })
  @IsNumberString()
  rate!: string;

  @ApiProperty({ format: 'date', example: '2026-01-31' })
  @IsDateString()
  validOn!: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;
}

/** Respuesta con la tasa registrada (upsert). */
export class ExchangeRateResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() rate!: string;
  @ApiProperty() validOn!: Date;
  @ApiProperty({ description: '¿Se creó (true) o actualizó (false)?' }) created!: boolean;
}
