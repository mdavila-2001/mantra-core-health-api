import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Un periodo hijo del ejercicio fiscal. */
export class FiscalPeriodInputDto {
  @ApiProperty({ description: 'Código del periodo (p. ej. 2026-01)', maxLength: 40 })
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  endDate!: string;
}

/** Cuerpo de `POST /accounting/fiscal-years` (UC-16-04). */
export class CreateFiscalYearDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  @ApiProperty({ description: 'Código del ejercicio (único por práctica)', maxLength: 40 })
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ type: [FiscalPeriodInputDto], description: 'Periodos hijos (>=1)' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FiscalPeriodInputDto)
  periods!: FiscalPeriodInputDto[];
}

/** Cuerpo de `POST /accounting/fiscal-periods/:id/lock` (UC-16-05). */
export class LockPeriodDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Respuesta con el ejercicio y sus periodos. */
export class FiscalYearResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: [String], description: 'Ids de periodos creados' })
  periodIds!: string[];
}
