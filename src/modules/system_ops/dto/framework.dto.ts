import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Un control (posiblemente jerárquico) dentro de un framework. */
export class FrameworkControlDto {
  @ApiProperty({ description: 'Código único del control dentro del framework', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  controlCode!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional({ description: 'Código del control padre (jerarquía dentro del mismo framework)', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  parentControlCode?: string;

  @ApiPropertyOptional({ description: 'Pilar (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pillarConceptId?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  objectiveText?: string;

  @ApiPropertyOptional({ description: 'Requisitos de evidencia (JSON libre)' })
  @IsOptional()
  @IsObject()
  evidenceRequirementsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Guía de evaluación (JSON libre)' })
  @IsOptional()
  @IsObject()
  assessmentGuidanceJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /admin/governance/operational-frameworks` (UC-11-11). */
export class CreateFrameworkDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Proveedor del framework (concept id)', format: 'uuid' })
  @IsUUID()
  providerConceptId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  version!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceUrl?: string;

  @ApiProperty({ type: [FrameworkControlDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrameworkControlDto)
  controls!: FrameworkControlDto[];
}

/** Respuesta al publicar un framework. */
export class FrameworkResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  version!: string;

  @ApiProperty({ type: [String], description: 'Ids de los controles creados' })
  controlIds!: string[];
}
