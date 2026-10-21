import { hostname } from 'node:os';
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException } from '../../../common/errors/domain.exception';
import {
  SCAN_LEASE_SECONDS,
  SCAN_LIMITATIONS,
  SOURCE_CODE,
} from '../catalog/catalog.constants';
import {
  planScan,
  type ForeignKeyInfo,
  type ObservedColumn,
  type ObservedObject,
} from '../catalog/scan-diff';
import {
  SQL_CLAVES,
  SQL_CLAVES_FORANEAS,
  SQL_COLUMNAS,
  SQL_OBJETOS,
  SQL_VERSION,
} from '../catalog/scan.queries';
import {
  CatalogRepository,
  type ScanRow,
} from '../repositories/catalog.repository';

/** Schemas que el escaneo no mira: los del sistema y los de extensiones con prefijo `_`. */
export const EXCLUDED_SCHEMAS = ['pg_*', 'information_schema', '_*'];

/** Resultado de pedir un escaneo. */
export interface ScanRequest {
  scan: ScanRow;
  /** `false` si la petición repetía una clave de idempotencia ya usada: se devuelve el escaneo de entonces. */
  created: boolean;
}

/**
 * Escaneo del catálogo: lee `pg_catalog` de la base primaria y actualiza `data_catalog.*` con lo
 * observado, sin pisar jamás lo curado (fichas, revisiones, evidencia).
 *
 * Pedir un escaneo es una aceptación durable (`QUEUED`, 202) y su ejecución ocurre fuera de la
 * petición. Hay **a lo sumo un escaneo activo por fuente**, garantizado por un índice único
 * parcial y no por un `if`; un escaneo `RUNNING` cuyo lease venció (el proceso murió) se cierra
 * como `FAILED` en la siguiente petición.
 */
@Injectable()
export class CatalogScanService {
  private readonly logger = new Logger(CatalogScanService.name);
  private readonly enCurso = new Set<Promise<unknown>>();

  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogRepository,
  ) {}

  /** Espera a que terminen los escaneos en vuelo de este proceso. Existe para las pruebas y el cierre ordenado. */
  async drain(): Promise<void> {
    await Promise.allSettled([...this.enCurso]);
  }

  /**
   * Acepta un escaneo. Con la misma clave de idempotencia del mismo usuario devuelve el que ya
   * existe; con otro escaneo activo responde 409.
   */
  async request(
    userId: string,
    idempotencyKey: string | null,
    { autorun = true } = {},
  ): Promise<ScanRequest> {
    const resultado = await this.em.fork().transactional(async (tx) => {
      await this.repo.failAbandoned(tx, new Date(), SCAN_LEASE_SECONDS);
      if (idempotencyKey) {
        const previo = await this.repo.scanByIdempotency(
          tx,
          userId,
          idempotencyKey,
        );
        if (previo) return { scan: previo, created: false };
      }
      const activo = await this.repo.activeScan(tx);
      if (activo)
        throw new ConflictException(
          'Ya hay un escaneo en curso de esta fuente',
          { scanId: activo.id, status: activo.status },
        );
      try {
        return {
          scan: await this.repo.insertScan(tx, {
            userId,
            idempotencyKey,
            excludedSchemas: EXCLUDED_SCHEMAS,
          }),
          created: true,
        };
      } catch (error) {
        // dos peticiones a la vez: el índice único de «uno activo» o el de idempotencia deciden
        if (
          error instanceof Error &&
          /ux_data_catalog_scan_runs_(one_active|idempotency)/.test(
            error.message,
          )
        )
          throw new ConflictException(
            'Ya hay un escaneo en curso de esta fuente',
          );
        throw error;
      }
    });
    // el efecto se dispara DESPUÉS del commit, nunca dentro de la transacción
    if (resultado.created && autorun) this.start(resultado.scan.id);
    return resultado;
  }

  private start(scanId: string): void {
    const trabajo = this.run(scanId)
      .catch((error: unknown) =>
        this.logger.error(
          {
            scanId,
            err: error instanceof Error ? error.message : String(error),
          },
          'El escaneo del catálogo falló fuera de su manejo de errores',
        ),
      )
      .finally(() => this.enCurso.delete(trabajo));
    this.enCurso.add(trabajo);
  }

  /** Ejecuta un escaneo ya aceptado. Nunca lanza: un fallo deja el escaneo en `FAILED` con su causa. */
  async run(scanId: string): Promise<ScanRow | null> {
    const owner = `${hostname()}:${process.pid}`;
    const tomado = await this.repo.claimScan(
      this.em.fork(),
      scanId,
      owner,
      SCAN_LEASE_SECONDS,
    );
    if (!tomado) return this.repo.scanById(this.em.fork(), scanId);
    try {
      const { observed, engineVersion } = await this.observe();
      await this.em.fork().transactional(async (tx) => {
        const plan = planScan(await this.repo.knownObjects(tx), observed);
        await this.repo.applyScan(
          tx,
          scanId,
          tomado.requested_by_user_id,
          plan,
        );
        await this.repo.finishScan(tx, scanId, {
          counters: plan.counters,
          snapshotHash: plan.snapshotHash,
          engineVersion,
          limitations: [...SCAN_LIMITATIONS],
        });
      });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { scanId, err: mensaje },
        'El escaneo del catálogo falló',
      );
      await this.repo.failScan(this.em.fork(), scanId, 'SCAN_FAILED', mensaje);
    }
    return this.repo.scanById(this.em.fork(), scanId);
  }

  /** Lee `pg_catalog` en una transacción de sólo lectura. */
  async observe(): Promise<{
    observed: ObservedObject[];
    engineVersion: string;
  }> {
    return this.em.fork().transactional(async (tx) => {
      const ejecutar = <T>(sql: string): Promise<T> =>
        tx
          .getConnection()
          .execute(sql, [], 'all', tx.getTransactionContext()) as Promise<T>;
      await ejecutar('set transaction read only');
      const [objetos, columnas, claves, foraneas, version] = await Promise.all([
        ejecutar<ObjetoPg[]>(SQL_OBJETOS),
        ejecutar<ColumnaPg[]>(SQL_COLUMNAS),
        ejecutar<ClavePg[]>(SQL_CLAVES),
        ejecutar<ForaneaPg[]>(SQL_CLAVES_FORANEAS),
        ejecutar<{ engine_version: string }[]>(SQL_VERSION),
      ]);
      return {
        observed: this.assemble(objetos, columnas, claves, foraneas),
        engineVersion: version[0]?.engine_version ?? 'desconocida',
      };
    });
  }

  /** Une las filas de `pg_catalog` en objetos observados. Pública para probarla sin base. */
  assemble(
    objetos: ObjetoPg[],
    columnas: ColumnaPg[],
    claves: ClavePg[],
    foraneas: ForaneaPg[],
  ): ObservedObject[] {
    const porOid = <T extends { oid: string | number }>(
      filas: T[],
    ): Map<string, T[]> => {
      const m = new Map<string, T[]>();
      for (const f of filas)
        m.set(String(f.oid), [...(m.get(String(f.oid)) ?? []), f]);
      return m;
    };
    const columnasPorOid = porOid(columnas);
    const clavesPorOid = porOid(claves);
    const foraneasPorOid = porOid(foraneas);
    return objetos.map((o) => {
      const oid = String(o.oid);
      const pk = new Set(
        (clavesPorOid.get(oid) ?? [])
          .filter((k) => k.kind === 'p')
          .map((k) => k.column_name),
      );
      const unicas = new Set(
        (clavesPorOid.get(oid) ?? [])
          .filter((k) => Number(k.width) === 1)
          .map((k) => k.column_name),
      );
      const fkPorColumna = new Map<string, ForeignKeyInfo>();
      for (const f of foraneasPorOid.get(oid) ?? []) {
        const origen = f.source_columns;
        if (origen.length)
          fkPorColumna.set(origen[0], {
            constraintName: f.constraint_name,
            sourceColumns: origen,
            targetSchema: f.target_schema,
            targetTable: f.target_table,
            targetColumns: f.target_columns,
          });
      }
      const cols: ObservedColumn[] = (columnasPorOid.get(oid) ?? []).map(
        (c) => ({
          name: c.column_name,
          ordinal: Number(c.ordinal),
          nativeType: c.native_type,
          isNullable: Boolean(c.is_nullable),
          defaultExpression: c.default_expression,
          isIdentity: Boolean(c.is_identity),
          isGenerated: Boolean(c.is_generated),
          isPrimaryKey: pk.has(c.column_name),
          isUnique: unicas.has(c.column_name),
          foreignKey: fkPorColumna.get(c.column_name) ?? null,
          comment: c.column_comment,
        }),
      );
      return {
        schemaName: o.schema_name,
        objectName: o.object_name,
        kind: o.object_kind as ObservedObject['kind'],
        comment: o.table_comment,
        estimatedRows: o.estimated_rows,
        totalBytes: o.total_bytes,
        primaryKey: cols.filter((c) => c.isPrimaryKey).map((c) => c.name),
        columns: cols,
      };
    });
  }

  /** Códigos de fuente soportados: hoy sólo `primary`. */
  get sourceCode(): string {
    return SOURCE_CODE;
  }
}

export interface ObjetoPg {
  schema_name: string;
  object_name: string;
  object_kind: string;
  table_comment: string | null;
  estimated_rows: string | null;
  total_bytes: string | null;
  oid: string | number;
}
export interface ColumnaPg {
  oid: string | number;
  column_name: string;
  ordinal: number | string;
  native_type: string;
  is_nullable: boolean;
  default_expression: string | null;
  is_identity: boolean;
  is_generated: boolean;
  column_comment: string | null;
}
export interface ClavePg {
  oid: string | number;
  kind: string;
  column_name: string;
  width: number | string;
}
export interface ForaneaPg {
  oid: string | number;
  constraint_name: string;
  source_columns: string[];
  target_schema: string;
  target_table: string;
  target_columns: string[];
}
