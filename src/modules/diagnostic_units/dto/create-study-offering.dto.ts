import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Componente de un panel compuesto (UC-23-05). */
export class StudyComponentDto {
  @ApiProperty({
    description: 'Oferta que actúa como componente',
    format: 'uuid',
  })
  @IsUUID()
  componentOfferingId!: string;

  @ApiPropertyOptional({
    description: 'Rol del componente (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  componentRoleConceptId?: string;

  @ApiPropertyOptional({ description: 'Cantidad', example: '1' })
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiPropertyOptional({ description: 'Orden en el panel' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Cuerpo de `POST /diagnostic-units/{id}/study-offerings` (UC-23-05). */
export class CreateStudyOfferingDto {
  @ApiProperty({
    description: 'Código del estudio en la unidad',
    maxLength: 60,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  studyCode!: string;

  @ApiProperty({ description: 'Estudio (concept id)', format: 'uuid' })
  @IsUUID()
  studyConceptId!: string;

  @ApiProperty({ description: 'Nombre visible del estudio', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Sitio de la unidad donde se ofrece',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  diagnosticUnitSiteId?: string;

  @ApiPropertyOptional({
    description: 'Modalidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  modalityConceptId?: string;

  @ApiPropertyOptional({
    description: 'Zona anatómica (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de muestra (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specimenTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Instrucciones de preparación' })
  @IsOptional()
  @IsString()
  preparationInstructions?: string;

  @ApiPropertyOptional({ description: 'Duración esperada (min)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Turnaround esperado (min)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedTurnaroundMinutes?: number;

  @ApiPropertyOptional({ description: 'Requiere orden médica' })
  @IsOptional()
  @IsBoolean()
  requiresMedicalOrder?: boolean;

  @ApiPropertyOptional({ description: 'Requiere autorización previa' })
  @IsOptional()
  @IsBoolean()
  requiresPriorAuthorization?: boolean;

  @ApiPropertyOptional({ description: 'Elegible para toma domiciliaria' })
  @IsOptional()
  @IsBoolean()
  homeCollectionEligible?: boolean;

  @ApiPropertyOptional({
    type: [StudyComponentDto],
    description: 'Componentes del panel (0..N)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudyComponentDto)
  components?: StudyComponentDto[];
}
