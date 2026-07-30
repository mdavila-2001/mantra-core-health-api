import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartNotesService } from './chart-notes.service';
import { CHART } from '../chart.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  ConflictException,
} from '../../../common';

const actor = { id: 'clin-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const notesRepo = {
    findHeaderById: mockFn(),
    findVersionById: mockFn(),
    maxVersionNumber: mockFn().mockResolvedValue(0),
    findSignatures: mockFn().mockResolvedValue([]),
    createHeader: mockFn(),
    createVersion: mockFn(),
    createSignature: mockFn(),
    createReleaseEvent: mockFn(),
    createExamFinding: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ChartNotesService(em as any, notesRepo, logger as any);
  return { service, tx, em, notesRepo };
}

describe('ChartNotesService', () => {
  describe('createNote (UC-15-01)', () => {
    it('flushes the header before creating version 1 and links currentVersionId', async () => {
      const d = build();
      const header: any = {
        id: 'h1',
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
        updatedAt: new Date(),
      };
      const version: any = {
        id: 'v1',
        versionNumber: 1,
        statusConceptId: CHART.VERSION_DRAFT,
      };
      d.notesRepo.createHeader.mockReturnValue(header);
      d.notesRepo.createVersion.mockReturnValue(version);

      const res = await d.service.createNote(
        {
          patientProfileId: 'p1',
          authorProfileId: 'a1',
          subjectiveText: 's',
        },
        actor,
      );

      expect(d.tx.flush).toHaveBeenCalledTimes(2);
      expect(header.currentVersionId).toBe('v1');
      expect(res).toEqual({
        noteId: 'h1',
        versionId: 'v1',
        versionNumber: 1,
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
        versionStatusConceptId: CHART.VERSION_DRAFT,
      });
    });
  });

  describe('addVersion (UC-15-02)', () => {
    it('rejects when the note is no longer a draft (must amend)', async () => {
      const d = build();
      d.notesRepo.findHeaderById.mockResolvedValue({
        id: 'h1',
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_SIGNED,
      });
      await expect(
        d.service.addVersion('h1', { authorProfileId: 'a1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('appends version n+1 and moves currentVersionId', async () => {
      const d = build();
      const header: any = {
        id: 'h1',
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
        updatedAt: new Date(),
      };
      d.notesRepo.findHeaderById.mockResolvedValue(header);
      d.notesRepo.maxVersionNumber.mockResolvedValue(1);
      d.notesRepo.createVersion.mockReturnValue({
        id: 'v2',
        versionNumber: 2,
        statusConceptId: CHART.VERSION_DRAFT,
      });

      await d.service.addVersion('h1', { authorProfileId: 'a1' }, actor);
      expect(d.notesRepo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          versionNumber: 2,
          supersedesVersionId: 'v1',
        }),
      );
      expect(header.currentVersionId).toBe('v2');
    });
  });

  describe('signVersion (UC-15-03)', () => {
    it('rejects signing a non-draft version', async () => {
      const d = build();
      d.notesRepo.findVersionById.mockResolvedValue({
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_SIGNED,
      });
      d.notesRepo.findHeaderById.mockResolvedValue({ id: 'h1' });
      await expect(
        d.service.signVersion(
          'h1',
          'v1',
          { signerProfileId: 's1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('freezes content hash, seals the version and marks the header signed', async () => {
      const d = build();
      const version: any = {
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_DRAFT,
        subjectiveText: 's',
      };
      const header: any = {
        id: 'h1',
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
        updatedAt: new Date(),
      };
      d.notesRepo.findVersionById.mockResolvedValue(version);
      d.notesRepo.findHeaderById.mockResolvedValue(header);

      await d.service.signVersion('h1', 'v1', { signerProfileId: 's1' }, actor);

      expect(version.statusConceptId).toBe(CHART.VERSION_SIGNED);
      expect(version.contentHash).toEqual(expect.any(String));
      expect(version.releaseEligibilityConceptId).toBe(
        CHART.ELIGIBILITY_ELIGIBLE,
      );
      expect(header.lifecycleStatusConceptId).toBe(CHART.NOTE_LIFECYCLE_SIGNED);
      expect(d.notesRepo.createSignature).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          signatureTypeConceptId: CHART.SIGNATURE_AUTHOR,
        }),
      );
    });

    it('throws when version does not belong to the note', async () => {
      const d = build();
      d.notesRepo.findVersionById.mockResolvedValue({
        id: 'v1',
        clinicalNoteId: 'other',
        statusConceptId: CHART.VERSION_DRAFT,
      });
      await expect(
        d.service.signVersion(
          'h1',
          'v1',
          { signerProfileId: 's1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('cosignVersion (UC-15-04)', () => {
    it('rejects a duplicate cosignature from the same signer', async () => {
      const d = build();
      d.notesRepo.findVersionById.mockResolvedValue({
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_SIGNED,
        contentHash: 'x',
      });
      d.notesRepo.findHeaderById.mockResolvedValue({ id: 'h1' });
      d.notesRepo.findSignatures.mockResolvedValue([
        {
          signatureTypeConceptId: CHART.SIGNATURE_AUTHOR,
          signerProfileId: 'a1',
        },
        {
          signatureTypeConceptId: CHART.SIGNATURE_COSIGN,
          signerProfileId: 's2',
        },
      ]);
      await expect(
        d.service.cosignVersion(
          'h1',
          'v1',
          { signerProfileId: 's2' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('cosigns a signed version and marks it COSIGNED + eligible', async () => {
      const d = build();
      const version: any = {
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_SIGNED,
        contentHash: 'x',
      };
      d.notesRepo.findVersionById.mockResolvedValue(version);
      d.notesRepo.findHeaderById.mockResolvedValue({
        id: 'h1',
        updatedAt: new Date(),
      });
      d.notesRepo.findSignatures.mockResolvedValue([
        {
          signatureTypeConceptId: CHART.SIGNATURE_AUTHOR,
          signerProfileId: 'a1',
        },
      ]);

      await d.service.cosignVersion(
        'h1',
        'v1',
        { signerProfileId: 's2' },
        actor,
      );
      expect(version.statusConceptId).toBe(CHART.VERSION_COSIGNED);
      expect(version.releaseEligibilityConceptId).toBe(
        CHART.ELIGIBILITY_ELIGIBLE,
      );
    });
  });

  describe('amendNote (UC-15-05)', () => {
    it('rejects amending a draft note (edit instead)', async () => {
      const d = build();
      d.notesRepo.findHeaderById.mockResolvedValue({
        id: 'h1',
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
      });
      await expect(
        d.service.amendNote(
          'h1',
          { authorProfileId: 'a1', amendmentReasonText: 'typo' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('appends an amendment version superseding the signed one', async () => {
      const d = build();
      const header: any = {
        id: 'h1',
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_SIGNED,
        updatedAt: new Date(),
      };
      d.notesRepo.findHeaderById.mockResolvedValue(header);
      d.notesRepo.maxVersionNumber.mockResolvedValue(1);
      d.notesRepo.createVersion.mockReturnValue({
        id: 'v2',
        versionNumber: 2,
        statusConceptId: CHART.VERSION_DRAFT,
      });

      await d.service.amendNote(
        'h1',
        { authorProfileId: 'a1', amendmentReasonText: 'clarify' },
        actor,
      );
      expect(d.notesRepo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          versionNumber: 2,
          supersedesVersionId: 'v1',
          amendmentReasonText: 'clarify',
        }),
      );
      expect(header.lifecycleStatusConceptId).toBe(
        CHART.NOTE_LIFECYCLE_AMENDED,
      );
    });
  });

  describe('releaseVersion (UC-15-06)', () => {
    it('rejects when the version is not eligible', async () => {
      const d = build();
      d.notesRepo.findVersionById.mockResolvedValue({
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_SIGNED,
        releaseEligibilityConceptId: undefined,
      });
      await expect(
        d.service.releaseVersion('v1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('records a release event and flips the header to RELEASED', async () => {
      const d = build();
      const header: any = {
        id: 'h1',
        patientProfileId: 'p1',
        updatedAt: new Date(),
      };
      d.notesRepo.findVersionById.mockResolvedValue({
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_COSIGNED,
        releaseEligibilityConceptId: CHART.ELIGIBILITY_ELIGIBLE,
      });
      d.notesRepo.findHeaderById.mockResolvedValue(header);
      d.notesRepo.createReleaseEvent.mockReturnValue({ id: 'e1' });

      const res = await d.service.releaseVersion(
        'v1',
        { policyVersion: 'v1' },
        actor,
      );
      expect(res.patientReleaseStatusConceptId).toBe(CHART.RELEASE_RELEASED);
      expect(header.currentReleasedVersionId).toBe('v1');
      expect(d.notesRepo.createReleaseEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          actionConceptId: CHART.RELEASE_ACTION_RELEASE,
          resultingVisibilityConceptId: CHART.VISIBILITY_PATIENT_VISIBLE,
        }),
      );
    });
  });

  describe('withholdVersion (UC-15-07)', () => {
    it('records a withhold event with a default legal reason and flips to WITHHELD', async () => {
      const d = build();
      const header: any = {
        id: 'h1',
        patientProfileId: 'p1',
        currentReleasedVersionId: 'v1',
        updatedAt: new Date(),
      };
      d.notesRepo.findVersionById.mockResolvedValue({
        id: 'v1',
        clinicalNoteId: 'h1',
      });
      d.notesRepo.findHeaderById.mockResolvedValue(header);
      d.notesRepo.createReleaseEvent.mockReturnValue({ id: 'e2' });

      const res = await d.service.withholdVersion('v1', {}, actor);
      expect(res.patientReleaseStatusConceptId).toBe(CHART.RELEASE_WITHHELD);
      expect(header.currentReleasedVersionId).toBeUndefined();
      expect(d.notesRepo.createReleaseEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          actionConceptId: CHART.RELEASE_ACTION_WITHHOLD,
          reasonConceptId: CHART.WITHHOLD_REASON_LEGAL,
        }),
      );
    });
  });

  describe('recordExamFindings (UC-15-08)', () => {
    it('rejects recording on a signed version', async () => {
      const d = build();
      d.notesRepo.findVersionById.mockResolvedValue({
        id: 'v1',
        statusConceptId: CHART.VERSION_SIGNED,
      });
      await expect(
        d.service.recordExamFindings('v1', { findings: [{}] } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('inserts one finding per entry with a default body system', async () => {
      const d = build();
      const version: any = { id: 'v1', statusConceptId: CHART.VERSION_DRAFT };
      d.notesRepo.findVersionById.mockResolvedValue(version);

      const res = await d.service.recordExamFindings(
        'v1',
        {
          findings: [{ isNormal: true }, { findingText: 'x' }],
          objectiveText: 'synth',
        },
        actor,
      );
      expect(res.recordedFindings).toBe(2);
      expect(d.notesRepo.createExamFinding).toHaveBeenCalledTimes(2);
      expect(d.notesRepo.createExamFinding).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          bodySystemConceptId: CHART.EXAM_BODY_SYSTEM_GENERAL,
        }),
      );
      expect(version.objectiveText).toBe('synth');
    });
  });
});
