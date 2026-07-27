import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ReportingRunsService } from './reporting-runs.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['REPORTING_ADMIN'] };
const DEFINITION = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';
const EXECUTION = '33333333-3333-3333-3333-333333333333';
const SCHEDULE = '44444444-4444-4444-4444-444444444444';
const CHANNEL = '55555555-5555-5555-5555-555555555555';
const RECIPIENT = '66666666-6666-6666-6666-666666666666';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const runsRepo = {
    createExecution: mockFn(),
    findExecutionById: mockFn(),
    findExecutionForUpdate: mockFn(),
    createSnapshot: mockFn(),
    findSnapshotByExecution: mockFn(),
    findSnapshotByHash: mockFn(),
    createSchedule: mockFn(),
    findScheduleById: mockFn(),
    findDueSchedules: mockFn(),
    findSchedulesByDefinitionForUpdate: mockFn(),
    createDistribution: mockFn(),
    findDistributionsByExecution: mockFn(),
    findDistributionsByExecutionForUpdate: mockFn(),
    createSubscription: mockFn(),
    findSubscription: mockFn(),
    findActiveSubscriptions: mockFn(),
  };
  const definitionsRepo = {
    findDefinitionById: mockFn(),
    findActiveVersion: mockFn(),
    findParametersByDefinition: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ReportingRunsService(
    em as any,
    runsRepo,
    definitionsRepo as any,
    logger as any,
  );
  return { service, tx, runsRepo, definitionsRepo };
}

function activeDefinition(overrides: Record<string, unknown> = {}): any {
  return {
    id: DEFINITION,
    currentVersion: 2,
    stateConceptId: CONCEPTS.REPORT_STATE_ACTIVE,
    defaultOutputFormatConceptId: CONCEPTS.OUTPUT_CSV,
    ...overrides,
  };
}

describe('ReportingRunsService', () => {
  describe('createExecution (UC-39-04)', () => {
    function wire(d: ReturnType<typeof build>, parameters: any[] = []) {
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition(),
      );
      d.definitionsRepo.findActiveVersion.mockResolvedValue({ id: VERSION });
      d.definitionsRepo.findParametersByDefinition.mockResolvedValue(
        parameters,
      );
      d.runsRepo.createExecution.mockReturnValue({ id: EXECUTION });
    }

    it('queues the run against the active version', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createExecution(DEFINITION, {}, actor);

      expect(res).toMatchObject({
        id: EXECUTION,
        reportVersionId: VERSION,
        statusConceptId: CONCEPTS.EXECUTION_QUEUED,
        outputFormatConceptId: CONCEPTS.OUTPUT_CSV,
      });
    });

    it('fills in the declared defaults for parameters that were not sent', async () => {
      const d = build();
      wire(d, [{ code: 'desde', defaultValueJson: '2026-01-01' }]);

      await d.service.createExecution(DEFINITION, {}, actor);

      expect(
        d.runsRepo.createExecution.mock.calls[0][1].parametersJson,
      ).toEqual({
        desde: '2026-01-01',
      });
    });

    it('drops values that the definition does not declare', async () => {
      const d = build();
      wire(d, [{ code: 'desde' }]);

      await d.service.createExecution(
        DEFINITION,
        { parametersJson: { desde: '2026-01-01', inyectado: 'x' } },
        actor,
      );

      expect(
        d.runsRepo.createExecution.mock.calls[0][1].parametersJson,
      ).toEqual({
        desde: '2026-01-01',
      });
    });

    it('refuses a run missing a required parameter', async () => {
      const d = build();
      wire(d, [{ code: 'desde', required: true }]);

      await expect(
        d.service.createExecution(DEFINITION, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('honours the requested output format over the default', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createExecution(
        DEFINITION,
        { outputFormat: 'PDF' as const },
        actor,
      );

      expect(res.outputFormatConceptId).toBe(CONCEPTS.OUTPUT_PDF);
    });

    it('refuses a definition that is not active', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition({ stateConceptId: CONCEPTS.REPORT_DRAFT }),
      );

      await expect(
        d.service.createExecution(DEFINITION, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a definition with no published version', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition(),
      );
      d.definitionsRepo.findActiveVersion.mockResolvedValue(null);

      await expect(
        d.service.createExecution(DEFINITION, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('materializeSnapshot (UC-39-05)', () => {
    const dto = { storageUri: 's3://reports/x.csv', rowCount: 120 };

    function wire(
      d: ReturnType<typeof build>,
      execution: Record<string, unknown> = {},
    ) {
      const exec: any = {
        id: EXECUTION,
        statusConceptId: CONCEPTS.EXECUTION_RUNNING,
        ...execution,
      };
      d.runsRepo.findExecutionForUpdate.mockResolvedValue(exec);
      d.runsRepo.findSnapshotByExecution.mockResolvedValue(null);
      d.runsRepo.createSnapshot.mockReturnValue({ id: 'snap-1' });
      return exec;
    }

    it('records the snapshot and closes the run as succeeded', async () => {
      const d = build();
      const execution = wire(d);

      const res = await d.service.materializeSnapshot(EXECUTION, dto, actor);

      expect(res).toMatchObject({
        id: 'snap-1',
        executionStatusConceptId: CONCEPTS.EXECUTION_SUCCEEDED,
        contentDeduplicated: false,
      });
      expect(execution.statusConceptId).toBe(CONCEPTS.EXECUTION_SUCCEEDED);
      expect(execution.rowCount).toBe('120');
    });

    it('reports deduplication when another snapshot has the same content', async () => {
      const d = build();
      wire(d);
      d.runsRepo.findSnapshotByHash.mockResolvedValue({ id: 'snap-twin' });

      const res = await d.service.materializeSnapshot(
        EXECUTION,
        { ...dto, contentHash: 'abc123' },
        actor,
      );

      expect(res.contentDeduplicated).toBe(true);
    });

    it('sets the retention deadline when it is given', async () => {
      const d = build();
      wire(d);

      const res = await d.service.materializeSnapshot(
        EXECUTION,
        { ...dto, retentionDays: 30 },
        actor,
      );

      expect(res.expiresAt).toEqual(expect.any(String));
    });

    it('rejects materializing an already succeeded run', async () => {
      const d = build();
      wire(d, { statusConceptId: CONCEPTS.EXECUTION_SUCCEEDED });

      await expect(
        d.service.materializeSnapshot(EXECUTION, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to materialize a failed run before retrying it', async () => {
      const d = build();
      wire(d, { statusConceptId: CONCEPTS.EXECUTION_FAILED });

      await expect(
        d.service.materializeSnapshot(EXECUTION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a second snapshot for the same run', async () => {
      const d = build();
      wire(d);
      d.runsRepo.findSnapshotByExecution.mockResolvedValue({ id: 'snap-prev' });

      await expect(
        d.service.materializeSnapshot(EXECUTION, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createSchedule (UC-39-06)', () => {
    const dto = {
      name: 'Mensual',
      cronExpression: '0 6 1 * *',
      outputFormat: 'PDF' as const,
      firstRunAt: '2026-08-01T06:00:00Z',
    };

    it('creates the schedule active with its next run', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition(),
      );
      d.definitionsRepo.findParametersByDefinition.mockResolvedValue([]);
      d.runsRepo.createSchedule.mockReturnValue({ id: SCHEDULE });

      const res = await d.service.createSchedule(DEFINITION, dto, actor);

      expect(res).toMatchObject({
        id: SCHEDULE,
        nextRunAt: '2026-08-01T06:00:00.000Z',
        stateConceptId: CONCEPTS.SCHEDULE_STATE_ACTIVE,
      });
    });

    it('validates the fixed parameters of the schedule', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition(),
      );
      d.definitionsRepo.findParametersByDefinition.mockResolvedValue([
        { code: 'desde', required: true },
      ]);

      await expect(
        d.service.createSchedule(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to schedule a definition that is not active', async () => {
      const d = build();
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition({ stateConceptId: CONCEPTS.REPORT_DRAFT }),
      );

      await expect(
        d.service.createSchedule(DEFINITION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('schedulerTick (UC-39-07)', () => {
    function dueSchedule(overrides: Record<string, unknown> = {}): any {
      return {
        id: SCHEDULE,
        reportDefinitionId: DEFINITION,
        outputFormatConceptId: CONCEPTS.OUTPUT_PDF,
        parametersJson: { desde: '2026-01-01' },
        ...overrides,
      };
    }

    it('queues one execution per due schedule and advances its window', async () => {
      const d = build();
      const schedule = dueSchedule();
      d.runsRepo.findDueSchedules.mockResolvedValue([schedule]);
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition(),
      );
      d.definitionsRepo.findActiveVersion.mockResolvedValue({ id: VERSION });
      d.runsRepo.createExecution.mockReturnValue({ id: EXECUTION });

      const res = await d.service.schedulerTick({}, actor);

      expect(res).toMatchObject({
        scanned: 1,
        queued: 1,
        skipped: 0,
        executionIds: [EXECUTION],
      });
      expect(schedule.lastRunAt).toBeInstanceOf(Date);
      expect(schedule.nextRunAt).toBeInstanceOf(Date);
    });

    it('carries the schedule parameters into the execution', async () => {
      const d = build();
      d.runsRepo.findDueSchedules.mockResolvedValue([dueSchedule()]);
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition(),
      );
      d.definitionsRepo.findActiveVersion.mockResolvedValue({ id: VERSION });
      d.runsRepo.createExecution.mockReturnValue({ id: EXECUTION });

      await d.service.schedulerTick({}, actor);

      expect(d.runsRepo.createExecution).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          parametersJson: { desde: '2026-01-01' },
          triggerConceptId: CONCEPTS.TRIGGER_SCHEDULED,
        }),
      );
    });

    it('skips a schedule whose definition is no longer active but advances it anyway', async () => {
      const d = build();
      const schedule = dueSchedule();
      d.runsRepo.findDueSchedules.mockResolvedValue([schedule]);
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition({ stateConceptId: CONCEPTS.REPORT_DEPRECATED }),
      );

      const res = await d.service.schedulerTick({}, actor);

      expect(res).toMatchObject({ scanned: 1, queued: 0, skipped: 1 });
      expect(schedule.nextRunAt).toBeInstanceOf(Date);
    });

    it('reports an empty tick when nothing is due', async () => {
      const d = build();
      d.runsRepo.findDueSchedules.mockResolvedValue([]);

      const res = await d.service.schedulerTick({}, actor);

      expect(res).toEqual({
        scanned: 0,
        queued: 0,
        skipped: 0,
        executionIds: [],
      });
    });
  });

  describe('dispatchDistributions (UC-39-08)', () => {
    function succeededExecution(overrides: Record<string, unknown> = {}): any {
      return {
        id: EXECUTION,
        statusConceptId: CONCEPTS.EXECUTION_SUCCEEDED,
        scheduleId: SCHEDULE,
        ...overrides,
      };
    }

    it('creates one distribution per active subscriber', async () => {
      const d = build();
      d.runsRepo.findExecutionById.mockResolvedValue(succeededExecution());
      d.runsRepo.findDistributionsByExecution.mockResolvedValue([]);
      d.runsRepo.findActiveSubscriptions.mockResolvedValue([
        { subscriberUserId: RECIPIENT, channelId: CHANNEL },
      ]);
      d.runsRepo.createDistribution.mockReturnValue({ id: 'dist-1' });

      const res = await d.service.dispatchDistributions(EXECUTION, {}, actor);

      expect(res).toMatchObject({
        created: 1,
        skipped: 0,
        distributionIds: ['dist-1'],
      });
      expect(d.runsRepo.createDistribution).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: CONCEPTS.DISTRIBUTION_PENDING,
        }),
      );
    });

    it('does not create a second row for a recipient that already has one', async () => {
      const d = build();
      d.runsRepo.findExecutionById.mockResolvedValue(succeededExecution());
      d.runsRepo.findDistributionsByExecution.mockResolvedValue([
        { recipientUserId: RECIPIENT, channelId: CHANNEL },
      ]);
      d.runsRepo.findActiveSubscriptions.mockResolvedValue([
        { subscriberUserId: RECIPIENT, channelId: CHANNEL },
      ]);

      const res = await d.service.dispatchDistributions(EXECUTION, {}, actor);

      expect(res).toMatchObject({ created: 0, skipped: 1 });
      expect(d.runsRepo.createDistribution).not.toHaveBeenCalled();
    });

    it('adds the extra recipients given in the body', async () => {
      const d = build();
      d.runsRepo.findExecutionById.mockResolvedValue(
        succeededExecution({ scheduleId: undefined }),
      );
      d.runsRepo.findDistributionsByExecution.mockResolvedValue([]);
      d.runsRepo.createDistribution.mockReturnValue({ id: 'dist-1' });

      const res = await d.service.dispatchDistributions(
        EXECUTION,
        {
          recipients: [
            {
              recipientType: 'ADDRESS' as const,
              recipientAddress: 'direccion@salud.example',
              channelId: CHANNEL,
            },
          ],
        },
        actor,
      );

      expect(res.created).toBe(1);
    });

    it('requires an address on an ADDRESS recipient', async () => {
      const d = build();
      d.runsRepo.findExecutionById.mockResolvedValue(
        succeededExecution({ scheduleId: undefined }),
      );
      d.runsRepo.findDistributionsByExecution.mockResolvedValue([]);

      await expect(
        d.service.dispatchDistributions(
          EXECUTION,
          {
            recipients: [
              { recipientType: 'ADDRESS' as const, channelId: CHANNEL },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to distribute a run that did not succeed', async () => {
      const d = build();
      d.runsRepo.findExecutionById.mockResolvedValue(
        succeededExecution({ statusConceptId: CONCEPTS.EXECUTION_FAILED }),
      );

      await expect(
        d.service.dispatchDistributions(EXECUTION, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('subscribe (UC-39-09)', () => {
    const dto = { channelId: CHANNEL };

    function wire(d: ReturnType<typeof build>) {
      d.runsRepo.findScheduleById.mockResolvedValue({
        id: SCHEDULE,
        stateConceptId: CONCEPTS.SCHEDULE_STATE_ACTIVE,
      });
    }

    it('subscribes the authenticated user', async () => {
      const d = build();
      wire(d);
      d.runsRepo.findSubscription.mockResolvedValue(null);
      d.runsRepo.createSubscription.mockReturnValue({ id: 'sub-1' });

      const res = await d.service.subscribe(SCHEDULE, dto, actor);

      expect(res).toMatchObject({
        id: 'sub-1',
        isActive: true,
        reactivated: false,
      });
      expect(d.runsRepo.createSubscription).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ subscriberUserId: actor.id }),
      );
    });

    it('reactivates a subscription that had been cancelled', async () => {
      const d = build();
      wire(d);
      const existing: any = { id: 'sub-prev', isActive: false };
      d.runsRepo.findSubscription.mockResolvedValue(existing);

      const res = await d.service.subscribe(SCHEDULE, dto, actor);

      expect(res).toMatchObject({ id: 'sub-prev', reactivated: true });
      expect(existing.isActive).toBe(true);
      expect(d.runsRepo.createSubscription).not.toHaveBeenCalled();
    });

    it('does not duplicate an already active subscription', async () => {
      const d = build();
      wire(d);
      d.runsRepo.findSubscription.mockResolvedValue({
        id: 'sub-prev',
        isActive: true,
      });

      const res = await d.service.subscribe(SCHEDULE, dto, actor);

      expect(res).toMatchObject({ id: 'sub-prev', reactivated: false });
    });

    it('refuses a suspended schedule', async () => {
      const d = build();
      d.runsRepo.findScheduleById.mockResolvedValue({
        id: SCHEDULE,
        stateConceptId: CONCEPTS.SCHEDULE_SUSPENDED,
      });

      await expect(
        d.service.subscribe(SCHEDULE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('retryExecution (UC-39-11)', () => {
    function failedExecution(overrides: Record<string, unknown> = {}): any {
      return {
        id: EXECUTION,
        reportDefinitionId: DEFINITION,
        statusConceptId: CONCEPTS.EXECUTION_FAILED,
        errorText: 'timeout',
        startedAt: new Date(),
        finishedAt: new Date(),
        ...overrides,
      };
    }

    it('returns the run to the queue and clears its error', async () => {
      const d = build();
      const execution = failedExecution();
      d.runsRepo.findExecutionForUpdate.mockResolvedValue(execution);
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition(),
      );

      const res = await d.service.retryExecution(EXECUTION, {}, actor);

      expect(res).toMatchObject({
        statusConceptId: CONCEPTS.EXECUTION_QUEUED,
        distributionsRequeued: 0,
      });
      expect(execution.errorText).toBeUndefined();
      expect(execution.startedAt).toBeUndefined();
      expect(execution.triggerConceptId).toBe(CONCEPTS.TRIGGER_RETRY);
    });

    it('requeues the distributions when asked', async () => {
      const d = build();
      d.runsRepo.findExecutionForUpdate.mockResolvedValue(failedExecution());
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition(),
      );
      const distribution: any = {
        id: 'dist-1',
        statusConceptId: CONCEPTS.DISTRIBUTION_SENT,
        sentAt: new Date(),
      };
      d.runsRepo.findDistributionsByExecutionForUpdate.mockResolvedValue([
        distribution,
      ]);

      const res = await d.service.retryExecution(
        EXECUTION,
        { requeueDistributions: true },
        actor,
      );

      expect(res.distributionsRequeued).toBe(1);
      expect(distribution.statusConceptId).toBe(CONCEPTS.DISTRIBUTION_PENDING);
      expect(distribution.sentAt).toBeUndefined();
    });

    it('refuses to retry a run that did not fail', async () => {
      const d = build();
      d.runsRepo.findExecutionForUpdate.mockResolvedValue(
        failedExecution({ statusConceptId: CONCEPTS.EXECUTION_SUCCEEDED }),
      );

      await expect(
        d.service.retryExecution(EXECUTION, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to retry a run of a deprecated definition', async () => {
      const d = build();
      d.runsRepo.findExecutionForUpdate.mockResolvedValue(failedExecution());
      d.definitionsRepo.findDefinitionById.mockResolvedValue(
        activeDefinition({ stateConceptId: CONCEPTS.REPORT_DEPRECATED }),
      );

      await expect(
        d.service.retryExecution(EXECUTION, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the execution does not exist', async () => {
      const d = build();
      d.runsRepo.findExecutionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.retryExecution(EXECUTION, {}, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
