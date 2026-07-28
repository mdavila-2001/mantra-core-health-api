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
  /**
   * Valor de control code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único del control dentro del framework',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  controlCode!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  /**
   * Valor de parent control code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Código del control padre (jerarquía dentro del mismo framework)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  parentControlCode?: string;

  /**
   * Identificador asociado a pillar concept.
   */
  @ApiPropertyOptional({ description: 'Pilar (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pillarConceptId?: string;

  /**
   * Valor de objective text mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  objectiveText?: string;

  /**
   * Valor de evidence requirements json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requisitos de evidencia (JSON libre)' })
  @IsOptional()
  @IsObject()
  evidenceRequirementsJson?: Record<string, unknown>;

  /**
   * Valor de assessment guidance json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Guía de evaluación (JSON libre)' })
  @IsOptional()
  @IsObject()
  assessmentGuidanceJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /admin/governance/operational-frameworks` (UC-11-11). */
export class CreateFrameworkDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a provider concept.
   */
  @ApiProperty({
    description: 'Proveedor del framework (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  providerConceptId!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  version!: string;

  /**
   * Valor de source url mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceUrl?: string;

  /**
   * Valor de controls mantenido por la instancia.
   */
  @ApiProperty({ type: [FrameworkControlDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrameworkControlDto)
  controls!: FrameworkControlDto[];
}

/** Respuesta al publicar un framework. */
export class FrameworkResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty()
  version!: string;

  /**
   * Valor de control ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de los controles creados' })
  controlIds!: string[];
}
