import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Un paso de funnel. */
export class FunnelStepDto {
  @ApiPropertyOptional({ description: 'Número de paso (contiguo desde 1). Si se omite se asigna por orden.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  stepNumber?: number;

  @ApiProperty({ description: 'Esquema de evento que cualifica el paso', format: 'uuid' })
  @IsUUID()
  eventSchemaDefinitionId!: string;

  @ApiPropertyOptional({ description: 'Regla de cualificación (JSON)' })
  @IsOptional()
  @IsObject()
  qualificationRuleJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /telemetry/funnels` (UC-28-10, pasos anidados). */
export class CreateFunnelDto {
  @ApiProperty({ description: 'Código único del funnel', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  funnelCode!: string;

  @ApiProperty({ description: 'Nombre del funnel', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Propósito de tracking activo', format: 'uuid' })
  @IsUUID()
  purposeDefinitionId!: string;

  @ApiPropertyOptional({ description: 'Tipo de portal (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  portalTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Número de versión', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  versionNumber?: number;

  @ApiProperty({ type: [FunnelStepDto], description: 'Pasos del funnel (>= 1)' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FunnelStepDto)
  steps!: FunnelStepDto[];
}

/** Respuesta de una definición de funnel. */
export class FunnelResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  funnelCode!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ description: 'Número de pasos definidos' })
  stepCount!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  createdAt!: Date;
}
