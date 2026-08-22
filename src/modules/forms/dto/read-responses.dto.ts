import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Respuestas de la cara de lectura del módulo (Fase 1 del carril de consulta
 * de formularios). Exponen concept ids crudos —el cliente los resuelve contra
 * terminología, como en el resto de las lecturas— y la información suficiente
 * para render dirigido por datos.
 */

/** Un set de definiciones, tal como aparece en el listado. */
export class DefinitionSetItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de namespace uri mantenido por la instancia.
   */
  @ApiProperty()
  namespaceUri!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Identificador asociado a owner tenant.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerTenantId?: string;

  /**
   * Identificador asociado a target domain concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  targetDomainConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Listado de sets de definiciones, acotado y con el recorte declarado. */
export class DefinitionSetListResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [DefinitionSetItemDto] })
  items!: DefinitionSetItemDto[];

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope aplicado al listado' })
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si quedaron sets fuera del tope. Se declara, no se calla',
  })
  truncated!: boolean;
}

/** Una versión de un set, con su estado de publicación. */
export class DefinitionSetVersionDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de semantic version mantenido por la instancia.
   */
  @ApiProperty()
  semanticVersion!: string;

  /**
   * Valor de schema hash mantenido por la instancia.
   */
  @ApiProperty()
  schemaHash!: string;

  /**
   * Identificador asociado a publication status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  publicationStatusConceptId?: string;

  /**
   * Identificador asociado a compatibility concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  compatibilityConceptId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveFrom?: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveTo?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;

  /**
   * Valor de members mantenido por la instancia.
   */
  @ApiProperty({
    type: () => [SetMemberDto],
    description: 'Campos que componen esta versión, en su orden',
  })
  members!: SetMemberDto[];
}

/** Un campo miembro de una versión del set. */
export class SetMemberDto {
  /**
   * Identificador asociado a field.
   */
  @ApiProperty({ format: 'uuid' })
  fieldId!: string;

  /**
   * Identificador asociado a section.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  sectionId?: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiPropertyOptional()
  required?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional()
  ordinal?: number;
}

/** Una localización i18n de un campo. */
export class FieldLocalizationDto {
  /**
   * Identificador asociado a language concept.
   */
  @ApiProperty({ format: 'uuid' })
  languageConceptId!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiPropertyOptional()
  label?: string;

  /**
   * Valor de help text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  helpText?: string;

  /**
   * Valor de placeholder mantenido por la instancia.
   */
  @ApiPropertyOptional()
  placeholder?: string;

  /**
   * Valor de validation message mantenido por la instancia.
   */
  @ApiPropertyOptional()
  validationMessage?: string;
}

/** Una regla de validación de un campo. */
export class FieldValidationRuleDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a rule type concept.
   */
  @ApiProperty({ format: 'uuid' })
  ruleTypeConceptId!: string;

  /**
   * Identificador asociado a operator concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  operatorConceptId?: string;

  /**
   * Valor de parameters json mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Parámetros de la regla, tal como se declararon',
  })
  parametersJson!: unknown;

  /**
   * Valor de error message mantenido por la instancia.
   */
  @ApiPropertyOptional()
  errorMessage?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  severityConceptId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional()
  ordinal?: number;

  /**
   * Valor de active mantenido por la instancia.
   */
  @ApiPropertyOptional()
  active?: boolean;
}

/** Una dependencia condicional que gobierna a un campo. */
export class FieldDependencyDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a target field.
   */
  @ApiProperty({ format: 'uuid' })
  targetFieldId!: string;

  /**
   * Identificador asociado a source field.
   */
  @ApiProperty({ format: 'uuid' })
  sourceFieldId!: string;

  /**
   * Identificador asociado a operator concept.
   */
  @ApiProperty({ format: 'uuid' })
  operatorConceptId!: string;

  /**
   * Identificador asociado a behavior concept.
   */
  @ApiProperty({ format: 'uuid' })
  behaviorConceptId!: string;

  /**
   * Valor de comparison value json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  comparisonValueJson?: unknown;

  /**
   * Valor de logical group mantenido por la instancia.
   */
  @ApiPropertyOptional()
  logicalGroup?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional()
  ordinal?: number;
}

/** El esquema completo de un campo, listo para render dirigido por datos. */
export class FieldSchemaDto {
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
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo técnico que decide el control a dibujar' })
  dataType!: string;

  /**
   * Identificador asociado a value set.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  valueSetId?: string;

  /**
   * Identificador asociado a unit value set.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  unitValueSetId?: string;

  /**
   * Valor de cardinality min mantenido por la instancia.
   */
  @ApiPropertyOptional()
  cardinalityMin?: number;

  /**
   * Valor de cardinality max mantenido por la instancia.
   */
  @ApiPropertyOptional()
  cardinalityMax?: number;

  /**
   * Valor de length min mantenido por la instancia.
   */
  @ApiPropertyOptional()
  lengthMin?: number;

  /**
   * Valor de length max mantenido por la instancia.
   */
  @ApiPropertyOptional()
  lengthMax?: number;

  /**
   * Valor de regex mantenido por la instancia.
   */
  @ApiPropertyOptional()
  regex?: string;

  /**
   * Valor de default value json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  defaultValueJson?: unknown;

  /**
   * Identificador asociado a state concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  stateConceptId?: string;

  /**
   * Valor de localizations mantenido por la instancia.
   */
  @ApiProperty({ type: [FieldLocalizationDto] })
  localizations!: FieldLocalizationDto[];

  /**
   * Valor de validation rules mantenido por la instancia.
   */
  @ApiProperty({ type: [FieldValidationRuleDto] })
  validationRules!: FieldValidationRuleDto[];

  /**
   * Valor de dependencies mantenido por la instancia.
   */
  @ApiProperty({
    type: [FieldDependencyDto],
    description: 'Dependencias cuyo destino es este campo',
  })
  dependencies!: FieldDependencyDto[];
}

/** Una sección referenciada por miembros o asignaciones. */
export class SectionItemDto {
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
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Identificador asociado a parent section.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentSectionId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional()
  ordinal?: number;
}

/** El detalle de un set: sus versiones, sus campos y sus secciones. */
export class DefinitionSetDetailResponseDto extends DefinitionSetItemDto {
  /**
   * Valor de versions mantenido por la instancia.
   */
  @ApiProperty({ type: [DefinitionSetVersionDto] })
  versions!: DefinitionSetVersionDto[];

  /**
   * Valor de fields mantenido por la instancia.
   */
  @ApiProperty({
    type: [FieldSchemaDto],
    description:
      'Las definiciones de todos los campos miembros, una sola vez aunque participen de varias versiones',
  })
  fields!: FieldSchemaDto[];

  /**
   * Valor de sections mantenido por la instancia.
   */
  @ApiProperty({ type: [SectionItemDto] })
  sections!: SectionItemDto[];
}

/** Una instancia de formulario, tal como aparece en el listado. */
export class FormInstanceItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a resource.
   */
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @ApiProperty({ format: 'uuid' })
  resourceTypeConceptId!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiProperty()
  schemaVersion!: number;

  /**
   * Identificador asociado a state concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  stateConceptId?: string;

  /**
   * Valor de closed at mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  closedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Listado de instancias de un recurso, acotado y con el recorte declarado. */
export class FormInstanceListResponseDto {
  /**
   * Identificador asociado a encounter.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Encuentro por el que se filtró el listado',
  })
  encounterId!: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [FormInstanceItemDto] })
  items!: FormInstanceItemDto[];

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope aplicado al listado' })
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si quedaron instancias fuera del tope. Se declara, no se calla',
  })
  truncated!: boolean;
}

/** Un valor vigente de la instancia, con su columna `value_*` ya resuelta. */
export class FieldValueItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a field.
   */
  @ApiProperty({ format: 'uuid' })
  fieldId!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    nullable: true,
    description:
      'Tipo técnico del campo, si su definición sigue existiendo. Decide cómo re-dibujar el valor',
  })
  dataType?: string;

  /**
   * Nombre legible del campo.
   */
  @ApiPropertyOptional({
    nullable: true,
    description:
      'Nombre del campo, si su definición sigue existiendo. Es la etiqueta con que una pantalla sin acceso a las plantillas puede re-pintar el valor',
  })
  fieldName?: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiPropertyOptional({
    nullable: true,
    description:
      'El valor único, resuelto de la columna value[x] que su tipo determina. null cuando el campo está enmascarado',
  })
  value?: unknown;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  unitConceptId?: string;

  /**
   * Identificador asociado a value status concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  valueStatusConceptId?: string;

  /**
   * Valor de value version mantenido por la instancia.
   */
  @ApiPropertyOptional()
  valueVersion?: number;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiProperty()
  ordinal!: number;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveFrom?: Date;

  /**
   * Valor de masked mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si el campo tiene una regla de acceso activa que hoy no puede evaluarse: el valor no se expone (deny-by-default)',
  })
  masked!: boolean;
}

/**
 * Listado del autoservicio del paciente: sus instancias, de todos sus
 * encuentros del tenant activo. Sin `encounterId`: acá no se filtra por un
 * encuentro elegido sino por la titularidad de la sesión.
 */
export class MyFormInstanceListResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [FormInstanceItemDto] })
  items!: FormInstanceItemDto[];

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope aplicado al listado' })
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si quedaron instancias fuera del tope. Se declara, no se calla',
  })
  truncated!: boolean;
}

/** El detalle de una instancia con sus valores vigentes. */
export class FormInstanceDetailResponseDto extends FormInstanceItemDto {
  /**
   * Valor de values mantenido por la instancia.
   */
  @ApiProperty({ type: [FieldValueItemDto] })
  values!: FieldValueItemDto[];
}

/** Una asignación de campo a un target, con su presentación. */
export class FieldAssignmentItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a field.
   */
  @ApiProperty({ format: 'uuid' })
  fieldId!: string;

  /**
   * Identificador asociado a target resource concept.
   */
  @ApiProperty({ format: 'uuid' })
  targetResourceConceptId!: string;

  /**
   * Identificador asociado a profile type concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  profileTypeConceptId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId?: string;

  /**
   * Identificador asociado a branch.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  branchId?: string;

  /**
   * Identificador asociado a section.
   */
  @ApiProperty({ format: 'uuid' })
  sectionId!: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiProperty()
  required!: boolean;

  /**
   * Valor de visible mantenido por la instancia.
   */
  @ApiProperty()
  visible!: boolean;

  /**
   * Valor de editable mantenido por la instancia.
   */
  @ApiProperty()
  editable!: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional()
  ordinal?: number;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo?: Date;

  /**
   * Identificador asociado a state concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  stateConceptId?: string;
}

/** Listado de asignaciones, acotado y con el recorte declarado. */
export class FieldAssignmentListResponseDto {
  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [FieldAssignmentItemDto] })
  items!: FieldAssignmentItemDto[];

  /**
   * Valor de sections mantenido por la instancia.
   */
  @ApiProperty({
    type: [SectionItemDto],
    description: 'Las secciones que las asignaciones referencian, resueltas',
  })
  sections!: SectionItemDto[];

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty({ description: 'Tope aplicado al listado' })
  limit!: number;

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si quedaron asignaciones fuera del tope. Se declara, no se calla',
  })
  truncated!: boolean;
}

/**
 * El presupuesto de extensión de un target, visto por un tenant.
 *
 * Existe para que la pantalla del generador **no tenga que adivinarlo**. Sin
 * esto sólo podía ofrecer «Añadir campo» y descubrir el techo cuando el `POST`
 * volvía con un 412 — que es enterarse tarde y con el trabajo escrito.
 */
export class ExtensionBudgetResponseDto {
  /**
   * Target sobre el que se consultó el presupuesto.
   */
  @ApiProperty({ format: 'uuid' })
  targetResourceConceptId!: string;

  /**
   * Valor de allow tenant fields mantenido por la instancia.
   */
  @ApiProperty({
    description:
      '¿La política deja que la organización cuelgue campos propios? Sin política activa es false',
  })
  allowTenantFields!: boolean;

  /**
   * Tope de campos que declara la política, si declara alguno.
   */
  @ApiPropertyOptional({
    description: 'Tope de la política; ausente significa sin tope declarado',
    nullable: true,
  })
  maximumFields?: number;

  /**
   * Asignaciones activas que el tenant ya consumió.
   */
  @ApiProperty({ description: 'Campos activos que el tenant ya colgó' })
  used!: number;

  /**
   * Lo que queda, cuando hay tope.
   */
  @ApiPropertyOptional({
    description: 'Campos que quedan; ausente cuando no hay tope declarado',
    nullable: true,
  })
  remaining?: number;
}
