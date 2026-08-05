import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/** Una especialidad declarada por la unidad (UC-23-04). */
export class SpecialtyItemDto {
  /**
   * Identificador asociado a specialty concept.
   */
  @ApiProperty({ description: 'Especialidad (concept id)', format: 'uuid' })
  @IsUUID()
  specialtyConceptId!: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Especialidad primaria de la unidad' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/** Cuerpo de `PUT /diagnostic-units/{id}/specialties` (UC-23-04). */
export class SetSpecialtiesDto {
  /**
   * Valor de specialties mantenido por la instancia.
   */
  @ApiProperty({
    type: [SpecialtyItemDto],
    description: 'Conjunto vigente de especialidades',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SpecialtyItemDto)
  specialties!: SpecialtyItemDto[];
}
