import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Cuerpo de `POST /billing/simulated/charges/:id/payment`. */
export class SimulatedRegisterPaymentDto {
  @ApiProperty({
    description: 'Código del catálogo SIMULADO de métodos de pago',
    example: 1,
  })
  @IsInt()
  methodCode!: number;
}

export class SimulatedBuyerDto {
  @ApiProperty() @IsString() @MaxLength(500) name!: string;
  @ApiProperty() @IsInt() documentTypeCode!: number;
  @ApiProperty() @IsString() @MaxLength(20) documentNumber!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5) complement?:
    string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(320) email?:
    string | null;
}

export class SimulatedSimulationDto {
  @ApiPropertyOptional({
    description: 'Sólo simulador: forzar un mensaje del catálogo oficial',
  })
  @IsOptional()
  @IsNumber()
  forceMessageCode?: number;
}

/** Cuerpo de `POST /billing/simulated/charges/:id/invoices`. */
export class SimulatedIssueInvoiceDto {
  @ApiProperty({ type: SimulatedBuyerDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SimulatedBuyerDto)
  buyer!: SimulatedBuyerDto;

  @ApiPropertyOptional({ description: 'Descuento adicional, decimal en texto' })
  @IsOptional()
  @IsString()
  additionalDiscount?: string | null;

  @ApiPropertyOptional({ type: SimulatedSimulationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SimulatedSimulationDto)
  simulation?: SimulatedSimulationDto | null;
}

export class SimulatedAnnulDto {
  @ApiProperty({
    description: 'Motivo del catálogo SIMULADO de anulación',
    example: 1,
  })
  @IsInt()
  reasonCode!: number;
}

export class SimulatedEmailDto {
  @ApiProperty({ example: 'paciente@correo.com' })
  @IsString()
  @MaxLength(320)
  to!: string;
}

export class SimulatedInstancePaymentDto {
  @ApiProperty() @IsInt() methodCode!: number;
  @ApiProperty({ description: 'Decimal en texto' }) @IsString() amount!: string;
}
