import type { InvColumn, InvTable } from './catalogacion-inventory';

/**
 * Explicación de SISTEMA de una tabla y de una columna: sólo hechos de estructura del DDL, del ORM
 * y del inventario de operaciones. Es `AUTO_DETECTADA` por definición; no dice nada del negocio.
 * Cada frase es verificable contra el JSON del que sale (se cita en {@link tableSystemReference}).
 */

const plural = (n: number, singular: string, plural_: string): string =>
  `${n} ${n === 1 ? singular : plural_}`;

/** Ruta del archivo del inventario de donde salen los hechos de una tabla. */
export const tableSystemReference = (table: InvTable): string =>
  `inventario/catalogo/${table.schema}.json#${table.id}`;

function accessCounts(table: InvTable): {
  reads: number;
  writes: number;
  deletes: number;
} {
  const ids = (acceso: string): number =>
    new Set(
      table.operations
        .filter((o) => o.access === acceso)
        .map((o) => o.operationId),
    ).size;
  return { reads: ids('LEE'), writes: ids('ESCRIBE'), deletes: ids('BORRA') };
}

/** La explicación de sistema de una tabla. Nunca vacía: toda tabla tiene estructura. */
export function tableSystemExplanation(table: InvTable): string {
  const pk = table.columns.filter((c) => c.primaryKey).map((c) => c.name);
  const fk = table.columns.filter((c) => c.foreignKeys.length > 0).length;
  const frases: string[] = [
    `La tabla ${table.id} declara ${plural(table.columns.length, 'columna', 'columnas')}` +
      (pk.length > 0
        ? `, con clave primaria (${pk.join(', ')})`
        : ', sin clave primaria declarada') +
      `, ${plural(fk, 'columna que es clave foránea', 'columnas que son clave foránea')}` +
      `, ${plural(table.outgoingRelations, 'relación saliente', 'relaciones salientes')}` +
      ` y ${plural(table.incomingRelations, 'entrante', 'entrantes')}.`,
    `Tiene ${plural(table.indexes.total, 'índice', 'índices')} (${table.indexes.unique} únicos).`,
  ];
  const names = new Set(table.columns.map((c) => c.name));
  const marcas: string[] = [];
  if (names.has('tenant_id'))
    marcas.push(
      'tiene la columna tenant_id (el registro pertenece a una organización)',
    );
  if (names.has('row_version'))
    marcas.push('tiene row_version (control de concurrencia optimista)');
  if (names.has('deleted_at'))
    marcas.push('tiene deleted_at (eliminación lógica)');
  if (names.has('valid_from') || names.has('valid_to'))
    marcas.push('declara vigencia (valid_from/valid_to)');
  if (!names.has('updated_at') && !names.has('row_version'))
    marcas.push('no tiene updated_at ni row_version');
  if (marcas.length > 0)
    frases.push(`Por su estructura: ${marcas.join('; ')}.`);
  frases.push(
    table.appendOnly.declared
      ? `El README del módulo la declara append-only${table.appendOnly.reference ? ` (${table.appendOnly.reference})` : ''}; esa declaración no es una barrera de base de datos.`
      : 'Ninguna fuente del inventario la declara append-only.',
  );
  frases.push(
    table.ormEntity
      ? `La entidad del ORM es ${table.ormEntity.className} (${table.ormEntity.file}).`
      : 'No tiene entidad del ORM en la API.',
  );
  const { reads, writes, deletes } = accessCounts(table);
  frases.push(
    reads + writes + deletes === 0
      ? 'Ningún endpoint del inventario la lee ni la escribe (puede usarla un worker, un seed o un job).'
      : `El inventario la ubica en ${plural(reads, 'operación que la lee', 'operaciones que la leen')}, ${plural(writes, 'que la escribe', 'que la escriben')} y ${plural(deletes, 'que borra de ella', 'que borran de ella')}.`,
  );
  return frases.join(' ');
}

/** La explicación de sistema (estructural) de una columna. */
export function columnSystemExplanation(
  table: InvTable,
  column: InvColumn,
): string {
  const partes: string[] = [
    `Columna ${column.ordinal} de ${table.id}, tipo ${column.nativeType}, ${column.nullable ? 'admite nulo' : 'obligatoria'}`,
  ];
  if (column.primaryKey) partes.push('forma parte de la clave primaria');
  if (column.unique) partes.push('tiene restricción de unicidad');
  for (const fk of column.foreignKeys)
    partes.push(`es clave foránea hacia ${fk.schema}.${fk.table}.${fk.column}`);
  if (column.defaultExpr)
    partes.push(`valor por defecto ${column.defaultExpr}`);
  return `${partes.join('; ')}.`;
}
