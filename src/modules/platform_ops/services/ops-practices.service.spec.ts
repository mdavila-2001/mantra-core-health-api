import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { OpsPracticesService } from './ops-practices.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SRE'] };
const REVIEW = '11111111-1111-1111-1111-111111111111';
const COMPONENT = '22222222-2222-2222-2222-222222222222';
const RUNBOOK = '33333333-3333-3333-3333-333333333333';
const VERSION = '44444444-4444-4444-4444-444444444444';
const EXERCISE = '55555555-5555-5555-5555-555555555555';
const INCIDENT = '66666666-6666-6666-6666-666666666666';
const OWNER = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = {
    findReviewForUpdate: mockFn(),
    findGoReview: mockFn(),
    findFindingsForUpdate: mockFn(() => Promise.resolve([])),
    findRunbookForUpdate: mockFn(),
    createRunbookVersion: mockFn(() => ({ id: VERSION })),
    findRunbookVersion: mockFn(() => Promise.resolve(null)),
    findRunbookVersionById: mockFn(),
    findLatestRunbookVersion: mockFn(() => Promise.resolve(null)),
    createRunbookExecution: mockFn(() => ({ id: 'execution-1' })),
    findExerciseForUpdate: mockFn(),
    findRecoveryObjectiveForUpdate: mockFn(),
  };
  const incidentsRepo = {
    findIncidentById: mockFn(),
    createTimelineEvent: mockFn(() => ({ id: 'timeline-1' })),
  };
  const improvementsRepo = {
    createImprovementItem: mockFn(() => ({ id: 'improvement-1' })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new OpsPracticesService(
    em as any,
    practicesRepo,
    incidentsRepo as any,
    improvementsRepo,
    logger as any,
  );
  return {
    service,
    tx,
    practicesRepo,
    incidentsRepo,
    improvementsRepo,
    logger,
  };
}

/**
 * Ejecuta la operación open finding.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de open finding conforme al contrato `any`.
 */
function openFinding(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'finding-1',
    findingCode: 'F-1',
    title: 'Falta alerta de saturación',
    severityConceptId: CONCEPTS.FINDING_SEV_MEDIUM,
    statusConceptId: CONCEPTS.FINDING_OPEN,
    ...overrides,
  };
}

describe('OpsPracticesService', () => {
  describe('completeReadinessReview (UC-46-12)', () => {
    const dto: any = { decision: 'GO', improvementOwnerUserId: OWNER };

    /**
     * Ejecuta la operación in progress review.
     * @returns Resultado de in progress review conforme al contrato `any`.
     */
    function inProgressReview(): any {
      return {
        id: REVIEW,
        serviceComponentId: COMPONENT,
        statusConceptId: CONCEPTS.ORR_IN_PROGRESS,
      };
    }

    it('closes the review with a go decision', async () => {
      const d = build();
      const review = inProgressReview();
      d.practicesRepo.findReviewForUpdate.mockResolvedValue(review);

      const res = await d.service.completeReadinessReview(REVIEW, dto, actor);

      expect(res).toEqual({
        id: REVIEW,
        statusConceptId: CONCEPTS.ORR_COMPLETED,
        decisionConceptId: CONCEPTS.ORR_DECISION_GO,
        resolvedCount: 0,
        improvementItemIds: [],
      });
      expect(review.completedAt).toBeInstanceOf(Date);
    });

    it('resolves the listed findings', async () => {
      const d = build();
      const finding = openFinding();
      d.practicesRepo.findReviewForUpdate.mockResolvedValue(inProgressReview());
      d.practicesRepo.findFindingsForUpdate.mockResolvedValue([finding]);

      const res = await d.service.completeReadinessReview(
        REVIEW,
        {
          ...dto,
          resolvedFindings: [
            { findingId: 'finding-1', evidenceJson: { pr: 42 } },
          ],
        },
        actor,
      );

      expect(res.resolvedCount).toBe(1);
      expect(finding.statusConceptId).toBe(CONCEPTS.FINDING_RESOLVED);
      expect(finding.resolvedAt).toBeInstanceOf(Date);
      expect(finding.evidenceJson).toEqual({ pr: 42 });
    });

    it('refuses a go decision with a critical finding still open', async () => {
      const d = build();
      d.practicesRepo.findReviewForUpdate.mockResolvedValue(inProgressReview());
      d.practicesRepo.findFindingsForUpdate.mockResolvedValue([
        openFinding({ severityConceptId: CONCEPTS.FINDING_SEV_CRITICAL }),
      ]);

      await expect(
        d.service.completeReadinessReview(REVIEW, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('allows a no-go with findings still open and moves them to the backlog', async () => {
      const d = build();
      d.practicesRepo.findReviewForUpdate.mockResolvedValue(inProgressReview());
      d.practicesRepo.findFindingsForUpdate.mockResolvedValue([
        openFinding({ severityConceptId: CONCEPTS.FINDING_SEV_HIGH }),
      ]);

      const res = await d.service.completeReadinessReview(
        REVIEW,
        { ...dto, decision: 'NO_GO' },
        actor,
      );

      expect(res.decisionConceptId).toBe(CONCEPTS.ORR_DECISION_NO_GO);
      expect(res.improvementItemIds).toEqual(['improvement-1']);
      expect(d.improvementsRepo.createImprovementItem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          sourceTypeConceptId: CONCEPTS.IMPROVEMENT_SOURCE_READINESS,
          priorityConceptId: CONCEPTS.IMPROVEMENT_PRIORITY_HIGH,
          ownerUserId: OWNER,
        }),
      );
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('keeps the finding owner when the finding declares one', async () => {
      const d = build();
      d.practicesRepo.findReviewForUpdate.mockResolvedValue(inProgressReview());
      d.practicesRepo.findFindingsForUpdate.mockResolvedValue([
        openFinding({ ownerUserId: 'user-owner' }),
      ]);

      await d.service.completeReadinessReview(REVIEW, dto, actor);

      expect(d.improvementsRepo.createImprovementItem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ ownerUserId: 'user-owner' }),
      );
    });

    it('fails when a listed finding is not from this review', async () => {
      const d = build();
      d.practicesRepo.findReviewForUpdate.mockResolvedValue(inProgressReview());
      d.practicesRepo.findFindingsForUpdate.mockResolvedValue([]);

      await expect(
        d.service.completeReadinessReview(
          REVIEW,
          { ...dto, resolvedFindings: [{ findingId: 'finding-x' }] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('refuses resolving a finding that is already closed', async () => {
      const d = build();
      d.practicesRepo.findReviewForUpdate.mockResolvedValue(inProgressReview());
      d.practicesRepo.findFindingsForUpdate.mockResolvedValue([
        openFinding({ statusConceptId: CONCEPTS.FINDING_WAIVED }),
      ]);

      await expect(
        d.service.completeReadinessReview(
          REVIEW,
          { ...dto, resolvedFindings: [{ findingId: 'finding-1' }] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a review that is not in progress', async () => {
      const d = build();
      d.practicesRepo.findReviewForUpdate.mockResolvedValue({
        id: REVIEW,
        statusConceptId: CONCEPTS.ORR_COMPLETED,
      });

      await expect(
        d.service.completeReadinessReview(REVIEW, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the review does not exist', async () => {
      const d = build();
      d.practicesRepo.findReviewForUpdate.mockResolvedValue(null);

      await expect(
        d.service.completeReadinessReview(REVIEW, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('publishRunbookVersion (UC-46-13)', () => {
    const dto: any = { contentMarkdown: '# Reiniciar el gateway' };

    /**
     * Ejecuta la operación active runbook.
     * @returns Resultado de active runbook conforme al contrato `any`.
     */
    function activeRunbook(): any {
      return { id: RUNBOOK, stateConceptId: CONCEPTS.STATE_ACTIVE };
    }

    it('publishes the first version and makes it current', async () => {
      const d = build();
      const runbook = activeRunbook();
      d.practicesRepo.findRunbookForUpdate.mockResolvedValue(runbook);

      const res = await d.service.publishRunbookVersion(RUNBOOK, dto, actor);

      expect(res).toEqual({
        id: VERSION,
        versionNumber: 1,
        runbookId: RUNBOOK,
      });
      expect(runbook.currentVersionId).toBe(VERSION);
    });

    it('continues the numbering from the latest version', async () => {
      const d = build();
      d.practicesRepo.findRunbookForUpdate.mockResolvedValue(activeRunbook());
      d.practicesRepo.findLatestRunbookVersion.mockResolvedValue({
        versionNumber: 7,
      });

      const res = await d.service.publishRunbookVersion(RUNBOOK, dto, actor);

      expect(res.versionNumber).toBe(8);
    });

    it('rejects a version number already taken', async () => {
      const d = build();
      d.practicesRepo.findRunbookForUpdate.mockResolvedValue(activeRunbook());
      d.practicesRepo.findRunbookVersion.mockResolvedValue({
        id: 'version-prev',
      });

      await expect(
        d.service.publishRunbookVersion(RUNBOOK, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a runbook that is not active', async () => {
      const d = build();
      d.practicesRepo.findRunbookForUpdate.mockResolvedValue({
        id: RUNBOOK,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.publishRunbookVersion(RUNBOOK, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the runbook does not exist', async () => {
      const d = build();
      d.practicesRepo.findRunbookForUpdate.mockResolvedValue(null);

      await expect(
        d.service.publishRunbookVersion(RUNBOOK, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordRunbookExecution (UC-46-13)', () => {
    const dto: any = {
      runbookVersionId: VERSION,
      mode: 'MANUAL',
      result: 'SUCCESS',
      startedAt: '2026-07-20T10:00:00.000Z',
      endedAt: '2026-07-20T10:20:00.000Z',
    };

    it('records the execution without a timeline entry outside an incident', async () => {
      const d = build();
      d.practicesRepo.findRunbookVersionById.mockResolvedValue({
        id: VERSION,
        versionNumber: 3,
      });

      const res = await d.service.recordRunbookExecution(dto, actor);

      expect(res).toEqual({
        id: 'execution-1',
        resultConceptId: CONCEPTS.RUNBOOK_RESULT_SUCCESS,
        timelineEventId: undefined,
      });
      expect(d.incidentsRepo.createTimelineEvent).not.toHaveBeenCalled();
    });

    it('adds the timeline entry when it ran inside an incident', async () => {
      const d = build();
      d.practicesRepo.findRunbookVersionById.mockResolvedValue({
        id: VERSION,
        versionNumber: 3,
      });
      d.incidentsRepo.findIncidentById.mockResolvedValue({ id: INCIDENT });

      const res = await d.service.recordRunbookExecution(
        { ...dto, healthIncidentId: INCIDENT },
        actor,
      );

      expect(res.timelineEventId).toBe('timeline-1');
      expect(d.incidentsRepo.createTimelineEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.TIMELINE_RUNBOOK_EXECUTED,
        }),
      );
    });

    it('warns when the execution did not complete', async () => {
      const d = build();
      d.practicesRepo.findRunbookVersionById.mockResolvedValue({
        id: VERSION,
        versionNumber: 3,
      });

      const res = await d.service.recordRunbookExecution(
        { ...dto, result: 'ABORTED' },
        actor,
      );

      expect(res.resultConceptId).toBe(CONCEPTS.RUNBOOK_RESULT_ABORTED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('rejects an execution that ends before it starts', async () => {
      const d = build();

      await expect(
        d.service.recordRunbookExecution(
          { ...dto, endedAt: '2026-07-20T09:00:00.000Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the incident does not exist', async () => {
      const d = build();
      d.practicesRepo.findRunbookVersionById.mockResolvedValue({
        id: VERSION,
        versionNumber: 3,
      });
      d.incidentsRepo.findIncidentById.mockResolvedValue(null);

      await expect(
        d.service.recordRunbookExecution(
          { ...dto, healthIncidentId: INCIDENT },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('fails when the runbook version does not exist', async () => {
      const d = build();
      d.practicesRepo.findRunbookVersionById.mockResolvedValue(null);

      await expect(
        d.service.recordRunbookExecution(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('completeResilienceExercise (UC-46-14)', () => {
    const dto: any = {
      startedAt: '2026-07-20T10:00:00.000Z',
      endedAt: '2026-07-20T10:30:00.000Z',
      observedRtoSeconds: '900',
      observedRpoSeconds: '120',
      improvementOwnerUserId: OWNER,
    };

    /**
     * Ejecuta la operación pending exercise.
     * @returns Resultado de pending exercise conforme al contrato `any`.
     */
    function pendingExercise(): any {
      return {
        id: EXERCISE,
        serviceComponentId: COMPONENT,
        scenarioName: 'Caída de la zona A',
        resultConceptId: undefined,
      };
    }

    /**
     * Ejecuta la operación objective.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de objective conforme al contrato `any`.
     */
    function objective(overrides: Record<string, unknown> = {}): any {
      return {
        id: 'objective-1',
        rtoSeconds: '1800',
        rpoSeconds: '300',
        ...overrides,
      };
    }

    it('passes the exercise when it meets both objectives', async () => {
      const d = build();
      const exercise = pendingExercise();
      d.practicesRepo.findExerciseForUpdate.mockResolvedValue(exercise);
      d.practicesRepo.findRecoveryObjectiveForUpdate.mockResolvedValue(
        objective(),
      );

      const res = await d.service.completeResilienceExercise(
        EXERCISE,
        dto,
        actor,
      );

      expect(res).toEqual({
        id: EXERCISE,
        resultConceptId: CONCEPTS.RESILIENCE_PASS,
        rtoBreached: false,
        rpoBreached: false,
        improvementItemId: undefined,
      });
      expect(exercise.resultConceptId).toBe(CONCEPTS.RESILIENCE_PASS);
      expect(d.improvementsRepo.createImprovementItem).not.toHaveBeenCalled();
    });

    it('fails the exercise and opens an improvement when the RTO is missed', async () => {
      const d = build();
      d.practicesRepo.findExerciseForUpdate.mockResolvedValue(
        pendingExercise(),
      );
      d.practicesRepo.findRecoveryObjectiveForUpdate.mockResolvedValue(
        objective(),
      );

      const res = await d.service.completeResilienceExercise(
        EXERCISE,
        { ...dto, observedRtoSeconds: '3600' },
        actor,
      );

      expect(res.resultConceptId).toBe(CONCEPTS.RESILIENCE_FAIL);
      expect(res.rtoBreached).toBe(true);
      expect(res.improvementItemId).toBe('improvement-1');
      expect(d.improvementsRepo.createImprovementItem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          sourceTypeConceptId: CONCEPTS.IMPROVEMENT_SOURCE_RESILIENCE,
          ownerUserId: OWNER,
        }),
      );
    });

    it('fails the exercise when only the RPO is missed', async () => {
      const d = build();
      d.practicesRepo.findExerciseForUpdate.mockResolvedValue(
        pendingExercise(),
      );
      d.practicesRepo.findRecoveryObjectiveForUpdate.mockResolvedValue(
        objective(),
      );

      const res = await d.service.completeResilienceExercise(
        EXERCISE,
        { ...dto, observedRpoSeconds: '600' },
        actor,
      );

      expect(res.rtoBreached).toBe(false);
      expect(res.rpoBreached).toBe(true);
      expect(res.resultConceptId).toBe(CONCEPTS.RESILIENCE_FAIL);
    });

    it('ignores the RPO when the exercise does not report one', async () => {
      const d = build();
      d.practicesRepo.findExerciseForUpdate.mockResolvedValue(
        pendingExercise(),
      );
      d.practicesRepo.findRecoveryObjectiveForUpdate.mockResolvedValue(
        objective(),
      );

      const res = await d.service.completeResilienceExercise(
        EXERCISE,
        { ...dto, observedRpoSeconds: undefined },
        actor,
      );

      expect(res.rpoBreached).toBe(false);
      expect(res.resultConceptId).toBe(CONCEPTS.RESILIENCE_PASS);
    });

    it('compares seconds beyond what a double holds exactly', async () => {
      const d = build();
      d.practicesRepo.findExerciseForUpdate.mockResolvedValue(
        pendingExercise(),
      );
      d.practicesRepo.findRecoveryObjectiveForUpdate.mockResolvedValue(
        objective({ rtoSeconds: '9007199254740992' }),
      );

      const res = await d.service.completeResilienceExercise(
        EXERCISE,
        { ...dto, observedRtoSeconds: '9007199254740993' },
        actor,
      );

      expect(res.rtoBreached).toBe(true);
    });

    it('refuses an exercise with no recovery objective to measure against', async () => {
      const d = build();
      d.practicesRepo.findExerciseForUpdate.mockResolvedValue(
        pendingExercise(),
      );
      d.practicesRepo.findRecoveryObjectiveForUpdate.mockResolvedValue(null);

      await expect(
        d.service.completeResilienceExercise(EXERCISE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses closing an exercise twice', async () => {
      const d = build();
      d.practicesRepo.findExerciseForUpdate.mockResolvedValue({
        ...pendingExercise(),
        resultConceptId: CONCEPTS.RESILIENCE_PASS,
      });

      await expect(
        d.service.completeResilienceExercise(EXERCISE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an exercise that ends before it starts', async () => {
      const d = build();

      await expect(
        d.service.completeResilienceExercise(
          EXERCISE,
          { ...dto, endedAt: '2026-07-20T09:00:00.000Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the exercise does not exist', async () => {
      const d = build();
      d.practicesRepo.findExerciseForUpdate.mockResolvedValue(null);

      await expect(
        d.service.completeResilienceExercise(EXERCISE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
