import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QueuesService } from './queues.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SYSTEM'] };
const QUEUE = '11111111-1111-1111-1111-111111111111';
const JOB = '22222222-2222-2222-2222-222222222222';
const DEAD = '33333333-3333-3333-3333-333333333333';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const queuesRepo = {
    findQueueByCode: mockFn(),
    findQueueById: mockFn(),
    createJob: mockFn(() => ({ id: JOB })),
    findJobByDedupeKey: mockFn(() => Promise.resolve(null)),
    findJobById: mockFn(),
    findJobForUpdate: mockFn(),
    claimReadyJobs: mockFn(() => Promise.resolve([])),
    createDeadLetterJob: mockFn(() => ({ id: DEAD })),
    findDeadLetterJobById: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new QueuesService(em as any, queuesRepo, logger as any);
  return { service, tx, queuesRepo, logger };
}

function activeQueue(overrides: Record<string, unknown> = {}): any {
  return {
    id: QUEUE,
    code: 'default',
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    defaultPriority: 5,
    defaultMaxAttempts: 3,
    visibilityTimeoutS: 30,
    ...overrides,
  };
}

function runningJob(overrides: Record<string, unknown> = {}): any {
  return {
    id: JOB,
    queueId: QUEUE,
    jobType: 'send-email',
    payloadJson: { to: 'x' },
    statusConceptId: CONCEPTS.JOB_RUNNING,
    lockedBy: 'worker-1',
    attempts: 1,
    maxAttempts: 3,
    ...overrides,
  };
}

describe('QueuesService', () => {
  describe('enqueueJob (UC-35-05)', () => {
    const dto: any = {
      jobType: 'send-email',
      dedupeKey: 'k-1',
      payloadJson: { to: 'x' },
    };

    it('enqueues the job as ready', async () => {
      const d = build();
      d.queuesRepo.findQueueByCode.mockResolvedValue(activeQueue());

      const res = await d.service.enqueueJob('default', dto, actor);

      expect(res).toEqual({
        id: JOB,
        statusConceptId: CONCEPTS.JOB_READY,
        duplicate: false,
      });
      expect(d.queuesRepo.createJob).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ priority: 5, maxAttempts: 3 }),
      );
    });

    it('collapses a repeated dedupe key', async () => {
      const d = build();
      d.queuesRepo.findQueueByCode.mockResolvedValue(activeQueue());
      d.queuesRepo.findJobByDedupeKey.mockResolvedValue({
        id: 'job-prev',
        statusConceptId: CONCEPTS.JOB_READY,
      });

      const res = await d.service.enqueueJob('default', dto, actor);

      expect(res).toMatchObject({ id: 'job-prev', duplicate: true });
      expect(d.queuesRepo.createJob).not.toHaveBeenCalled();
    });

    it('refuses an inactive queue', async () => {
      const d = build();
      d.queuesRepo.findQueueByCode.mockResolvedValue(
        activeQueue({ stateConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.enqueueJob('default', dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the queue does not exist', async () => {
      const d = build();
      d.queuesRepo.findQueueByCode.mockResolvedValue(null);

      await expect(
        d.service.enqueueJob('default', dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('claimJobs (UC-35-06)', () => {
    it('claims the batch and reserves it for the worker', async () => {
      const d = build();
      d.queuesRepo.findQueueByCode.mockResolvedValue(activeQueue());
      const job = {
        id: JOB,
        jobType: 'send-email',
        payloadJson: {},
        attempts: 0,
      } as any;
      d.queuesRepo.claimReadyJobs.mockResolvedValue([job]);

      const res = await d.service.claimJobs('default', {
        workerId: 'worker-1',
      });

      expect(res.claimed).toBe(1);
      expect(job.statusConceptId).toBe(CONCEPTS.JOB_RUNNING);
      expect(job.lockedBy).toBe('worker-1');
      expect(job.attempts).toBe(1);
      expect(job.lockExpiresAt).toBeInstanceOf(Date);
    });

    it('returns an empty batch when there is nothing ready', async () => {
      const d = build();
      d.queuesRepo.findQueueByCode.mockResolvedValue(activeQueue());

      const res = await d.service.claimJobs('default', {
        workerId: 'worker-1',
      });

      expect(res).toMatchObject({ queueId: QUEUE, claimed: 0, jobs: [] });
    });

    it('refuses claiming from an inactive queue', async () => {
      const d = build();
      d.queuesRepo.findQueueByCode.mockResolvedValue(
        activeQueue({ stateConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.claimJobs('default', { workerId: 'worker-1' } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('completeJob (UC-35-07)', () => {
    it('closes the job and releases the lock', async () => {
      const d = build();
      const job = runningJob();
      d.queuesRepo.findJobForUpdate.mockResolvedValue(job);

      const res = await d.service.completeJob(JOB, {
        workerId: 'worker-1',
      });

      expect(res.statusConceptId).toBe(CONCEPTS.JOB_SUCCEEDED);
      expect(job.completedAt).toBeInstanceOf(Date);
      expect(job.lockedBy).toBeUndefined();
    });

    it('refuses a worker that does not hold the lock', async () => {
      const d = build();
      d.queuesRepo.findJobForUpdate.mockResolvedValue(
        runningJob({ lockedBy: 'worker-2' }),
      );

      await expect(
        d.service.completeJob(JOB, { workerId: 'worker-1' } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses closing a job that is not running', async () => {
      const d = build();
      d.queuesRepo.findJobForUpdate.mockResolvedValue(
        runningJob({ statusConceptId: CONCEPTS.JOB_READY }),
      );

      await expect(
        d.service.completeJob(JOB, { workerId: 'worker-1' } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the job does not exist', async () => {
      const d = build();
      d.queuesRepo.findJobForUpdate.mockResolvedValue(null);

      await expect(
        d.service.completeJob(JOB, { workerId: 'worker-1' } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('failJob (UC-35-08)', () => {
    const dto: any = {
      workerId: 'worker-1',
      errorText: 'el proveedor devolvió 500',
    };

    it('returns the job to the queue with backoff', async () => {
      const d = build();
      const job = runningJob({ attempts: 1, maxAttempts: 3 });
      d.queuesRepo.findJobForUpdate.mockResolvedValue(job);

      const res = await d.service.failJob(JOB, dto);

      expect(res.statusConceptId).toBe(CONCEPTS.JOB_READY);
      expect(res.availableAt).toBeDefined();
      expect(new Date(res.availableAt as string).getTime()).toBeGreaterThan(
        Date.now(),
      );
      expect(job.lockedBy).toBeUndefined();
      expect(res.deadLetterJobId).toBeUndefined();
    });

    it('moves the job to the dead letter queue when attempts run out', async () => {
      const d = build();
      const job = runningJob({ attempts: 3, maxAttempts: 3 });
      d.queuesRepo.findJobForUpdate.mockResolvedValue(job);
      d.queuesRepo.findQueueById.mockResolvedValue(activeQueue());

      const res = await d.service.failJob(JOB, dto);

      expect(res.statusConceptId).toBe(CONCEPTS.JOB_DEAD_LETTER);
      expect(res.deadLetterJobId).toBe(DEAD);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('sends the evidence to the queue declared as dead letter destination', async () => {
      const d = build();
      d.queuesRepo.findJobForUpdate.mockResolvedValue(
        runningJob({ attempts: 3, maxAttempts: 3 }),
      );
      d.queuesRepo.findQueueById.mockResolvedValue(
        activeQueue({ deadLetterQueueId: 'queue-dlq' }),
      );

      await d.service.failJob(JOB, dto);

      expect(d.queuesRepo.createDeadLetterJob).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ queueId: 'queue-dlq', originalJobId: JOB }),
      );
    });

    it('refuses a worker that does not hold the lock', async () => {
      const d = build();
      d.queuesRepo.findJobForUpdate.mockResolvedValue(
        runningJob({ lockedBy: 'worker-2' }),
      );

      await expect(d.service.failJob(JOB, dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('fails when the job does not exist', async () => {
      const d = build();
      d.queuesRepo.findJobForUpdate.mockResolvedValue(null);

      await expect(d.service.failJob(JOB, dto)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('redriveDeadLetter (UC-35-09)', () => {
    const dto: any = { reason: 'corregido el timeout del proveedor' };

    function wire(d: ReturnType<typeof build>) {
      d.queuesRepo.findDeadLetterJobById.mockResolvedValue({
        id: DEAD,
        queueId: QUEUE,
        originalJobId: JOB,
        payloadJson: { to: 'x' },
      });
      d.queuesRepo.findJobById.mockResolvedValue(
        runningJob({ statusConceptId: CONCEPTS.JOB_DEAD_LETTER }),
      );
      d.queuesRepo.findQueueById.mockResolvedValue(activeQueue());
    }

    it('enqueues a new job reusing the original payload', async () => {
      const d = build();
      wire(d);

      const res = await d.service.redriveDeadLetter(DEAD, dto, actor);

      expect(res).toEqual({
        jobId: JOB,
        deadLetterJobId: DEAD,
        statusConceptId: CONCEPTS.JOB_READY,
        duplicate: false,
      });
      expect(d.queuesRepo.createJob).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          dedupeKey: `redrive:${DEAD}`,
          payloadJson: { to: 'x' },
        }),
      );
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('does not redrive the same dead letter entry twice', async () => {
      const d = build();
      wire(d);
      d.queuesRepo.findJobByDedupeKey.mockResolvedValue({
        id: 'job-prev',
        statusConceptId: CONCEPTS.JOB_READY,
      });

      const res = await d.service.redriveDeadLetter(DEAD, dto, actor);

      expect(res).toMatchObject({ jobId: 'job-prev', duplicate: true });
      expect(d.queuesRepo.createJob).not.toHaveBeenCalled();
    });

    it('refuses redriving into an inactive queue', async () => {
      const d = build();
      wire(d);
      d.queuesRepo.findQueueById.mockResolvedValue(
        activeQueue({ stateConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.redriveDeadLetter(DEAD, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the dead letter entry does not exist', async () => {
      const d = build();
      d.queuesRepo.findDeadLetterJobById.mockResolvedValue(null);

      await expect(
        d.service.redriveDeadLetter(DEAD, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
