import { SCHEMA_DESCRIPTIONS } from './schema-descriptions.generated';

/**
 * La explicación de un schema (módulo del modelo) tal como la dice la bóveda
 * SALUD. Es lectura del modelo, no una ficha revisable: el ciclo de revisión es de
 * tablas y columnas.
 */
export interface SchemaDescription {
  moduleNumber: number;
  moduleCode: string;
  title: string;
  domain: string | null;
  /** `null` si la nota del módulo no trae «Propósito de negocio». */
  business: string | null;
  /** Armada sólo con las métricas de la nota; `null` si no las trae. */
  system: string | null;
  /** Ruta de la nota en la bóveda. */
  source: string;
}

/** La descripción de un schema, o `null` si ningún módulo de la bóveda lo declara. */
export function describeSchema(schemaName: string): SchemaDescription | null {
  // `hasOwn`: un schema llamado `constructor` o `__proto__` no puede devolver lo del prototipo.
  return Object.hasOwn(SCHEMA_DESCRIPTIONS, schemaName)
    ? SCHEMA_DESCRIPTIONS[schemaName]
    : null;
}
