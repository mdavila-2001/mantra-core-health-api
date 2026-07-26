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
  @ApiProperty({ description: 'Especialidad (concept id)', format: 'uuid' })
  @IsUUID()
  specialtyConceptId!: string;

  @ApiPropertyOptional({ description: 'Especialidad primaria de la unidad' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/** Cuerpo de `PUT /diagnostic-units/{id}/specialties` (UC-23-04). */
export class SetSpecialtiesDto {
  @ApiProperty({ type: [SpecialtyItemDto], description: 'Conjunto vigente de especialidades' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SpecialtyItemDto)
  specialties!: SpecialtyItemDto[];
}
