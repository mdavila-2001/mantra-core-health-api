import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Una dependencia upstream declarada por la definición. */
export class ReadModelDependencyInputDto {
  /**
   * Valor de source schema name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Esquema de la fuente upstream',
    example: 'billing',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sourceSchemaName!: string;

  /**
   * Valor de source object name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Objeto (tabla/vista) de la fuente upstream',
    example: 'bills',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sourceObjectName!: string;

  /**
   * Valor de dependency type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de dependencia', enum: ['TABLE', 'VIEW'] })
  @IsIn(['TABLE', 'VIEW'])
  dependencyType!: 'TABLE' | 'VIEW';

  /**
   * Valor de selected columns mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Columnas seleccionadas de la fuente' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedColumns?: string[];

  /**
   * Valor de filtering rule summary mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Resumen de la regla de filtrado' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  filteringRuleSummary?: string;
}

/** Cuerpo de `POST /read-models/definitions` (UC-30-01). */
export class CreateReadModelDefinitionDto {
  /**
   * Valor de schema name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Esquema físico', example: 'read_models' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  schemaName!: string;

  /**
   * Valor de object name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nombre del objeto',
    example: 'crm_account_360_v',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(/^[a-z0-9_]+$/, { message: 'objectName debe ser snake_case' })
  objectName!: string;

  /**
   * Valor de object type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de objeto físico',
    enum: ['VIEW', 'MATERIALIZED_VIEW'],
  })
  @IsIn(['VIEW', 'MATERIALIZED_VIEW'])
  objectType!: 'VIEW' | 'MATERIALIZED_VIEW';

  /**
   * Valor de owning module mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Módulo dueño del contrato' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  owningModule?: string;

  /**
   * Valor de purpose text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Propósito legible del read model' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  purposeText?: string;

  /**
   * Valor de refresh mode mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Modo de refresh',
    enum: ['CONCURRENT', 'SCHEDULED'],
  })
  @IsOptional()
  @IsIn(['CONCURRENT', 'SCHEDULED'])
  refreshMode?: 'CONCURRENT' | 'SCHEDULED';

  /**
   * Valor de maximum staleness seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Máxima antigüedad tolerada en segundos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maximumStalenessSeconds?: number;

  /**
   * Valor de default page size mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tamaño de página por defecto' })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultPageSize?: number;

  /**
   * Valor de maximum page size mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tamaño de página máximo' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maximumPageSize?: number;

  /**
   * Valor de stable cursor columns mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Columnas de cursor estable (tie-breaker determinista)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stableCursorColumns?: string[];

  /**
   * Valor de contains pii mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'La vista contiene PII' })
  @IsOptional()
  @IsBoolean()
  containsPii?: boolean;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'La vista contiene PHI' })
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  /**
   * Valor de security barrier required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere security barrier' })
  @IsOptional()
  @IsBoolean()
  securityBarrierRequired?: boolean;

  /**
   * Valor de row level security required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere row-level security' })
  @IsOptional()
  @IsBoolean()
  rowLevelSecurityRequired?: boolean;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Número de versión inicial (por defecto 1)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  versionNumber?: number;

  /**
   * Valor de dependencies mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Dependencias upstream',
    type: [ReadModelDependencyInputDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReadModelDependencyInputDto)
  dependencies!: ReadModelDependencyInputDto[];
}
