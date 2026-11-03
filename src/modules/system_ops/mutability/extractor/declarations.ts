/**
 * Declaraciones de intención sobre la mutabilidad de una tabla: estereotipos de los diagramas
 * `.puml` (`<<IMMUTABLE>>`, `<<APPEND_ONLY>>`…) y la matriz de integridad del módulo 33. Son
 * evidencia `DECLARED_MODEL`: dicen qué se quiso, no qué está impuesto.
 */

/** Estereotipo declarado para una entidad de un diagrama. */
export interface PumlDeclaration {
  /** Nombre tal como aparece: `tabla` o `schema.tabla`. */
  name: string;
  stereotypes: string[];
  /** Schema que declara el título del diagrama (`schema: x`), si lo hay. */
  moduleSchema: string | null;
  /** `archivo:línea`. */
  source: string;
}

/** Regla declarada en la matriz de integridad. */
export interface MatrixDeclaration {
  name: string;
  moduleSchema: string | null;
  stereotypes: string[];
  /** `forbidden` en UPDATE y DELETE a la vez. */
  updateDeleteForbidden: boolean;
  updateForbidden: boolean;
  /** `DELETE` marcado como «sólo purga por retención» o con `DELETE allowed`. */
  deleteRetentionOnly: boolean;
  truncateForbidden: boolean;
  /** Plazo declarado (`RETENTION 14 days`), si lo hay. */
  retentionDays: number | null;
  /** Texto de la regla de retención declarada (para citarla). */
  retentionText: string | null;
  /** `archivo:línea`. */
  source: string;
}

/** Estereotipos que, por sí solos, declaran que una tabla no se reescribe. */
export const IMMUTABLE_STEREOTYPES = new Set(['IMMUTABLE', 'APPEND_ONLY']);

/**
 * Entidades con estereotipo de un `.puml`. Se descartan las referencias a tablas de otros módulos
 * (`<<REFERENCE_ONLY>>`) y los conjuntos de índices, que no declaran nada de la tabla.
 */
export function parsePumlDeclarations(
  text: string,
  file: string,
): PumlDeclaration[] {
  const title = text.match(/^title .*?schema:\s*([a-z_0-9]+)/m);
  const moduleSchema = title ? title[1] : null;
  const out: PumlDeclaration[] = [];
  const lines = text.split('\n');
  const re =
    /^entity\s+(?:"([^"]+)"\s+as\s+\w+|([A-Za-z_][A-Za-z0-9_.]*))\s*((?:<<[A-Z_]+>>\s*)+)/;
  lines.forEach((line, i) => {
    const m = line.match(re);
    if (!m) return;
    const name = m[1] ?? m[2];
    const stereotypes = [...m[3].matchAll(/<<([A-Z_]+)>>/g)].map((s) => s[1]);
    if (stereotypes.includes('REFERENCE_ONLY')) return;
    if (stereotypes.includes('INDEX_SET')) return;
    if (/\s|·/.test(name)) return;
    out.push({ name, stereotypes, moduleSchema, source: `${file}:${i + 1}` });
  });
  return out;
}

/** Filas de la matriz de integridad (`integrity-matrix.md`) con reglas de escritura o retención. */
export function parseIntegrityMatrix(
  text: string,
  file: string,
): MatrixDeclaration[] {
  const out: MatrixDeclaration[] = [];
  let moduleSchema: string | null = null;
  text.split('\n').forEach((line, i) => {
    const head = line.match(/^###\s+M[oó]dulo\s+\d+\s+·\s+`([a-z_0-9]+)`/);
    if (head) {
      moduleSchema = head[1];
      return;
    }
    const row = line.match(
      /^\|\s*`([A-Za-z_0-9.]+)`\s*\|\s*`([^`]*)`\s*\|(.*)\|\s*$/,
    );
    if (!row) return;
    const rules = row[3];
    const updateDelete = /\*\*UPDATE_DELETE\*\*\s+forbidden/i.test(rules);
    const update = /\*\*UPDATE\*\*\s+forbidden/i.test(rules);
    const deleteRetention =
      /\*\*DELETE\*\*\s+retention purge only/i.test(rules) ||
      /DELETE allowed/i.test(rules);
    const truncate = /\*\*TRUNCATE\*\*\s+forbidden/i.test(rules);
    const retention = rules.match(/\*\*RETENTION\*\*\s+(\d+)\s+days[^;|]*/i);
    if (!updateDelete && !update && !deleteRetention && !truncate && !retention)
      return;
    out.push({
      name: row[1],
      moduleSchema,
      stereotypes: row[2]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      updateDeleteForbidden: updateDelete,
      updateForbidden: update || updateDelete,
      deleteRetentionOnly: deleteRetention,
      truncateForbidden: truncate,
      retentionDays: retention ? Number(retention[1]) : null,
      retentionText: retention ? retention[0].trim() : null,
      source: `${file}:${i + 1}`,
    });
  });
  return out;
}
