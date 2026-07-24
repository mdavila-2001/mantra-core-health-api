/**
 * Tipos definidos por el usuario que el modelo declara en PostgreSQL.
 *
 * El modelo canónico resuelve prácticamente todos sus valores cerrados contra el
 * catálogo de terminología (`*_concept_id` -> `terminology.catalog_concepts`) en
 * lugar de contra enums nativos. Es una decisión de gobernanza: añadir un valor
 * a un catálogo es un INSERT, mientras que añadirlo a un enum de PostgreSQL es
 * un ALTER TYPE, es decir, una migración.
 *
 * La única excepción declarada por el modelo es `terminology.technical_data_type`,
 * que describe el tipo técnico de un dato (no un concepto de negocio) y por eso
 * sí se modela como enum nativo.
 */

/** Definición declarativa de un tipo enumerado. */
export interface EnumTypeSpec {
  readonly schema: string;
  readonly name: string;
  readonly values: readonly string[];
  readonly purpose: string;
  /** Marcado cuando el conjunto de valores todavía no está fijado por el modelo. */
  readonly provisional: boolean;
}

/**
 * TODO (deuda conocida, heredada del modelo): el documento de materialización
 * física de la bóveda lista "definir valores del enum
 * terminology.technical_data_type" como pendiente. El modelo declara el tipo
 * pero no su dominio de valores.
 *
 * Sin un valor mínimo el arranque no puede crear el tipo (PostgreSQL no admite
 * enums vacíos) y, en cascada, no puede crear las seis tablas que lo usan:
 * forms.dynamic_field_definitions, terminology.concept_properties,
 * reporting.report_columns, reporting.report_parameters,
 * read_models.frontend_view_fields y health_context.health_context_facts.
 *
 * Se materializa por tanto un conjunto provisional con los tipos técnicos que
 * las columnas del modelo necesitan describir. Es ampliable sin pérdida de
 * datos (`ALTER TYPE ... ADD VALUE`), así que cuando el modelo fije el dominio
 * definitivo bastará con añadir lo que falte. Queda marcado `provisional: true`
 * para que el informe de arranque lo reporte como deuda y no pase inadvertido.
 */
export const enumTypeCatalog: readonly EnumTypeSpec[] = [
  {
    schema: 'terminology',
    name: 'technical_data_type',
    purpose:
      'tipo técnico de un campo dinámico, una propiedad de concepto o una columna de reporte',
    provisional: true,
    values: [
      'string',
      'text',
      'integer',
      'decimal',
      'boolean',
      'date',
      'datetime',
      'time',
      'uuid',
      'json',
      'binary',
      'reference',
      'code',
    ],
  },
];
