import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ObjectStorageController } from './object-storage.controller';

const actor = { id: 'user-1', roles: ['STORAGE_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';
const HOLD = '22222222-2222-2222-2222-222222222222';

function build() {
  const storageService = {
    initiateUpload: mockFn(),
    completeUpload: mockFn(),
    createVersion: mockFn(),
    registerLargePayload: mockFn(),
    issueSignedUrl: mockFn(),
  };
  const dicomService = { catalogStudy: mockFn() };
  const governanceService = {
    applyRetentionLock: mockFn(),
    placeLegalHold: mockFn(),
    releaseLegalHold: mockFn(),
    recordIntegrityCheck: mockFn(),
    buildArchiveJob: mockFn(),
    requestDeletion: mockFn(),
  };
  return {
    controller: new ObjectStorageController(
      storageService as any,
      dicomService as any,
      governanceService as any,
    ),
    storageService,
    dicomService,
    governanceService,
  };
}

describe('ObjectStorageController', () => {
  it('delegates initiating the upload with the namespace code (UC-60-01)', async () => {
    const d = build();
    const dto = { providerUploadId: 'up-1' } as any;
    d.storageService.initiateUpload.mockResolvedValue({ id: ID });

    await d.controller.initiateUpload('clinical-media', dto);

    expect(d.storageService.initiateUpload).toHaveBeenCalledWith(
      'clinical-media',
      dto,
    );
  });

  it('delegates completing the upload (UC-60-02)', async () => {
    const d = build();
    const dto = { sha256: 'a' } as any;
    d.storageService.completeUpload.mockResolvedValue({ manifestId: ID });

    await d.controller.completeUpload(ID, dto);

    expect(d.storageService.completeUpload).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates creating a version (UC-60-03)', async () => {
    const d = build();
    const dto = { sha256: 'b' } as any;
    d.storageService.createVersion.mockResolvedValue({ manifestId: ID });

    await d.controller.createVersion(ID, dto);

    expect(d.storageService.createVersion).toHaveBeenCalledWith(ID, dto);
  });

  it('delegates cataloguing the DICOM study (UC-60-04)', async () => {
    const d = build();
    const dto = { studyInstanceUid: '1.2.3', series: [] } as any;
    d.dicomService.catalogStudy.mockResolvedValue({ studyId: ID });

    await d.controller.catalogDicomStudy(dto, actor);

    expect(d.dicomService.catalogStudy).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates registering the large payload (UC-60-06)', async () => {
    const d = build();
    const dto = { objectManifestId: ID } as any;
    d.storageService.registerLargePayload.mockResolvedValue({ id: ID });

    await d.controller.registerLargePayload(dto);

    expect(d.storageService.registerLargePayload).toHaveBeenCalledWith(dto);
  });

  it('delegates the retention lock (UC-60-07)', async () => {
    const d = build();
    const dto = { lockMode: 'compliance' } as any;
    d.governanceService.applyRetentionLock.mockResolvedValue({ id: ID });

    await d.controller.applyRetentionLock(ID, dto);

    expect(d.governanceService.applyRetentionLock).toHaveBeenCalledWith(
      ID,
      dto,
    );
  });

  it('delegates placing the legal hold (UC-60-08)', async () => {
    const d = build();
    const dto = { legalCaseReference: 'CASO-1' } as any;
    d.governanceService.placeLegalHold.mockResolvedValue({ id: HOLD });

    await d.controller.placeLegalHold(ID, dto, actor);

    expect(d.governanceService.placeLegalHold).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates releasing the legal hold with both ids (UC-60-08)', async () => {
    const d = build();
    d.governanceService.releaseLegalHold.mockResolvedValue({ id: HOLD });

    await d.controller.releaseLegalHold(ID, HOLD, actor);

    expect(d.governanceService.releaseLegalHold).toHaveBeenCalledWith(
      ID,
      HOLD,
      actor,
    );
  });

  it('delegates issuing the signed access (UC-60-09)', async () => {
    const d = build();
    const dto = { purposeOfUseCode: 'TREATMENT' } as any;
    d.storageService.issueSignedUrl.mockResolvedValue({ objectVersionId: ID });

    await d.controller.issueSignedUrl(ID, dto, actor);

    expect(d.storageService.issueSignedUrl).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the integrity check (UC-60-10)', async () => {
    const d = build();
    const dto = { actualHash: 'a' } as any;
    d.governanceService.recordIntegrityCheck.mockResolvedValue({ id: ID });

    await d.controller.recordIntegrityCheck(ID, dto);

    expect(d.governanceService.recordIntegrityCheck).toHaveBeenCalledWith(
      ID,
      dto,
    );
  });

  it('delegates the archive job (UC-60-11)', async () => {
    const d = build();
    const dto = { objectManifestId: ID } as any;
    d.governanceService.buildArchiveJob.mockResolvedValue({ id: ID });

    await d.controller.buildArchiveJob(dto);

    expect(d.governanceService.buildArchiveJob).toHaveBeenCalledWith(dto);
  });

  it('delegates the deletion request (UC-60-12)', async () => {
    const d = build();
    const dto = { reason: 'x' } as any;
    d.governanceService.requestDeletion.mockResolvedValue({ id: ID });

    await d.controller.requestDeletion(ID, dto, actor);

    expect(d.governanceService.requestDeletion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});
