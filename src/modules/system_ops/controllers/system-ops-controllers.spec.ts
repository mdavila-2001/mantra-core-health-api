import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { RetentionExecutionController } from './retention-execution.controller';
import { ResidencyController } from './residency.controller';
import { LegalHoldController } from './legal-hold.controller';
import { BackupController } from './backup.controller';
import { RestoreTestController } from './restore-test.controller';
import { AssessmentController } from './assessment.controller';
import { DraftController } from './draft.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('RetentionExecutionController (UC-11-05)', () => {
  it('delegates run', async () => {
    const service = { run: mockFn() };
    const controller = new RetentionExecutionController(service as any);
    await controller.run(
      { retentionPolicyId: 'p', entityRegistryId: 'e' },
      actor,
    );
    expect(service.run).toHaveBeenCalledWith(
      { retentionPolicyId: 'p', entityRegistryId: 'e' },
      actor,
    );
  });
});

describe('ResidencyController (UC-11-06/07)', () => {
  function build() {
    const service = {
      createResidencyPolicy: mockFn(),
      createBinding: mockFn(),
      recordTransfer: mockFn(),
    };
    return { controller: new ResidencyController(service as any), service };
  }
  it('delegates createResidencyPolicy', async () => {
    const d = build();
    await d.controller.createResidencyPolicy({ code: 'r' } as any, actor);
    expect(d.service.createResidencyPolicy).toHaveBeenCalledWith(
      { code: 'r' },
      actor,
    );
  });
  it('delegates createBinding', async () => {
    const d = build();
    await d.controller.createBinding({ tenantId: 't' } as any, actor);
    expect(d.service.createBinding).toHaveBeenCalledWith(
      { tenantId: 't' },
      actor,
    );
  });
  it('delegates recordTransfer', async () => {
    const d = build();
    await d.controller.recordTransfer({ transferReference: 'x' } as any, actor);
    expect(d.service.recordTransfer).toHaveBeenCalledWith(
      { transferReference: 'x' },
      actor,
    );
  });
});

describe('LegalHoldController (UC-11-08)', () => {
  function build() {
    const service = { place: mockFn(), release: mockFn() };
    return { controller: new LegalHoldController(service as any), service };
  }
  it('delegates place', async () => {
    const d = build();
    await d.controller.place({ tenantId: 't' } as any, actor);
    expect(d.service.place).toHaveBeenCalledWith({ tenantId: 't' }, actor);
  });
  it('delegates release', async () => {
    const d = build();
    await d.controller.release('h1', { reason: 'x' }, actor);
    expect(d.service.release).toHaveBeenCalledWith(
      'h1',
      { reason: 'x' },
      actor,
    );
  });
});

describe('BackupController (UC-11-09)', () => {
  it('delegates createPolicy', async () => {
    const service = { createPolicy: mockFn() };
    const controller = new BackupController(service as any);
    await controller.createPolicy({ tenantId: 't' } as any, actor);
    expect(service.createPolicy).toHaveBeenCalledWith({ tenantId: 't' }, actor);
  });
});

describe('RestoreTestController (UC-11-10)', () => {
  it('delegates recordRestoreTest', async () => {
    const service = { recordRestoreTest: mockFn() };
    const controller = new RestoreTestController(service as any);
    await controller.recordRestoreTest({ backupPolicyId: 'b' } as any, actor);
    expect(service.recordRestoreTest).toHaveBeenCalledWith(
      { backupPolicyId: 'b' },
      actor,
    );
  });
});

describe('AssessmentController (UC-11-11..14)', () => {
  function build() {
    const service = {
      publishFramework: mockFn(),
      createAssessment: mockFn(),
      putControlResults: mockFn(),
      createFinding: mockFn(),
      createRemediationPlan: mockFn(),
      verifyAction: mockFn(),
      updateFinding: mockFn(),
    };
    return { controller: new AssessmentController(service as any), service };
  }
  it('delegates publishFramework', async () => {
    const d = build();
    await d.controller.publishFramework({ code: 'c' } as any, actor);
    expect(d.service.publishFramework).toHaveBeenCalledWith(
      { code: 'c' },
      actor,
    );
  });
  it('delegates createAssessment', async () => {
    const d = build();
    await d.controller.createAssessment({ tenantId: 't' } as any, actor);
    expect(d.service.createAssessment).toHaveBeenCalledWith(
      { tenantId: 't' },
      actor,
    );
  });
  it('delegates putControlResults', async () => {
    const d = build();
    await d.controller.putControlResults('a1', { results: [] }, actor);
    expect(d.service.putControlResults).toHaveBeenCalledWith(
      'a1',
      { results: [] },
      actor,
    );
  });
  it('delegates createFinding', async () => {
    const d = build();
    await d.controller.createFinding('a1', { findingCode: 'f' } as any, actor);
    expect(d.service.createFinding).toHaveBeenCalledWith(
      'a1',
      { findingCode: 'f' },
      actor,
    );
  });
  it('delegates createRemediationPlan', async () => {
    const d = build();
    await d.controller.createRemediationPlan('a1', { code: 'p' } as any, actor);
    expect(d.service.createRemediationPlan).toHaveBeenCalledWith(
      'a1',
      { code: 'p' },
      actor,
    );
  });
  it('delegates verifyAction', async () => {
    const d = build();
    await d.controller.verifyAction(
      'ra1',
      { verificationEvidenceJson: {} },
      actor,
    );
    expect(d.service.verifyAction).toHaveBeenCalledWith(
      'ra1',
      { verificationEvidenceJson: {} },
      actor,
    );
  });
  it('delegates updateFinding', async () => {
    const d = build();
    await d.controller.updateFinding('f1', { ownerTeam: 'x' }, actor);
    expect(d.service.updateFinding).toHaveBeenCalledWith(
      'f1',
      { ownerTeam: 'x' },
      actor,
    );
  });
});

describe('DraftController (UC-11-15)', () => {
  function build() {
    const service = { createDraft: mockFn(), publishDraft: mockFn() };
    return { controller: new DraftController(service as any), service };
  }
  it('delegates createDraft', async () => {
    const d = build();
    await d.controller.createDraft({ schemaName: 's' } as any, actor);
    expect(d.service.createDraft).toHaveBeenCalledWith(
      { schemaName: 's' },
      actor,
    );
  });
  it('delegates publishDraft', async () => {
    const d = build();
    await d.controller.publishDraft('dr1', { publishReference: 'r' }, actor);
    expect(d.service.publishDraft).toHaveBeenCalledWith(
      'dr1',
      { publishReference: 'r' },
      actor,
    );
  });
});
