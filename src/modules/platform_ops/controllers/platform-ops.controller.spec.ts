import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PlatformOpsController } from './platform-ops.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const releasesService = {
    createChangeRequest: mockFn(),
    recordApproval: mockFn(),
    publishArtifact: mockFn(),
    createDeployment: mockFn(),
    rollbackDeployment: mockFn(),
  };
  const incidentsService = {
    recordHealthRun: mockFn(),
    updateIncident: mockFn(),
    openPostmortem: mockFn(),
  };
  const reliabilityService = {
    recordSloMeasurement: mockFn(),
    recordBurnEvent: mockFn(),
    recordCapacityMeasurement: mockFn(),
  };
  const practicesService = {
    completeReadinessReview: mockFn(),
    publishRunbookVersion: mockFn(),
    recordRunbookExecution: mockFn(),
    completeResilienceExercise: mockFn(),
  };
  return {
    controller: new PlatformOpsController(
      releasesService as any,
      incidentsService as any,
      reliabilityService as any,
      practicesService as any,
    ),
    releasesService,
    incidentsService,
    reliabilityService,
    practicesService,
  };
}

describe('PlatformOpsController', () => {
  it('delegates the change request (UC-46-01)', async () => {
    const d = build();
    const dto = { title: 'x' } as any;
    d.releasesService.createChangeRequest.mockResolvedValue({ id: ID });

    await d.controller.createChangeRequest(dto, actor);

    expect(d.releasesService.createChangeRequest).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates the approval with the route id (UC-46-02)', async () => {
    const d = build();
    const dto = { approvalStep: 1, decision: 'APPROVED' } as any;
    d.releasesService.recordApproval.mockResolvedValue({ id: ID });

    await d.controller.recordApproval(ID, dto, actor);

    expect(d.releasesService.recordApproval).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates publishing the artifact (UC-46-03)', async () => {
    const d = build();
    const dto = { artifactRef: 'ref' } as any;
    d.releasesService.publishArtifact.mockResolvedValue({ id: ID });

    await d.controller.publishArtifact(dto, actor);

    expect(d.releasesService.publishArtifact).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the deployment (UC-46-04)', async () => {
    const d = build();
    const dto = { artifactId: ID } as any;
    d.releasesService.createDeployment.mockResolvedValue({ id: ID });

    await d.controller.createDeployment(dto, actor);

    expect(d.releasesService.createDeployment).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the rollback with the route id (UC-46-05)', async () => {
    const d = build();
    const dto = { reason: 'x' } as any;
    d.releasesService.rollbackDeployment.mockResolvedValue({ id: ID });

    await d.controller.rollbackDeployment(ID, dto, actor);

    expect(d.releasesService.rollbackDeployment).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the health check run with the route id (UC-46-06)', async () => {
    const d = build();
    const dto = { status: 'FAIL', source: 'SCHEDULER' } as any;
    d.incidentsService.recordHealthRun.mockResolvedValue({ id: ID });

    await d.controller.recordHealthRun(ID, dto, actor);

    expect(d.incidentsService.recordHealthRun).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the incident update with the route id (UC-46-07)', async () => {
    const d = build();
    const dto = { transition: 'ACKNOWLEDGE' } as any;
    d.incidentsService.updateIncident.mockResolvedValue({ id: ID });

    await d.controller.updateIncident(ID, dto, actor);

    expect(d.incidentsService.updateIncident).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates opening the postmortem (UC-46-08)', async () => {
    const d = build();
    const dto = { title: 'x', actionItems: [] } as any;
    d.incidentsService.openPostmortem.mockResolvedValue({ id: ID });

    await d.controller.openPostmortem(ID, dto, actor);

    expect(d.incidentsService.openPostmortem).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the SLO measurement (UC-46-09)', async () => {
    const d = build();
    const dto = { goodEvents: '1', totalEvents: '1' } as any;
    d.reliabilityService.recordSloMeasurement.mockResolvedValue({ id: ID });

    await d.controller.recordSloMeasurement(ID, dto, actor);

    expect(d.reliabilityService.recordSloMeasurement).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the burn event with the policy id (UC-46-10)', async () => {
    const d = build();
    const dto = { burnRate: '3' } as any;
    d.reliabilityService.recordBurnEvent.mockResolvedValue({ id: ID });

    await d.controller.recordBurnEvent(ID, dto, actor);

    expect(d.reliabilityService.recordBurnEvent).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the capacity measurement (UC-46-11)', async () => {
    const d = build();
    const dto = { metric: 'CPU' } as any;
    d.reliabilityService.recordCapacityMeasurement.mockResolvedValue({
      id: ID,
    });

    await d.controller.recordCapacityMeasurement(ID, dto, actor);

    expect(d.reliabilityService.recordCapacityMeasurement).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates completing the readiness review (UC-46-12)', async () => {
    const d = build();
    const dto = { decision: 'GO' } as any;
    d.practicesService.completeReadinessReview.mockResolvedValue({ id: ID });

    await d.controller.completeReadinessReview(ID, dto, actor);

    expect(d.practicesService.completeReadinessReview).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates publishing the runbook version (UC-46-13)', async () => {
    const d = build();
    const dto = { contentMarkdown: '# x' } as any;
    d.practicesService.publishRunbookVersion.mockResolvedValue({ id: ID });

    await d.controller.publishRunbookVersion(ID, dto, actor);

    expect(d.practicesService.publishRunbookVersion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the runbook execution (UC-46-13)', async () => {
    const d = build();
    const dto = { runbookVersionId: ID } as any;
    d.practicesService.recordRunbookExecution.mockResolvedValue({ id: ID });

    await d.controller.recordRunbookExecution(dto, actor);

    expect(d.practicesService.recordRunbookExecution).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates completing the resilience exercise (UC-46-14)', async () => {
    const d = build();
    const dto = { observedRtoSeconds: '900' } as any;
    d.practicesService.completeResilienceExercise.mockResolvedValue({ id: ID });

    await d.controller.completeResilienceExercise(ID, dto, actor);

    expect(d.practicesService.completeResilienceExercise).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});
