import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import type {
  AvailabilityDto,
  BlocksQueryDto,
  CancelBlockDto,
  EndBlockDto,
  HygieneDto,
  IsolationDto,
  StatusEventsQueryDto,
} from '../dto/care-space-ops.dto';
import type {
  AvailabilityResult,
  BedBoardCell,
  BlockActionResult,
  CareSpaceBlockView,
  HygieneResult,
  IsolationResult,
  OperationalStateView,
  StatusEventPage,
} from '../dto/care-space-ops.types';
import { FORMS, FUNCTIONS } from '../infrastructure-catalog';
import { assertOpsVersion } from '../http/ops-version';
import {
  AVAILABILITY,
  AXES,
  BLOCK_KINDS,
  BLOCK_REASONS,
  BLOCK_REASON_KINDS,
  HYGIENE,
  ISOLATION,
  OCCUPANCY,
  STATUS_SOURCES,
  axisCodes,
  conceptIdOf,
  hasOperationalState,
  type BlockKindCode,
} from '../ops-catalog';
import { OpsErrorReason } from '../practice-ops.error-reasons';
import { PRAC } from '../practice.concepts';
import {
  CareSpaceBlocksService,
  toBlockView,
} from './care-space-blocks.service';
import { CleaningOrdersService, toOrderView } from './cleaning-orders.service';
import {
  InfrastructureAccessService,
  type InfraGrant,
} from './infrastructure-access.service';
import { OpsRecorder, type OpsContext } from './ops-recorder';
import { OpsSettingsReader, type InfraSettings } from './ops-settings';
import {
  ORDER_COLUMNS,
  isoOrNull,
  toOrderRow,
  type SpaceOpsRow,
  SPACE_OPS_COLUMNS,
  toSpaceOpsRow,
  str,
  strOrNull,
} from './ops-rows';
import {
  CLINICAL_TEXT_ROLES,
  isClinicalText,
  visibleText,
} from './ops-privacy';
import { OpsStateService, isLifecycleActive } from './ops-state';
import { practiceOutOfScope } from './practice-scope';
import { ref } from './structure-mapper';

/** Acción de la política que corresponde a cada tipo de bloqueo. */
function permissionFor(kind: BlockKindCode): string {
  switch (kind) {
    case 'BLOCK_CLINICAL':
      return 'infra.block.clinical';
    case 'BLOCK_MAINTENANCE':
      return 'infra.block.maintenance';
    default:
      return 'infra.block.admin';
  }
}

/** Tipo de bloqueo que corresponde a una disponibilidad (espacios cerrados antes del modelo no tienen bloqueo). */
const KIND_OF_AVAILABILITY: Readonly<Record<string, BlockKindCode>> = {
  SPACE_OP_BLOCKED_CLINICAL: 'BLOCK_CLINICAL',
  SPACE_OP_BLOCKED_ADMIN: 'BLOCK_ADMIN',
  SPACE_OP_MAINTENANCE: 'BLOCK_MAINTENANCE',
  SPACE_OP_CLOSED: 'BLOCK_CLOSURE',
};

/**
 * Operación de un espacio: disponibilidad (bloqueos y mantenimiento), higiene,
 * aislamiento, ficha operativa e historial A20 (CONTRATO-F2-F5 §F2.3).
 *
 * Todas las mutaciones corren en **una** transacción con el espacio bloqueado
 * (`FOR UPDATE`), exigen `If-Match-Ops` (412 si la versión operativa cambió) y dejan
 * su evento A20, su historia y su outbox. Quién puede qué lo decide
 * `InfrastructureAccessService`; el resto son reglas de negocio con su `reason`.
 */
@Injectable()
export class CareSpaceOpsService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Evaluador de roles y alcance.
   * @param state - Lectura del estado operativo.
   * @param recorder - Escritura de ejes y eventos A20.
   * @param blocks - Ciclo de vida de los bloqueos.
   * @param cleaning - Órdenes de limpieza.
   * @param settings - Configuración `infra.*`.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly state: OpsStateService,
    private readonly recorder: OpsRecorder,
    private readonly blocks: CareSpaceBlocksService,
    private readonly cleaning: CleaningOrdersService,
    private readonly settings: OpsSettingsReader,
  ) {}

  // ------------------------------------------------------------------ lecturas

  /**
   * `GET /care-spaces/:id/operational-state`: la celda con sus ejes, los bloqueos
   * abiertos y la orden de limpieza abierta.
   */
  async operationalState(
    spaceId: string,
    actor: AuthenticatedUser,
  ): Promise<OperationalStateView> {
    return this.em.transactional(async (tx) => {
      const grant = await this.access.assertCan(
        actor,
        'infra.board.view',
        { careSpaceId: spaceId },
        tx,
      );
      const row = await this.state.loadSpace(tx, grant.tenantId, spaceId);
      const now = new Date();
      const [cell] = await this.cellsOf(tx, grant, [row], now);
      const open = await this.blocks.list(tx, grant.tenantId, spaceId, false);
      const orderRows = await tx.execute<Record<string, unknown>[]>(
        `select ${ORDER_COLUMNS} from practice.cleaning_orders o
          where o.care_space_id = ? and o.tenant_id = ? and o.status_concept_id in (?, ?, ?)`,
        [
          spaceId,
          grant.tenantId,
          PRAC.CLN_PENDING,
          PRAC.CLN_IN_PROGRESS,
          PRAC.CLN_DONE,
        ],
      );
      return {
        cell,
        openBlocks: open.map((block) =>
          toBlockView(
            block,
            cell.availability.code,
            now,
            this.access.hasRole(grant, ...CLINICAL_TEXT_ROLES),
          ),
        ),
        openCleaningOrder: orderRows.length
          ? toOrderView(toOrderRow(orderRows[0]), row.code, row.name, now)
          : null,
      };
    });
  }

  /** `GET /care-spaces/:id/blocks?includeEnded`. */
  async listBlocks(
    spaceId: string,
    query: BlocksQueryDto,
    actor: AuthenticatedUser,
  ): Promise<CareSpaceBlockView[]> {
    return this.em.transactional(async (tx) => {
      const grant = await this.access.assertCan(
        actor,
        'infra.board.view',
        { careSpaceId: spaceId },
        tx,
      );
      const row = await this.state.loadSpace(tx, grant.tenantId, spaceId);
      const now = new Date();
      const availability = axisCodes({
        operationalStatusConceptId: row.operationalStatusConceptId,
      }).availability;
      const blocks = await this.blocks.list(
        tx,
        grant.tenantId,
        spaceId,
        query.includeEnded === 'true',
      );
      return blocks.map((block) =>
        toBlockView(
          block,
          availability,
          now,
          this.access.hasRole(grant, ...CLINICAL_TEXT_ROLES),
        ),
      );
    });
  }

  /** `GET /care-spaces/:id/status-events`: el historial A20, del más reciente al más viejo. */
  async statusEvents(
    spaceId: string,
    query: StatusEventsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<StatusEventPage> {
    return this.em.transactional(async (tx) => {
      const grant = await this.access.assertCan(
        actor,
        'infra.events.view',
        { careSpaceId: spaceId },
        tx,
      );
      const limit = query.limit ?? 50;
      const params: unknown[] = [spaceId, grant.tenantId];
      let where = 'e.care_space_id = ? and e.tenant_id = ?';
      if (query.axis) {
        const axis = AXES.byInput(query.axis);
        if (!axis) {
          throw new PreconditionFailedException(
            'Eje inválido',
            { field: 'axis', accepted: AXES.codes() },
            OpsErrorReason.OPS_CODE_INVALID,
          );
        }
        where += ' and e.axis_concept_id = ?';
        params.push(axis.id);
      }
      if (query.from) {
        where += ' and e.occurred_at >= ?';
        params.push(new Date(query.from));
      }
      if (query.to) {
        where += ' and e.occurred_at <= ?';
        params.push(new Date(query.to));
      }
      const after = decodeKeyset(query.cursor);
      if (after) {
        where += ' and (e.occurred_at, e.id) < (?::timestamptz, ?::uuid)';
        params.push(after.t, after.id);
      }
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select e.id, e.care_space_id, e.axis_concept_id, e.from_concept_id, e.to_concept_id,
                e.reason_concept_id, e.reason_text, e.expected_until, e.v2_0116_code,
                e.source_concept_id, e.source_ref_id, e.occurred_at, e.recorded_by_user_id, e.request_id
           from practice.care_space_status_events e
          where ${where}
          order by e.occurred_at desc, e.id desc
          limit ?`,
        [...params, limit + 1],
      );
      const clinical = this.access.hasRole(grant, ...CLINICAL_TEXT_ROLES);
      const page = rows.slice(0, limit);
      const items = page.map((raw) => {
        const axis = AXES.byConceptId(str(raw.axis_concept_id));
        const toId = str(raw.to_concept_id);
        const fromId = strOrNull(raw.from_concept_id);
        const lookup = (id: string | null) =>
          id
            ? ref(
                AVAILABILITY.byConceptId(id) ??
                  HYGIENE.byConceptId(id) ??
                  ISOLATION.byConceptId(id) ??
                  OCCUPANCY.byConceptId(id),
              )
            : null;
        const reasonEntry = BLOCK_REASONS.byConceptId(
          strOrNull(raw.reason_concept_id),
        );
        return {
          id: str(raw.id),
          careSpaceId: str(raw.care_space_id),
          axis: ref(axis),
          from: lookup(fromId),
          to: lookup(toId),
          reason: ref(
            BLOCK_REASONS.byConceptId(strOrNull(raw.reason_concept_id)),
          ),
          reasonText: visibleText(
            strOrNull(raw.reason_text),
            isClinicalText(axis?.code, reasonEntry?.code),
            clinical,
          ),
          expectedUntil: isoOrNull(
            raw.expected_until ? new Date(str(raw.expected_until)) : null,
          ),
          v2Code: str(raw.v2_0116_code),
          source: ref(STATUS_SOURCES.byConceptId(str(raw.source_concept_id))),
          sourceRefId: strOrNull(raw.source_ref_id),
          occurredAt: new Date(str(raw.occurred_at)).toISOString(),
          recordedByUserId: raw.recorded_by_user_id
            ? str(raw.recorded_by_user_id)
            : null,
          requestId: strOrNull(raw.request_id),
        };
      });
      const last = page[page.length - 1];
      return {
        items,
        nextCursor:
          rows.length > limit && last
            ? encodeKeyset(new Date(str(last.occurred_at)), str(last.id))
            : null,
      };
    });
  }

  // ------------------------------------------------------------- disponibilidad

  /**
   * `POST /care-spaces/:id/availability`: bloquear, desbloquear, iniciar
   * mantenimiento, cerrar o reabrir.
   *
   * - bloquear exige motivo; mantenimiento, además, la fecha estimada;
   * - no se bloquea ni se cierra una cama ocupada o reservada;
   * - los compromisos futuros en la ventana (cirugías, citas) frenan con la lista
   *   salvo `acknowledgeConflicts`;
   * - con `startsAt` futuro el bloqueo queda programado y `blocks-tick` lo aplica.
   *
   * @param spaceId - Espacio.
   * @param dto - Acción y datos del bloqueo.
   * @param expectedOpsVersion - `If-Match-Ops`.
   * @param actor - Quien lo hace.
   * @param requestId - Id de correlación.
   */
  async changeAvailability(
    spaceId: string,
    dto: AvailabilityDto,
    expectedOpsVersion: number,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<AvailabilityResult> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const row = await this.state.loadSpace(tx, tenantId, spaceId, true);
      const now = new Date();
      const ending = dto.action === 'unblock' || dto.action === 'reopen';

      // Qué bloqueo y, por él, qué permiso se exige.
      const open = ending
        ? await this.blocks.currentOpen(tx, tenantId, spaceId, now)
        : null;
      const kind = ending
        ? this.kindToEnd(row, open, dto.action as 'unblock' | 'reopen')
        : this.kindToStart(dto);
      const grant = await this.access.assertCan(
        actor,
        permissionFor(kind),
        { careSpaceId: spaceId },
        tx,
      );
      assertOpsVersion(row.opsVersion, expectedOpsVersion);
      const ctx = this.context(
        tenantId,
        actor,
        requestId,
        grant,
        `AVAILABILITY_${dto.action.toUpperCase().replace('-', '_')}`,
      );

      if (ending) {
        const ended = open
          ? await this.blocks.end(tx, row, open, dto.endNote?.trim() || null, {
              ...ctx,
              now,
            })
          : null;
        let updated = ended?.result?.row ?? row;
        if (!open) {
          // Espacio cerrado o bloqueado antes del modelo: no hay bloqueo que terminar.
          const direct = await this.recorder.applyChange(
            tx,
            row,
            {
              availability: {
                to: 'SPACE_OP_AVAILABLE',
                reasonConceptId: null,
                expectedUntil: null,
                reasonText: dto.endNote?.trim() || null,
              },
            },
            { ...ctx, source: 'SRC_MANUAL', now },
          );
          updated = direct.row;
        }
        await tx.flush();
        const [cell] = await this.cellsOf(tx, grant, [updated], now);
        return { cell, blockId: open?.id ?? null, conflicts: [] };
      }

      this.assertOperable(row, now);
      const input = this.newBlock(dto, kind, now);
      const created = await this.blocks.create(
        tx,
        row,
        {
          ...input,
          acknowledgeConflicts: dto.acknowledgeConflicts === true,
          checkCommitments: true,
        },
        { ...ctx, now },
      );
      await tx.flush();
      const [cell] = await this.cellsOf(
        tx,
        grant,
        [created.result?.row ?? row],
        now,
      );
      return { cell, blockId: created.block.id, conflicts: created.conflicts };
    });
  }

  /** `POST /care-space-blocks/:id/end`: termina el bloqueo vigente. */
  async endBlock(
    blockId: string,
    dto: EndBlockDto,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<BlockActionResult> {
    return this.closeBlock(
      blockId,
      actor,
      requestId,
      'BLOCK_ENDED',
      async (tx, row, block, ctx) =>
        this.blocks.end(tx, row, block, dto.note?.trim() || null, ctx),
    );
  }

  /** `POST /care-space-blocks/:id/cancel`: cancela el bloqueo (programado o vigente) con motivo. */
  async cancelBlock(
    blockId: string,
    dto: CancelBlockDto,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<BlockActionResult> {
    const reason = dto.reason?.trim();
    if (!reason) {
      throw new PreconditionFailedException(
        'Cancelar un bloqueo exige el motivo',
        { blockId },
        OpsErrorReason.BLOCK_REASON_REQUIRED,
      );
    }
    return this.closeBlock(
      blockId,
      actor,
      requestId,
      'BLOCK_CANCELLED',
      async (tx, row, block, ctx) =>
        this.blocks.cancel(tx, row, block, reason, ctx),
    );
  }

  // ------------------------------------------------------------------- higiene

  /**
   * `POST /care-spaces/:id/hygiene`: marcar sucia o contaminada. Las dos abren una
   * orden de limpieza; sucia con una orden abierta es 409, contaminada la **sube** a
   * terminal en lugar de fallar.
   */
  async changeHygiene(
    spaceId: string,
    dto: HygieneDto,
    expectedOpsVersion: number,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<HygieneResult> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const row = await this.state.loadSpace(tx, tenantId, spaceId, true);
      const contaminated = dto.action === 'mark-contaminated';
      const grant = await this.access.assertCan(
        actor,
        contaminated
          ? 'infra.hygiene.mark-contaminated'
          : 'infra.hygiene.mark-dirty',
        { careSpaceId: spaceId },
        tx,
      );
      const reason = dto.reasonText?.trim();
      if (!reason) {
        throw new PreconditionFailedException(
          'Marcar el estado de higiene exige el motivo',
          { action: dto.action },
          OpsErrorReason.HYGIENE_REASON_REQUIRED,
        );
      }
      const now = new Date();
      this.assertOperable(row, now);
      assertOpsVersion(row.opsVersion, expectedOpsVersion);
      const ctx = this.context(
        tenantId,
        actor,
        requestId,
        grant,
        contaminated
          ? ('HYGIENE_MARK_CONTAMINATED' as const)
          : ('HYGIENE_MARK_DIRTY' as const),
      );
      const opened = await this.cleaning.openOrder(
        tx,
        row,
        contaminated
          ? {
              typeCode: 'CLEAN_TERMINAL',
              triggerCode: 'CLN_TRG_CONTAMINATION',
              priorityCode: 'CLN_PRIO_URGENT',
              terminal: true,
              hygiene: 'HYG_CONTAMINATED',
              note: reason,
            }
          : {
              typeCode: 'CLEAN_SPOT',
              triggerCode: 'CLN_TRG_MANUAL',
              priorityCode: 'CLN_PRIO_ROUTINE',
              note: reason,
              failIfOpen: true,
            },
        { ...ctx, source: 'SRC_MANUAL', now },
      );
      await tx.flush();
      const [cell] = await this.cellsOf(tx, grant, [opened.result.row], now);
      return { cell, cleaningOrderId: opened.order.id };
    });
  }

  // -------------------------------------------------------------- aislamiento

  /**
   * `POST /care-spaces/:id/isolation`: marcar o levantar el aislamiento.
   *
   * - el aéreo exige un local AIIR con presión negativa y validación HVAC vigente
   *   (422 `ISOLATION_ROOM_NOT_CAPABLE` con `details.missing`); el protector, ambiente
   *   protector con presión positiva;
   * - en una habitación compartida las camas hermanas **libres** quedan bloqueadas por
   *   cohorte, salvo cohorte avalada por control de infecciones;
   * - al levantarlo la cama exige limpieza terminal (orden `TERMINAL` y bandera) y se
   *   liberan los bloqueos de cohorte de las hermanas.
   */
  async changeIsolation(
    spaceId: string,
    dto: IsolationDto,
    expectedOpsVersion: number,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<IsolationResult> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      // Se bloquean primero las camas de la habitación en orden de id (evita interbloqueos).
      const room = await tx.execute<{ id: string }[]>(
        `select cs.id from practice.care_spaces cs
          where cs.tenant_id = ? and cs.parent_space_id is not null
            and cs.parent_space_id = (select parent_space_id from practice.care_spaces where id = ? and tenant_id = ?)
          order by cs.id for update`,
        [tenantId, spaceId, tenantId],
      );
      const row = await this.state.loadSpace(tx, tenantId, spaceId, true);
      const grant = await this.access.assertCan(
        actor,
        'infra.isolation.set',
        { careSpaceId: spaceId },
        tx,
      );
      const target = ISOLATION.byInput(dto.isolationCode);
      if (!target) {
        throw new PreconditionFailedException(
          'Código de aislamiento inválido',
          { field: 'isolationCode', accepted: ISOLATION.codes() },
          OpsErrorReason.OPS_CODE_INVALID,
        );
      }
      const isSet = target.code !== 'ISO_NONE';
      const reason = dto.reasonText?.trim() || null;
      if (isSet && !reason) {
        throw new PreconditionFailedException(
          'Aislar exige el motivo clínico',
          { field: 'reasonText' },
          OpsErrorReason.ISOLATION_REASON_REQUIRED,
        );
      }
      const organism = isSet ? dto.organismText?.trim() || null : null;
      const cohort = isSet && dto.cohortApproved === true;
      if (cohort) {
        if (!this.access.hasRole(grant, 'INFECTION_CONTROL')) {
          throw new InsufficientRoleException(
            'La cohorte la avala control de infecciones',
            { requiredRoles: ['INFECTION_CONTROL'] },
            OpsErrorReason.ISOLATION_COHORT_REQUIRES_APPROVAL,
          );
        }
        if (!organism) {
          throw new PreconditionFailedException(
            'Una cohorte avalada exige el organismo',
            { field: 'organismText' },
            OpsErrorReason.ISOLATION_ORGANISM_REQUIRED,
          );
        }
      }
      const now = new Date();
      this.assertOperable(row, now);
      assertOpsVersion(row.opsVersion, expectedOpsVersion);
      const settings = await this.settings.forSite(tx, row.practiceSiteId);
      if (isSet)
        await this.assertRoomCapable(tx, row, target.code, settings, now);

      const ctx: OpsContext = {
        ...this.context(
          tenantId,
          actor,
          requestId,
          grant,
          isSet ? 'ISOLATION_SET' : 'ISOLATION_LIFTED',
        ),
        source: 'SRC_MANUAL',
        now,
      };
      const hadIsolation =
        axisCodes({ isolationConceptId: row.isolationConceptId }).isolation !==
        'ISO_NONE';
      const companions: { careSpaceId: string; blockId: string }[] = [];
      let updated: SpaceOpsRow;

      if (isSet) {
        const applied = await this.recorder.applyChange(
          tx,
          row,
          {
            isolation: {
              to: target.code as 'ISO_CONTACT',
              organismText: organism,
              reasonText: reason,
            },
          },
          ctx,
        );
        updated = applied.row;
        if (!cohort)
          companions.push(
            ...(await this.blockSiblings(tx, updated, room, ctx)),
          );
      } else {
        if (!hadIsolation) {
          const unchanged = await this.recorder.applyChange(
            tx,
            row,
            { isolation: { to: 'ISO_NONE', organismText: null } },
            ctx,
          );
          updated = unchanged.row;
        } else {
          const occupancy = (await this.state.stateOf(tx, row, now)).occupancy;
          const none = {
            to: 'ISO_NONE' as const,
            organismText: null,
            reasonText: reason,
          };
          if (occupancy === 'OCC_FREE') {
            updated = (
              await this.cleaning.openOrder(
                tx,
                row,
                {
                  typeCode: 'CLEAN_TERMINAL',
                  triggerCode: 'CLN_TRG_ISOLATION_END',
                  priorityCode: 'CLN_PRIO_ROUTINE',
                  terminal: true,
                  note: 'Fin del aislamiento',
                },
                { ...ctx, source: 'SRC_MANUAL' },
                { isolation: none },
              )
            ).result.row;
          } else {
            // Con el paciente todavía en la cama sólo queda la bandera: la orden se abre al egreso.
            updated = (
              await this.recorder.applyChange(
                tx,
                row,
                { isolation: none, terminalCleaningRequired: true },
                ctx,
              )
            ).row;
          }
          companions.push(
            ...(await this.releaseSiblings(tx, updated, room, ctx)),
          );
        }
      }
      await tx.flush();
      const [cell] = await this.cellsOf(tx, grant, [updated], now);
      return { cell, companionBlocks: companions };
    });
  }

  // ---------------------------------------------------------------- auxiliares

  /** Termina o cancela un bloqueo cargado por id (comparte permisos, bloqueo y respuesta). */
  private async closeBlock(
    blockId: string,
    actor: AuthenticatedUser,
    requestId: string | undefined,
    action: string,
    run: (
      tx: EntityManager,
      row: SpaceOpsRow,
      block: NonNullable<Awaited<ReturnType<CareSpaceBlocksService['find']>>>,
      ctx: OpsContext,
    ) => Promise<{
      block: Parameters<typeof toBlockView>[0];
      result: { row: SpaceOpsRow } | null;
      cleaningOrderId: string | null;
    }>,
  ): Promise<BlockActionResult> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const peek = await this.blocks.find(tx, tenantId, blockId);
      if (!peek) throw practiceOutOfScope('Bloqueo no encontrado');
      // Primero el espacio, después el bloqueo: el mismo orden de bloqueo que las demás operaciones.
      const row = await this.state.loadSpace(
        tx,
        tenantId,
        peek.careSpaceId,
        true,
      );
      const block = (await this.blocks.find(tx, tenantId, blockId, true))!;
      const kind = BLOCK_KINDS.byConceptId(block.kindConceptId)!
        .code as BlockKindCode;
      const grant = await this.access.assertCan(
        actor,
        permissionFor(kind),
        { careSpaceId: row.id },
        tx,
      );
      const now = new Date();
      const ctx: OpsContext = {
        ...this.context(tenantId, actor, requestId, grant, action),
        now,
      };
      const done = await run(tx, row, block, ctx);
      await tx.flush();
      const updated = done.result?.row ?? row;
      const [cell] = await this.cellsOf(tx, grant, [updated], now);
      return {
        block: toBlockView(
          done.block,
          cell.availability.code,
          now,
          this.access.hasRole(grant, ...CLINICAL_TEXT_ROLES),
        ),
        cell,
        cleaningOrderId: done.cleaningOrderId,
      };
    });
  }

  /** Tipo de bloqueo que se crea con la acción pedida (422 si es incoherente). */
  private kindToStart(dto: AvailabilityDto): BlockKindCode {
    const given = dto.kindCode ? BLOCK_KINDS.byInput(dto.kindCode) : undefined;
    if (dto.kindCode && !given) {
      throw new PreconditionFailedException(
        'Tipo de bloqueo inválido',
        { field: 'kindCode', accepted: BLOCK_KINDS.codes() },
        OpsErrorReason.OPS_CODE_INVALID,
      );
    }
    const forced: BlockKindCode | undefined =
      dto.action === 'start-maintenance'
        ? 'BLOCK_MAINTENANCE'
        : dto.action === 'close'
          ? 'BLOCK_CLOSURE'
          : undefined;
    if (forced) {
      if (given && given.code !== forced) {
        throw new PreconditionFailedException(
          `La acción ${dto.action} corresponde al tipo ${forced}`,
          { action: dto.action, kindCode: given.code },
          OpsErrorReason.AVAILABILITY_ACTION_INVALID,
        );
      }
      return forced;
    }
    if (!given) {
      throw new PreconditionFailedException(
        'Bloquear exige el tipo de bloqueo',
        {
          field: 'kindCode',
          accepted: ['BLOCK_CLINICAL', 'BLOCK_ADMIN', 'BLOCK_MAINTENANCE'],
        },
        OpsErrorReason.AVAILABILITY_ACTION_INVALID,
      );
    }
    if (given.code === 'BLOCK_CLOSURE') {
      throw new PreconditionFailedException(
        'El cierre se pide con la acción close',
        { action: 'close' },
        OpsErrorReason.AVAILABILITY_ACTION_INVALID,
      );
    }
    return given.code as BlockKindCode;
  }

  /** Tipo del bloqueo que se termina, y 422 si la acción no corresponde a él. */
  private kindToEnd(
    row: SpaceOpsRow,
    open: Awaited<ReturnType<CareSpaceBlocksService['currentOpen']>>,
    action: 'unblock' | 'reopen',
  ): BlockKindCode {
    const availability = axisCodes({
      operationalStatusConceptId: row.operationalStatusConceptId,
    }).availability;
    const kind = open
      ? (BLOCK_KINDS.byConceptId(open.kindConceptId)!.code as BlockKindCode)
      : KIND_OF_AVAILABILITY[availability];
    if (!kind) {
      throw new PreconditionFailedException(
        'El espacio no tiene un bloqueo vigente',
        { availability },
        OpsErrorReason.AVAILABILITY_ACTION_INVALID,
      );
    }
    const expected = kind === 'BLOCK_CLOSURE' ? 'reopen' : 'unblock';
    if (action !== expected) {
      throw new PreconditionFailedException(
        `El bloqueo vigente se levanta con la acción ${expected}`,
        { expected, kind },
        OpsErrorReason.AVAILABILITY_ACTION_INVALID,
      );
    }
    return kind;
  }

  /** Valida y arma un bloqueo nuevo a partir del cuerpo. */
  private newBlock(dto: AvailabilityDto, kind: BlockKindCode, now: Date) {
    if (!dto.reasonCode?.trim()) {
      throw new PreconditionFailedException(
        'Todo bloqueo exige un motivo',
        { field: 'reasonCode' },
        OpsErrorReason.BLOCK_REASON_REQUIRED,
      );
    }
    const reason = BLOCK_REASONS.byInput(dto.reasonCode);
    if (!reason) {
      throw new PreconditionFailedException(
        'Motivo de bloqueo inválido',
        { field: 'reasonCode', accepted: BLOCK_REASONS.codes() },
        OpsErrorReason.OPS_CODE_INVALID,
      );
    }
    const text = dto.reasonText?.trim() || null;
    if (reason.code === 'BLOCK_RSN_OTHER' && !text) {
      throw new PreconditionFailedException(
        'El motivo «otro» exige el texto',
        { field: 'reasonText' },
        OpsErrorReason.BLOCK_REASON_TEXT_REQUIRED,
      );
    }
    const expectedEndAt = dto.expectedEndAt
      ? new Date(dto.expectedEndAt)
      : null;
    if (kind === 'BLOCK_MAINTENANCE' && !expectedEndAt) {
      throw new PreconditionFailedException(
        'El mantenimiento exige la fecha estimada de fin',
        { field: 'expectedEndAt' },
        OpsErrorReason.BLOCK_EXPECTED_END_REQUIRED,
      );
    }
    if (!BLOCK_REASON_KINDS[reason.code]?.includes(kind)) {
      throw new PreconditionFailedException(
        'El motivo no corresponde a ese tipo de bloqueo',
        {
          reasonCode: reason.code,
          kind,
          allowedKinds: BLOCK_REASON_KINDS[reason.code],
        },
        OpsErrorReason.BLOCK_REASON_KIND_MISMATCH,
      );
    }
    const requestedStart = dto.startsAt ? new Date(dto.startsAt) : now;
    const startsAt =
      requestedStart.getTime() <= now.getTime() ? now : requestedStart;
    if (expectedEndAt && expectedEndAt.getTime() <= startsAt.getTime()) {
      throw new PreconditionFailedException(
        'La fecha estimada de fin tiene que ser posterior al inicio',
        {
          startsAt: startsAt.toISOString(),
          expectedEndAt: expectedEndAt.toISOString(),
        },
        OpsErrorReason.BLOCK_PERIOD_INVALID,
      );
    }
    return {
      kind,
      reasonConceptId: reason.id,
      reasonText: text,
      startsAt,
      expectedEndAt,
      workOrderRef: dto.workOrderRef?.trim() || null,
    };
  }

  /** 422 si el espacio no tiene estado operativo o no está activo. */
  private assertOperable(row: SpaceOpsRow, now: Date): void {
    if (!hasOperationalState(row.formConceptId)) {
      throw new PreconditionFailedException(
        'Este espacio no tiene estado operativo',
        { careSpaceId: row.id },
        OpsErrorReason.SPACE_NOT_OPERABLE,
      );
    }
    if (!isLifecycleActive(row, now)) {
      throw new PreconditionFailedException(
        'El espacio no está activo',
        { careSpaceId: row.id },
        OpsErrorReason.SPACE_NOT_ACTIVE,
      );
    }
  }

  /** Contexto de la operación para el recorder y los servicios. */
  private context(
    tenantId: string,
    actor: AuthenticatedUser,
    requestId: string | undefined,
    grant: InfraGrant,
    action: string,
  ): OpsContext {
    return {
      tenantId,
      actorUserId: actor.id,
      requestId,
      actingRoles: grant.actingRoles,
      action,
      source: 'SRC_MANUAL',
    };
  }

  /** Celdas de los espacios; el paciente sólo viaja a Enfermería y Admisión. */
  private cellsOf(
    tx: EntityManager,
    grant: InfraGrant,
    rows: readonly SpaceOpsRow[],
    now: Date,
  ): Promise<BedBoardCell[]> {
    const clinical = this.access.hasRole(grant, 'NURSE', 'ADMISSION');
    const clinicalText = this.access.hasRole(grant, ...CLINICAL_TEXT_ROLES);
    return this.state.cells(tx, rows[0].practiceSiteId, rows, {
      now,
      patientVisible: () => clinical,
      clinicalVisible: () => clinicalText,
    });
  }

  /**
   * Un local apto para el aislamiento pedido. Para una cama el «local» es su
   * habitación; para una habitación, ella misma.
   *
   * @throws PreconditionFailedException (422 `ISOLATION_ROOM_NOT_CAPABLE`, `details.missing`).
   */
  private async assertRoomCapable(
    tx: EntityManager,
    row: SpaceOpsRow,
    code: string,
    settings: InfraSettings,
    now: Date,
  ): Promise<void> {
    if (code !== 'ISO_AIRBORNE' && code !== 'ISO_PROTECTIVE') return;
    const isBed = FORMS.byConceptId(row.formConceptId)?.code === 'LOC_FORM_BED';
    let local = row;
    if (isBed && row.parentSpaceId) {
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select ${SPACE_OPS_COLUMNS} from practice.care_spaces cs where cs.id = ? and cs.tenant_id = ?`,
        [row.parentSpaceId, row.tenantId],
      );
      if (rows.length) local = toSpaceOpsRow(rows[0]);
    }
    const fn = FUNCTIONS.byConceptId(local.spaceTypeConceptId)?.code;
    const missing: string[] = [];
    if (code === 'ISO_AIRBORNE') {
      if (fn !== 'SPACE_FN_ISOLATION_AIIR') missing.push('AIIR');
      if (local.pressureConceptId !== PRAC.PRESSURE_NEGATIVE)
        missing.push('NEGATIVE_PRESSURE');
      const validated = local.hvacValidatedOn
        ? new Date(`${local.hvacValidatedOn}T00:00:00Z`)
        : null;
      const ageDays = validated
        ? (now.getTime() - validated.getTime()) / 86_400_000
        : Infinity;
      if (!validated || ageDays > settings.hvacValidationMaxDays)
        missing.push('HVAC_VALIDATION');
      if (
        settings.aiirMinAirChanges !== null &&
        (local.airChangesPerHour === null ||
          local.airChangesPerHour < settings.aiirMinAirChanges)
      )
        missing.push('AIR_CHANGES');
    } else {
      if (fn !== 'SPACE_FN_PROTECTIVE_ENV') missing.push('PROTECTIVE_ENV');
      if (local.pressureConceptId !== PRAC.PRESSURE_POSITIVE)
        missing.push('POSITIVE_PRESSURE');
    }
    if (missing.length > 0) {
      throw new PreconditionFailedException(
        'El local no es apto para este aislamiento',
        { isolationCode: code, missing, localCode: local.code },
        OpsErrorReason.ISOLATION_ROOM_NOT_CAPABLE,
      );
    }
  }

  /** Bloquea por cohorte las camas hermanas libres de una habitación compartida. */
  private async blockSiblings(
    tx: EntityManager,
    row: SpaceOpsRow,
    room: readonly { id: string }[],
    ctx: OpsContext,
  ): Promise<{ careSpaceId: string; blockId: string }[]> {
    const siblingIds = room.map((r) => r.id).filter((id) => id !== row.id);
    if (siblingIds.length === 0) return [];
    const now = ctx.now ?? new Date();
    const siblings = await this.state.loadSpaces(tx, row.tenantId, siblingIds);
    const occupancy = await this.state.occupancyOf(
      tx,
      { spaceIds: siblingIds },
      now,
    );
    const created: { careSpaceId: string; blockId: string }[] = [];
    for (const sibling of siblings.sort((a, b) => a.id.localeCompare(b.id))) {
      if (
        !isLifecycleActive(sibling, now) ||
        !hasOperationalState(sibling.formConceptId)
      )
        continue;
      if (
        axisCodes({
          operationalStatusConceptId: sibling.operationalStatusConceptId,
        }).availability !== 'SPACE_OP_AVAILABLE'
      )
        continue;
      if ((occupancy.get(sibling.id)?.code ?? 'OCC_FREE') !== 'OCC_FREE')
        continue;
      const open = await this.blocks.list(tx, row.tenantId, sibling.id, false);
      if (open.length > 0) continue;
      const block = await this.blocks.create(
        tx,
        sibling,
        {
          kind: 'BLOCK_CLINICAL',
          reasonConceptId: conceptIdOf(
            BLOCK_REASONS,
            'BLOCK_RSN_ISOLATION_COHORT',
          ),
          reasonText: `Aislamiento en ${row.code}`,
          startsAt: now,
          expectedEndAt: null,
          workOrderRef: null,
          acknowledgeConflicts: true,
          checkCommitments: false,
        },
        { ...ctx, action: 'ISOLATION_COHORT_BLOCK' },
      );
      created.push({ careSpaceId: sibling.id, blockId: block.block.id });
    }
    return created;
  }

  /** Libera los bloqueos de cohorte de las hermanas si ya no queda otra cama aislada en la habitación. */
  private async releaseSiblings(
    tx: EntityManager,
    row: SpaceOpsRow,
    room: readonly { id: string }[],
    ctx: OpsContext,
  ): Promise<{ careSpaceId: string; blockId: string }[]> {
    const siblingIds = room.map((r) => r.id).filter((id) => id !== row.id);
    if (siblingIds.length === 0) return [];
    const siblings = await this.state.loadSpaces(tx, row.tenantId, siblingIds);
    const stillIsolated = siblings.some(
      (s) =>
        axisCodes({ isolationConceptId: s.isolationConceptId }).isolation !==
        'ISO_NONE',
    );
    if (stillIsolated) return [];
    const released: { careSpaceId: string; blockId: string }[] = [];
    for (const sibling of siblings.sort((a, b) => a.id.localeCompare(b.id))) {
      const open = await this.blocks.currentOpen(
        tx,
        row.tenantId,
        sibling.id,
        ctx.now ?? new Date(),
      );
      if (!open) continue;
      if (
        open.kindConceptId !== conceptIdOf(BLOCK_KINDS, 'BLOCK_CLINICAL') ||
        open.reasonConceptId !==
          conceptIdOf(BLOCK_REASONS, 'BLOCK_RSN_ISOLATION_COHORT')
      )
        continue;
      await this.blocks.end(
        tx,
        sibling,
        open,
        'Fin del aislamiento de la habitación',
        {
          ...ctx,
          action: 'ISOLATION_COHORT_RELEASE',
        },
      );
      released.push({ careSpaceId: sibling.id, blockId: open.id });
    }
    return released;
  }
}

/** Cursor por clave (fecha del evento e id): estable aunque lleguen eventos nuevos. */
function encodeKeyset(at: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ t: at.toISOString(), id }),
    'utf8',
  ).toString('base64url');
}

function decodeKeyset(
  cursor: string | undefined,
): { t: string; id: string } | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as {
      t?: unknown;
      id?: unknown;
    };
    if (typeof parsed.t === 'string' && typeof parsed.id === 'string') {
      return { t: parsed.t, id: parsed.id };
    }
  } catch {
    // cursor ilegible: se lee la primera página
  }
  return null;
}
