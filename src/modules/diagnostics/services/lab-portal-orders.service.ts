import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  PreconditionFailedException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { badRequestWithReason } from '../../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../../common/errors/system-error-reasons';
import { CATEGORIES_WITH_SPECIMEN, DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { AccessionSpecimens } from '../entities';
import {
  LAB_PORTAL_PAGE_DEFAULT,
  LabPortalRepository,
  LabWorkRepository,
  SpecimensRepository,
  type LabOrderKey,
} from '../repositories';
import type {
  LabOrderDto,
  LabOrderListQueryDto,
  LabOrderPageDto,
  LabOrderTransitionDto,
} from '../dto/lab-portal-orders.dto';
import { LAB_ORDER_TRANSITIONS } from './lab-portal.projection';
import { notAvailable } from './lab-portal-results.service';
import {
  LabPortalSnapshotService,
  type LabOrderView,
} from './lab-portal-snapshot.service';

export function toOrderDto(view: LabOrderView): LabOrderDto {
  return {
    orderId: view.order.id,
    studyName: view.studyName,
    patientName: view.patientName,
    requesterName: view.requesterName,
    requestedAt: view.order.createdAt.toISOString(),
    status: view.status,
    reason: view.reason,
    // REJECT is recorded against the received specimen: imaging has none.
    canReject:
      LAB_ORDER_TRANSITIONS.REJECT.includes(view.status) &&
      view.openSpecimenIds.length > 0,
    files: view.files
      .filter((file) => file.status === 'AVAILABLE')
      .map((file) => ({
        id: file.fileId,
        fileName: file.meta.fileName,
        sizeBytes: file.meta.sizeBytes,
      })),
  };
}

/** The keyset a page ends with, as an opaque cursor. */
const encodeOrderKey = (key: LabOrderKey): string =>
  encodeKeysetCursor({ createdAt: key.createdAt.toISOString(), id: key.id });

function decodeOrderKey(cursor: string): LabOrderKey {
  const { createdAt, id } = decodeKeysetCursor(cursor);
  const at = typeof createdAt === 'string' ? new Date(createdAt) : null;
  if (!at || Number.isNaN(at.getTime()) || typeof id !== 'string') {
    throw badRequestWithReason(
      'El cursor de paginación no es válido',
      SystemErrorReason.INVALID_CURSOR,
      { parameter: 'cursor' },
    );
  }
  return { createdAt: at, id };
}

const unsupported = (message: string): PreconditionFailedException =>
  new PreconditionFailedException(
    message,
    undefined,
    DiagnosticsErrorReason.DIAGNOSTICS_LAB_ORDER_ACTION_UNSUPPORTED,
  );

/** A per-tenant unique business number (`uk_*_tenant_number`). */
const number = (prefix: string): string =>
  `${prefix}-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

/**
 * Orders routed to the laboratory / imaging center and their steps.
 *
 * - RECEIVE: an accession (`ACC_RECEIVED`) of the performer; for laboratory
 *   orders that declare a specimen type, also the received specimen.
 * - PROCESS: a performer work order with `completed_at` and its test line.
 * - REJECT: a `specimen_rejection_events` row per open specimen, with the
 *   reason in `notes` (same effects as UC-20-02).
 * - CANCEL: not representable — the order belongs to the requester tenant
 *   (`custodian_tenant_id` RLS) and the performer has no row to record a
 *   cancellation with its reason. Answers 422 with a stable reason.
 */
@Injectable()
export class LabPortalOrdersService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: LabPortalRepository,
    private readonly specimens: SpecimensRepository,
    private readonly work: LabWorkRepository,
    private readonly snapshot: LabPortalSnapshotService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LabPortalOrdersService.name);
  }

  /** One keyset page, newest first; `count` is the laboratory's total. */
  async list(
    tenantId: string,
    query: LabOrderListQueryDto = {},
  ): Promise<LabOrderPageDto> {
    const em = this.em.fork();
    const limit = query.limit ?? LAB_PORTAL_PAGE_DEFAULT;
    const after = query.cursor ? decodeOrderKey(query.cursor) : undefined;
    // One row more than asked tells whether an older page exists.
    const [rows, count] = await Promise.all([
      this.repo.findOrders(em, tenantId, { limit: limit + 1, after }),
      this.repo.countOrders(em, tenantId),
    ]);
    const orders = rows.slice(0, limit);
    const snap = await this.snapshot.load(em, tenantId, orders);
    const last = orders[orders.length - 1];
    return {
      items: snap.orders.map(toOrderDto),
      count,
      ...(rows.length > limit && { nextCursor: encodeOrderKey(last) }),
    };
  }

  async transition(
    tenantId: string,
    orderId: string,
    dto: LabOrderTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<LabOrderDto> {
    this.logger.info(
      {
        operation: 'diagnostics.lab-portal.order.transition',
        orderId,
        action: dto.action,
      },
      'Laboratory order step',
    );
    await this.em.transactional(async (tx) => {
      const order = await this.repo.findOrder(tx, tenantId, orderId);
      if (!order) throw notAvailable();
      const [view] = (await this.snapshot.load(tx, tenantId, [order])).orders;
      if (!LAB_ORDER_TRANSITIONS[dto.action].includes(view.status)) {
        throw new ConflictException(
          'La orden no está en un estado que admita ese paso.',
          { currentStatus: view.status },
        );
      }
      if (dto.action === 'RECEIVE')
        await this.receive(tx, tenantId, view, actor);
      if (dto.action === 'PROCESS')
        await this.process(tx, tenantId, view, actor);
      if (dto.action === 'REJECT')
        await this.reject(tx, view, dto.reason, actor);
      if (dto.action === 'CANCEL') {
        throw unsupported(
          'La orden pertenece a quien la pidió: el laboratorio no puede anularla todavía.',
        );
      }
    });
    const order = await this.repo.findOrder(this.em.fork(), tenantId, orderId);
    const [view] = (
      await this.snapshot.load(this.em.fork(), tenantId, [order!])
    ).orders;
    return toOrderDto(view);
  }

  private async receive(
    tx: EntityManager,
    tenantId: string,
    { order }: LabOrderView,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const now = new Date();
    const accession = this.specimens.createAccession(tx, {
      custodianTenantId: tenantId,
      patientProfileId: order.patientProfileId,
      encounterId: order.encounterId,
      serviceRequestId: order.id,
      accessionNumber: number('ACC'),
      receivedAt: now,
      priorityConceptId: DIAG.PRIORITY_ROUTINE,
      statusConceptId: DIAG.ACCESSION_RECEIVED,
      actorUserId: actor.id,
    });
    const isLab = CATEGORIES_WITH_SPECIMEN.includes(
      order.categoryConceptId ?? '',
    );
    if (!isLab || !order.specimenTypeConceptId) {
      await tx.flush();
      return;
    }
    const specimen = this.specimens.createSpecimen(tx, {
      patientProfileId: order.patientProfileId,
      custodianTenantId: tenantId,
      specimenTypeConceptId: order.specimenTypeConceptId,
      statusConceptId: DIAG.SPECIMEN_RECEIVED,
      serviceRequestId: order.id,
      encounterId: order.encounterId,
      actorUserId: actor.id,
    });
    specimen.receivedAt = now;
    await tx.flush();
    this.specimens.addAccessionSpecimen(tx, {
      laboratoryAccessionId: accession.id,
      specimenId: specimen.id,
      sequenceNumber: 1,
      statusConceptId: DIAG.ACCESSION_ITEM_RECEIVED,
    });
    this.specimens.recordCustodyEvent(tx, {
      specimenId: specimen.id,
      custodyEventTypeConceptId: DIAG.CUSTODY_RECEPTION,
      occurredAt: now,
      signedByUserId: actor.id,
    });
    await tx.flush();
  }

  private async process(
    tx: EntityManager,
    tenantId: string,
    { order, accession, openSpecimenIds }: LabOrderView,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const now = new Date();
    const workOrder = this.work.createWorkOrder(tx, {
      custodianTenantId: tenantId,
      laboratoryAccessionId: accession!.id,
      workOrderNumber: number('WO'),
      priorityConceptId: DIAG.PRIORITY_ROUTINE,
      statusConceptId: DIAG.WORK_ORDER_OPEN,
      actorUserId: actor.id,
    });
    workOrder.startedAt = now;
    workOrder.completedAt = now;
    await tx.flush();
    this.work.createWorkOrderTest(tx, {
      laboratoryWorkOrderId: workOrder.id,
      serviceRequestId: order.id,
      testCodeConceptId: order.codeConceptId,
      statusConceptId: DIAG.TEST_PENDING,
      specimenId: openSpecimenIds[0],
      actorUserId: actor.id,
    });
    await tx.flush();
  }

  private async reject(
    tx: EntityManager,
    { accession, openSpecimenIds }: LabOrderView,
    reason: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (openSpecimenIds.length === 0) {
      throw unsupported(
        'La orden no tiene una muestra registrada que se pueda rechazar.',
      );
    }
    const notes = reason?.trim() || undefined;
    const specimens = await this.specimens.findSpecimensByIds(tx, [
      ...openSpecimenIds,
    ]);
    for (const specimen of specimens) {
      this.specimens.recordRejection(tx, {
        specimenId: specimen.id,
        rejectedAt: new Date(),
        rejectionReasonConceptId: DIAG.REJECTION_REASON_QUALITY,
        notes,
      });
      specimen.statusConceptId = DIAG.SPECIMEN_REJECTED;
      touch(specimen, actor.id);
      await this.specimens.cancelTestsForSpecimen(
        tx,
        specimen.id,
        DIAG.TEST_CANCELLED,
      );
    }
    await tx.nativeUpdate(
      AccessionSpecimens,
      {
        laboratoryAccessionId: accession!.id,
        specimenId: { $in: [...openSpecimenIds] },
      },
      { statusConceptId: DIAG.ACCESSION_ITEM_REJECTED },
    );
    await tx.flush();
  }
}
