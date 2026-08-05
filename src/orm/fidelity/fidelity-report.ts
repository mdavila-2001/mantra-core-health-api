/**
 * Estructuras del informe de fidelidad entre el modelo mapeado y la base real.
 *
 * "Fidelidad" aquí tiene un significado preciso: para cada entidad declarada en
 * `src/modules/**\/entities` debe existir su tabla, con exactamente sus columnas
 * y con la misma obligatoriedad. Cualquier diferencia es deriva, y la deriva es
 * el modo de fallo más caro de esta arquitectura: el código compila, el ORM
 * arranca, y el error aparece en la primera consulta que toca la columna que no
 * está, en producción y sin contexto.
 *
 * Este informe convierte ese fallo diferido en una señal de arranque.
 */

/** Categorías de deriva, ordenadas por gravedad operativa. */
export type DriftKind =
  /** La entidad está mapeada pero su tabla no existe. Toda consulta a ella falla. */
  | 'tabla-ausente'
  /** La entidad declara una columna que la tabla no tiene. Falla cualquier SELECT que la proyecte. */
  | 'columna-ausente'
  /** La tabla tiene una columna NOT NULL que la entidad no mapea: todo INSERT fallará. */
  | 'columna-obligatoria-no-mapeada'
  /** La entidad la declara opcional y la base la exige, o al revés. Falla al escribir, no al leer. */
  | 'obligatoriedad-divergente';

/** Una diferencia concreta entre modelo y base. */
export interface SchemaDrift {
  /**
   * Valor de kind mantenido por la instancia.
   */
  readonly kind: DriftKind;
  /**
   * Valor de schema mantenido por la instancia.
   */
  readonly schema: string;
  /**
   * Valor de table mantenido por la instancia.
   */
  readonly table: string;
  /** Columna afectada; ausente cuando la deriva es de tabla completa. */
  readonly column?: string;
  /** Explicación en una línea, pensada para leerse directamente en el log. */
  readonly detail: string;
}

/** Resultado completo de una verificación. */
export interface FidelityReport {
  /** Entidades comprobadas. */
  readonly entities: number;
  /** Tablas presentes en la base dentro de los schemas del modelo. */
  readonly tablesInDatabase: number;
  /** Diferencias encontradas, agrupadas por tipo en `byKind`. */
  readonly drift: readonly SchemaDrift[];
  /**
   * Valor de by kind mantenido por la instancia.
   */
  readonly byKind: Readonly<Record<DriftKind, number>>;
  /**
   * Valor de took ms mantenido por la instancia.
   */
  readonly tookMs: number;
}

/** Número máximo de diferencias que se detallan en el log antes de resumir. */
const MAX_DETAILED = 25;

/**
 * Compone el texto del informe.
 *
 * Se limita el detalle: si el modelo y la base divergen en 4000 columnas, volcar
 * las 4000 al log no aporta nada que no aporten las 25 primeras más el total, y
 * sí llena el agregador de logs.
 */
export function formatFidelityReport(report: FidelityReport): string {
  if (report.drift.length === 0) {
    return (
      `Fidelidad verificada: ${report.entities} entidades coinciden con la base ` +
      `(${report.tablesInDatabase} tablas presentes, ${report.tookMs} ms)`
    );
  }

  const summary = Object.entries(report.byKind)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${kind}=${count}`)
    .join(', ');

  const lines = report.drift
    .slice(0, MAX_DETAILED)
    .map(
      (drift) =>
        `  - [${drift.kind}] ${drift.schema}.${drift.table}` +
        `${drift.column ? `.${drift.column}` : ''}: ${drift.detail}`,
    );

  const omitted = report.drift.length - lines.length;

  return [
    `Deriva detectada entre el modelo y la base: ${report.drift.length} diferencias (${summary})`,
    ...lines,
    omitted > 0 ? `  ... y ${omitted} más` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

/** Cuenta las diferencias por categoría, con todas las claves siempre presentes. */
export function summarizeByKind(
  drift: readonly SchemaDrift[],
): Record<DriftKind, number> {
  const counters: Record<DriftKind, number> = {
    'tabla-ausente': 0,
    'columna-ausente': 0,
    'columna-obligatoria-no-mapeada': 0,
    'obligatoriedad-divergente': 0,
  };
  for (const item of drift) counters[item.kind] += 1;
  return counters;
}
