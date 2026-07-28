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
  /**
   * Identificador asociado a component offering.
   */
  @ApiProperty({
    description: 'Oferta que actúa como componente',
    format: 'uuid',
  })
  @IsUUID()
  componentOfferingId!: string;

  /**
   * Identificador asociado a component role concept.
   */
  @ApiPropertyOptional({
    description: 'Rol del componente (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  componentRoleConceptId?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad', example: '1' })
  @IsOptional()
  @IsString()
  quantity?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Orden en el panel' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Cuerpo de `POST /diagnostic-units/{id}/study-offerings` (UC-23-05). */
export class CreateStudyOfferingDto {
  /**
   * Valor de study code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código del estudio en la unidad',
    maxLength: 60,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  studyCode!: string;

  /**
   * Identificador asociado a study concept.
   */
  @ApiProperty({ description: 'Estudio (concept id)', format: 'uuid' })
  @IsUUID()
  studyConceptId!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre visible del estudio', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  /**
   * Identificador asociado a diagnostic unit site.
   */
  @ApiPropertyOptional({
    description: 'Sitio de la unidad donde se ofrece',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  diagnosticUnitSiteId?: string;

  /**
   * Identificador asociado a modality concept.
   */
  @ApiPropertyOptional({
    description: 'Modalidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  modalityConceptId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({
    description: 'Zona anatómica (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a specimen type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de muestra (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specimenTypeConceptId?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Valor de preparation instructions mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Instrucciones de preparación' })
  @IsOptional()
  @IsString()
  preparationInstructions?: string;

  /**
   * Valor de expected duration minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Duración esperada (min)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedDurationMinutes?: number;

  /**
   * Valor de expected turnaround minutes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Turnaround esperado (min)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedTurnaroundMinutes?: number;

  /**
   * Valor de requires medical order mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere orden médica' })
  @IsOptional()
  @IsBoolean()
  requiresMedicalOrder?: boolean;

  /**
   * Valor de requires prior authorization mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere autorización previa' })
  @IsOptional()
  @IsBoolean()
  requiresPriorAuthorization?: boolean;

  /**
   * Valor de home collection eligible mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Elegible para toma domiciliaria' })
  @IsOptional()
  @IsBoolean()
  homeCollectionEligible?: boolean;

  /**
   * Valor de components mantenido por la instancia.
   */
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
