import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { DIAG } from '../diagnostics.concepts';
import { LABP } from '../lab-portal.concepts';
import { AccessionSpecimens } from '../entities';
import {
  LabPortalEventsRepository,
  SpecimensRepository,
} from '../repositories';
import type { LabOrderView } from './lab-portal-snapshot.service';

/** The reason is part of the record: no cancel or reject without it. */
function requiredReason(reason: string | undefined): string {
  const text = reason?.trim();
  if (!text) {
    throw new PreconditionFailedException('Cuente por qué para continuar.');
  }
  return text;
}

/**
 * How the performer (laboratory / imaging center) ends an order it did not
 * issue. The order belongs to the requester tenant and the performer can only
 * read it, so both outcomes are an append-only row of the performer
 * (`service_request_performer_events`) with its reason; the requester's row is
 * never touched. Works the same for laboratory and imaging orders.
 *
 * REJECT also rejects the order's received specimens, when it has any, with the
 * same effects as UC-20-02 (specimen rejected, tests cancelled, accession items
 * rejected).
 */
@Injectable()
export class LabPortalOrderOutcomeService {
  constructor(
    private readonly events: LabPortalEventsRepository,
    private readonly specimens: SpecimensRepository,
  ) {}

  async cancel(
    tx: EntityManager,
    tenantId: string,
    { order }: LabOrderView,
    reason: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<void> {
    this.events.record(tx, {
      serviceRequestId: order.id,
      custodianTenantId: tenantId,
      eventTypeConceptId: LABP.PERFORMER_CANCELLED,
      reasonText: requiredReason(reason),
      actorUserId: actor.id,
    });
    await tx.flush();
  }

  async reject(
    tx: EntityManager,
    tenantId: string,
    { order, accession, openSpecimenIds }: LabOrderView,
    reason: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const notes = requiredReason(reason);
    this.events.record(tx, {
      serviceRequestId: order.id,
      custodianTenantId: tenantId,
      eventTypeConceptId: LABP.PERFORMER_REJECTED,
      reasonText: notes,
      actorUserId: actor.id,
    });
    if (openSpecimenIds.length > 0) {
      await this.rejectSpecimens(
        tx,
        accession!.id,
        openSpecimenIds,
        notes,
        actor,
      );
    }
    await tx.flush();
  }

  private async rejectSpecimens(
    tx: EntityManager,
    accessionId: string,
    specimenIds: readonly string[],
    notes: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const specimens = await this.specimens.findSpecimensByIds(tx, [
      ...specimenIds,
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
        laboratoryAccessionId: accessionId,
        specimenId: { $in: [...specimenIds] },
      },
      { statusConceptId: DIAG.ACCESSION_ITEM_REJECTED },
    );
  }
}
