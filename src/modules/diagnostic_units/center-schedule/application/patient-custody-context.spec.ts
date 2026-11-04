import { describe, expect, it, jest } from '@jest/globals';
import { runWithTenant } from '../../../../common';
import {
  actor,
  build,
  ORDER_ID,
  TENANT,
  UNIT_ID,
} from './center-schedule.testing';
import { inPatientCustodyContext } from './patient-custody-context';

const SYSTEM_CONTEXT = "select set_config('app.system_context', 'true', true)";

describe('inPatientCustodyContext', () => {
  it('opens its own transaction and raises the system context before any work', async () => {
    const d = build();
    const fork = jest.spyOn(d.em, 'fork');
    const work = jest.fn(async (tx: unknown) => {
      expect(d.em.execute).toHaveBeenCalledWith(SYSTEM_CONTEXT);
      return tx === d.em ? 'done' : 'wrong tx';
    });
    await expect(
      inPatientCustodyContext(d.em as never, work as never),
    ).resolves.toBe('done');
    expect(fork).toHaveBeenCalledTimes(1);
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('a failing work still propagates its error', async () => {
    const d = build();
    await expect(
      inPatientCustodyContext(d.em as never, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});

describe('booking use cases cross tenants under the system context', () => {
  /** The context is raised before the ownership check reads anything. */
  const raisedBeforeOwnership = (d: ReturnType<typeof build>) => {
    expect(d.em.transactional).toHaveBeenCalled();
    expect(d.em.execute).toHaveBeenCalledWith(SYSTEM_CONTEXT);
    expect((d.em.execute as any).mock.invocationCallOrder[0]).toBeLessThan(
      (d.patients.ownPatientProfileId as any).mock.invocationCallOrder[0],
    );
  };

  it('booking-options', async () => {
    const d = build();
    await d.options.execute(actor, ORDER_ID);
    raisedBeforeOwnership(d);
  });

  it('book', async () => {
    const d = build();
    await d.booker
      .execute(actor, ORDER_ID, {
        unitId: UNIT_ID,
        startAt: new Date().toISOString(),
      })
      .catch(() => undefined);
    raisedBeforeOwnership(d);
  });

  it('cancel', async () => {
    const d = build();
    await d.canceller.execute(actor, ORDER_ID).catch(() => undefined);
    raisedBeforeOwnership(d);
  });

  it('the order is read scoped by the patient profile, never by id alone', async () => {
    const d = build();
    await runWithTenant(TENANT, () => d.options.execute(actor, ORDER_ID));
    const [, orderId, patientProfileId] = (
      d.patients.findDiagnosticOrder as any
    ).mock.calls[0];
    expect(orderId).toBe(ORDER_ID);
    expect(patientProfileId).toBe(
      await d.patients.ownPatientProfileId(d.em, actor.id),
    );
  });
});
