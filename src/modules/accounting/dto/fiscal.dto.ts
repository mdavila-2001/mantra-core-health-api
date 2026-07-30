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
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código del periodo (p. ej. 2026-01)',
    maxLength: 40,
  })
  @IsString()
  @MaxLength(40)
  code!: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date' })
  @IsDateString()
  startDate!: string;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date' })
  @IsDateString()
  endDate!: string;
}

/** Cuerpo de `POST /accounting/fiscal-years` (UC-16-04). */
export class CreateFiscalYearDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código del ejercicio (único por práctica)',
    maxLength: 40,
  })
  @IsString()
  @MaxLength(40)
  code!: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date' })
  @IsDateString()
  startDate!: string;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @ApiProperty({ format: 'date' })
  @IsDateString()
  endDate!: string;

  /**
   * Valor de periods mantenido por la instancia.
   */
  @ApiProperty({
    type: [FiscalPeriodInputDto],
    description: 'Periodos hijos (>=1)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FiscalPeriodInputDto)
  periods!: FiscalPeriodInputDto[];
}

/** Cuerpo de `POST /accounting/fiscal-periods/:id/lock` (UC-16-05). */
export class LockPeriodDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Respuesta con el ejercicio y sus periodos. */
export class FiscalYearResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty() code!: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty() status!: string;
  /**
   * Valor de period ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de periodos creados' })
  periodIds!: string[];
}
