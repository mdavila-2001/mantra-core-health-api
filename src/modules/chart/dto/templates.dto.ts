import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TECHNICAL_DATA_TYPES, type TechnicalDataType } from '../../forms/dto';

/** Cuerpo de `POST /charts/templates/{templateId}/assignments` (UC-15-12). */
export class AssignTemplateDto {
  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Práctica destino (practice.practices)',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Perfil del profesional destino',
  })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  /**
   * Valor de is default mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Marca esta asignación como default del scope',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/** Respuesta de `POST /charts/templates/{templateId}/assignments` (UC-15-12). */
export class AssignmentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a template.
   */
  @ApiProperty({ format: 'uuid' })
  templateId!: string;

  /**
   * Valor de is default mantenido por la instancia.
   */
  @ApiProperty()
  isDefault!: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    description: 'Concept id del estado de la asignación',
    format: 'uuid',
  })
  statusConceptId!: string;
}

/**
 * Un campo del esquema de una plantilla (`POST /charts/templates`).
 *
 * Reusa el catálogo de tipos técnicos del módulo `forms` (`TECHNICAL_DATA_TYPES`)
 * en lugar de duplicarlo: cada campo termina siendo, del lado de persistencia,
 * un `forms.dynamic_field_definitions` asignado a la sección de la plantilla.
 */
export class TemplateFieldInputDto {
  /**
   * Código único del campo dentro de la plantilla.
   */
  @ApiProperty({ description: 'Código único del campo', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Nombre legible del campo.
   */
  @ApiProperty({ description: 'Nombre legible del campo', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Tipo de dato técnico del campo.
   */
  @ApiProperty({
    enum: TECHNICAL_DATA_TYPES,
    description: 'Tipo de dato técnico',
  })
  @IsIn(TECHNICAL_DATA_TYPES)
  dataType!: TechnicalDataType;

  /**
   * Value set de valores permitidos, para campos de selección.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Value set de valores permitidos (campos de selección)',
  })
  @IsOptional()
  @IsUUID()
  valueSetId?: string;

  /**
   * Si el campo es obligatorio al completar la plantilla.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * Orden de presentación del campo dentro de la plantilla.
   */
  @ApiPropertyOptional({ description: 'Orden de presentación' })
  @IsOptional()
  @IsInt()
  ordinal?: number;
}

/** Cuerpo de `POST /charts/templates`: crea una plantilla con su esquema de campos. */
export class CreateChartTemplateDto {
  /**
   * Especialidad a la que pertenece la plantilla.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Especialidad de la plantilla (concept id)',
  })
  @IsUUID()
  specialtyConceptId!: string;

  /**
   * Tenant dueño de la plantilla. Ausente: plantilla disponible en cualquier tenant.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Tenant dueño de la plantilla',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Código único de la plantilla.
   */
  @ApiProperty({ description: 'Código único de la plantilla', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Nombre legible de la plantilla.
   */
  @ApiProperty({
    description: 'Nombre legible de la plantilla',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Campos propios de la especialidad que componen el esquema de la plantilla.
   */
  @ApiProperty({
    type: [TemplateFieldInputDto],
    description: 'Campos del esquema, en el orden en que se presentan',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldInputDto)
  fields!: TemplateFieldInputDto[];
}

/** Un campo ya persistido de una plantilla, tal como lo lee el frontend. */
export class ChartTemplateFieldDto {
  /**
   * Identificador de la asignación (`forms.field_assignments.id`).
   */
  @ApiProperty({ format: 'uuid' })
  assignmentId!: string;

  /**
   * Identificador del campo (`forms.dynamic_field_definitions.id`).
   */
  @ApiProperty({ format: 'uuid' })
  fieldId!: string;

  /**
   * Código del campo.
   */
  @ApiProperty()
  code!: string;

  /**
   * Nombre legible del campo.
   */
  @ApiProperty()
  name!: string;

  /**
   * Tipo de dato técnico del campo.
   */
  @ApiProperty({ enum: TECHNICAL_DATA_TYPES })
  dataType!: TechnicalDataType;

  /**
   * Value set de valores permitidos, si el campo es de selección.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  valueSetId?: string;

  /**
   * Si el campo es obligatorio al completar la plantilla.
   */
  @ApiProperty()
  required!: boolean;

  /**
   * Orden de presentación del campo dentro de la plantilla.
   */
  @ApiPropertyOptional()
  ordinal?: number;
}

/** Respuesta de `POST /charts/templates`, `GET /charts/templates` y `GET /charts/templates/:id`. */
export class ChartTemplateResponseDto {
  /**
   * Identificador único de la plantilla.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Especialidad a la que pertenece la plantilla.
   */
  @ApiProperty({ format: 'uuid' })
  specialtyConceptId!: string;

  /**
   * Tenant dueño de la plantilla, si no es global.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  tenantId?: string;

  /**
   * Código único de la plantilla.
   */
  @ApiProperty()
  code!: string;

  /**
   * Nombre legible de la plantilla.
   */
  @ApiProperty()
  name!: string;

  /**
   * Versión de la plantilla.
   */
  @ApiProperty()
  version!: number;

  /**
   * Concept id del estado de la plantilla.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Los campos del esquema, en su orden de presentación.
   */
  @ApiProperty({ type: [ChartTemplateFieldDto] })
  fields!: ChartTemplateFieldDto[];
}
