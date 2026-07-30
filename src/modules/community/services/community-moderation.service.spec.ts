import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityModerationService } from './community-moderation.service';
import { ConflictException, ResourceNotFoundException } from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'mod-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const moderationRepo = {
    createReport: mockFn(),
    findReportsByTarget: mockFn().mockResolvedValue([]),
    findQueueById: mockFn(),
    findOpenQueueForContent: mockFn(),
    createQueue: mockFn(),
    findDecisionById: mockFn(),
    createDecision: mockFn(),
    createStrike: mockFn(),
    createAppeal: mockFn(),
    findOpenAppealForDecision: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityModerationService(
    em as any,
    moderationRepo,
    logger as any,
  );
  return { service, tx, moderationRepo };
}

describe('CommunityModerationService', () => {
  describe('report (UC-19-08)', () => {
    it('creates the report and a new queue entry when none is open', async () => {
      const d = build();
      d.moderationRepo.createReport.mockReturnValue({ id: 'rep1' });
      d.moderationRepo.findOpenQueueForContent.mockResolvedValue(null);
      d.moderationRepo.createQueue.mockReturnValue({ id: 'q1' });
      const res = await d.service.report(
        { targetType: 'POST', targetId: 'post1', reason: 'SPAM' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'rep1', moderationQueueId: 'q1' });
    });

    it('reuses an existing open queue entry (dedup)', async () => {
      const d = build();
      d.moderationRepo.createReport.mockReturnValue({ id: 'rep2' });
      d.moderationRepo.findOpenQueueForContent.mockResolvedValue({
        id: 'qExisting',
      });
      const res = await d.service.report(
        { targetType: 'POST', targetId: 'post1', reason: 'ABUSE' } as any,
        actor,
      );
      expect(res.moderationQueueId).toBe('qExisting');
      expect(d.moderationRepo.createQueue).not.toHaveBeenCalled();
    });
  });

  describe('decide (UC-19-09)', () => {
    it('throws when the queue entry does not exist', async () => {
      const d = build();
      d.moderationRepo.findQueueById.mockResolvedValue(null);
      await expect(
        d.service.decide('missing', { decision: 'REMOVED' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects deciding an already resolved queue', async () => {
      const d = build();
      d.moderationRepo.findQueueById.mockResolvedValue({
        id: 'q1',
        statusConceptId: COMM.QUEUE_RESOLVED,
      });
      await expect(
        d.service.decide('q1', { decision: 'REMOVED' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('records the decision, resolves the queue and issues a strike', async () => {
      const d = build();
      const queue = {
        id: 'q1',
        statusConceptId: COMM.QUEUE_QUEUED,
        contentRefId: 'post1',
        updatedAt: new Date(),
      };
      d.moderationRepo.findQueueById.mockResolvedValue(queue);
      d.moderationRepo.createDecision.mockReturnValue({ id: 'dec1' });
      d.moderationRepo.createStrike.mockReturnValue({ id: 'str1' });
      const res = await d.service.decide(
        'q1',
        {
          decision: 'REMOVED',
          subjectProfileId: 'p9',
          strikeSeverity: 'HIGH',
        } as any,
        actor,
      );
      expect(res).toEqual({
        id: 'dec1',
        strikeId: 'str1',
        decision: 'REMOVED',
      });
      expect(queue.statusConceptId).toBe(COMM.QUEUE_RESOLVED);
    });
  });

  describe('appeal (UC-19-10)', () => {
    it('throws when the decision does not exist', async () => {
      const d = build();
      d.moderationRepo.findDecisionById.mockResolvedValue(null);
      await expect(
        d.service.appeal(
          'missing',
          { appellantProfileId: 'p1', reasonText: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a second open appeal for the same decision', async () => {
      const d = build();
      d.moderationRepo.findDecisionById.mockResolvedValue({
        id: 'dec1',
        moderationQueueId: 'q1',
      });
      d.moderationRepo.findOpenAppealForDecision.mockResolvedValue({
        id: 'ap0',
      });
      await expect(
        d.service.appeal(
          'dec1',
          { appellantProfileId: 'p1', reasonText: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the appeal and re-queues the content', async () => {
      const d = build();
      d.moderationRepo.findDecisionById.mockResolvedValue({
        id: 'dec1',
        moderationQueueId: 'q1',
      });
      d.moderationRepo.findOpenAppealForDecision.mockResolvedValue(null);
      d.moderationRepo.createAppeal.mockReturnValue({ id: 'ap1' });
      d.moderationRepo.findQueueById.mockResolvedValue({
        id: 'q1',
        contentTypeConceptId: 'ct',
        contentRefId: 'post1',
      });
      const res = await d.service.appeal(
        'dec1',
        { appellantProfileId: 'p1', reasonText: 'unfair' },
        actor,
      );
      expect(res).toEqual({ id: 'ap1' });
      expect(d.moderationRepo.createQueue).toHaveBeenCalled();
    });
  });
});
