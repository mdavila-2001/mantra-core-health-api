import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SOURCE_CODE } from '../../domain/catalog/catalog.constants';
import { iso } from '../../domain/catalog/timestamps';
import type {
  FitImportedOperation,
  FitLiveObject,
  FitScanState,
} from './fit.types';

/**
 * Lecturas de la sonda de ajuste sobre `data_catalog.*`. **Sólo `SELECT`**: la sonda observa el
 * catálogo, no lo toca. Son consultas parametrizadas sin concatenar entrada de nadie.
 *
 * Nota de verificación: este SQL se escribió contra las entidades y las consultas existentes de
 * `CatalogRepository`; no se ejecutó contra un PostgreSQL real en el trabajo que lo creó.
 */
@Injectable()
export class FitLiveRepository {
  private q<T>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  /** Objetos observados con sus columnas y su ficha. Tres consultas planas, unidas en memoria. */
  async liveObjects(em: EntityManager): Promise<FitLiveObject[]> {
    const objetos = await this.q<
      {
        id: string;
        schema_name: string;
        object_name: string;
        object_kind: string;
        table_comment: string | null;
      }[]
    >(
      em,
      `select o.id, o.schema_name, o.object_name, o.object_kind, o.table_comment
         from data_catalog.catalog_objects o
        where o.source_code = ? and o.observation_status = 'OBSERVED'
        order by o.schema_name, o.object_name`,
      [SOURCE_CODE],
    );
    const columnas = await this.q<
      {
        object_id: string;
        column_name: string;
        native_type: string;
        sensitivity: string | null;
      }[]
    >(
      em,
      `select c.object_id, c.column_name, c.native_type, a.sensitivity
         from data_catalog.catalog_columns c
         join data_catalog.catalog_objects o on o.id = c.object_id
         left join data_catalog.catalog_annotations a
           on a.target_kind = 'COLUMN' and a.column_id = c.id
        where o.source_code = ? and o.observation_status = 'OBSERVED'
          and c.observation_status = 'OBSERVED'
        order by c.object_id, c.ordinal`,
      [SOURCE_CODE],
    );
    const fichas = await this.q<
      {
        object_id: string;
        purpose: string | null;
        definition: string | null;
        sensitivity: string;
        review_status: string;
      }[]
    >(
      em,
      `select a.object_id, a.purpose, a.definition, a.sensitivity, a.review_status
         from data_catalog.catalog_annotations a
         join data_catalog.catalog_objects o on o.id = a.object_id
        where a.target_kind = 'OBJECT' and o.source_code = ? and o.observation_status = 'OBSERVED'`,
      [SOURCE_CODE],
    );
    const columnasDe = new Map<string, FitLiveObject['columns'][number][]>();
    for (const c of columnas) {
      const lista = columnasDe.get(c.object_id) ?? [];
      lista.push({
        name: c.column_name,
        nativeType: c.native_type,
        sensitivity: c.sensitivity,
      });
      columnasDe.set(c.object_id, lista);
    }
    const fichaDe = new Map(fichas.map((f) => [f.object_id, f]));
    return objetos.map((o) => {
      const f = fichaDe.get(o.id);
      return {
        schema: o.schema_name,
        name: o.object_name,
        kind: o.object_kind,
        tableComment: o.table_comment,
        columns: columnasDe.get(o.id) ?? [],
        card: f
          ? {
              purpose: f.purpose,
              definition: f.definition,
              sensitivity: f.sensitivity,
              reviewStatus: f.review_status,
            }
          : null,
      };
    });
  }

  /** Último escaneo exitoso y estado del más reciente que llegó a ejecutarse. */
  async scanState(em: EntityManager): Promise<FitScanState> {
    const [agregado] = await this.q<
      { last_succeeded_at: string | null; last_finished_at: string | null }[]
    >(
      em,
      `select max(finished_at) filter (where status = 'SUCCEEDED') as last_succeeded_at,
              max(finished_at) as last_finished_at
         from data_catalog.catalog_scan_runs
        where source_code = ? and status in ('SUCCEEDED', 'FAILED') and started_at is not null`,
      [SOURCE_CODE],
    );
    const [ultimo] = await this.q<{ status: string }[]>(
      em,
      `select status from data_catalog.catalog_scan_runs
        where source_code = ? and status in ('SUCCEEDED', 'FAILED') and started_at is not null
        order by finished_at desc nulls last limit 1`,
      [SOURCE_CODE],
    );
    const fecha = (v: string | null | undefined): Date | null =>
      v ? new Date(iso(v)) : null;
    return {
      lastSucceededAt: fecha(agregado?.last_succeeded_at),
      lastFinishedAt: fecha(agregado?.last_finished_at),
      lastStatus: ultimo?.status ?? null,
    };
  }

  /** Operaciones que la última importación dejó `OBSERVED` en `catalog_operations`. */
  async importedOperations(em: EntityManager): Promise<FitImportedOperation[]> {
    const filas = await this.q<
      {
        operation_key: string;
        http_method: string;
        route_template: string;
        source_code: string;
      }[]
    >(
      em,
      `select operation_key, http_method, route_template, source_code
         from data_catalog.catalog_operations
        where observation_status = 'OBSERVED'`,
    );
    return filas.map((f) => ({
      key: f.operation_key,
      method: f.http_method,
      route: f.route_template,
      origin: f.source_code,
    }));
  }
}
