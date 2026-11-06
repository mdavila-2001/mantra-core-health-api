import { jest } from '@jest/globals';
import { CriticalResultDetectionService } from './critical-result-detection.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const lab = { id: 'lab-user', roles: ['CLINICIAN'] } as any;

function build() {
  // The request transaction (tenant RLS scope) seen through a savepoint.
  const requestTx = { name: 'request-tx' };
  const savepoint = { transactional: mockFn((cb: any) => cb(requestTx)) };
  const em = { fork: mockFn(() => savepoint) };
  const reports = {
    detectCritical: mockFn().mockResolvedValue({ id: 'crit-1', status: 's' }),
  };
  const ordersRepo = {
    findReportById: mockFn().mockResolvedValue({
      id: 'r1',
      serviceRequestId: 'sr1',
    }),
  };
  const refsRepo = {
    findServiceRequest: mockFn().mockResolvedValue({
      id: 'sr1',
      requesterProfileId: 'hp-req',
      createdByUserId: 'creator-user',
      custodianTenantId: 't1',
    }),
    findObservation: mockFn().mockResolvedValue({
      id: 'o1',
      encounterId: 'e1',
      custodianTenantId: 't1',
    }),
    findEncounter: mockFn().mockResolvedValue({
      id: 'e1',
      primaryPractitionerId: 'hp-enc',
    }),
  };
  const accountLinks = {
    findActiveByPerson: mockFn(async (_em: unknown, personId: string) =>
      personId === 'hp-req' || personId === 'hp-enc'
        ? { userId: `user-of-${personId}` }
        : null,
    ),
  };
  const notifications = {
    emitInApp: mockFn().mockResolvedValue({ suppressed: false }),
  };
  const logger = { setContext: mockFn(), error: mockFn() };
  const service = new CriticalResultDetectionService(
    em as any,
    reports as any,
    ordersRepo as any,
    refsRepo as any,
    accountLinks as any,
    notifications as any,
    logger as any,
  );
  return {
    service,
    em,
    requestTx,
    reports,
    refsRepo,
    accountLinks,
    notifications,
    logger,
  };
}

describe('CriticalResultDetectionService (UC-20-09 notice)', () => {
  it('notifies the practitioner who ordered the study, CLINICAL, to the critical result', async () => {
    const d = build();
    const dto = {
      observationId: 'o1',
      patientProfileId: 'p1',
      diagnosticReportId: 'r1',
    };

    const res = await d.service.detect(dto, lab);

    expect(d.reports.detectCritical).toHaveBeenCalledWith(dto, lab);
    expect(res).toEqual({ id: 'crit-1', status: 's' });
    expect(d.notifications.emitInApp).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'user-of-hp-req',
        category: 'CLINICAL',
        destination: { type: 'CRITICAL_RESULT', id: 'crit-1' },
        tenantId: 't1',
        debounceKey: 'diagnostics:critical:crit-1',
        actorUserId: 'lab-user',
      }),
    );
  });

  it('without a report, falls back to the encounter primary practitioner', async () => {
    const d = build();
    await d.service.detect(
      { observationId: 'o1', patientProfileId: 'p1' },
      lab,
    );

    expect(d.notifications.emitInApp).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: 'user-of-hp-enc' }),
    );
  });

  it('reads inside the request transaction (tenant RLS), never a detached fork', async () => {
    const d = build();
    await d.service.detect(
      { observationId: 'o1', patientProfileId: 'p1', diagnosticReportId: 'r1' },
      lab,
    );

    expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
    expect(d.em.fork).not.toHaveBeenCalledWith({
      keepTransactionContext: false,
    });
    expect(d.refsRepo.findServiceRequest).toHaveBeenCalledWith(
      d.requestTx,
      'sr1',
    );
    expect(d.accountLinks.findActiveByPerson).toHaveBeenCalledWith(
      d.requestTx,
      'hp-req',
    );
  });

  it('a requester without account falls back to the encounter practitioner, never the order creator', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockImplementation(
      async (_em: unknown, personId: string) =>
        personId === 'hp-enc' ? { userId: 'user-of-hp-enc' } : null,
    );
    await d.service.detect(
      { observationId: 'o1', patientProfileId: 'p1', diagnosticReportId: 'r1' },
      lab,
    );

    expect(d.notifications.emitInApp).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'user-of-hp-enc',
        tenantId: 't1',
      }),
    );
  });

  it('no linked clinician: no notice (the order creator may be admin staff)', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockResolvedValue(null);
    await d.service.detect(
      { observationId: 'o1', patientProfileId: 'p1', diagnosticReportId: 'r1' },
      lab,
    );

    expect(d.notifications.emitInApp).not.toHaveBeenCalled();
  });

  it('does not notify the actor about their own detection', async () => {
    const d = build();
    await d.service.detect(
      { observationId: 'o1', patientProfileId: 'p1', diagnosticReportId: 'r1' },
      { id: 'user-of-hp-req', roles: ['PRACTITIONER'] } as any,
    );

    expect(d.notifications.emitInApp).not.toHaveBeenCalled();
  });

  it('a failing lookup never fails the recorded critical result', async () => {
    const d = build();
    d.refsRepo.findObservation.mockRejectedValue(new Error('db down'));

    await expect(
      d.service.detect({ observationId: 'o1', patientProfileId: 'p1' }, lab),
    ).resolves.toEqual({ id: 'crit-1', status: 's' });
    expect(d.logger.error).toHaveBeenCalled();
  });

  it('a failed detection emits nothing', async () => {
    const d = build();
    d.reports.detectCritical.mockRejectedValue(new Error('conflict'));

    await expect(
      d.service.detect({ observationId: 'o1', patientProfileId: 'p1' }, lab),
    ).rejects.toThrow('conflict');
    expect(d.notifications.emitInApp).not.toHaveBeenCalled();
  });
});
