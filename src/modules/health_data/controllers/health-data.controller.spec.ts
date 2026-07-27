import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { HealthDataController } from './health-data.controller';

const actor = { id: 'user-1', roles: ['HEALTH_DATA_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const ingestionService = {
    openBatch: mockFn(),
    recordIngestionRecord: mockFn(),
    closeBatch: mockFn(),
    projectResource: mockFn(),
  };
  const resourcesService = {
    registerIdentifier: mockFn(),
    createRelationship: mockFn(),
    createBinding: mockFn(),
    retireResource: mockFn(),
  };
  const validationService = {
    validateVersion: mockFn(),
    recordQualityRun: mockFn(),
  };
  const identityService = {
    resolveCandidate: mockFn(),
    projectTimelineEntry: mockFn(),
  };
  const releaseService = { recordDeidRun: mockFn() };
  return {
    controller: new HealthDataController(
      ingestionService as any,
      resourcesService as any,
      validationService as any,
      identityService as any,
      releaseService as any,
    ),
    ingestionService,
    resourcesService,
    validationService,
    identityService,
    releaseService,
  };
}

describe('HealthDataController', () => {
  it('delegates opening the batch (UC-52-01)', async () => {
    const d = build();
    const dto = { batchIdentifier: 'B-1' } as any;
    d.ingestionService.openBatch.mockResolvedValue({ id: ID });

    await d.controller.openBatch(dto, actor);

    expect(d.ingestionService.openBatch).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the record with the batch id (UC-52-02)', async () => {
    const d = build();
    const dto = { sourceRecordIdentifier: 'Patient/1' } as any;
    d.ingestionService.recordIngestionRecord.mockResolvedValue({ id: ID });

    await d.controller.recordIngestionRecord(ID, dto);

    expect(d.ingestionService.recordIngestionRecord).toHaveBeenCalledWith(
      ID,
      dto,
    );
  });

  it('delegates closing the batch (UC-52-02)', async () => {
    const d = build();
    const dto = {} as any;
    d.ingestionService.closeBatch.mockResolvedValue({ id: ID });

    await d.controller.closeBatch(ID, dto);

    expect(d.ingestionService.closeBatch).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates the canonical projection (UC-52-03)', async () => {
    const d = build();
    const dto = { logicalIdentifier: 'Patient/1' } as any;
    d.ingestionService.projectResource.mockResolvedValue({ resourceId: ID });

    await d.controller.projectResource(dto, actor);

    expect(d.ingestionService.projectResource).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the identifier with the resource id (UC-52-04)', async () => {
    const d = build();
    const dto = { identifierSystem: 's', identifierValue: 'v' } as any;
    d.resourcesService.registerIdentifier.mockResolvedValue({ id: ID });

    await d.controller.registerIdentifier(ID, dto);

    expect(d.resourcesService.registerIdentifier).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates the relationship (UC-52-05)', async () => {
    const d = build();
    const dto = { targetResourceId: ID } as any;
    d.resourcesService.createRelationship.mockResolvedValue({ id: ID });

    await d.controller.createRelationship(ID, dto);

    expect(d.resourcesService.createRelationship).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates the domain binding (UC-52-06)', async () => {
    const d = build();
    const dto = { domainEntityId: ID } as any;
    d.resourcesService.createBinding.mockResolvedValue({ id: ID });

    await d.controller.createBinding(ID, dto);

    expect(d.resourcesService.createBinding).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates the FHIR validation with the version id (UC-52-07)', async () => {
    const d = build();
    const dto = { fhirProfileVersionId: ID } as any;
    d.validationService.validateVersion.mockResolvedValue({ id: ID });

    await d.controller.validateVersion(ID, dto);

    expect(d.validationService.validateVersion).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates the quality run (UC-52-08)', async () => {
    const d = build();
    const dto = { healthDataQualityRuleSetId: ID } as any;
    d.validationService.recordQualityRun.mockResolvedValue({ id: ID });

    await d.controller.recordQualityRun(dto, actor);

    expect(d.validationService.recordQualityRun).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates the identity decision with the candidate id (UC-52-09)', async () => {
    const d = build();
    const dto = { decision: 'MATCH', reasonText: 'x' } as any;
    d.identityService.resolveCandidate.mockResolvedValue({ id: ID });

    await d.controller.resolveCandidate(ID, dto, actor);

    expect(d.identityService.resolveCandidate).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the timeline projection (UC-52-10)', async () => {
    const d = build();
    const dto = { patientProfileId: ID } as any;
    d.identityService.projectTimelineEntry.mockResolvedValue({ id: ID });

    await d.controller.projectTimelineEntry(dto);

    expect(d.identityService.projectTimelineEntry).toHaveBeenCalledWith(dto);
  });

  it('delegates the de-identification run (UC-52-11)', async () => {
    const d = build();
    const dto = { healthDeidentificationProfileId: ID } as any;
    d.releaseService.recordDeidRun.mockResolvedValue({ id: ID });

    await d.controller.recordDeidRun(dto, actor);

    expect(d.releaseService.recordDeidRun).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates retiring the resource (UC-52-14)', async () => {
    const d = build();
    const dto = { reason: 'x' } as any;
    d.resourcesService.retireResource.mockResolvedValue({ id: ID });

    await d.controller.retireResource(ID, dto, actor);

    expect(d.resourcesService.retireResource).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});
