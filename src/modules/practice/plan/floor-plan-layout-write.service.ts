import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { CLIN } from '../../clinical/clinical.concepts';
import { practiceOutOfScope } from '../services/practice-scope';
import { RowVersionMismatchException } from '../http/row-version';
import {
  validateLayoutDelta,
  type ElementUpsert,
  type LayoutDelta,
  type PlacementUpsert,
  type SpaceInfo,
  type ValidationOutcome,
} from '../domain/plan-layout-validator';
import type {
  ElementItemDto,
  CreateElementDto,
  CreatePlacementDto,
  PatchLayoutDto,
  PlacementItemDto,
  ReplaceLayoutDto,
  UpdateElementDto,
  UpdatePlacementDto,
} from './floor-plan.dto';
import {
  LAYOUT_EVENT_ID_CAP,
  PLAN_EVENTS,
  PLAN_LIMITS,
} from './floor-plan.constants';
import { FloorPlanReason } from './floor-plan.error-reasons';
import type { LayoutWriteResult, PlanLayoutError } from './floor-plan.types';
import { FloorPlanContextService } from './floor-plan-context.service';
import { FloorPlanLayoutRepository } from './floor-plan-layout.repository';
import {
  FloorPlansRepository,
  type PlanRow,
  type WorkingModel,
} from './floor-plans.repository';
import {
  layoutVersionMismatch,
  planDbException,
  translatePlanDbError,
} from './plan-constraint-reasons';
import { PlanEventsService } from './plan-events.service';
import { PlanViewerService } from './plan-viewer.service';

/** Cómo llegó el pedido de escritura. */
type WriteMode = 'DELTA' | 'REPLACE' | 'SINGLE';

/** Un pedido de escritura ya normalizado. */
interface WriteRequest {
  readonly mode: WriteMode;
  readonly delta: LayoutDelta;
  /** `layoutVersion` esperado; `undefined` en las operaciones sueltas (usan `rowVersion`). */
  readonly expectedLayoutVersion?: number;
  readonly dryRun: boolean;
  readonly confirmRemoval?: boolean;
  /** En REPLACE: los ids que figuran, para derivar lo que se quita. */
  readonly replaceSpaceIds?: ReadonlySet<string>;
  readonly replaceElementIds?: ReadonlySet<string>;
}

/** Contexto de la petición. */
export interface WriteContext {
  readonly actor: AuthenticatedUser;
  readonly supportReason?: string;
  readonly correlationId?: string;
}

/** Señal interna para deshacer una transacción de `dryRun` devolviendo el resultado. */
class DryRunRollback extends Error {
  constructor(readonly result: LayoutWriteResult) {
    super('dryRun');
  }
}

/**
 * Escritura del layout de un lienzo (CONTRATO-PLANO §3.4): delta, reemplazo
 * total y operaciones sueltas, **todo o nada** en una sola transacción.
 *
 * Orden obligatorio, para que el resultado no dependa del orden en que mande
 * los ítems el cliente:
 *
 * 1. `SELECT … FOR UPDATE` del lienzo y comparación del `layoutVersion` (412).
 * 2. Pre-validación en memoria (`validateLayoutDelta`): error **por elemento**.
 * 3. `SET CONSTRAINTS … ex_space_placements_no_overlap DEFERRED` (permite
 *    intercambiar dos locales de lugar en un mismo guardado).
 * 4. Historia **antes** de cada borrado, luego los cambios (padres antes que
 *    hijos al insertar; hijos antes que padres al quitar).
 * 5. Verificación de la base acotada a lo tocado y `SET CONSTRAINTS ALL
 *    IMMEDIATE`: los errores del `COMMIT` salen como 422 con ítems y no como
 *    un 500 al confirmar.
 * 6. Evento `practice.floor_plan.layout_changed` en el outbox.
 *
 * Si el validador y la base discrepan, **gana la base** y el caso queda en el
 * registro del servidor (`source: 'database'` en el error).
 */
@Injectable()
export class FloorPlanLayoutWriteService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param plans - Lienzos.
   * @param layout - Ubicaciones y elementos.
   * @param viewers - Permisos.
   * @param events - Outbox.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: FloorPlanContextService,
    private readonly plans: FloorPlansRepository,
    private readonly layout: FloorPlanLayoutRepository,
    private readonly viewers: PlanViewerService,
    private readonly events: PlanEventsService,
  ) {}

  // ------------------------------------------------------------------ delta

  /**
   * `PATCH /floor-plans/:id/layout`.
   *
   * @param planId - Lienzo.
   * @param dto - Delta (`upsert` y `remove`).
   * @param expectedLayoutVersion - `If-Match`.
   * @param dryRun - `true` valida con la base y deshace.
   * @param ctx - Actor y correlación.
   * @returns Recuentos, advertencias de área y la nueva versión.
   */
  patch(
    planId: string,
    dto: PatchLayoutDto,
    expectedLayoutVersion: number,
    dryRun: boolean,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult> {
    const delta: LayoutDelta = {
      placements: (dto.upsert?.placements ?? []).map(toPlacementUpsert),
      elements: (dto.upsert?.elements ?? []).map(toElementUpsert),
      removeSpaceIds: dto.remove?.spaceIds ?? [],
      removeElementIds: dto.remove?.elementIds ?? [],
      cascade: dto.remove?.cascade ?? false,
    };
    const items =
      delta.placements.length +
      delta.elements.length +
      delta.removeSpaceIds.length +
      delta.removeElementIds.length;
    if (items > PLAN_LIMITS.maxItemsPerPatch) {
      throw tooManyItems(items, PLAN_LIMITS.maxItemsPerPatch);
    }
    return this.execute(
      planId,
      { mode: 'DELTA', delta, expectedLayoutVersion, dryRun },
      ctx,
    );
  }

  /**
   * `PUT /floor-plans/:id/layout`: reemplazo total (lo que no figura se quita).
   *
   * @param planId - Lienzo.
   * @param dto - Todo el dibujo y `confirmRemoval`.
   * @param expectedLayoutVersion - `If-Match`.
   * @param dryRun - `true` valida con la base y deshace.
   * @param ctx - Actor y correlación.
   * @returns Recuentos, advertencias de área y la nueva versión.
   */
  replace(
    planId: string,
    dto: ReplaceLayoutDto,
    expectedLayoutVersion: number,
    dryRun: boolean,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult> {
    const items = dto.placements.length + dto.elements.length;
    if (items > PLAN_LIMITS.maxItemsPerReplace) {
      throw tooManyItems(items, PLAN_LIMITS.maxItemsPerReplace);
    }
    const delta: LayoutDelta = {
      placements: dto.placements.map(toPlacementUpsert),
      elements: dto.elements.map(toElementUpsert),
      removeSpaceIds: [],
      removeElementIds: [],
      cascade: false,
    };
    return this.execute(
      planId,
      {
        mode: 'REPLACE',
        delta,
        expectedLayoutVersion,
        dryRun,
        confirmRemoval: dto.confirmRemoval === true,
        replaceSpaceIds: new Set(dto.placements.map((p) => p.spaceId)),
        replaceElementIds: new Set(dto.elements.map((e) => e.id)),
      },
      ctx,
    );
  }

  // ---------------------------------------------------------- operaciones sueltas

  /** `POST /floor-plans/:id/placements`. */
  async createPlacement(
    planId: string,
    dto: CreatePlacementDto,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult & { placementId: string | null }> {
    const result = await this.execute(
      planId,
      {
        mode: 'SINGLE',
        delta: {
          placements: [toPlacementUpsert(dto)],
          elements: [],
          removeSpaceIds: [],
          removeElementIds: [],
          cascade: false,
        },
        dryRun: false,
      },
      ctx,
    );
    return { ...result, placementId: await this.placementIdOf(dto.spaceId) };
  }

  /** `PATCH /space-placements/:id` (`If-Match: rowVersion` de la ubicación). */
  async updatePlacement(
    placementId: string,
    dto: UpdatePlacementDto,
    expectedRowVersion: number,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult> {
    const target = await this.findPlacement(placementId);
    return this.execute(
      target.planId,
      {
        mode: 'SINGLE',
        delta: {
          placements: [
            {
              spaceId: target.spaceId,
              geometry: dto.geometry ?? target.geometry,
              zOrder: dto.zOrder,
              locked: dto.locked,
              expectedRowVersion,
            },
          ],
          elements: [],
          removeSpaceIds: [],
          removeElementIds: [],
          cascade: false,
        },
        dryRun: false,
      },
      ctx,
    );
  }

  /** `DELETE /space-placements/:id` (`If-Match: rowVersion`; `cascade` quita los hijos dibujados). */
  async deletePlacement(
    placementId: string,
    expectedRowVersion: number,
    cascade: boolean,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult> {
    const target = await this.findPlacement(placementId);
    if (target.rowVersion !== expectedRowVersion) {
      throw new RowVersionMismatchException(target.rowVersion);
    }
    return this.execute(
      target.planId,
      {
        mode: 'SINGLE',
        delta: {
          placements: [],
          elements: [],
          removeSpaceIds: [target.spaceId],
          removeElementIds: [],
          cascade,
        },
        dryRun: false,
      },
      ctx,
    );
  }

  /** `POST /floor-plans/:id/elements`. */
  createElement(
    planId: string,
    dto: CreateElementDto,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult> {
    return this.execute(
      planId,
      {
        mode: 'SINGLE',
        delta: {
          placements: [],
          elements: [toElementUpsert(dto)],
          removeSpaceIds: [],
          removeElementIds: [],
          cascade: false,
        },
        dryRun: false,
      },
      ctx,
    );
  }

  /** `PATCH /plan-elements/:id` (`If-Match: rowVersion`). */
  async updateElement(
    elementId: string,
    dto: UpdateElementDto,
    expectedRowVersion: number,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult> {
    const current = await this.findElement(elementId);
    const merged: ElementUpsert = {
      id: elementId,
      kind: current.kind,
      vertices: dto.vertices ?? current.vertices ?? undefined,
      thicknessM: dto.thicknessM ?? current.thicknessM ?? undefined,
      hostElementId: dto.hostElementId ?? current.hostElementId ?? undefined,
      offsetM: dto.offsetM ?? current.offsetM ?? undefined,
      widthM: dto.widthM ?? current.widthM ?? undefined,
      swing: dto.swing ?? current.swing ?? undefined,
      swingSide: dto.swingSide ?? current.swingSide ?? undefined,
      label: dto.label ?? current.label ?? undefined,
      verticalLinkCode:
        dto.verticalLinkCode ?? current.verticalLinkCode ?? undefined,
      connectsSpaceAId:
        dto.connectsSpaceAId ?? current.connectsSpaceAId ?? undefined,
      connectsSpaceBId:
        dto.connectsSpaceBId ?? current.connectsSpaceBId ?? undefined,
      zOrder: dto.zOrder,
      expectedRowVersion,
    };
    return this.execute(
      current.planId,
      {
        mode: 'SINGLE',
        delta: {
          placements: [],
          elements: [merged],
          removeSpaceIds: [],
          removeElementIds: [],
          cascade: false,
        },
        dryRun: false,
      },
      ctx,
    );
  }

  /** `DELETE /plan-elements/:id` (`If-Match: rowVersion`); quita también lo que aloja. */
  async deleteElement(
    elementId: string,
    expectedRowVersion: number,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult> {
    const current = await this.findElement(elementId);
    if (current.rowVersion !== expectedRowVersion) {
      throw new RowVersionMismatchException(current.rowVersion);
    }
    return this.execute(
      current.planId,
      {
        mode: 'SINGLE',
        delta: {
          placements: [],
          elements: [],
          removeSpaceIds: [],
          removeElementIds: [elementId],
          cascade: false,
        },
        dryRun: false,
      },
      ctx,
    );
  }

  // ------------------------------------------------------------------ motor

  private async execute(
    planId: string,
    request: WriteRequest,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult> {
    try {
      return await this.em.transactional((tx) =>
        this.run(tx, planId, request, ctx),
      );
    } catch (error) {
      if (error instanceof DryRunRollback) return error.result;
      throw error;
    }
  }

  private async run(
    tx: EntityManager,
    planId: string,
    request: WriteRequest,
    ctx: WriteContext,
  ): Promise<LayoutWriteResult> {
    const { actor, correlationId } = ctx;
    const { tenantId, plan, viewer } = await this.context.plan(
      tx,
      planId,
      actor,
      true,
    );
    this.viewers.assertCanEdit(viewer, ctx.supportReason);
    if (plan.retired) {
      throw new ConflictException(
        'El lienzo está clausurado: reabrilo para editarlo',
        undefined,
        FloorPlanReason.PLAN_RETIRED,
      );
    }
    if (
      request.expectedLayoutVersion !== undefined &&
      plan.layoutVersion !== request.expectedLayoutVersion
    ) {
      throw layoutVersionMismatch(
        plan.layoutVersion,
        request.expectedLayoutVersion,
        plan.layoutChangedAt,
      );
    }

    const model = await this.plans.loadWorkingModel(tx, plan.id, tenantId);
    let delta = request.delta;
    if (request.mode === 'REPLACE') {
      const removeSpaceIds = model.placements
        .filter((p) => !request.replaceSpaceIds?.has(p.spaceId))
        .map((p) => p.spaceId);
      const removeElementIds = model.elements
        .filter((e) => !request.replaceElementIds?.has(e.id))
        .map((e) => e.id);
      if (
        (removeSpaceIds.length > 0 || removeElementIds.length > 0) &&
        !request.confirmRemoval
      ) {
        throw new PreconditionFailedException(
          'El reemplazo total quitaría figuras que hoy están dibujadas; confirmalo con `confirmRemoval: true`',
          {
            wouldRemove: {
              spaces: removeSpaceIds.length,
              elements: removeElementIds.length,
            },
          },
          FloorPlanReason.PLAN_REMOVAL_NOT_CONFIRMED,
        );
      }
      delta = { ...delta, removeSpaceIds, removeElementIds, cascade: true };
    }

    // Árbol de los espacios involucrados; lo que no es del tenant no existe.
    const wanted = new Set<string>([
      ...delta.placements.map((p) => p.spaceId),
      ...delta.removeSpaceIds,
      ...model.placements.map((p) => p.spaceId),
    ]);
    for (const element of delta.elements) {
      for (const id of [element.connectsSpaceAId, element.connectsSpaceBId]) {
        if (typeof id === 'string') wanted.add(id);
      }
    }
    const infos = await this.plans.loadSpaceInfos(tx, tenantId, [...wanted]);
    for (const placement of delta.placements) {
      if (!infos.has(placement.spaceId))
        throw practiceOutOfScope('Espacio no encontrado');
    }
    for (const element of delta.elements) {
      for (const id of [element.connectsSpaceAId, element.connectsSpaceBId]) {
        if (typeof id === 'string' && !infos.has(id)) {
          throw practiceOutOfScope('Espacio no encontrado');
        }
      }
    }

    // Un espacio tiene un solo lugar en todo el sistema (INV-PL-07).
    const inThisPlan = new Set(model.placements.map((p) => p.spaceId));
    const elsewhere = await this.plans.placedElsewhere(
      tx,
      tenantId,
      plan.id,
      delta.placements
        .map((p) => p.spaceId)
        .filter((id) => !inThisPlan.has(id)),
    );
    if (elsewhere.length > 0) {
      throw new ConflictException(
        'El espacio ya está dibujado en otro lienzo',
        { conflicts: elsewhere },
        FloorPlanReason.PLAN_SPACE_ALREADY_PLACED,
      );
    }

    const outcome = validateLayoutDelta({
      canvas: {
        widthM: plan.widthM,
        heightM: plan.heightM,
        toleranceM: plan.contactToleranceM,
        anchorSpaceId: plan.anchorSpaceId,
        siteId: plan.siteId,
      },
      spaces: infos,
      currentPlacements: model.placements,
      currentElements: model.elements,
      delta,
    });
    if (outcome.rowVersionConflicts.length > 0) {
      throw new DomainException(
        HttpStatus.PRECONDITION_FAILED,
        ErrorCode.CONCURRENCY_CONFLICT,
        'Otra persona cambió alguno de estos ítems; recargá y volvé a intentar',
        { items: outcome.rowVersionConflicts },
        FloorPlanReason.PLAN_VERSION_MISMATCH,
      );
    }
    if (outcome.errors.length > 0) {
      throw this.invalid(outcome.errors, outcome.omittedErrors, correlationId);
    }

    // INV-PL-12: no se saca del plano lo que tiene pacientes.
    if (outcome.placementsToRemove.length > 0) {
      const occupied = await this.plans.occupiedBedsIn(
        tx,
        tenantId,
        outcome.placementsToRemove.map((p) => p.spaceId),
        CLIN.LOCATION_ACTIVE,
      );
      if (occupied.length > 0) {
        const errors: PlanLayoutError[] = [
          ...new Set(occupied.map((o) => o.rootId)),
        ].map((rootId) => {
          const info = infos.get(rootId);
          return {
            kind: 'SPACE',
            id: rootId,
            code: FloorPlanReason.PLAN_SPACE_OCCUPIED,
            message: `${info ? `${info.code} · ${info.name}` : rootId} tiene camas con pacientes`,
            nextAction: {
              label: 'Trasladar o dar egreso al paciente',
              hint: 'Una cama ocupada no puede quedar invisible en el plano.',
            },
          };
        });
        throw new ConflictException(
          'No se puede sacar del plano un espacio con camas ocupadas',
          { errors, requestId: correlationId ?? null },
          FloorPlanReason.PLAN_SPACE_OCCUPIED,
        );
      }
    }

    const fromVersion = plan.layoutVersion;
    const nothing =
      outcome.placementsToWrite.length === 0 &&
      outcome.placementsToRemove.length === 0 &&
      outcome.elementsToWrite.length === 0 &&
      outcome.elementsToRemove.length === 0;
    if (nothing) {
      const result: LayoutWriteResult = {
        layoutVersion: fromVersion,
        applied: outcome.counts,
        warnings: [],
        requestId: correlationId ?? null,
        ...(request.dryRun ? { dryRun: true } : {}),
      };
      return result;
    }

    await this.write(tx, plan, tenantId, outcome, ctx, infos, model);

    const { version } = await this.plans.layoutVersionOf(tx, plan.id);
    const warnings = await this.layout.areaWarnings(
      tx,
      plan.id,
      outcome.placementsToWrite.map((w) => w.spaceId),
    );
    const result: LayoutWriteResult = {
      layoutVersion: version,
      applied: outcome.counts,
      warnings,
      requestId: correlationId ?? null,
      ...(request.dryRun ? { dryRun: true } : {}),
    };
    if (request.dryRun) throw new DryRunRollback(result);

    const cap = (ids: readonly string[]): string[] =>
      ids.slice(0, LAYOUT_EVENT_ID_CAP);
    const placed = outcome.placementsToWrite
      .filter((w) => w.isNew)
      .map((w) => w.spaceId);
    const moved = outcome.placementsToWrite
      .filter((w) => !w.isNew)
      .map((w) => w.spaceId);
    const removed = outcome.placementsToRemove.map((p) => p.spaceId);
    await this.events.publish(tx, {
      type: PLAN_EVENTS.layoutChanged,
      floorPlanId: plan.id,
      tenantId,
      actorUserId: actor.id,
      correlationId,
      payload: {
        siteId: plan.siteId,
        fromVersion,
        toVersion: version,
        placedSpaceIds: cap(placed),
        movedSpaceIds: cap(moved),
        removedSpaceIds: cap(removed),
        elementsAdded: outcome.elementsToWrite.filter((e) => e.isNew).length,
        elementsChanged: outcome.elementsToWrite.filter((e) => !e.isNew).length,
        elementsRemoved: outcome.elementsToRemove.length,
        truncated:
          placed.length > LAYOUT_EVENT_ID_CAP ||
          moved.length > LAYOUT_EVENT_ID_CAP ||
          removed.length > LAYOUT_EVENT_ID_CAP,
        ...(ctx.supportReason ? { supportReason: ctx.supportReason } : {}),
      },
    });
    return result;
  }

  /** Escribe en el orden del contrato y deja la base verificar. */
  private async write(
    tx: EntityManager,
    plan: PlanRow,
    tenantId: string,
    outcome: ValidationOutcome,
    ctx: WriteContext,
    infos: ReadonlyMap<string, SpaceInfo>,
    current: WorkingModel,
  ): Promise<void> {
    const { actor, correlationId } = ctx;
    const wctx = { tenantId, planId: plan.id, actorUserId: actor.id };
    const placementByPlacementId = new Map(
      current.placements.map((p) => [p.placementId, p]),
    );
    const elementById = new Map(current.elements.map((e) => [e.id, e]));
    try {
      await tx.execute(
        'set constraints practice.ex_space_placements_no_overlap deferred',
      );

      // Historia ANTES de borrar: la revisión final nace cerrada.
      await this.layout.appendHistory(
        tx,
        'plan_elements',
        outcome.elementsToRemove.map((e) => e.id),
        AUD.OPERATION_DELETE,
        actor.id,
        tenantId,
        true,
      );
      await this.layout.appendHistory(
        tx,
        'space_placements',
        outcome.placementsToRemove.map((p) => p.placementId),
        AUD.OPERATION_DELETE,
        actor.id,
        tenantId,
        true,
      );
      await this.layout.deleteElements(
        tx,
        tenantId,
        plan.id,
        outcome.elementsToRemove.map((e) => e.id),
      );
      await this.layout.deletePlacements(
        tx,
        tenantId,
        plan.id,
        outcome.placementsToRemove.map((p) => p.placementId),
      );

      // Ubicaciones: padres antes que hijos (ya vienen ordenadas por profundidad).
      const insertedPlacementIds: string[] = [];
      const updatedPlacementIds: string[] = [];
      for (const write of outcome.placementsToWrite) {
        if (write.placementId === null) {
          const id = randomUUID();
          await this.layout.insertPlacement(tx, wctx, write, id);
          insertedPlacementIds.push(id);
        } else {
          const row = placementByPlacementId.get(write.placementId);
          const ok = await this.layout.updatePlacement(
            tx,
            wctx,
            write,
            row?.rowVersion ?? write.expectedRowVersion ?? 0,
          );
          if (!ok) throw new RowVersionMismatchException();
          updatedPlacementIds.push(write.placementId);
        }
      }
      // Elementos: muros antes que aberturas.
      const insertedElementIds: string[] = [];
      const updatedElementIds: string[] = [];
      for (const write of outcome.elementsToWrite) {
        const row = elementById.get(write.id);
        if (!row) {
          await this.layout.insertElement(tx, wctx, write);
          insertedElementIds.push(write.id);
        } else {
          const ok = await this.layout.updateElement(
            tx,
            wctx,
            write,
            row.rowVersion,
          );
          if (!ok) throw new RowVersionMismatchException();
          updatedElementIds.push(write.id);
        }
      }
      await this.layout.appendHistory(
        tx,
        'space_placements',
        insertedPlacementIds,
        AUD.OPERATION_INSERT,
        actor.id,
        tenantId,
      );
      await this.layout.appendHistory(
        tx,
        'space_placements',
        updatedPlacementIds,
        AUD.OPERATION_UPDATE,
        actor.id,
        tenantId,
      );
      await this.layout.appendHistory(
        tx,
        'plan_elements',
        insertedElementIds,
        AUD.OPERATION_INSERT,
        actor.id,
        tenantId,
      );
      await this.layout.appendHistory(
        tx,
        'plan_elements',
        updatedElementIds,
        AUD.OPERATION_UPDATE,
        actor.id,
        tenantId,
      );

      // Lo que toca la verificación de la base: lo escrito y sus hijos.
      const touched = outcome.placementsToWrite.map((w) => w.spaceId);
      const issues = await this.layout.scopedIssues(tx, plan.id, touched);
      if (issues.length > 0) {
        const errors = issues
          .filter((issue) => issue.severity === 'ERROR')
          .map((issue): PlanLayoutError => {
            const subject = infos.get(issue.subjectId);
            const other = issue.otherId ? infos.get(issue.otherId) : undefined;
            return {
              kind: 'SPACE',
              id: issue.subjectId,
              code:
                issue.code === 'SIBLING_OVERLAP'
                  ? FloorPlanReason.PLAN_SIBLING_OVERLAP
                  : issue.code === 'CHILD_OUTSIDE_PARENT'
                    ? FloorPlanReason.PLAN_CHILD_OUTSIDE_PARENT
                    : FloorPlanReason.PLAN_OUT_OF_BOUNDS,
              field: 'geometry',
              message: `${subject ? `${subject.code} · ${subject.name}` : issue.subjectId}: ${issue.detail}`,
              ...(issue.otherId
                ? {
                    conflictsWith: [
                      {
                        kind: 'SPACE' as const,
                        id: issue.otherId,
                        code: other?.code ?? issue.otherId,
                        name: other?.name ?? '',
                      },
                    ],
                  }
                : {}),
            };
          });
        if (errors.length > 0) {
          throw this.invalid(errors, 0, correlationId, 'database');
        }
      }
      await tx.execute('set constraints all immediate');
    } catch (error) {
      if (error instanceof DomainException) throw error;
      const translation = translatePlanDbError(error);
      if (translation)
        throw planDbException(translation, plan.id, correlationId);
      throw error;
    }
  }

  private invalid(
    errors: PlanLayoutError[],
    omitted: number,
    requestId?: string,
    source: 'validator' | 'database' = 'validator',
  ): DomainException {
    return new PreconditionFailedException(
      errors.length === 1
        ? 'El dibujo no es válido: 1 elemento tiene un error'
        : `El dibujo no es válido: ${errors.length + omitted} elementos tienen un error`,
      { errors, omittedErrors: omitted, requestId: requestId ?? null, source },
      FloorPlanReason.PLAN_LAYOUT_INVALID,
    );
  }

  // --------------------------------------------------------------- búsquedas

  private async findPlacement(placementId: string): Promise<{
    planId: string;
    spaceId: string;
    rowVersion: number;
    geometry: Record<string, unknown>;
  }> {
    return this.em.transactional(async (tx) => {
      const rows = await tx.execute<
        {
          floor_plan_id: string;
          care_space_id: string;
          row_version: number;
          shape_kind: string;
          center_x_m: number | null;
          center_y_m: number | null;
          width_m: number | null;
          depth_m: number | null;
          rotation_deg: number | null;
          vertices: [number, number][];
        }[]
      >(
        `select sp.floor_plan_id, sp.care_space_id, sp.row_version, sp.shape_kind,
                sp.center_x_m::float8 as center_x_m, sp.center_y_m::float8 as center_y_m,
                sp.width_m::float8 as width_m, sp.depth_m::float8 as depth_m,
                sp.rotation_deg::float8 as rotation_deg, sp.vertices
           from practice.space_placements sp where sp.id = ?::uuid and sp.tenant_id = ?::uuid`,
        [placementId, this.tenantId()],
      );
      const row = rows[0];
      if (!row) throw practiceOutOfScope('Ubicación no encontrada');
      return {
        planId: row.floor_plan_id,
        spaceId: row.care_space_id,
        rowVersion: row.row_version,
        geometry:
          row.shape_kind === 'RECT'
            ? {
                kind: 'RECT',
                centerXM: row.center_x_m,
                centerYM: row.center_y_m,
                widthM: row.width_m,
                depthM: row.depth_m,
                rotationDeg: row.rotation_deg,
              }
            : { kind: 'POLYGON', vertices: row.vertices },
      };
    });
  }

  private async findElement(elementId: string): Promise<{
    planId: string;
    kind: string;
    rowVersion: number;
    vertices: [number, number][] | null;
    thicknessM: number | null;
    hostElementId: string | null;
    offsetM: number | null;
    widthM: number | null;
    swing: string | null;
    swingSide: string | null;
    label: string | null;
    verticalLinkCode: string | null;
    connectsSpaceAId: string | null;
    connectsSpaceBId: string | null;
  }> {
    return this.em.transactional(async (tx) => {
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select e.floor_plan_id, e.kind, e.row_version, e.vertices, e.thickness_m::float8 as thickness_m,
                e.host_element_id, e.offset_m::float8 as offset_m, e.width_m::float8 as width_m, e.swing, e.swing_side,
                e.label, e.vertical_link_code, e.connects_space_a_id, e.connects_space_b_id
           from practice.plan_elements e where e.id = ?::uuid and e.tenant_id = ?::uuid`,
        [elementId, this.tenantId()],
      );
      const r = rows[0];
      if (!r) throw practiceOutOfScope('Elemento no encontrado');
      return {
        planId: r.floor_plan_id as string,
        kind: r.kind as string,
        rowVersion: r.row_version as number,
        vertices: (r.vertices as [number, number][] | null) ?? null,
        thicknessM: (r.thickness_m as number | null) ?? null,
        hostElementId: (r.host_element_id as string | null) ?? null,
        offsetM: (r.offset_m as number | null) ?? null,
        widthM: (r.width_m as number | null) ?? null,
        swing: (r.swing as string | null) ?? null,
        swingSide: (r.swing_side as string | null) ?? null,
        label: (r.label as string | null) ?? null,
        verticalLinkCode: (r.vertical_link_code as string | null) ?? null,
        connectsSpaceAId: (r.connects_space_a_id as string | null) ?? null,
        connectsSpaceBId: (r.connects_space_b_id as string | null) ?? null,
      };
    });
  }

  private async placementIdOf(spaceId: string): Promise<string | null> {
    return this.em.transactional(async (tx) => {
      const rows = await tx.execute<{ id: string }[]>(
        `select id from practice.space_placements where care_space_id = ?::uuid and tenant_id = ?::uuid`,
        [spaceId, this.tenantId()],
      );
      return rows[0]?.id ?? null;
    });
  }

  private tenantId(): string {
    return requireTenantId();
  }
}

function toPlacementUpsert(dto: PlacementItemDto): PlacementUpsert {
  return {
    spaceId: dto.spaceId,
    geometry: dto.geometry,
    zOrder: dto.zOrder,
    locked: dto.locked,
    expectedRowVersion: dto.expectedRowVersion,
  };
}

function toElementUpsert(dto: ElementItemDto): ElementUpsert {
  return {
    id: dto.id,
    kind: dto.kind,
    vertices: dto.vertices,
    thicknessM: dto.thicknessM,
    hostElementId: dto.hostElementId,
    offsetM: dto.offsetM,
    widthM: dto.widthM,
    swing: dto.swing,
    swingSide: dto.swingSide,
    label: dto.label,
    verticalLinkCode: dto.verticalLinkCode,
    connectsSpaceAId: dto.connectsSpaceAId,
    connectsSpaceBId: dto.connectsSpaceBId,
    zOrder: dto.zOrder,
    expectedRowVersion: dto.expectedRowVersion,
  };
}

function tooManyItems(items: number, max: number): DomainException {
  return new DomainException(
    HttpStatus.PAYLOAD_TOO_LARGE,
    ErrorCode.PAYLOAD_TOO_LARGE,
    `El guardado trae ${items} ítems y el máximo es ${max}`,
    { items, max },
    FloorPlanReason.PLAN_TOO_MANY_ITEMS,
  );
}
