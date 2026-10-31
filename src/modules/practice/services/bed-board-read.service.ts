import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import {
  CareSpaces,
  CleaningOrders,
  ClinicalUnits,
  SpaceUnitAssignments,
} from '../entities';
import { PRAC } from '../practice.concepts';
import { CareSpaceOpsRepository } from '../repositories';
import type {
  BedBoardCellDto,
  BedBoardDto,
  BedBoardQueryDto,
  BedBoardUnitDto,
  CareSpaceBlockDto,
  CleaningOrderListDto,
  CleaningOrderQueryDto,
  OperationalStateDto,
  StatusEventListDto,
  StatusEventsQueryDto,
} from '../dto';
import {
  AXIS,
  CLEANING_PRIORITY,
  CLEANING_STATUS,
  OPEN_CLEANING_STATUSES,
} from '../domain/ops/ops-catalog';
import {
  PATIENT_VIEWERS,
  type InfraRole,
  type ScopeTarget,
} from '../domain/ops/infra-scope';
import { assignabilityViolations, v2CodeOf } from '../domain/ops/bed-status-v2';
import { InfrastructureAccessService } from './infrastructure-access.service';
import { CareSpaceOpsCore } from './ops/care-space-ops-core';
import { OpsCellBuilder, patientBadge } from './ops/ops-cell-builder';

const PAGE = 500;
const ORDER_PAGE = 100;
const EVENT_PAGE = 100;

/** Índice en memoria de la estructura de una sede. */
interface SiteIndex {
  readonly byId: Map<string, CareSpaces>;
  readonly unitsBySpace: Map<string, string[]>;
  readonly ownerBySpace: Map<string, string>;
  readonly unitParent: Map<string, string | null>;
  readonly unitName: Map<string, string>;
}

/**
 * Lecturas de la operación de F2 (CONTRATO-F2-F5 §F2.3): tablero, estado de un
 * espacio, bloqueos, cola de limpieza e historial A20. Cada fila se filtra por
 * el alcance del actor (§0.3: Enfermería de la unidad 3 ve sólo su unidad) y el
 * bloque `patient` sólo viaja a Enfermería/Admisión sobre ese espacio.
 */
@Injectable()
export class BedBoardReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly core: CareSpaceOpsCore,
    private readonly opsRepo: CareSpaceOpsRepository,
    private readonly cells: OpsCellBuilder,
  ) {}

  /**
   * `GET /sites/:siteId/bed-board`.
   *
   * @param siteId - Sede.
   * @param query - Filtros.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async bedBoard(
    siteId: string,
    query: BedBoardQueryDto,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<BedBoardDto> {
    const em = this.em.fork();
    const { target, scope } = await this.access.assertCan(
      actor,
      'f2.board.read',
      { siteId },
      em,
      tenantId,
    );
    const index = await this.index(em, siteId);
    const functionIds = (query.functionCodes ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => PRAC[c as keyof typeof PRAC])
      .filter(Boolean);
    const v2Filter = new Set(
      (query.v2Codes ?? '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    );
    let spaces = [...index.byId.values()].filter(
      (s) =>
        s.statusConceptId !== PRAC.SPACE_RETIRED &&
        (functionIds.length > 0
          ? functionIds.includes(s.spaceTypeConceptId)
          : s.formConceptId === PRAC.LOC_FORM_BED),
    );
    if (query.parentSpaceId) {
      spaces = spaces.filter((s) =>
        this.chainOf(index, s.id).includes(query.parentSpaceId as string),
      );
    }
    if (query.unitId) {
      spaces = spaces.filter((s) =>
        this.unitsOf(index, s.id).includes(query.unitId as string),
      );
    }
    spaces.sort((a, b) => a.code.localeCompare(b.code));
    if (query.cursor)
      spaces = spaces.filter((s) => s.code > (query.cursor as string));
    const settings = await this.core.settings(em, target.site.practiceId);
    const ids = spaces.map((s) => s.id);
    const [occupancy, orders, lastEvents, lastEventAt] = await Promise.all([
      this.core.occupancy(em, ids),
      this.opsRepo.openCleaningOrders(em, ids),
      this.opsRepo.lastEventBySpace(em, ids),
      this.opsRepo.lastEventAt(em, siteId),
    ]);
    const orderBySpace = new Map(orders.map((o) => [o.careSpaceId, o.id]));
    const cellsOut: { unitId: string | null; cell: BedBoardCellDto }[] = [];
    const visible: { space: CareSpaces; roles: Set<InfraRole> }[] = [];
    for (const space of spaces) {
      const roles = this.access.rolesOn(
        scope,
        this.targetOf(index, space, target.site),
      );
      if (
        !this.access.can(
          'f2.board.read',
          roles,
          space.spaceTypeConceptId === PRAC.SPACE_FN_OPERATING_ROOM,
        )
      )
        continue;
      visible.push({ space, roles });
      if (visible.length >= PAGE) break;
    }
    const patientEncounters = visible
      .filter((v) => PATIENT_VIEWERS.some((r) => v.roles.has(r)))
      .map((v) => occupancy.get(v.space.id)?.encounterId)
      .filter((id): id is string => !!id);
    const badges = new Map(
      (await this.opsRepo.patientBadges(em, patientEncounters)).map((b) => [
        b.encounter_id,
        patientBadge(b),
      ]),
    );
    for (const { space, roles } of visible) {
      const occ = occupancy.get(space.id) ?? {
        code: 'OCC_FREE' as const,
        since: null,
        encounterId: null,
        locationId: null,
      };
      const axes = this.core.axesOf(space, occ.code);
      const violations = assignabilityViolations(axes, settings);
      const patient =
        PATIENT_VIEWERS.some((r) => roles.has(r)) && occ.encounterId
          ? badges.get(occ.encounterId)
          : undefined;
      const chain = this.chainOf(index, space.id).map((id) => {
        const s = index.byId.get(id) as CareSpaces;
        return {
          id: s.id,
          code: s.code,
          name: s.name,
          form_concept_id: s.formConceptId ?? null,
        };
      });
      const cell = this.cells.cell(
        space,
        {
          axes,
          occupancy: occ,
          v2Code: v2CodeOf(axes, settings),
          assignable: violations.length === 0,
          violations,
          settings,
        },
        chain,
        orderBySpace.get(space.id) ?? null,
        lastEvents.get(space.id) ?? null,
        patient,
      );
      if (v2Filter.size > 0 && !v2Filter.has(cell.v2Code)) continue;
      cellsOut.push({
        unitId:
          index.ownerBySpace.get(space.id) ?? space.clinicalUnitId ?? null,
        cell,
      });
    }
    const units = new Map<string | null, BedBoardUnitDto>();
    for (const { unitId, cell } of cellsOut) {
      let unit = units.get(unitId);
      if (!unit) {
        unit = {
          unitId,
          name: unitId ? (index.unitName.get(unitId) ?? '') : 'Sin unidad',
          counts: {
            total: 0,
            assignable: 0,
            occupied: 0,
            reserved: 0,
            blocked: 0,
            maintenance: 0,
            dirty: 0,
            cleaning: 0,
            isolation: 0,
            contaminated: 0,
          },
          cells: [],
        };
        units.set(unitId, unit);
      }
      unit.cells.push(cell);
      const c = unit.counts;
      c.total += 1;
      if (cell.assignable) c.assignable += 1;
      if (cell.occupancy.code === 'OCC_OCCUPIED') c.occupied += 1;
      if (cell.occupancy.code === 'OCC_RESERVED') c.reserved += 1;
      if (
        cell.availability.code.startsWith('SPACE_OP_BLOCKED') ||
        cell.availability.code === 'SPACE_OP_CLOSED'
      )
        c.blocked += 1;
      if (cell.availability.code === 'SPACE_OP_MAINTENANCE') c.maintenance += 1;
      if (cell.hygiene.code === 'HYG_DIRTY') c.dirty += 1;
      if (cell.hygiene.code === 'HYG_CLEANING') c.cleaning += 1;
      if (cell.hygiene.code === 'HYG_CONTAMINATED') c.contaminated += 1;
      if (cell.isolation.code !== 'ISO_NONE') c.isolation += 1;
    }
    return {
      generatedAt: new Date().toISOString(),
      lastEventAt: lastEventAt?.toISOString() ?? null,
      units: [...units.values()],
      nextCursor:
        visible.length >= PAGE ? visible[visible.length - 1].space.code : null,
    };
  }

  /**
   * `GET /care-spaces/:id/operational-state`.
   *
   * @param spaceId - Espacio.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async operationalState(
    spaceId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<OperationalStateDto> {
    const em = this.em.fork();
    const { target, roles } = await this.access.assertCan(
      actor,
      'f2.board.read',
      { careSpaceId: spaceId },
      em,
      tenantId,
    );
    const space = target.space as CareSpaces;
    const withPatient = PATIENT_VIEWERS.some((r) => roles.has(r));
    const cell = await this.cells.cellFor(
      em,
      space,
      target.site.practiceId,
      withPatient,
    );
    const blocks = await this.opsRepo.openBlocks(em, space.id);
    const [order] = await this.opsRepo.openCleaningOrders(em, [space.id]);
    return {
      ...cell,
      openBlocks: blocks.map((b) => this.cells.block(b)),
      openCleaningOrder: order ? this.cells.order(order, space) : null,
    };
  }

  /**
   * `GET /care-spaces/:id/blocks?includeEnded`.
   *
   * @param spaceId - Espacio.
   * @param includeEnded - Incluir terminados y cancelados.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async blocks(
    spaceId: string,
    includeEnded: boolean,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<CareSpaceBlockDto[]> {
    const em = this.em.fork();
    await this.access.assertCan(
      actor,
      'f2.events.read',
      { careSpaceId: spaceId },
      em,
      tenantId,
    );
    return (await this.opsRepo.blocks(em, spaceId, includeEnded)).map((b) =>
      this.cells.block(b),
    );
  }

  /**
   * `GET /sites/:siteId/cleaning-orders` (sin datos de paciente).
   *
   * @param siteId - Sede.
   * @param query - Filtros.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async cleaningOrders(
    siteId: string,
    query: CleaningOrderQueryDto,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<CleaningOrderListDto> {
    const em = this.em.fork();
    const { target, scope } = await this.access.assertCan(
      actor,
      'f2.cleaning.read',
      { siteId },
      em,
      tenantId,
    );
    const index = await this.index(em, siteId);
    const limit = query.limit ?? ORDER_PAGE;
    const rows = await em.find(
      CleaningOrders,
      {
        practiceSiteId: siteId,
        statusConceptId: query.status
          ? CLEANING_STATUS[query.status]
          : { $in: OPEN_CLEANING_STATUSES.map((c) => CLEANING_STATUS[c]) },
        ...(query.unitId ? { clinicalUnitId: query.unitId } : {}),
        ...(query.assignedTo === 'me' ? { assignedUserId: actor.id } : {}),
        ...(query.priority
          ? { priorityConceptId: CLEANING_PRIORITY[query.priority] }
          : {}),
        ...(query.cursor
          ? { requestedAt: { $gt: new Date(query.cursor) } }
          : {}),
      },
      { orderBy: { requestedAt: 'asc' }, limit: limit * 4 },
    );
    const items = [];
    for (const order of rows) {
      const space = index.byId.get(order.careSpaceId);
      if (!space) continue;
      const roles = this.access.rolesOn(
        scope,
        this.targetOf(index, space, target.site),
      );
      if (
        !this.access.can(
          'f2.cleaning.read',
          roles,
          space.spaceTypeConceptId === PRAC.SPACE_FN_OPERATING_ROOM,
        )
      )
        continue;
      items.push(this.cells.order(order, space));
      if (items.length >= limit) break;
    }
    return {
      items,
      nextCursor:
        items.length >= limit ? items[items.length - 1].requestedAt : null,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * `GET /care-spaces/:id/status-events` (historial A20, más nuevo primero).
   *
   * @param spaceId - Espacio.
   * @param query - Eje, rango y cursor.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async statusEvents(
    spaceId: string,
    query: StatusEventsQueryDto,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<StatusEventListDto> {
    const em = this.em.fork();
    await this.access.assertCan(
      actor,
      'f2.events.read',
      { careSpaceId: spaceId },
      em,
      tenantId,
    );
    const rows = await this.opsRepo.statusEvents(em, spaceId, {
      axisId: query.axis ? AXIS[query.axis] : undefined,
      from: query.from,
      to: query.to,
      before: query.cursor ? new Date(query.cursor) : undefined,
      limit: EVENT_PAGE,
    });
    const items = rows.map((r) => this.cells.event(r));
    return {
      items,
      nextCursor:
        items.length >= EVENT_PAGE ? items[items.length - 1].occurredAt : null,
    };
  }

  private async index(em: EntityManager, siteId: string): Promise<SiteIndex> {
    const [spaces, units] = await Promise.all([
      em.find(CareSpaces, { practiceSiteId: siteId }),
      em.find(ClinicalUnits, { practiceSiteId: siteId }),
    ]);
    const now = new Date();
    const links = spaces.length
      ? await em.find(SpaceUnitAssignments, {
          careSpaceId: { $in: spaces.map((s) => s.id) },
          validFrom: { $lte: now },
          $or: [{ validTo: null }, { validTo: { $gt: now } }],
        })
      : [];
    const unitsBySpace = new Map<string, string[]>();
    const ownerBySpace = new Map<string, string>();
    for (const l of links) {
      unitsBySpace.set(l.careSpaceId, [
        ...(unitsBySpace.get(l.careSpaceId) ?? []),
        l.clinicalUnitId,
      ]);
      if (l.roleConceptId === PRAC.SPACE_UNIT_ROLE_OWNER)
        ownerBySpace.set(l.careSpaceId, l.clinicalUnitId);
    }
    return {
      byId: new Map(spaces.map((s) => [s.id, s])),
      unitsBySpace,
      ownerBySpace,
      unitParent: new Map(units.map((u) => [u.id, u.parentUnitId ?? null])),
      unitName: new Map(units.map((u) => [u.id, u.name])),
    };
  }

  /** El espacio y sus ancestros. */
  private chainOf(index: SiteIndex, spaceId: string): string[] {
    const out: string[] = [];
    let current: string | undefined = spaceId;
    while (current && out.length < 32 && !out.includes(current)) {
      out.push(current);
      current = index.byId.get(current)?.parentSpaceId ?? undefined;
    }
    return out;
  }

  /** Unidades que contienen al espacio (camino + ancestros de unidad). */
  private unitsOf(index: SiteIndex, spaceId: string): string[] {
    const direct = new Set<string>();
    for (const id of this.chainOf(index, spaceId)) {
      for (const u of index.unitsBySpace.get(id) ?? []) direct.add(u);
      const own = index.byId.get(id)?.clinicalUnitId;
      if (own) direct.add(own);
    }
    const out = new Set<string>();
    for (const u of direct) {
      let current: string | null | undefined = u;
      while (current && !out.has(current)) {
        out.add(current);
        current = index.unitParent.get(current);
      }
    }
    return [...out];
  }

  private targetOf(
    index: SiteIndex,
    space: CareSpaces,
    site: { id: string; practiceId: string },
  ): ScopeTarget {
    return {
      practiceId: site.practiceId,
      siteId: site.id,
      unitIds: this.unitsOf(index, space.id),
      spaceChain: this.chainOf(index, space.id),
    };
  }
}
