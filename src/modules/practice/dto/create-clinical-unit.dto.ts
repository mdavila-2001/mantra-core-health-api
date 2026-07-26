import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Cuerpo de `POST /sites/{siteId}/clinical-units` (UC-14-04). */
export class CreateClinicalUnitDto {
  @ApiPropertyOptional({ description: 'Unidad padre (misma sede)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentUnitId?: string;

  @ApiProperty({ description: 'Código único dentro de la sede', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre de la unidad', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Concepto de tipo de unidad', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Concepto de especialidad', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string;

  @ApiPropertyOptional({ description: 'Concepto de modo de servicio', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceModeConceptId?: string;
}
