import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

/** Cuerpo de `POST /sites/{siteId}/care-spaces` (UC-14-05). */
export class CreateCareSpaceDto {
  @ApiPropertyOptional({ description: 'Unidad clínica (misma sede)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  @ApiPropertyOptional({ description: 'Espacio padre (misma sede)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentSpaceId?: string;

  @ApiProperty({ description: 'Código único dentro de la sede', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre del espacio', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Concepto de tipo de espacio', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  spaceTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Capacidad (nº de plazas)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}
