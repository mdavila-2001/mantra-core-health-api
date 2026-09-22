import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  createdBy,
  type AuthenticatedUser,
} from '../../../common';
import {
  CONNECTOR_VERSION,
  PRIMARY_SOURCE,
  SCAN_TERMINAL,
  objectKey,
  planReconciliation,
  snapshotHash,
  type KnownObject,
  type ReconciliationPlan,
  type ScanStatus,
} from '../domain';
import { CatalogScanRuns } from '../entities';
import { PostgresIntrospector } from '../infrastructure/postgres-introspector';
import { CatalogScanRepository } from '../repositories';

/** Un worker que no termina en este plazo pierde la corrida y otro la retoma. */
export const SCAN_LEASE_MS = 5 * 60_000;
/** Intentos antes de declarar la corrida fallida en vez de reintentarla. */
export const SCAN_MAX_ATTEMPTS = 3;

export interface ScanAcceptance {
  scan: CatalogScanRuns;
  /** false cuando la clave de idempotencia devolvió una corrida ya aceptada. */
  created: boolean;
}

export interface RunNextResult {
  claimed: number;
  scanId?: string;
  status?: ScanStatus;
  /** true si otro worker reclamó la corrida mientras ésta trabajaba. */
  fenced?: boolean;
}

/**
 * Ciclo de vida del escaneo técnico: aceptación durable (202), reclamo por un
 * worker con lease, introspección de sólo lectura, reconciliación y cierre.
 *
 * La API no ejecuta nada al aceptar: la corrida queda QUEUED en la base y el
 * worker `data_catalog` la reclama. Así un reinicio de la API o de la pestaña
 * no pierde trabajo aceptado.
 */
@Injectable()
export class CatalogScanService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogScanRepository,
    private readonly introspector: PostgresIntrospector,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CatalogScanService.name);
  }

  /**
   * Acepta una corrida. Misma clave de idempotencia del mismo usuario devuelve
   * la corrida original; una corrida viva de la misma fuente es un conflicto,
   * garantizado además por el índice único parcial de la tabla.
   */
  async request(
    actor: AuthenticatedUser,
    idempotencyKey: string | undefined,
  ): Promise<ScanAcceptance> {
    try {
      return await this.em.transactional(async (tx) => {
        if (idempotencyKey) {
          const existing = await this.repo.findByIdempotencyKey(
            tx,
            actor.id,
            idempotencyKey,
          );
          if (existing) return { scan: existing, created: false };
        }
        const active = await this.repo.findActiveScan(tx, PRIMARY_SOURCE);
        if (active) {
          throw new ConflictException(
            'Ya hay un escaneo en curso de esta fuente',
            {
              activeScanId: active.id,
              status: active.status,
            },
          );
        }
        const now = new Date();
        const scan = tx.create(
          CatalogScanRuns,
          {
            sourceCode: PRIMARY_SOURCE,
            mode: 'FULL',
            status: 'QUEUED',
            idempotencyKey,
            requestedByUserId: actor.id,
            requestedAt: now,
            attempt: 0,
            connectorVersion: CONNECTOR_VERSION,
            ...createdBy(actor.id, now),
          },
          { partial: true },
        );
        await tx.flush();
        this.logger.info(
          { operation: 'catalog.scan.request', scanId: scan.id },
          'Catalog scan accepted',
        );
        return { scan, created: true };
      });
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'Otra petición aceptó un escaneo de esta fuente al mismo tiempo',
        );
      }
      throw error;
    }
  }

  /** Pide cancelar. En cola se cancela ya; en marcha, lo confirma el runner. */
  async cancel(
    scanId: string,
    actor: AuthenticatedUser,
  ): Promise<CatalogScanRuns> {
    return this.em.transactional(async (tx) => {
      const scan = await this.repo.findScanForUpdate(tx, scanId);
      if (!scan)
        throw new ResourceNotFoundException('Escaneo no encontrado', {
          scanId,
        });
      if (SCAN_TERMINAL.includes(scan.status as ScanStatus)) {
        throw new ConflictException('El escaneo ya terminó', {
          status: scan.status,
        });
      }
      const now = new Date();
      scan.cancelRequestedAt ??= now;
      if (scan.status === 'QUEUED') {
        scan.status = 'CANCELLED';
        scan.finishedAt = now;
      }
      scan.updatedAt = now;
      scan.updatedByUserId = actor.id;
      await tx.flush();
      return scan;
    });
  }

  /**
   * Reclama y ejecuta la siguiente corrida disponible. Lo invoca el worker; si
   * no hay nada que hacer devuelve `claimed: 0` sin tocar la base.
   */
  async runNext(workerId: string): Promise<RunNextResult> {
    const leaseOwner = `${workerId}:${randomUUID()}`;
    const claimed = await this.em.transactional((tx) =>
      this.repo.claimNext(tx, leaseOwner, SCAN_LEASE_MS),
    );
    if (!claimed) return { claimed: 0 };

    const log = {
      operation: 'catalog.scan.run',
      scanId: claimed.id,
      attempt: claimed.attempt,
    };
    if (claimed.attempt > SCAN_MAX_ATTEMPTS) {
      const status = await this.finish(claimed.id, leaseOwner, 'FAILED', {
        errorCode: 'MAX_ATTEMPTS_EXCEEDED',
        errorMessage: `La corrida se reclamó ${claimed.attempt} veces sin terminar`,
      });
      return {
        claimed: 1,
        scanId: claimed.id,
        status: status ?? undefined,
        fenced: status === null,
      };
    }

    let introspection;
    try {
      introspection = await this.introspector.introspect();
    } catch (error) {
      this.logger.error({ ...log, err: error }, 'Catalog introspection failed');
      const status = await this.finish(claimed.id, leaseOwner, 'FAILED', {
        errorCode: 'INTROSPECTION_FAILED',
        errorMessage: sanitize(error),
      });
      return {
        claimed: 1,
        scanId: claimed.id,
        status: status ?? undefined,
        fenced: status === null,
      };
    }

    try {
      const outcome = await this.em.transactional(async (tx) => {
        const scan = await this.repo.findScanForUpdate(tx, claimed.id);
        // Fencing: si el lease cambió de manos, este worker llegó tarde y su
        // resultado no se escribe.
        if (
          !scan ||
          scan.leaseOwner !== leaseOwner ||
          scan.status !== 'RUNNING'
        ) {
          return null;
        }
        const now = new Date();
        if (scan.cancelRequestedAt) {
          scan.status = 'CANCELLED';
          scan.finishedAt = now;
          scan.updatedAt = now;
          await tx.flush();
          return 'CANCELLED' as const;
        }

        const known = await this.repo.loadKnown(tx, scan.sourceCode);
        const plan = planReconciliation(introspection.objects, known, true);
        await this.apply(tx, scan, plan, known, now);

        Object.assign(scan, plan.counters, {
          status: 'SUCCEEDED',
          finishedAt: now,
          updatedAt: now,
          engineVersion: introspection.engineVersion,
          excludedSchemas: introspection.excludedSchemas,
          limitations: introspection.limitations,
          snapshotHash: snapshotHash(introspection.objects),
          leaseExpiresAt: undefined,
        });
        await tx.flush();
        this.logger.info(
          { ...log, ...plan.counters },
          'Catalog scan succeeded',
        );
        return 'SUCCEEDED' as const;
      });
      return {
        claimed: 1,
        scanId: claimed.id,
        status: outcome ?? undefined,
        fenced: outcome === null,
      };
    } catch (error) {
      this.logger.error(
        { ...log, err: error },
        'Catalog reconciliation failed',
      );
      const status = await this.finish(claimed.id, leaseOwner, 'FAILED', {
        errorCode: 'RECONCILIATION_FAILED',
        errorMessage: sanitize(error),
      });
      return {
        claimed: 1,
        scanId: claimed.id,
        status: status ?? undefined,
        fenced: status === null,
      };
    }
  }

  /** Aplica el plan de reconciliación dentro de la transacción del cierre. */
  private async apply(
    tx: EntityManager,
    scan: CatalogScanRuns,
    plan: ReconciliationPlan,
    known: readonly KnownObject[],
    now: Date,
  ): Promise<void> {
    // Ids de lo ya conocido: los eventos de columnas que dejaron de verse
    // tienen que apuntar a su fila real.
    const objectIds = new Map<string, string>();
    const columnIds = new Map<string, string>();
    for (const object of known) {
      const key = objectKey(object.schemaName, object.objectName);
      objectIds.set(key, object.id);
      for (const column of object.columns) {
        columnIds.set(`${key}.${column.name}`, column.id);
      }
    }
    const inserted = await this.repo.insertObjects(
      tx,
      scan.sourceCode,
      scan.id,
      now,
      plan.create,
    );
    for (const [key, id] of inserted) objectIds.set(key, id);

    await this.repo.touchObjects(
      tx,
      scan.id,
      now,
      plan.update.map((update) => ({
        id: update.id,
        estimatedRows: update.next.estimatedRows,
        totalBytes: update.next.totalBytes,
      })),
    );
    for (const update of plan.update) {
      const key = objectKey(update.next.schemaName, update.next.objectName);
      if (update.changed) {
        await this.repo.updateObjectFacts(tx, update.id, update.next, now);
      }
      const created = await this.repo.insertColumns(
        tx,
        update.id,
        scan.id,
        now,
        update.columns.create,
      );
      for (const [name, id] of created) columnIds.set(`${key}.${name}`, id);
      await this.repo.touchColumns(
        tx,
        scan.id,
        now,
        update.columns.update.map((column) => column.id),
      );
      for (const column of update.columns.update) {
        if (column.changed) {
          await this.repo.updateColumnFacts(tx, column.id, column.next, now);
        }
      }
      await this.repo.markColumnsNotObserved(
        tx,
        update.columns.notObserved,
        now,
      );
    }
    for (const gone of plan.notObserved) {
      await this.repo.markColumnsNotObserved(tx, gone.columnIds, now);
    }
    await this.repo.markObjectsNotObserved(
      tx,
      plan.notObserved.map((gone) => gone.id),
      now,
    );

    await this.repo.insertEvents(
      tx,
      plan.events.map((event) => {
        const key = objectKey(event.schemaName, event.objectName);
        return {
          scanRunId: scan.id,
          objectId: objectIds.get(key)!,
          columnId: event.columnName
            ? columnIds.get(`${key}.${event.columnName}`)
            : undefined,
          changeKind: event.kind,
          beforeJson: event.before ?? undefined,
          afterJson: event.after ?? undefined,
          createdAt: now,
        };
      }),
    );
  }

  /**
   * Cierra la corrida en un estado terminal si este worker sigue siendo su
   * dueño. Devuelve null si el lease ya era de otro (resultado descartado).
   */
  private async finish(
    scanId: string,
    leaseOwner: string,
    status: ScanStatus,
    error: { errorCode: string; errorMessage: string },
  ): Promise<ScanStatus | null> {
    return this.em.transactional(async (tx) => {
      const scan = await this.repo.findScanForUpdate(tx, scanId);
      if (
        !scan ||
        scan.leaseOwner !== leaseOwner ||
        scan.status !== 'RUNNING'
      ) {
        return null;
      }
      const now = new Date();
      scan.status = status;
      scan.finishedAt = now;
      scan.updatedAt = now;
      scan.leaseExpiresAt = undefined;
      scan.errorCode = error.errorCode;
      scan.errorMessage = error.errorMessage;
      await tx.flush();
      return status;
    });
  }
}

/**
 * Mensaje de error apto para guardarse y mostrarse: sin cadenas de conexión
 * y acotado. El detalle completo va al log estructurado, no a la base.
 */
export function sanitize(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/postgres(ql)?:\/\/[^\s]+/gi, 'postgres://[redactado]')
    .replace(/password=[^\s;]+/gi, 'password=[redactado]')
    .slice(0, 500);
}
