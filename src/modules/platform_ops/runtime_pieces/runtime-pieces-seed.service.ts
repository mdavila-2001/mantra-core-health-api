import { Injectable } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { SEED, deterministicId } from '../../../common/constants/concepts';
import { PLATFORM_OPS } from '../platform_ops.concepts';
import { draftFor, fingerprintOf, parseProvenance } from './domain/provenance';
import { RUNTIME_PIECE_KIND } from './runtime-pieces.concepts';
import { RuntimePiecesErrorReason } from './runtime-pieces.error-reasons';
import {
  RuntimePiecesRepository,
  type RegistryRow,
} from './runtime-pieces.repository';
import {
  REGISTRY_CODE_PREFIX,
  type PieceKind,
  type ScanResult,
} from './runtime-pieces.types';
import type { SqlPort } from './sql-port';

/** Sujeto de plataforma dueño de las filas (el mismo que `TS_ADMIN_TENANT_ID` por omisión). */
export const RUNTIME_PIECES_TENANT_ID = SEED.tenantId;

/** Id estable de la fila de una pieza: dos corridas, o dos bases, dan el mismo. */
export const registryIdOf = (code: string): string =>
  deterministicId(`seed:runtime-piece:${code}`);

export interface DiscoveryReport {
  readonly dryRun: boolean;
  /** Fecha (UTC, `AAAA-MM-DD`) que queda como «descubierto» en las filas nuevas o cambiadas. */
  readonly discoveredAt: string;
  readonly scanned: number;
  readonly created: number;
  readonly updated: number;
  readonly unchanged: number;
  /** Filas registradas cuyo código ya no existe: se informan, NUNCA se borran. */
  readonly orphans: number;
  /** Filas `rtp.*` que alguien creó sin procedencia: no se pisan. */
  readonly conflicts: number;
  readonly createdIds: readonly string[];
  readonly updatedIds: readonly string[];
  readonly orphanIds: readonly string[];
  readonly conflictIds: readonly string[];
}

const ID_LIST_CAP = 300;
const cap = (ids: readonly string[]): string[] => ids.slice(0, ID_LIST_CAP);

/**
 * Registra en `platform_ops.tool_registry` lo que el escáner descubrió.
 *
 * - IDEMPOTENTE: id determinista por pieza, `INSERT … ON CONFLICT (code) DO
 *   NOTHING` y actualización sólo cuando cambia la HUELLA de lo descubierto. La
 *   segunda corrida con el mismo código no inserta ni modifica nada (ni
 *   `updated_at` ni `row_version`).
 * - No borra nunca: lo que ya no existe en el código se informa como huérfano.
 * - No toca el estado ni la homologación de una fila existente: una persona pudo
 *   deshabilitarla y eso se respeta.
 * - Procedencia en `purpose` (el DDL no tiene columnas para ella): fuente,
 *   archivo:línea, fecha y huella.
 */
@Injectable()
export class RuntimePiecesSeedService {
  constructor(private readonly repo: RuntimePiecesRepository) {}

  async run(
    db: SqlPort,
    scan: ScanResult,
    options: { actorUserId: string | null; now: Date; dryRun?: boolean },
  ): Promise<DiscoveryReport> {
    if (!scan.available) {
      throw new ConflictException(
        scan.reason ?? 'No hay código fuente para escanear',
        { root: scan.root },
        RuntimePiecesErrorReason.RUNTIME_PIECES_SOURCE_UNAVAILABLE,
      );
    }
    const dryRun = options.dryRun === true;
    const discoveredAt = options.now.toISOString().slice(0, 10);

    return db.transaction(async (tx) => {
      await this.assertPreconditions(tx);
      await this.repo.lockDiscovery(tx);

      const existing = new Map<string, RegistryRow>(
        (await this.repo.listRegistered(tx, RUNTIME_PIECES_TENANT_ID)).map(
          (row) => [row.code, row],
        ),
      );
      const created: string[] = [];
      const updated: string[] = [];
      const conflicts: string[] = [];
      let unchanged = 0;

      for (const piece of scan.pieces) {
        const draft = draftFor(piece, discoveredAt);
        const row = existing.get(piece.id);
        if (!row) {
          created.push(piece.id);
          if (!dryRun) {
            const inserted = await this.repo.insertIfAbsent(tx, {
              id: registryIdOf(piece.id),
              tenantId: RUNTIME_PIECES_TENANT_ID,
              code: piece.id,
              name: draft.name,
              toolTypeConceptId: RUNTIME_PIECE_KIND[piece.kind],
              vendor: draft.vendor,
              purpose: draft.purpose,
              stateConceptId: PLATFORM_OPS.TOOL_STATE_ACTIVE,
              actorUserId: options.actorUserId,
              now: options.now,
            });
            // Otro proceso la insertó entre la lectura y la escritura: no es una alta nuestra.
            if (!inserted) created.pop();
          }
          continue;
        }
        const provenance = parseProvenance(row.purpose);
        if (provenance === null) {
          conflicts.push(piece.id);
          continue;
        }
        if (
          provenance.fingerprint === fingerprintOf(piece) &&
          row.toolTypeConceptId === RUNTIME_PIECE_KIND[piece.kind]
        ) {
          unchanged += 1;
          continue;
        }
        updated.push(piece.id);
        if (!dryRun) {
          await this.repo.updateDerived(tx, {
            tenantId: RUNTIME_PIECES_TENANT_ID,
            code: piece.id,
            name: draft.name,
            toolTypeConceptId: RUNTIME_PIECE_KIND[piece.kind],
            vendor: draft.vendor,
            purpose: draft.purpose,
            actorUserId: options.actorUserId,
            now: options.now,
          });
        }
      }

      const found = new Set(scan.pieces.map((piece) => piece.id));
      const orphans = [...existing.keys()]
        .filter(
          (code) => code.startsWith(REGISTRY_CODE_PREFIX) && !found.has(code),
        )
        .sort();

      return {
        dryRun,
        discoveredAt,
        scanned: scan.pieces.length,
        created: created.length,
        updated: updated.length,
        unchanged,
        orphans: orphans.length,
        conflicts: conflicts.length,
        createdIds: cap(created),
        updatedIds: cap(updated),
        orphanIds: cap(orphans),
        conflictIds: cap(conflicts),
      };
    });
  }

  /** Falla con un motivo claro en vez de un error de FK crudo si falta el catálogo. */
  private async assertPreconditions(tx: SqlPort): Promise<void> {
    const needed = [
      ...Object.values(RUNTIME_PIECE_KIND),
      PLATFORM_OPS.TOOL_STATE_ACTIVE,
    ];
    const present = await this.repo.existingConcepts(tx, needed);
    const missing = needed.filter((id) => !present.has(id));
    if (missing.length > 0) {
      throw new PreconditionFailedException(
        'Faltan conceptos del catálogo para registrar las piezas: ejecutar el seed de terminología',
        { missingConcepts: missing.length },
        RuntimePiecesErrorReason.RUNTIME_PIECES_CONCEPTS_MISSING,
      );
    }
    if (!(await this.repo.tenantExists(tx, RUNTIME_PIECES_TENANT_ID))) {
      throw new PreconditionFailedException(
        'No existe el tenant de plataforma que es dueño de las piezas',
        {},
        RuntimePiecesErrorReason.RUNTIME_PIECES_TENANT_MISSING,
      );
    }
  }
}

/** Mapa inverso concepto → tipo, para leer filas del registro. */
export const KIND_BY_CONCEPT: ReadonlyMap<string, PieceKind> = new Map(
  (Object.entries(RUNTIME_PIECE_KIND) as [PieceKind, string][]).map(
    ([kind, id]) => [id, kind],
  ),
);
