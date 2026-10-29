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
  /**
   * Valor de step number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Número de paso (contiguo desde 1). Si se omite se asigna por orden.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  stepNumber?: number;

  /**
   * Identificador asociado a event schema definition.
   */
  @ApiProperty({
    description: 'Esquema de evento que cualifica el paso',
    format: 'uuid',
  })
  @IsUUID()
  eventSchemaDefinitionId!: string;

  /**
   * Valor de qualification rule json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Regla de cualificación (JSON)' })
  @IsOptional()
  @IsObject()
  qualificationRuleJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /telemetry/funnels` (UC-28-10, pasos anidados). */
export class CreateFunnelDto {
  /**
   * Valor de funnel code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único del funnel', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  funnelCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre del funnel', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a purpose definition.
   */
  @ApiProperty({ description: 'Propósito de tracking activo', format: 'uuid' })
  @IsUUID()
  purposeDefinitionId!: string;

  /**
   * Identificador asociado a portal type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de portal (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  portalTypeConceptId?: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Número de versión', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  versionNumber?: number;

  /**
   * Valor de steps mantenido por la instancia.
   */
  @ApiProperty({
    type: [FunnelStepDto],
    description: 'Pasos del funnel (>= 1)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FunnelStepDto)
  steps!: FunnelStepDto[];
}

/** Respuesta de una definición de funnel. */
export class FunnelResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de funnel code mantenido por la instancia.
   */
  @ApiProperty()
  funnelCode!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Valor de step count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de pasos definidos' })
  stepCount!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
