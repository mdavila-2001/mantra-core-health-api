import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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

/**
 * Código del campo reservado que transporta la ficha de catálogo de una
 * plantilla sembrada (carril R2-5).
 *
 * `chart.specialty_chart_templates` no tiene columnas para organismo, URL ni
 * licencia, y el modelo de datos no se edita a mano —el pipeline es
 * `.puml` → `gen_ddl.py` → `SQL/patches/`, fuera de este repo—. Hasta que
 * existan, la procedencia viaja dentro del propio esquema de la plantilla, en
 * el `default_value_json` de un `forms.dynamic_field_definitions` con este
 * código.
 *
 * `ChartTemplatesService` lo **saca de `fields`** al responder y lo publica como
 * `provenance`: para todo consumidor —incluido `specialty-form-block`, que
 * dibuja un control por campo— la plantilla tiene exactamente los campos que un
 * médico debe completar, ni uno más.
 */
export const CHART_TEMPLATE_PROVENANCE_FIELD_CODE = '__catalog__';

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
   * Opciones propias de un campo de elección sin `valueSetId`: texto libre,
   * en el orden en que se ofrecen. Mutuamente excluyente con `valueSetId` —
   * un campo "code" declara una de las dos, nunca las dos.
   */
  @ApiPropertyOptional({
    type: [String],
    description:
      'Opciones propias de un campo de elección (dataType "code" sin valueSetId)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2, {
    message: 'Un campo de elección necesita al menos dos opciones',
  })
  @IsString({ each: true })
  options?: string[];

  /** Si el campo admite marcar varias opciones («casillas de verificación»). */
  @ApiPropertyOptional({
    description: 'Admite varias respuestas en vez de una sola',
  })
  @IsOptional()
  @IsBoolean()
  multiple?: boolean;

  /** Si el campo ofrece además «Otro», con un texto libre que no está entre `options`. */
  @ApiPropertyOptional({ description: 'Ofrece «Otro», con texto libre' })
  @IsOptional()
  @IsBoolean()
  allowOther?: boolean;

  /** La ayuda que se lee bajo la pregunta cuando el nombre no alcanza. */
  @ApiPropertyOptional({
    description: 'Ayuda que se lee bajo la pregunta (se sirve como "hint")',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /** Casillas: marcar al menos N. Sólo tiene sentido con `multiple: true`. */
  @ApiPropertyOptional({
    description: 'Cardinalidad mínima (sólo con multiple)',
  })
  @IsOptional()
  @IsInt()
  cardinalityMin?: number;

  /** Casillas: marcar como máximo N. Sólo tiene sentido con `multiple: true`. */
  @ApiPropertyOptional({
    description: 'Cardinalidad máxima (sólo con multiple)',
  })
  @IsOptional()
  @IsInt()
  cardinalityMax?: number;

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

/**
 * Cuándo se muestra un campo: `enableWhen` de HL7 FHIR con operador `=` y
 * comportamiento `SHOW`. Se cumple si el campo `fieldId` vale `equals`; si ese
 * campo es de varias respuestas, si las incluye; si `equals` es una lista,
 * basta con que coincida uno. Un campo cuyo padre está oculto, también.
 */
export class ChartTemplateShowWhenDto {
  /** El campo del que depende (`fieldId` de la misma plantilla). */
  @ApiProperty({ format: 'uuid' })
  fieldId!: string;

  /** El valor, o los valores, que lo muestran. */
  @ApiProperty({
    oneOf: [
      { type: 'string' },
      { type: 'boolean' },
      {
        type: 'array',
        items: { oneOf: [{ type: 'string' }, { type: 'boolean' }] },
      },
    ],
  })
  equals!: string | boolean | (string | boolean)[];
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

  /** Casillas: marcar al menos N. Sólo con `multiple`. */
  @ApiPropertyOptional()
  cardinalityMin?: number;

  /** Casillas: marcar como máximo N. Sólo con `multiple`. */
  @ApiPropertyOptional()
  cardinalityMax?: number;

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

  /**
   * Si el campo lo agregó esta organización, o viene del estándar.
   *
   * Lo necesita el generador para dos cosas que no puede adivinar: qué campos
   * puede tocar —los del estándar no— y cuáles cuentan contra su presupuesto de
   * extensión.
   */
  @ApiProperty({
    description: '¿Es un campo propio del tenant, o del formulario estándar?',
  })
  own!: boolean;

  /** La sección de la ficha en la que va (motivo, antecedentes, examen…). */
  @ApiPropertyOptional()
  section?: string;

  /**
   * Las respuestas ofrecidas de una lista cerrada. Con `multiple`, el valor es
   * la lista elegida (`json`); sin él, la opción elegida (`string`).
   */
  @ApiPropertyOptional({ type: [String] })
  options?: string[];

  /** Si se pueden elegir varias opciones. */
  @ApiPropertyOptional()
  multiple?: boolean;

  /** Si además se ofrece «Otro» con texto libre. */
  @ApiPropertyOptional()
  allowOther?: boolean;

  /** La ayuda bajo el campo. */
  @ApiPropertyOptional()
  description?: string;

  /** Cuándo se muestra el campo; ausente = siempre. */
  @ApiPropertyOptional({ type: () => ChartTemplateShowWhenDto })
  showWhen?: ChartTemplateShowWhenDto;
}

/**
 * De dónde salió una plantilla del catálogo de formularios estándar.
 *
 * Muchos formularios clínicos estándar tienen derechos de autor: algunos son de
 * uso libre y citable, otros son propiedad de sociedades científicas o
 * editoriales y no se pueden incorporar a un producto comercial sin licencia,
 * aunque el PDF se baje gratis. Por eso la procedencia es un dato del catálogo y
 * no una nota en un chat — se muestra junto al formulario, en pantalla.
 *
 * Ausente en las plantillas que arma un admin a mano: sólo la traen las
 * sembradas por `ClinicalFormsSeedService`.
 */
export class ChartTemplateProvenanceDto {
  /** Título del documento tal como lo publica el organismo. */
  @ApiProperty()
  sourceTitle!: string;

  /** Organismo que lo publica. */
  @ApiProperty()
  organization!: string;

  /** URL de la que se descargó. */
  @ApiProperty()
  url!: string;

  /** Licencia bajo la que se puede usar. */
  @ApiProperty()
  license!: string;

  /** Versión o edición del documento de origen. */
  @ApiPropertyOptional()
  sourceVersion?: string;

  /** Fecha de descarga, en ISO `YYYY-MM-DD`. */
  @ApiProperty()
  retrievedAt!: string;

  /** Qué se transcribió y qué quedó afuera, cuando no es obvio. */
  @ApiPropertyOptional()
  note?: string;
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
   * Sección que aloja los campos de la plantilla.
   *
   * Se publica porque colgar un campo propio **dentro** de la plantilla exige
   * nombrarla: una asignación en otra sección existe pero no la dibuja nadie.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  sectionId?: string;

  /**
   * Target de las asignaciones de campo de las plantillas de chart.
   *
   * Es un concepto del catálogo, y su UUID se deriva de un código: publicarlo
   * evita que cada cliente lo copie a mano y quede clavado el día que cambie.
   */
  @ApiProperty({ format: 'uuid' })
  fieldTargetConceptId!: string;

  /**
   * Los campos del esquema, en su orden de presentación.
   */
  @ApiProperty({ type: [ChartTemplateFieldDto] })
  fields!: ChartTemplateFieldDto[];

  /**
   * De dónde salió la plantilla, si vino del catálogo de formularios estándar.
   */
  @ApiPropertyOptional({ type: ChartTemplateProvenanceDto })
  provenance?: ChartTemplateProvenanceDto;

  /**
   * Qué clase de ficha es, en el catálogo estándar: la consulta inicial de la
   * especialidad (`BASE`), el control estándar de una condición (`SPECIFIC`) o
   * una de toda consulta (`GENERAL`). Ausente en las plantillas armadas a mano.
   */
  @ApiPropertyOptional({ enum: ['BASE', 'SPECIFIC', 'GENERAL'] })
  kind?: 'BASE' | 'SPECIFIC' | 'GENERAL';
}
