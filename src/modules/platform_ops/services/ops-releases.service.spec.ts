import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { OpsReleasesService } from './ops-releases.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['RELEASE_MANAGER'] };
const REQUESTER = 'user-9';
const COMPONENT = '11111111-1111-1111-1111-111111111111';
const CHANGE = '22222222-2222-2222-2222-222222222222';
const ARTIFACT = '33333333-3333-3333-3333-333333333333';
const DEPLOYMENT = '44444444-4444-4444-4444-444444444444';
const WINDOW = '55555555-5555-5555-5555-555555555555';
const TOOL = '66666666-6666-6666-6666-666666666666';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const releasesRepo = {
    findComponentById: mockFn(),
    findToolById: mockFn(),
    findWindowForUpdate: mockFn(),
    findChangesInWindow: mockFn(() => Promise.resolve([])),
    createChangeRequest: mockFn(),
    findChangeRequestById: mockFn(),
    findChangeRequestForUpdate: mockFn(),
    findChangeRequestByNumber: mockFn(() => Promise.resolve(null)),
    countChangeRequests: mockFn(() => Promise.resolve(0)),
    createApproval: mockFn(),
    findApprovals: mockFn(() => Promise.resolve([])),
    createArtifact: mockFn(),
    findArtifactById: mockFn(),
    findArtifactByRef: mockFn(() => Promise.resolve(null)),
    findArtifactByVersion: mockFn(() => Promise.resolve(null)),
    createDeployment: mockFn(),
    findDeploymentById: mockFn(),
    findDeploymentForUpdate: mockFn(),
    findCurrentDeploymentForUpdate: mockFn(() => Promise.resolve(null)),
    findDeploymentByNumber: mockFn(() => Promise.resolve(null)),
    countDeployments: mockFn(() => Promise.resolve(0)),
    findPreviousSucceededDeployment: mockFn(),
  };
  const reliabilityRepo = {
    findFreezingPolicies: mockFn(() => Promise.resolve([])),
    findLatestBurnEvent: mockFn(),
  };
  const practicesRepo = { findGoReview: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new OpsReleasesService(
    em as any,
    releasesRepo,
    reliabilityRepo as any,
    practicesRepo as any,
    logger as any,
  );
  return { service, tx, releasesRepo, reliabilityRepo, practicesRepo, logger };
}

/**
 * Ejecuta la operación active component.
 * @returns Resultado de active component conforme al contrato `any`.
 */
function activeComponent(): any {
  return { id: COMPONENT, stateConceptId: CONCEPTS.STATE_ACTIVE };
}

/**
 * Ejecuta la operación approved change.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de approved change conforme al contrato `any`.
 */
function approvedChange(overrides: Record<string, unknown> = {}): any {
  return {
    id: CHANGE,
    serviceComponentId: COMPONENT,
    requestedByUserId: REQUESTER,
    statusConceptId: CONCEPTS.CHANGE_APPROVED,
    ...overrides,
  };
}

describe('OpsReleasesService', () => {
  describe('createChangeRequest (UC-46-01)', () => {
    const dto: any = {
      serviceComponentId: COMPONENT,
      title: 'Actualizar el gateway',
      changeType: 'NORMAL',
      risk: 'MEDIUM',
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.releasesRepo.findComponentById.mockResolvedValue(activeComponent());
      d.releasesRepo.createChangeRequest.mockReturnValue({ id: CHANGE });
    }

    it('registers the change with a correlative number', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.countChangeRequests.mockResolvedValue(4);

      const res = await d.service.createChangeRequest(dto, actor);

      expect(res).toEqual({
        id: CHANGE,
        changeNumber: 'CHG-000005',
        statusConceptId: CONCEPTS.CHANGE_REQUESTED,
      });
      expect(d.releasesRepo.createChangeRequest).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          changeTypeConceptId: CONCEPTS.CHANGE_TYPE_NORMAL,
          riskLevelConceptId: CONCEPTS.CHANGE_RISK_MEDIUM,
          requestedByUserId: actor.id,
        }),
      );
    });

    it('skips a number already taken', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findChangeRequestByNumber.mockResolvedValueOnce({
        id: 'other',
      });

      const res = await d.service.createChangeRequest(dto, actor);

      expect(res.changeNumber).toBe('CHG-000002');
    });

    it('rejects an inverted planned window', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.createChangeRequest(
          {
            ...dto,
            plannedStartAt: '2026-08-02T10:00:00.000Z',
            plannedEndAt: '2026-08-02T09:00:00.000Z',
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the component does not exist', async () => {
      const d = build();
      d.releasesRepo.findComponentById.mockResolvedValue(null);

      await expect(
        d.service.createChangeRequest(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('refuses an inactive component', async () => {
      const d = build();
      d.releasesRepo.findComponentById.mockResolvedValue({
        id: COMPONENT,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.createChangeRequest(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a closed maintenance window', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findWindowForUpdate.mockResolvedValue({
        id: WINDOW,
        statusConceptId: CONCEPTS.MAINTENANCE_WINDOW_CLOSED,
        startsAt: new Date('2026-08-02T00:00:00.000Z'),
        endsAt: new Date('2026-08-03T00:00:00.000Z'),
      });

      await expect(
        d.service.createChangeRequest(
          { ...dto, maintenanceWindowId: WINDOW },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a change that does not fit inside its window', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findWindowForUpdate.mockResolvedValue({
        id: WINDOW,
        statusConceptId: CONCEPTS.MAINTENANCE_WINDOW_PLANNED,
        startsAt: new Date('2026-08-02T00:00:00.000Z'),
        endsAt: new Date('2026-08-02T04:00:00.000Z'),
      });

      await expect(
        d.service.createChangeRequest(
          {
            ...dto,
            maintenanceWindowId: WINDOW,
            plannedStartAt: '2026-08-02T01:00:00.000Z',
            plannedEndAt: '2026-08-02T06:00:00.000Z',
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts a change contained in its window', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findWindowForUpdate.mockResolvedValue({
        id: WINDOW,
        statusConceptId: CONCEPTS.MAINTENANCE_WINDOW_PLANNED,
        startsAt: new Date('2026-08-02T00:00:00.000Z'),
        endsAt: new Date('2026-08-02T08:00:00.000Z'),
      });

      const res = await d.service.createChangeRequest(
        {
          ...dto,
          maintenanceWindowId: WINDOW,
          plannedStartAt: '2026-08-02T01:00:00.000Z',
          plannedEndAt: '2026-08-02T03:00:00.000Z',
        },
        actor,
      );

      expect(res.id).toBe(CHANGE);
    });

    it('fails when the window does not exist', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findWindowForUpdate.mockResolvedValue(null);

      await expect(
        d.service.createChangeRequest(
          { ...dto, maintenanceWindowId: WINDOW },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordApproval (UC-46-02)', () => {
    /**
     * Ejecuta la operación requested change.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de requested change conforme al contrato `any`.
     */
    function requestedChange(overrides: Record<string, unknown> = {}): any {
      return {
        id: CHANGE,
        requestedByUserId: REQUESTER,
        statusConceptId: CONCEPTS.CHANGE_REQUESTED,
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param change - Valor de change requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, change = requestedChange()) {
      d.releasesRepo.findChangeRequestForUpdate.mockResolvedValue(change);
      d.releasesRepo.createApproval.mockReturnValue({ id: 'approval-1' });
      return change;
    }

    it('approves the single required step and leaves the change approved', async () => {
      const d = build();
      const change = wire(d);

      const res = await d.service.recordApproval(
        CHANGE,
        { approvalStep: 1, decision: 'APPROVED' } as any,
        actor,
      );

      expect(res).toEqual({
        id: 'approval-1',
        changeRequestId: CHANGE,
        changeStatusConceptId: CONCEPTS.CHANGE_APPROVED,
        approvedSteps: 1,
      });
      expect(change.statusConceptId).toBe(CONCEPTS.CHANGE_APPROVED);
    });

    it('leaves the change in review while steps remain', async () => {
      const d = build();
      const change = wire(d);

      const res = await d.service.recordApproval(
        CHANGE,
        {
          approvalStep: 1,
          decision: 'APPROVED',
          requiredApprovalSteps: 2,
        } as any,
        actor,
      );

      expect(res.changeStatusConceptId).toBe(CONCEPTS.CHANGE_IN_REVIEW);
      expect(change.statusConceptId).toBe(CONCEPTS.CHANGE_IN_REVIEW);
    });

    it('rejects the change on a negative decision', async () => {
      const d = build();
      const change = wire(d);

      const res = await d.service.recordApproval(
        CHANGE,
        {
          approvalStep: 1,
          decision: 'REJECTED',
          decisionReason: 'sin plan de vuelta atrás',
        } as any,
        actor,
      );

      expect(res.changeStatusConceptId).toBe(CONCEPTS.CHANGE_REJECTED);
      expect(change.statusConceptId).toBe(CONCEPTS.CHANGE_REJECTED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('refuses the requester approving their own change', async () => {
      const d = build();
      wire(d, requestedChange({ requestedByUserId: actor.id }));

      await expect(
        d.service.recordApproval(
          CHANGE,
          { approvalStep: 1, decision: 'APPROVED' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a second vote from the same approver in the same step', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findApprovals.mockResolvedValue([
        {
          approvalStep: 1,
          approverUserId: actor.id,
          decisionConceptId: CONCEPTS.CHANGE_DECISION_APPROVED,
        },
      ]);

      await expect(
        d.service.recordApproval(
          CHANGE,
          { approvalStep: 1, decision: 'APPROVED' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses skipping a step', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.recordApproval(
          CHANGE,
          { approvalStep: 2, decision: 'APPROVED' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts the second step once the first is approved', async () => {
      const d = build();
      wire(d, requestedChange({ statusConceptId: CONCEPTS.CHANGE_IN_REVIEW }));
      d.releasesRepo.findApprovals.mockResolvedValue([
        {
          approvalStep: 1,
          approverUserId: 'user-2',
          decisionConceptId: CONCEPTS.CHANGE_DECISION_APPROVED,
        },
      ]);

      const res = await d.service.recordApproval(
        CHANGE,
        {
          approvalStep: 2,
          decision: 'APPROVED',
          requiredApprovalSteps: 2,
        } as any,
        actor,
      );

      expect(res.approvedSteps).toBe(2);
      expect(res.changeStatusConceptId).toBe(CONCEPTS.CHANGE_APPROVED);
    });

    it('refuses deciding on a change that is already resolved', async () => {
      const d = build();
      wire(
        d,
        requestedChange({ statusConceptId: CONCEPTS.CHANGE_IMPLEMENTED }),
      );

      await expect(
        d.service.recordApproval(
          CHANGE,
          { approvalStep: 1, decision: 'APPROVED' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the change does not exist', async () => {
      const d = build();
      d.releasesRepo.findChangeRequestForUpdate.mockResolvedValue(null);

      await expect(
        d.service.recordApproval(
          CHANGE,
          { approvalStep: 1, decision: 'APPROVED' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('publishArtifact (UC-46-03)', () => {
    const dto: any = {
      serviceComponentId: COMPONENT,
      artifactRef: 'registry/gateway@sha256:abc',
      artifactKind: 'CONTAINER_IMAGE',
      name: 'gateway',
      version: '1.4.0',
      contentHash: 'AABBCC'.padEnd(64, '0'),
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.releasesRepo.findComponentById.mockResolvedValue(activeComponent());
      d.releasesRepo.createArtifact.mockReturnValue({ id: ARTIFACT });
    }

    it('publishes the artifact as immutable and normalises the hash', async () => {
      const d = build();
      wire(d);

      const res = await d.service.publishArtifact(dto, actor);

      expect(res).toEqual({
        id: ARTIFACT,
        artifactRef: dto.artifactRef,
        contentHash: dto.contentHash.toLowerCase(),
        isImmutable: true,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
    });

    it('rejects a repeated reference', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findArtifactByRef.mockResolvedValue({
        id: 'artifact-prev',
      });

      await expect(
        d.service.publishArtifact(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a version the component already published', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findArtifactByVersion.mockResolvedValue({
        id: 'artifact-prev',
      });

      await expect(
        d.service.publishArtifact(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a tool that is not approved', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findToolById.mockResolvedValue({
        id: TOOL,
        isApproved: false,
      });

      await expect(
        d.service.publishArtifact(
          { ...dto, producedByToolId: TOOL },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts an approved tool', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findToolById.mockResolvedValue({
        id: TOOL,
        isApproved: true,
      });

      const res = await d.service.publishArtifact(
        { ...dto, producedByToolId: TOOL },
        actor,
      );

      expect(res.id).toBe(ARTIFACT);
    });

    it('fails when the tool does not exist', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findToolById.mockResolvedValue(null);

      await expect(
        d.service.publishArtifact(
          { ...dto, producedByToolId: TOOL },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('fails when the component does not exist', async () => {
      const d = build();
      d.releasesRepo.findComponentById.mockResolvedValue(null);

      await expect(
        d.service.publishArtifact(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createDeployment (UC-46-04)', () => {
    const dto: any = {
      changeRequestId: CHANGE,
      artifactId: ARTIFACT,
      environment: 'STAGING',
      strategy: 'ROLLING',
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param change - Valor de change requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, change = approvedChange()) {
      d.releasesRepo.findChangeRequestForUpdate.mockResolvedValue(change);
      d.releasesRepo.findArtifactById.mockResolvedValue({
        id: ARTIFACT,
        serviceComponentId: COMPONENT,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.releasesRepo.createDeployment.mockReturnValue({
        id: DEPLOYMENT,
        statusConceptId: CONCEPTS.DEPLOY_IN_PROGRESS,
      });
      return change;
    }

    it('starts the deployment in progress without touching the current one', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createDeployment(dto, actor);

      expect(res).toMatchObject({
        id: DEPLOYMENT,
        deploymentNumber: 'DEP-000001',
        isCurrent: false,
      });
      expect(res.supersededDeploymentId).toBeUndefined();
    });

    it('hands the current flag over only when the deployment succeeded', async () => {
      const d = build();
      const change = wire(d);
      const current: any = { id: 'deployment-prev', isCurrent: true };
      d.releasesRepo.findCurrentDeploymentForUpdate.mockResolvedValue(current);
      d.releasesRepo.createDeployment.mockReturnValue({
        id: DEPLOYMENT,
        statusConceptId: CONCEPTS.DEPLOY_SUCCEEDED,
      });

      const res = await d.service.createDeployment(
        { ...dto, outcome: 'SUCCEEDED' },
        actor,
      );

      expect(res.isCurrent).toBe(true);
      expect(res.supersededDeploymentId).toBe('deployment-prev');
      expect(current.isCurrent).toBe(false);
      expect(change.statusConceptId).toBe(CONCEPTS.CHANGE_IMPLEMENTED);
      expect(change.deploymentId).toBe(DEPLOYMENT);
    });

    it('leaves a failed deployment out of the current flag', async () => {
      const d = build();
      const change = wire(d);
      const current: any = { id: 'deployment-prev', isCurrent: true };
      d.releasesRepo.findCurrentDeploymentForUpdate.mockResolvedValue(current);
      d.releasesRepo.createDeployment.mockReturnValue({
        id: DEPLOYMENT,
        statusConceptId: CONCEPTS.DEPLOY_FAILED,
      });

      const res = await d.service.createDeployment(
        { ...dto, outcome: 'FAILED' },
        actor,
      );

      expect(res.isCurrent).toBe(false);
      expect(current.isCurrent).toBe(true);
      expect(change.statusConceptId).toBe(CONCEPTS.CHANGE_APPROVED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('refuses a change that is not approved', async () => {
      const d = build();
      wire(d, approvedChange({ statusConceptId: CONCEPTS.CHANGE_IN_REVIEW }));

      await expect(
        d.service.createDeployment(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an artifact from another component', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findArtifactById.mockResolvedValue({
        id: ARTIFACT,
        serviceComponentId: 'other-component',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });

      await expect(
        d.service.createDeployment(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an inactive artifact', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findArtifactById.mockResolvedValue({
        id: ARTIFACT,
        serviceComponentId: COMPONENT,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.createDeployment(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('demands a readiness review with go in production', async () => {
      const d = build();
      wire(d);
      d.practicesRepo.findGoReview.mockResolvedValue(null);

      await expect(
        d.service.createDeployment(
          { ...dto, environment: 'PRODUCTION' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts production when the review says go', async () => {
      const d = build();
      wire(d);
      d.practicesRepo.findGoReview.mockResolvedValue({ id: 'review-1' });

      const res = await d.service.createDeployment(
        { ...dto, environment: 'PRODUCTION' },
        actor,
      );

      expect(res.id).toBe(DEPLOYMENT);
      expect(d.practicesRepo.findGoReview).toHaveBeenCalledWith(
        d.tx,
        COMPONENT,
        CONCEPTS.ORR_COMPLETED,
        CONCEPTS.ORR_DECISION_GO,
      );
    });

    it('refuses to deploy while the error budget freeze is active', async () => {
      const d = build();
      wire(d);
      d.reliabilityRepo.findFreezingPolicies.mockResolvedValue([
        { id: 'policy-1' },
      ]);
      d.reliabilityRepo.findLatestBurnEvent.mockResolvedValue({
        remainingBudgetPercent: '0.00000',
      });

      await expect(
        d.service.createDeployment(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('deploys when the budget still has room', async () => {
      const d = build();
      wire(d);
      d.reliabilityRepo.findFreezingPolicies.mockResolvedValue([
        { id: 'policy-1' },
      ]);
      d.reliabilityRepo.findLatestBurnEvent.mockResolvedValue({
        remainingBudgetPercent: '12.50000',
      });

      const res = await d.service.createDeployment(dto, actor);

      expect(res.id).toBe(DEPLOYMENT);
    });

    it('fails when the artifact does not exist', async () => {
      const d = build();
      wire(d);
      d.releasesRepo.findArtifactById.mockResolvedValue(null);

      await expect(
        d.service.createDeployment(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('rollbackDeployment (UC-46-05)', () => {
    /**
     * Ejecuta la operación current deployment.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de current deployment conforme al contrato `any`.
     */
    function currentDeployment(overrides: Record<string, unknown> = {}): any {
      return {
        id: DEPLOYMENT,
        serviceComponentId: COMPONENT,
        environmentConceptId: CONCEPTS.OPS_ENV_PRODUCTION,
        statusConceptId: CONCEPTS.DEPLOY_FAILED,
        isCurrent: true,
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación previous deployment.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de previous deployment conforme al contrato `any`.
     */
    function previousDeployment(overrides: Record<string, unknown> = {}): any {
      return {
        id: 'deployment-prev',
        serviceComponentId: COMPONENT,
        environmentConceptId: CONCEPTS.OPS_ENV_PRODUCTION,
        artifactId: 'artifact-prev',
        gitRef: 'v1.3.0',
        ...overrides,
      };
    }

    it('creates the reversion and marks the failed deployment as rolled back', async () => {
      const d = build();
      const source = currentDeployment();
      d.releasesRepo.findDeploymentForUpdate.mockResolvedValue(source);
      d.releasesRepo.findPreviousSucceededDeployment.mockResolvedValue(
        previousDeployment(),
      );
      d.releasesRepo.createDeployment.mockReturnValue({
        id: 'deployment-rollback',
      });

      const res = await d.service.rollbackDeployment(
        DEPLOYMENT,
        { reason: 'errores 5xx tras el despliegue' },
        actor,
      );

      expect(res).toEqual({
        id: 'deployment-rollback',
        deploymentNumber: 'DEP-000001',
        rolledBackDeploymentId: DEPLOYMENT,
        artifactId: 'artifact-prev',
      });
      expect(source.statusConceptId).toBe(CONCEPTS.DEPLOY_ROLLED_BACK);
      expect(source.isCurrent).toBe(false);
      expect(d.releasesRepo.createDeployment).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          strategyConceptId: CONCEPTS.DEPLOY_STRATEGY_RECREATE,
          statusConceptId: CONCEPTS.DEPLOY_SUCCEEDED,
          isCurrent: true,
          rollbackOfDeploymentId: DEPLOYMENT,
        }),
      );
    });

    it('honours an explicit rollback target', async () => {
      const d = build();
      d.releasesRepo.findDeploymentForUpdate.mockResolvedValue(
        currentDeployment(),
      );
      d.releasesRepo.findDeploymentById.mockResolvedValue(
        previousDeployment({
          id: 'deployment-chosen',
          artifactId: 'artifact-chosen',
        }),
      );
      d.releasesRepo.createDeployment.mockReturnValue({
        id: 'deployment-rollback',
      });

      const res = await d.service.rollbackDeployment(
        DEPLOYMENT,
        {
          reason: 'volver dos versiones',
          targetDeploymentId: 'deployment-chosen',
        },
        actor,
      );

      expect(res.artifactId).toBe('artifact-chosen');
      expect(
        d.releasesRepo.findPreviousSucceededDeployment,
      ).not.toHaveBeenCalled();
    });

    it('refuses a target from another component or environment', async () => {
      const d = build();
      d.releasesRepo.findDeploymentForUpdate.mockResolvedValue(
        currentDeployment(),
      );
      d.releasesRepo.findDeploymentById.mockResolvedValue(
        previousDeployment({ environmentConceptId: CONCEPTS.OPS_ENV_STAGING }),
      );

      await expect(
        d.service.rollbackDeployment(
          DEPLOYMENT,
          { reason: 'x', targetDeploymentId: 'deployment-prev' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to roll back a deployment that is no longer current', async () => {
      const d = build();
      d.releasesRepo.findDeploymentForUpdate.mockResolvedValue(
        currentDeployment({ isCurrent: false }),
      );

      await expect(
        d.service.rollbackDeployment(
          DEPLOYMENT,
          { reason: 'x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to roll back a deployment still in progress', async () => {
      const d = build();
      d.releasesRepo.findDeploymentForUpdate.mockResolvedValue(
        currentDeployment({ statusConceptId: CONCEPTS.DEPLOY_IN_PROGRESS }),
      );

      await expect(
        d.service.rollbackDeployment(
          DEPLOYMENT,
          { reason: 'x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses when there is nothing stable to go back to', async () => {
      const d = build();
      d.releasesRepo.findDeploymentForUpdate.mockResolvedValue(
        currentDeployment(),
      );
      d.releasesRepo.findPreviousSucceededDeployment.mockResolvedValue(null);

      await expect(
        d.service.rollbackDeployment(
          DEPLOYMENT,
          { reason: 'x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the deployment does not exist', async () => {
      const d = build();
      d.releasesRepo.findDeploymentForUpdate.mockResolvedValue(null);

      await expect(
        d.service.rollbackDeployment(
          DEPLOYMENT,
          { reason: 'x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
