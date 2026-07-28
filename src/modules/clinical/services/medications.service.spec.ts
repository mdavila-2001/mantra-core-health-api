import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { MedicationsService } from './medications.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const requestsRepo = { findById: mockFn(), create: mockFn() };
  const recordsRepo = { create: mockFn() };
  // Por defecto FAIL-SAFE: sin política, la firma no se exige.
  const signaturePolicies = {
    isSignatureRequired: mockFn().mockResolvedValue(false),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new MedicationsService(
    em as any,
    requestsRepo,
    recordsRepo as any,
    signaturePolicies as any,
    logger as any,
  );
  return { service, requestsRepo, recordsRepo, signaturePolicies };
}

describe('MedicationsService', () => {
  describe('prescribe (UC-08-10)', () => {
    it('prescribes a medication as an editable DRAFT', async () => {
      const d = build();
      d.requestsRepo.create.mockReturnValue({
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        createdAt: new Date(),
      });
      const res = await d.service.prescribe(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          medicationConceptId: 'm1',
        },
        actor,
      );
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
      expect(d.requestsRepo.create.mock.calls[0][1].statusConceptId).toBe(
        CLIN.MEDICATION_REQUEST_DRAFT,
      );
    });
  });

  describe('editDraft (immutability guard)', () => {
    it('edits clinical items while in DRAFT', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      await d.service.editDraft('mr1', { doseText: '500mg' }, actor);
      expect(request.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
      expect((request as any).doseText).toBe('500mg');
    });

    it('rejects editing an issued (immutable) request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
      });
      await expect(
        d.service.editDraft('mr1', { doseText: 'x' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the request is missing', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.editDraft('missing', {}, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('issue (DRAFT → ISSUED, seals content)', () => {
    it('issues a draft and stamps issuedAt', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.issue('mr1', actor);
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
      expect(request.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
      expect((request as any).issuedAt).toBeInstanceOf(Date);
    });

    it('rejects issuing a non-draft request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
      });
      await expect(d.service.issue('mr1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('issues without signature when no policy applies (fail-safe, flow intact)', async () => {
      const d = build();
      // isSignatureRequired ya devuelve false por defecto.
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        custodianTenantId: 't1',
        medicationConceptId: 'm1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.issue('mr1', actor);
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
      expect(d.signaturePolicies.isSignatureRequired).toHaveBeenCalledWith(
        't1',
        { medicationType: 'm1' },
      );
    });

    it('rejects issuing an unsigned request when the policy requires a signature', async () => {
      const d = build();
      d.signaturePolicies.isSignatureRequired.mockResolvedValue(true);
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        custodianTenantId: 't1',
        medicationConceptId: 'm1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      await expect(d.service.issue('mr1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      // No debe emitirse.
      expect(request.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
    });

    it('issues a signed request even when the policy requires a signature', async () => {
      const d = build();
      d.signaturePolicies.isSignatureRequired.mockResolvedValue(true);
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        custodianTenantId: 't1',
        medicationConceptId: 'm1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        signedAt: new Date(),
        signedByUserId: 'user-1',
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.issue('mr1', actor);
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
      // Ya estaba firmada: ni siquiera se consulta la política.
      expect(d.signaturePolicies.isSignatureRequired).not.toHaveBeenCalled();
    });
  });

  describe('sign (REDESA D-05, additive)', () => {
    it('stamps signedAt/signedByUserId on a draft', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.sign('mr1', actor);
      expect((request as any).signedAt).toBeInstanceOf(Date);
      expect((request as any).signedByUserId).toBe('user-1');
      expect(res.signedAt).toBeInstanceOf(Date);
    });

    it('rejects signing a non-draft request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
      });
      await expect(d.service.sign('mr1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('invalidate (reason mandatory, preserved)', () => {
    it('invalidates an issued request keeping the reason', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.invalidate(
        'mr1',
        { reasonText: 'dosis errónea' },
        actor,
      );
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_INVALIDATED);
      expect((request as any).statusReasonText).toBe('dosis errónea');
    });

    it('rejects invalidating a draft', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
      });
      await expect(
        d.service.invalidate('mr1', { reasonText: 'x' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('replace (invalidate + new related request)', () => {
    it('marks the original REPLACED and returns a new DRAFT linked via replaces', async () => {
      const d = build();
      const original = {
        id: 'mr1',
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        medicationConceptId: 'm1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(original);
      d.requestsRepo.create.mockReturnValue({
        id: 'mr2',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        replacesRequestId: 'mr1',
        createdAt: new Date(),
      });

      const res = await d.service.replace(
        'mr1',
        { reasonText: 'corrección de dosis', doseText: '250mg' },
        actor,
      );

      expect(res.id).toBe('mr2');
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
      expect(res.replacesRequestId).toBe('mr1');
      expect(original.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_REPLACED);
      expect((original as any).replacedByRequestId).toBe('mr2');
      expect((original as any).statusReasonText).toBe('corrección de dosis');
      expect(d.requestsRepo.create.mock.calls[0][1].replacesRequestId).toBe(
        'mr1',
      );
      expect(d.requestsRepo.create.mock.calls[0][1].doseText).toBe('250mg');
    });

    it('rejects replacing a non-issued request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
      });
      await expect(
        d.service.replace('mr1', { reasonText: 'x' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('renew (new request copying data)', () => {
    it('creates a new DRAFT copy linked via renewed_from and leaves the source intact', async () => {
      const d = build();
      const source = {
        id: 'mr1',
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        medicationConceptId: 'm1',
        doseText: '500mg',
        statusConceptId: CLIN.MEDICATION_REQUEST_COMPLETED,
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(source);
      d.requestsRepo.create.mockReturnValue({
        id: 'mr3',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        renewedFromRequestId: 'mr1',
        createdAt: new Date(),
      });

      const res = await d.service.renew('mr1', {}, actor);

      expect(res.id).toBe('mr3');
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
      expect(res.renewedFromRequestId).toBe('mr1');
      // La original no cambia de estado.
      expect(source.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_COMPLETED);
      expect(d.requestsRepo.create.mock.calls[0][1].renewedFromRequestId).toBe(
        'mr1',
      );
      expect(d.requestsRepo.create.mock.calls[0][1].doseText).toBe('500mg');
    });

    it('rejects renewing a draft', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
      });
      await expect(d.service.renew('mr1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('administer (UC-08-11)', () => {
    it('records an administration and completes the issued request on the final dose', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
        updatedAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      d.recordsRepo.create.mockReturnValue({
        id: 'rec1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_RECORD_COMPLETED,
        requestId: 'mr1',
        createdAt: new Date(),
      });

      const res = await d.service.administer(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          medicationConceptId: 'm1',
          requestId: 'mr1',
          isFinalDose: true,
        },
        actor,
      );

      expect(request.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_COMPLETED);
      expect(res.status).toBe(CLIN.MEDICATION_RECORD_COMPLETED);
    });

    it('throws when the referenced request is missing', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.administer(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            medicationConceptId: 'm1',
            requestId: 'missing',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects administering against a non-issued request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
      });
      await expect(
        d.service.administer(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            medicationConceptId: 'm1',
            requestId: 'mr1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
