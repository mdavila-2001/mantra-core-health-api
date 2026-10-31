import type { EntityManager } from '@mikro-orm/postgresql';
import type {
  CatalogSeedStore,
  ObjectIndex,
  SeedRow,
  SeedTableSpec,
} from './catalog-seed.types';

/** Filas por sentencia: acota el tamaño del parámetro JSON y deja una corrida interrumpida retomable. */
export const SEED_CHUNK = 500;

/** `insert … select … from jsonb_to_recordset(?) … on conflict do nothing returning id`. */
export function insertSql(spec: SeedTableSpec): string {
  const names = spec.columns.map(([name]) => `"${name}"`).join(', ');
  const defs = spec.columns
    .map(([name, type]) => `"${name}" ${type}`)
    .join(', ');
  return `insert into ${spec.table} (${names})
    select ${names} from jsonb_to_recordset(?::jsonb) as x(${defs})
    on conflict do nothing
    returning id`;
}

/**
 * Persistencia real de la siembra: SQL parametrizado sobre la conexión de MikroORM. Todo lo que
 * escribe es `insert … on conflict do nothing` (más el enlace de dominio a objetos sin dominio);
 * nunca `update` de lo curado ni `truncate`.
 */
export class PgCatalogSeedStore implements CatalogSeedStore {
  constructor(private readonly em: EntityManager) {}

  private exec<T>(sql: string, params: unknown[] = []): Promise<T> {
    return this.em
      .getConnection()
      .execute(
        sql,
        params,
        'all',
        this.em.getTransactionContext(),
      ) as Promise<T>;
  }

  async hasTable(qualified: string): Promise<boolean> {
    const filas = await this.exec<{ ok: boolean }[]>(
      `select to_regclass(?) is not null as ok`,
      [qualified],
    );
    return filas[0]?.ok === true;
  }

  async insertMissing(
    spec: SeedTableSpec,
    rows: readonly SeedRow[],
  ): Promise<string[]> {
    const insertados: string[] = [];
    for (let i = 0; i < rows.length; i += SEED_CHUNK) {
      const lote = rows.slice(i, i + SEED_CHUNK);
      const filas = await this.exec<{ id: string }[]>(insertSql(spec), [
        JSON.stringify(lote),
      ]);
      for (const fila of filas) insertados.push(fila.id);
    }
    return insertados;
  }

  async loadObjects(): Promise<ObjectIndex> {
    const objetos = await this.exec<
      { id: string; schema_name: string; object_name: string }[]
    >(
      `select id, schema_name, object_name from data_catalog.catalog_objects
        where observation_status = 'OBSERVED' order by schema_name, object_name`,
    );
    const columnas = await this.exec<
      { object_id: string; id: string; column_name: string }[]
    >(
      `select object_id, id, column_name from data_catalog.catalog_columns
        where observation_status = 'OBSERVED'`,
    );
    const porObjeto = new Map<string, Map<string, string>>();
    for (const c of columnas) {
      const mapa = porObjeto.get(c.object_id) ?? new Map<string, string>();
      mapa.set(c.column_name, c.id);
      porObjeto.set(c.object_id, mapa);
    }
    return new Map(
      objetos.map((o) => [
        `${o.schema_name}.${o.object_name}`,
        { id: o.id, columns: porObjeto.get(o.id) ?? new Map<string, string>() },
      ]),
    );
  }

  async loadDomainIds(): Promise<ReadonlyMap<string, string>> {
    const filas = await this.exec<{ id: string; code: string }[]>(
      `select id, code from system_ops.data_domains`,
    );
    return new Map(filas.map((f) => [f.code, f.id]));
  }

  async linkObjectDomains(
    links: readonly { objectId: string; domainId: string }[],
  ): Promise<number> {
    let cambiados = 0;
    for (let i = 0; i < links.length; i += SEED_CHUNK) {
      const lote = links.slice(i, i + SEED_CHUNK);
      const filas = await this.exec<{ id: string }[]>(
        `update data_catalog.catalog_objects o set domain_id = x.domain_id
           from jsonb_to_recordset(?::jsonb) as x(object_id uuid, domain_id uuid)
          where o.id = x.object_id and o.domain_id is null
          returning o.id`,
        [
          JSON.stringify(
            lote.map((l) => ({ object_id: l.objectId, domain_id: l.domainId })),
          ),
        ],
      );
      cambiados += filas.length;
    }
    return cambiados;
  }
}

/**
 * Doble en memoria con el mismo contrato (conflicto = no-op por `id` y por claves naturales que el
 * modelo declara únicas). **No prueba SQL, tipos ni índices reales**: prueba la lógica del plan y
 * la idempotencia del servicio. Lo declara su nombre y el informe de la siembra.
 */
export class InMemoryCatalogSeedStore implements CatalogSeedStore {
  readonly tables = new Map<string, Map<string, SeedRow>>();
  private objects: ObjectIndex = new Map();
  private readonly missing = new Set<string>();
  private readonly objectDomains = new Map<string, string>();

  /** Claves naturales únicas del modelo (índices `ux_*`) que el doble respeta. */
  private static readonly NATURAL_KEYS: Readonly<
    Record<string, readonly string[][]>
  > = {
    'system_ops.data_domains': [['code']],
    'system_ops.data_classifications': [['code']],
    'data_catalog.catalog_glossary_terms': [['term_code']],
    'data_catalog.catalog_glossary_term_revisions': [
      ['term_id', 'revision_no'],
    ],
    'data_catalog.catalog_lineage_edges': [
      [
        'source_kind',
        'source_ref',
        'target_kind',
        'target_ref',
        'edge_kind',
        'origin',
      ],
    ],
    'data_catalog.catalog_annotations': [
      ['object_id', 'target_kind', 'column_id'],
    ],
    'data_catalog.catalog_annotation_revisions': [
      ['annotation_id', 'revision_no'],
    ],
  };

  withObjects(objects: ObjectIndex): this {
    this.objects = objects;
    return this;
  }

  withoutTable(qualified: string): this {
    this.missing.add(qualified);
    return this;
  }

  rows(table: string): SeedRow[] {
    return [...(this.tables.get(table)?.values() ?? [])];
  }

  hasTable(qualified: string): Promise<boolean> {
    return Promise.resolve(!this.missing.has(qualified));
  }

  private readonly naturalSeen = new Set<string>();

  insertMissing(
    spec: SeedTableSpec,
    rows: readonly SeedRow[],
  ): Promise<string[]> {
    const tabla = this.tables.get(spec.table) ?? new Map<string, SeedRow>();
    this.tables.set(spec.table, tabla);
    const claves = InMemoryCatalogSeedStore.NATURAL_KEYS[spec.table] ?? [];
    const huella = (fila: SeedRow, cols: string[]): string =>
      `${spec.table}|${cols.join(',')}|${JSON.stringify(cols.map((c) => fila[c] ?? null))}`;
    const insertados: string[] = [];
    for (const fila of rows) {
      const idFila = String(fila.id);
      const huellas = claves.map((cols) => huella(fila, cols));
      const choca =
        tabla.has(idFila) || huellas.some((h) => this.naturalSeen.has(h));
      if (choca) continue;
      tabla.set(idFila, structuredClone(fila));
      for (const h of huellas) this.naturalSeen.add(h);
      insertados.push(idFila);
    }
    return Promise.resolve(insertados);
  }

  loadObjects(): Promise<ObjectIndex> {
    return Promise.resolve(this.objects);
  }

  loadDomainIds(): Promise<ReadonlyMap<string, string>> {
    return Promise.resolve(
      new Map(
        this.rows('system_ops.data_domains').map((r) => [
          String(r.code),
          String(r.id),
        ]),
      ),
    );
  }

  linkObjectDomains(
    links: readonly { objectId: string; domainId: string }[],
  ): Promise<number> {
    let cambiados = 0;
    for (const l of links)
      if (!this.objectDomains.has(l.objectId)) {
        this.objectDomains.set(l.objectId, l.domainId);
        cambiados += 1;
      }
    return Promise.resolve(cambiados);
  }

  domainOf(objectId: string): string | undefined {
    return this.objectDomains.get(objectId);
  }
}
