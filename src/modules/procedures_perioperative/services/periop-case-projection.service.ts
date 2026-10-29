import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OperatingRoomBlocks, SurgicalSafetyChecklists } from '../entities';
import type { ProcedureCases } from '../entities';
import type {
  CaseBlockDto,
  CaseChecklistDto,
  CaseOperatingRoomDto,
} from '../dto';
import { PERIOP } from '../procedures_perioperative.concepts';

/** Lo que F4 agrega a la cabecera de un caso. */
export interface CaseF4Fields {
  operatingRoom: CaseOperatingRoomDto | null;
  reservedStartAt: Date | null;
  reservedEndAt: Date | null;
  prepMinutes: number | null;
  cleanupMinutes: number | null;
  block: CaseBlockDto | null;
  checklist: CaseChecklistDto | null;
}

/**
 * Proyección de lectura de F4 sobre los casos: el quirófano con su ruta, la ventana reservada,
 * el bloque y las tres fases del check-list (CONTRATO-F2-F5 §F4.3, `GET /procedure-cases`).
 * Resuelve todo en lote (una consulta por tabla, no una por caso) y siempre acotado al tenant.
 */
@Injectable()
export class PeriopCaseProjectionService {
  /**
   * @param tx - Contexto de lectura.
   * @param tenantId - Tenant del contexto.
   * @param cases - Casos de la página o el detalle.
   * @returns Los campos de F4 de cada caso, por id de caso.
   */
  async project(
    tx: EntityManager,
    tenantId: string,
    cases: readonly ProcedureCases[],
  ): Promise<Map<string, CaseF4Fields>> {
    const out = new Map<string, CaseF4Fields>();
    if (cases.length === 0) return out;

    const roomIds = [
      ...new Set(cases.map((c) => c.operatingRoomId).filter(isString)),
    ];
    const blockIds = [
      ...new Set(cases.map((c) => c.operatingRoomBlockId).filter(isString)),
    ];
    const [rooms, blocks, checklists] = await Promise.all([
      this.roomsWithPath(tx, tenantId, roomIds),
      blockIds.length
        ? tx.find(OperatingRoomBlocks, { tenantId, id: { $in: blockIds } })
        : Promise.resolve([] as OperatingRoomBlocks[]),
      tx.find(SurgicalSafetyChecklists, {
        procedureCaseId: { $in: cases.map((c) => c.id) },
      }),
    ]);
    const blockById = new Map(blocks.map((b) => [b.id, b]));
    const checklistByCase = new Map(
      checklists.map((c) => [c.procedureCaseId, c]),
    );

    for (const c of cases) {
      const block = c.operatingRoomBlockId
        ? blockById.get(c.operatingRoomBlockId)
        : undefined;
      const checklist = checklistByCase.get(c.id);
      out.set(c.id, {
        operatingRoom: c.operatingRoomId
          ? (rooms.get(c.operatingRoomId) ?? null)
          : null,
        reservedStartAt: c.reservedStartAt ?? null,
        reservedEndAt: c.reservedEndAt ?? null,
        prepMinutes: c.prepMinutes ?? null,
        cleanupMinutes: c.cleanupMinutes ?? null,
        block: block
          ? {
              id: block.id,
              owner: {
                kind:
                  block.ownerKindConceptId === PERIOP.ORB_OWNER_SURGEON
                    ? 'SURGEON'
                    : 'SERVICE',
                clinicalUnitId: block.clinicalUnitId ?? null,
                surgicalSpecialtyConceptId:
                  block.surgicalSpecialtyConceptId ?? null,
                surgeonProfileId: block.surgeonProfileId ?? null,
              },
            }
          : null,
        checklist: checklist
          ? {
              id: checklist.id,
              signIn: checklist.signInCompletedAt ?? null,
              timeOut: checklist.timeOutCompletedAt ?? null,
              signOut: checklist.signOutCompletedAt ?? null,
            }
          : null,
      });
    }
    return out;
  }

  /** Cada sala con su camino de antecesores (de la raíz hacia ella, sin incluirla). */
  private async roomsWithPath(
    tx: EntityManager,
    tenantId: string,
    roomIds: readonly string[],
  ): Promise<Map<string, CaseOperatingRoomDto>> {
    const rooms = new Map<string, CaseOperatingRoomDto>();
    if (roomIds.length === 0) return rooms;
    const marks = roomIds.map(() => '?').join(', ');
    const rows = await tx.execute<
      {
        room_id: string;
        id: string;
        code: string;
        name: string;
        depth: number;
      }[]
    >(
      `with recursive up(room_id, id, parent_id, depth) as (
         select cs.id, cs.id, cs.parent_space_id, 0
           from practice.care_spaces cs
          where cs.id in (${marks}) and cs.tenant_id = ?
         union all
         select up.room_id, p.id, p.parent_space_id, up.depth + 1
           from up
           join practice.care_spaces p on p.id = up.parent_id and p.tenant_id = ?
       )
       select up.room_id, cs.id, cs.code, cs.name, up.depth
         from up join practice.care_spaces cs on cs.id = up.id
        order by up.room_id, up.depth desc`,
      [...roomIds, tenantId, tenantId],
    );
    for (const row of rows) {
      if (row.depth === 0) {
        rooms.set(row.room_id, {
          id: row.id,
          code: row.code,
          name: row.name,
          path: [],
        });
      }
    }
    for (const row of rows) {
      if (row.depth > 0) {
        rooms.get(row.room_id)?.path.push({
          id: row.id,
          code: row.code,
          name: row.name,
        });
      }
    }
    return rooms;
  }
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string';
}
