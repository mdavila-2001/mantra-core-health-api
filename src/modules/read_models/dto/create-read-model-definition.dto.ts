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
  @ApiProperty({ description: 'Esquema de la fuente upstream', example: 'billing' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sourceSchemaName!: string;

  @ApiProperty({ description: 'Objeto (tabla/vista) de la fuente upstream', example: 'bills' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sourceObjectName!: string;

  @ApiProperty({ description: 'Tipo de dependencia', enum: ['TABLE', 'VIEW'] })
  @IsIn(['TABLE', 'VIEW'])
  dependencyType!: 'TABLE' | 'VIEW';

  @ApiPropertyOptional({ description: 'Columnas seleccionadas de la fuente' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedColumns?: string[];

  @ApiPropertyOptional({ description: 'Resumen de la regla de filtrado' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  filteringRuleSummary?: string;
}

/** Cuerpo de `POST /read-models/definitions` (UC-30-01). */
export class CreateReadModelDefinitionDto {
  @ApiProperty({ description: 'Esquema físico', example: 'read_models' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  schemaName!: string;

  @ApiProperty({ description: 'Nombre del objeto', example: 'crm_account_360_v' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(/^[a-z0-9_]+$/, { message: 'objectName debe ser snake_case' })
  objectName!: string;

  @ApiProperty({ description: 'Tipo de objeto físico', enum: ['VIEW', 'MATERIALIZED_VIEW'] })
  @IsIn(['VIEW', 'MATERIALIZED_VIEW'])
  objectType!: 'VIEW' | 'MATERIALIZED_VIEW';

  @ApiPropertyOptional({ description: 'Módulo dueño del contrato' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  owningModule?: string;

  @ApiPropertyOptional({ description: 'Propósito legible del read model' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  purposeText?: string;

  @ApiPropertyOptional({ description: 'Modo de refresh', enum: ['CONCURRENT', 'SCHEDULED'] })
  @IsOptional()
  @IsIn(['CONCURRENT', 'SCHEDULED'])
  refreshMode?: 'CONCURRENT' | 'SCHEDULED';

  @ApiPropertyOptional({ description: 'Máxima antigüedad tolerada en segundos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maximumStalenessSeconds?: number;

  @ApiPropertyOptional({ description: 'Tamaño de página por defecto' })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultPageSize?: number;

  @ApiPropertyOptional({ description: 'Tamaño de página máximo' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maximumPageSize?: number;

  @ApiPropertyOptional({ description: 'Columnas de cursor estable (tie-breaker determinista)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stableCursorColumns?: string[];

  @ApiPropertyOptional({ description: 'La vista contiene PII' })
  @IsOptional()
  @IsBoolean()
  containsPii?: boolean;

  @ApiPropertyOptional({ description: 'La vista contiene PHI' })
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  @ApiPropertyOptional({ description: 'Requiere security barrier' })
  @IsOptional()
  @IsBoolean()
  securityBarrierRequired?: boolean;

  @ApiPropertyOptional({ description: 'Requiere row-level security' })
  @IsOptional()
  @IsBoolean()
  rowLevelSecurityRequired?: boolean;

  @ApiPropertyOptional({ description: 'Número de versión inicial (por defecto 1)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  versionNumber?: number;

  @ApiProperty({ description: 'Dependencias upstream', type: [ReadModelDependencyInputDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReadModelDependencyInputDto)
  dependencies!: ReadModelDependencyInputDto[];
}
