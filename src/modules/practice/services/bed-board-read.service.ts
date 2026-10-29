import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { V2_BED_STATUS_CODES, type V2BedStatus } from '../domain/bed-status-v2';
import type {
  BedBoard,
  BedBoardCell,
  BedBoardCounts,
  BedBoardUnit,
} from '../dto/care-space-ops.types';
import type { BedBoardQueryDto } from '../dto/care-space-ops.dto';
import { SPACE_LIFECYCLE, FUNCTIONS } from '../infrastructure-catalog';
import { hasOperationalState } from '../ops-catalog';
import { OpsErrorReason } from '../practice-ops.error-reasons';
import { InfrastructureAccessService } from './infrastructure-access.service';
import { decodeOffset, encodeOffset } from './cleaning-orders.service';
import { placeholders } from './ops-rows';
import { OpsStateService } from './ops-state';

/** Resultado del tablero y el instante que va en `X-Data-As-Of`. */
export interface BedBoardResponse {
  readonly board: BedBoard;
  /** Último evento A20 visible, o el instante de la lectura si no hay. */
  readonly dataAsOf: string;
}

/** Recuentos derivados de un grupo de celdas. */
export function countCells(cells: readonly BedBoardCell[]): BedBoardCounts {
  const count = (predicate: (cell: BedBoardCell) => boolean) =>
    cells.filter(predicate).length;
  return {
    total: cells.length,
    assignable: count((c) => c.assignable),
    occupied: count((c) => c.occupancy.code === 'OCC_OCCUPIED'),
    reserved: count((c) => c.occupancy.code === 'OCC_RESERVED'),
    blocked: count((c) =>
      [
        'SPACE_OP_BLOCKED_CLINICAL',
        'SPACE_OP_BLOCKED_ADMIN',
        'SPACE_OP_CLOSED',
      ].includes(c.availability.code),
    ),
    maintenance: count((c) => c.availability.code === 'SPACE_OP_MAINTENANCE'),
    dirty: count((c) => c.hygiene.code === 'HYG_DIRTY'),
    cleaning: count((c) => c.hygiene.code === 'HYG_CLEANING'),
    isolation: count((c) => c.isolation.code !== 'ISO_NONE'),
    contaminated: count((c) => c.hygiene.code === 'HYG_CONTAMINATED'),
  };
}

/**
 * Tablero de camas (`GET /sites/:siteId/bed-board`): los espacios con estado
 * operativo de la sede, agrupados por unidad dueña, con los recuentos derivados y la
 * **antigüedad del dato** (`generatedAt`, `lastEventAt`, S7).
 *
 * Quien tiene alcance de unidad o espacio ve sólo lo suyo. El paciente (iniciales,
 * sexo y edad) viaja únicamente a Enfermería y Admisión sobre el espacio; Limpieza,
 * Mantenimiento y las administraciones leen el tablero sin datos de paciente.
 */
@Injectable()
export class BedBoardReadService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Evaluador de roles y alcance.
   * @param state - Lectura del estado operativo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly state: OpsStateService,
  ) {}

  /**
   * Arma el tablero.
   *
   * @param siteId - Establecimiento.
   * @param query - Filtros y cursor.
   * @param actor - Quien consulta.
   */
  async board(
    siteId: string,
    query: BedBoardQueryDto,
    actor: AuthenticatedUser,
  ): Promise<BedBoardResponse> {
    return this.em.transactional(async (tx) => {
      const grant = await this.access.assertCan(
        actor,
        'infra.board.view',
        { siteId },
        tx,
      );
      const now = new Date();
      const v2Filter = this.parseV2(query.v2Codes);
      const functionIds = this.parseFunctions(query.functionCodes);

      const [all, covered, clinicalCovered, tree] = await Promise.all([
        this.state.loadSiteSpaces(tx, grant.tenantId, siteId),
        this.access.coveredSpaceIds(tx, grant, grant.actingRoles),
        this.access.coveredSpaceIds(tx, grant, ['NURSE', 'ADMISSION']),
        this.state.treeOf(tx, siteId),
      ]);

      const inSubtree = (id: string): boolean => {
        if (!query.parentSpaceId) return true;
        const seen = new Set<string>();
        let current = tree.get(id)?.parentId ?? null;
        while (current && !seen.has(current)) {
          if (current === query.parentSpaceId) return true;
          seen.add(current);
          current = tree.get(current)?.parentId ?? null;
        }
        return false;
      };

      const lifecycleIds = [
        SPACE_LIFECYCLE.byInput('ACTIVE')!.id,
        SPACE_LIFECYCLE.byInput('SUSPENDED')!.id,
      ];
      const spaces = all.filter(
        (row) =>
          lifecycleIds.includes(row.statusConceptId) &&
          hasOperationalState(row.formConceptId) &&
          (covered === null || covered.has(row.id)) &&
          (!query.unitId || row.clinicalUnitId === query.unitId) &&
          (!functionIds || functionIds.has(row.spaceTypeConceptId)) &&
          inSubtree(row.id),
      );

      const cells = await this.state.cells(tx, siteId, spaces, {
        now,
        patientVisible: (id) =>
          clinicalCovered === null || clinicalCovered.has(id),
      });
      const rowById = new Map(spaces.map((row) => [row.id, row]));

      // Grupos por unidad dueña, con nombre.
      const unitIds = [
        ...new Set(spaces.map((s) => s.clinicalUnitId).filter(Boolean)),
      ] as string[];
      const unitNames = new Map<string, string>();
      if (unitIds.length) {
        const rows = await tx.execute<{ id: string; name: string }[]>(
          `select id, name from practice.clinical_units where id in (${placeholders(unitIds.length)})`,
          unitIds,
        );
        for (const unit of rows)
          unitNames.set(String(unit.id), String(unit.name));
      }
      const groupKey = (cell: BedBoardCell) =>
        rowById.get(cell.id)?.clinicalUnitId ?? null;
      const keys = [...new Set(cells.map(groupKey))].sort((a, b) =>
        (a ? (unitNames.get(a) ?? '') : '￿').localeCompare(
          b ? (unitNames.get(b) ?? '') : '￿',
        ),
      );

      const limit = query.limit ?? 300;
      const offset = decodeOffset(query.cursor);
      const ordered = cells
        .slice()
        .sort(
          (a, b) =>
            keys.indexOf(groupKey(a)) - keys.indexOf(groupKey(b)) ||
            a.code.localeCompare(b.code, 'es', { numeric: true }) ||
            a.id.localeCompare(b.id),
        );
      const filtered = v2Filter
        ? ordered.filter((c) => v2Filter.has(c.v2Code))
        : ordered;
      const page = filtered.slice(offset, offset + limit);

      const units: BedBoardUnit[] = keys.map((key) => ({
        unitId: key,
        name: key ? (unitNames.get(key) ?? 'Unidad') : 'Sin unidad',
        counts: countCells(ordered.filter((c) => groupKey(c) === key)),
        cells: page.filter((c) => groupKey(c) === key),
      }));

      const lastEventAt =
        cells
          .map((c) => c.lastEventAt)
          .filter((at): at is string => at !== null)
          .sort()
          .pop() ?? null;
      const generatedAt = now.toISOString();
      return {
        board: {
          generatedAt,
          lastEventAt,
          units,
          nextCursor:
            filtered.length > offset + limit
              ? encodeOffset(offset + limit)
              : null,
        },
        dataAsOf: lastEventAt ?? generatedAt,
      };
    });
  }

  private parseV2(raw: string | undefined): Set<V2BedStatus> | null {
    if (!raw) return null;
    const codes = raw
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    const invalid = codes.filter(
      (c) => !V2_BED_STATUS_CODES.includes(c as V2BedStatus),
    );
    if (invalid.length) {
      throw new PreconditionFailedException(
        'Código v2 inválido',
        { field: 'v2Codes', invalid, accepted: V2_BED_STATUS_CODES },
        OpsErrorReason.OPS_CODE_INVALID,
      );
    }
    return new Set(codes as V2BedStatus[]);
  }

  private parseFunctions(raw: string | undefined): Set<string> | null {
    if (!raw) return null;
    const ids = new Set<string>();
    for (const code of raw
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)) {
      const entry = FUNCTIONS.byInput(code);
      if (!entry) {
        throw new PreconditionFailedException(
          'Función inválida',
          { field: 'functionCodes', invalid: code },
          OpsErrorReason.OPS_CODE_INVALID,
        );
      }
      ids.add(entry.id);
    }
    return ids;
  }
}
