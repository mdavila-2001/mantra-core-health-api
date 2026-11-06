import { describe, expect, it } from '@jest/globals';
import { PreconditionFailedException } from '../../../common';
import { DIAG } from '../diagnostics.concepts';
import { LABP } from '../lab-portal.concepts';
import { LAB, actor, build, view } from './lab-portal-orders.testing';

describe('LabPortalOrderOutcomeService (through LabPortalOrdersService.transition)', () => {
  it('REJECT: a performer event plus a specimen rejection with the reason, tests cancelled', async () => {
    const t = build(
      view('RECEIVED'),
      view('REJECTED', { reason: 'Hemolizada' }),
    );
    const result = await t.service.transition(
      LAB,
      'sr-1',
      { action: 'REJECT', reason: '  Hemolizada ' },
      actor,
    );
    expect(t.events.record).toHaveBeenCalledWith(expect.anything(), {
      serviceRequestId: 'sr-1',
      custodianTenantId: LAB,
      eventTypeConceptId: LABP.PERFORMER_REJECTED,
      reasonText: 'Hemolizada',
      actorUserId: 'user-1',
    });
    expect(t.specimens.recordRejection).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ specimenId: 'sp-1', notes: 'Hemolizada' }),
    );
    expect(t.specimens.cancelTestsForSpecimen).toHaveBeenCalledWith(
      expect.anything(),
      'sp-1',
      DIAG.TEST_CANCELLED,
    );
    expect(t.tx.nativeUpdate).toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'REJECTED', reason: 'Hemolizada' });
  });

  it('REJECT of an order with no specimen (imaging): only the performer event', async () => {
    const t = build(
      view('RECEIVED', { openSpecimenIds: [], accession: { id: 'acc-1' } }),
      view('REJECTED', { reason: 'Equipo en mantenimiento' }),
    );
    const result = await t.service.transition(
      LAB,
      'sr-1',
      { action: 'REJECT', reason: 'Equipo en mantenimiento' },
      actor,
    );
    expect(t.events.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        eventTypeConceptId: LABP.PERFORMER_REJECTED,
        reasonText: 'Equipo en mantenimiento',
      }),
    );
    expect(t.specimens.recordRejection).not.toHaveBeenCalled();
    expect(result.status).toBe('REJECTED');
  });

  it.each(['DRAFT', 'RECEIVED'])(
    'CANCEL from %s: a performer event, the requester order untouched',
    async (status) => {
      const t = build(
        view(status),
        view('CANCELLED', { reason: 'Paciente no se presentó' }),
      );
      const result = await t.service.transition(
        LAB,
        'sr-1',
        { action: 'CANCEL', reason: 'Paciente no se presentó' },
        actor,
      );
      expect(t.events.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          serviceRequestId: 'sr-1',
          custodianTenantId: LAB,
          eventTypeConceptId: LABP.PERFORMER_CANCELLED,
          reasonText: 'Paciente no se presentó',
        }),
      );
      expect(t.specimens.recordRejection).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        status: 'CANCELLED',
        reason: 'Paciente no se presentó',
      });
    },
  );

  it.each(['CANCEL', 'REJECT'])(
    '%s without a reason is refused and records nothing',
    async (action) => {
      const t = build(view('RECEIVED'));
      const error: any = await t.service
        .transition(LAB, 'sr-1', { action: action as any, reason: '  ' }, actor)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(t.events.record).not.toHaveBeenCalled();
      expect(t.specimens.recordRejection).not.toHaveBeenCalled();
    },
  );
});
