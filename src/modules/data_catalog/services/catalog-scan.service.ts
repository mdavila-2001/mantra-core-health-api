import { hostname } from 'node:os';
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException } from '../../../common/errors/domain.exception';
import {
  PROBE_INTERVAL_MS,
  SCAN_FAILED_CODE,
  SCAN_LEASE_SECONDS,
  SCAN_LIMITATIONS,
  SOURCE_CODE,
} from '../catalog/catalog.constants';
import { iso } from '../catalog/timestamps';
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
import { CatalogClassificationService } from './catalog-classification.service';

/** `true` si pasó el intervalo de la sonda desde `ultimo` (texto `timestamptz` del driver). */
function intervaloVencido(ultimo: string | Date, now: Date): boolean {
  return now.getTime() - new Date(iso(ultimo)).getTime() >= PROBE_INTERVAL_MS;
}

/** Schemas que el escaneo no mira: los del sistema y los de extensiones con prefijo `_`. */
export const EXCLUDED_SCHEMAS = ['pg_*', 'information_schema', '_*'];

/** Lo que la sonda informa al worker tras un tick. `claimed` es 0 o 1. */
export interface RunNextResult {
  claimed: 0 | 1;
  scanId?: string;
  status?: string;
  /** `true` si el lease se perdió: otro proceso cerró o retomó el escaneo y no se pisó. */
  fenced?: boolean;
}

/** Interna: el cierre del escaneo no es nuestro; revierte lo aplicado en la misma transacción. */
class ScanFenced extends Error {}

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
    private readonly classification: CatalogClassificationService,
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

  /**
   * Un tick de la sonda, en este orden: (1) cierra lo abandonado, (2) retoma el escaneo activo si
   * está en cola, (3) si no hay ninguno y venció el intervalo, pide uno y lo ejecuta.
   * `claimed: 0` si no había nada que hacer o si otro proceso ya lo tomó.
   */
  async runNext(
    actorId: string,
    now: Date = new Date(),
  ): Promise<RunNextResult> {
    const activo = await this.em.fork().transactional(async (tx) => {
      await this.repo.failAbandoned(tx, now, SCAN_LEASE_SECONDS);
      return this.repo.activeScan(tx);
    });
    if (activo) {
      if (activo.status !== 'QUEUED') return { claimed: 0 };
      return this.runClaimed(activo.id);
    }
    const ultimo = await this.repo.lastFinishedScanAt(this.em.fork());
    if (ultimo && !intervaloVencido(ultimo, now)) return { claimed: 0 };
    try {
      const { scan } = await this.request(actorId, null, { autorun: false });
      return this.runClaimed(scan.id);
    } catch (error) {
      // otro proceso pidió un escaneo entre el `activeScan` y el insert: lo decide el índice único
      if (error instanceof ConflictException) return { claimed: 0 };
      throw error;
    }
  }

  private async runClaimed(scanId: string): Promise<RunNextResult> {
    const { scan, claimed, fenced } = await this.execute(scanId);
    if (!claimed) return { claimed: 0 };
    return {
      claimed: 1,
      scanId,
      status: scan?.status,
      ...(fenced ? { fenced: true } : {}),
    };
  }

  /** Ejecuta un escaneo ya aceptado. Nunca lanza: un fallo deja el escaneo en `FAILED` con su causa. */
  async run(scanId: string): Promise<ScanRow | null> {
    return (await this.execute(scanId)).scan;
  }

  private async execute(scanId: string): Promise<{
    scan: ScanRow | null;
    claimed: boolean;
    fenced: boolean;
  }> {
    const owner = `${hostname()}:${process.pid}`;
    const tomado = await this.repo.claimScan(
      this.em.fork(),
      scanId,
      owner,
      SCAN_LEASE_SECONDS,
    );
    if (!tomado)
      return {
        scan: await this.repo.scanById(this.em.fork(), scanId),
        claimed: false,
        fenced: false,
      };
    let fenced = false;
    let exito = false;
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
        const cerrado = await this.repo.finishScan(tx, scanId, owner, {
          counters: plan.counters,
          snapshotHash: plan.snapshotHash,
          engineVersion,
          limitations: [...SCAN_LIMITATIONS],
        });
        // sin el lease no se confirma nada: se revierte lo aplicado en esta transacción
        if (!cerrado) throw new ScanFenced();
      });
      exito = true;
    } catch (error) {
      if (error instanceof ScanFenced) fenced = true;
      else {
        const mensaje = error instanceof Error ? error.message : String(error);
        this.logger.error(
          { scanId, err: mensaje },
          'El escaneo del catálogo falló',
        );
        fenced = !(await this.repo.failScan(
          this.em.fork(),
          scanId,
          owner,
          SCAN_FAILED_CODE,
          mensaje,
        ));
      }
    }
    // columnas nuevas o cambiadas: se clasifican fuera de esta llamada, para no alargar el tick
    if (exito) this.classifyInBackground(scanId);
    if (fenced)
      this.logger.warn(
        { scanId },
        'El escaneo perdió su lease: otro proceso lo cerró; no se pisó',
      );
    return {
      scan: await this.repo.scanById(this.em.fork(), scanId),
      claimed: true,
      fenced,
    };
  }

  /** La clasificación nunca hace fallar al escaneo: un error se registra y se sigue. */
  private classifyInBackground(scanId: string): void {
    const trabajo = this.classification
      .classifyScan(scanId)
      .catch((error: unknown) =>
        this.logger.error(
          {
            scanId,
            err: error instanceof Error ? error.message : String(error),
          },
          'La clasificación automática del escaneo falló',
        ),
      )
      .finally(() => this.enCurso.delete(trabajo));
    this.enCurso.add(trabajo);
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
