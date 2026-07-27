import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AssessmentService } from './assessment.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { SYSOPS } from '../system_ops.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findFrameworkByCodeVersion: mockFn(),
    findFrameworkById: mockFn(),
    createFramework: mockFn(),
    createControl: mockFn(),
    findAssessmentById: mockFn(),
    createAssessment: mockFn(),
    findControlResult: mockFn(),
    createControlResult: mockFn(),
    findFindingById: mockFn(),
    findFindingByCode: mockFn(),
    createFinding: mockFn(),
    findPlanByCode: mockFn(),
    createPlan: mockFn(),
    createAction: mockFn(),
    findActionById: mockFn(),
    findPlanById: mockFn(),
    countActionsNotIn: mockFn().mockResolvedValue(0),
    countFindingActionsNotIn: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AssessmentService(em as any, repo as any, logger as any);
  return { service, repo };
}

describe('AssessmentService', () => {
  describe('publishFramework (UC-11-11)', () => {
    it('rejects a duplicate code+version', async () => {
      const d = build();
      d.repo.findFrameworkByCodeVersion.mockResolvedValue({ id: 'f1' });
      await expect(
        d.service.publishFramework(
          { code: 'C', version: '1', controls: [] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates framework and links control hierarchy', async () => {
      const d = build();
      d.repo.findFrameworkByCodeVersion.mockResolvedValue(null);
      d.repo.createFramework.mockReturnValue({
        id: 'f1',
        code: 'C',
        version: '1',
      });
      const parent: any = { id: 'ctrl-parent' };
      const child: any = { id: 'ctrl-child' };
      d.repo.createControl
        .mockReturnValueOnce(parent)
        .mockReturnValueOnce(child);

      const res = await d.service.publishFramework(
        {
          code: 'C',
          version: '1',
          providerConceptId: 'p',
          name: 'n',
          controls: [
            { controlCode: 'A', title: 'A' },
            { controlCode: 'B', title: 'B', parentControlCode: 'A' },
          ],
        },
        actor,
      );

      expect(res.controlIds).toEqual(['ctrl-parent', 'ctrl-child']);
      expect(child.parentControlId).toBe('ctrl-parent');
    });
  });

  describe('createAssessment (UC-11-12)', () => {
    it('throws when framework missing', async () => {
      const d = build();
      d.repo.findFrameworkById.mockResolvedValue(null);
      await expect(
        d.service.createAssessment(
          { operationalFrameworkId: 'f1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects an unpublished framework', async () => {
      const d = build();
      d.repo.findFrameworkById.mockResolvedValue({
        id: 'f1',
        stateConceptId: 'draft',
      });
      await expect(
        d.service.createAssessment(
          { operationalFrameworkId: 'f1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates the assessment IN_PROGRESS', async () => {
      const d = build();
      d.repo.findFrameworkById.mockResolvedValue({
        id: 'f1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.repo.createAssessment.mockReturnValue({ id: 'a1' });
      const res = await d.service.createAssessment(
        {
          operationalFrameworkId: 'f1',
          tenantId: 't',
          workloadCode: 'w',
          workloadName: 'W',
          assessmentTypeConceptId: 'ty',
        },
        actor,
      );
      expect(res).toEqual({ id: 'a1' });
    });
  });

  describe('createFinding (UC-11-13)', () => {
    it('rejects a duplicate finding_code', async () => {
      const d = build();
      d.repo.findAssessmentById.mockResolvedValue({ id: 'a1' });
      d.repo.findFindingByCode.mockResolvedValue({ id: 'x' });
      await expect(
        d.service.createFinding(
          'a1',
          { findingCode: 'F1', title: 't', severityConceptId: 's' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('verifyAction (UC-11-14)', () => {
    it('rejects when verifier equals the assigned user (segregation)', async () => {
      const d = build();
      d.repo.findActionById.mockResolvedValue({
        id: 'ra1',
        statusConceptId: SYSOPS.ACTION_OPEN,
        assignedUserId: actor.id,
      });
      await expect(
        d.service.verifyAction(
          'ra1',
          { verificationEvidenceJson: {} } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('verifies the action and closes finding and plan when all verified', async () => {
      const d = build();
      const action: any = {
        id: 'ra1',
        statusConceptId: SYSOPS.ACTION_OPEN,
        assessmentFindingId: 'fnd1',
        remediationPlanId: 'pl1',
        updatedAt: new Date(),
      };
      const finding: any = {
        id: 'fnd1',
        statusConceptId: SYSOPS.FINDING_OPEN,
        updatedAt: new Date(),
      };
      const plan: any = {
        id: 'pl1',
        statusConceptId: SYSOPS.PLAN_OPEN,
        updatedAt: new Date(),
      };
      d.repo.findActionById.mockResolvedValue(action);
      d.repo.findFindingById.mockResolvedValue(finding);
      d.repo.findPlanById.mockResolvedValue(plan);

      const res = await d.service.verifyAction(
        'ra1',
        { verificationEvidenceJson: { ok: true } },
        actor,
      );
      expect(res).toEqual({ ok: true });
      expect(action.statusConceptId).toBe(SYSOPS.ACTION_VERIFIED);
      expect(finding.statusConceptId).toBe(SYSOPS.FINDING_CLOSED);
      expect(plan.statusConceptId).toBe(SYSOPS.PLAN_COMPLETED);
    });
  });
});
