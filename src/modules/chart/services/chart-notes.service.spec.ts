import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { ChartNotesService } from './chart-notes.service';
import { CHART } from '../chart.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  ConflictException,
  runWithTenant,
} from '../../../common';
import { ChartEncounterScopeService } from './chart-encounter-scope.service';
import { ChartErrorReason } from '../chart.error-reasons';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const actor = {
  id: 'clin-1',
  roles: [],
  practitionerProfileId: 's1',
} as any;
// D-7: quien cofirma es otro perfil; el que firma como autor no puede ser
// también el cofirmante (la propia regla del cofirmante repetido lo impide).
const actor2 = {
  id: 'clin-2',
  roles: [],
  practitionerProfileId: 's2',
} as any;

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant A, como lo hace
 * `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenantA<T extends object>(service: T): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(TENANT_A, () => value.apply(target, args));
    },
  });
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const notesRepo = {
    findHeaderById: mockFn(),
    findHeadersByPatient: mockFn().mockResolvedValue([]),
    findHeadersByEncounter: mockFn().mockResolvedValue([]),
    findHeadersPageByAuthor: mockFn().mockResolvedValue([]),
    findVersionsByIds: mockFn().mockResolvedValue(new Map()),
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
  const clinicalRead = {
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  // CHART-01: el alcance real, con repositorios de prueba. Por defecto el
  // encuentro `enc-1` existe, está abierto y es del paciente `p1`.
  const encountersRepo = {
    findById: mockFn(async (_tx: unknown, id: string) => ({
      id,
      patientProfileId: 'p1',
      tenantId: TENANT_A,
      sealedAt: undefined,
    })),
  };
  const conditionsRepo = {
    findById: mockFn(async (_tx: unknown, id: string) => ({
      id,
      patientProfileId: 'p1',
    })),
  };
  const encounterScope = new ChartEncounterScopeService(
    encountersRepo as any,
    conditionsRepo as any,
  );
  const service = new ChartNotesService(
    em as any,
    notesRepo,
    logger as any,
    clinicalRead as any,
    encounterScope,
  );
  return {
    service: inTenantA(service),
    tx,
    em,
    notesRepo,
    clinicalRead,
    encountersRepo,
    conditionsRepo,
  };
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
          authorProfileId: 's1',
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

  // CL-20 (BR-13) — el autor sale de la sesión, nunca del cuerpo.
  describe('autor por sesión (CL-20)', () => {
    const noteHeader = () => ({
      id: 'h1',
      currentVersionId: 'v1',
      lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
      updatedAt: new Date(),
    });
    const version = () => ({
      id: 'v2',
      versionNumber: 2,
      statusConceptId: CHART.VERSION_DRAFT,
    });

    it('createNote sin autor en el cuerpo usa el perfil de la sesión', async () => {
      const d = build();
      d.notesRepo.createHeader.mockReturnValue(noteHeader());
      d.notesRepo.createVersion.mockReturnValue({
        id: 'v1',
        versionNumber: 1,
        statusConceptId: CHART.VERSION_DRAFT,
      });
      await d.service.createNote({ patientProfileId: 'p1' }, actor);
      expect(d.notesRepo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ authorProfileId: 's1' }),
      );
    });

    it('createNote con otro autor responde 403 y no crea la cabecera', async () => {
      const d = build();
      await expect(
        d.service.createNote(
          { patientProfileId: 'p1', authorProfileId: 'hp-otro' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.notesRepo.createHeader).not.toHaveBeenCalled();
    });

    it('createNote sin perfil profesional en la sesión responde 403', async () => {
      const d = build();
      await expect(
        d.service.createNote({ patientProfileId: 'p1' }, {
          id: 'u',
          roles: [],
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.notesRepo.createHeader).not.toHaveBeenCalled();
    });

    it('addVersion con otro autor responde 403 y no crea la versión', async () => {
      const d = build();
      d.notesRepo.findHeaderById.mockResolvedValue(noteHeader());
      await expect(
        d.service.addVersion('h1', { authorProfileId: 'hp-otro' }, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.notesRepo.createVersion).not.toHaveBeenCalled();
    });

    it('addVersion sin autor en el cuerpo usa el perfil de la sesión', async () => {
      const d = build();
      const header = noteHeader();
      d.notesRepo.findHeaderById.mockResolvedValue(header);
      d.notesRepo.maxVersionNumber.mockResolvedValue(1);
      d.notesRepo.createVersion.mockReturnValue(version());
      await d.service.addVersion('h1', { subjectiveText: 's' }, actor);
      expect(d.notesRepo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ authorProfileId: 's1' }),
      );
    });

    it('amendNote con otro autor responde 403 y no crea la enmienda', async () => {
      const d = build();
      d.notesRepo.findHeaderById.mockResolvedValue({
        ...noteHeader(),
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_SIGNED,
      });
      await expect(
        d.service.amendNote(
          'h1',
          { authorProfileId: 'hp-otro', amendmentReasonText: 'x' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.notesRepo.createVersion).not.toHaveBeenCalled();
    });

    it('SUPERADMIN escribe con el perfil que declare', async () => {
      const d = build();
      d.notesRepo.createHeader.mockReturnValue(noteHeader());
      d.notesRepo.createVersion.mockReturnValue({
        id: 'v1',
        versionNumber: 1,
        statusConceptId: CHART.VERSION_DRAFT,
      });
      await d.service.createNote(
        { patientProfileId: 'p1', authorProfileId: 'hp-otro' },
        { id: 'root', roles: ['SUPERADMIN'] } as any,
      );
      expect(d.notesRepo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ authorProfileId: 'hp-otro' }),
      );
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
        d.service.addVersion('h1', { authorProfileId: 's1' } as any, actor),
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

      await d.service.addVersion('h1', { authorProfileId: 's1' }, actor);
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

    it('D-7: rechaza con 403 firmar con el perfil de otro profesional', async () => {
      const d = build();
      d.notesRepo.findVersionById.mockResolvedValue({
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_DRAFT,
      });
      await expect(
        d.service.signVersion(
          'h1',
          'v1',
          { signerProfileId: 'perfil-ajeno' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.notesRepo.createSignature).not.toHaveBeenCalled();
    });

    it('D-7: SUPERADMIN firma con cualquier perfil', async () => {
      const d = build();
      const superadmin = { id: 'admin-1', roles: ['SUPERADMIN'] } as any;
      const version: any = {
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_DRAFT,
      };
      const header: any = {
        id: 'h1',
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
        updatedAt: new Date(),
      };
      d.notesRepo.findVersionById.mockResolvedValue(version);
      d.notesRepo.findHeaderById.mockResolvedValue(header);

      await d.service.signVersion(
        'h1',
        'v1',
        { signerProfileId: 'perfil-ajeno' },
        superadmin,
      );
      expect(version.statusConceptId).toBe(CHART.VERSION_SIGNED);
    });
    it('C5: sin signerProfileId en el cuerpo, firma con el perfil de la sesión', async () => {
      const d = build();
      const version: any = {
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_DRAFT,
      };
      const header: any = {
        id: 'h1',
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
        updatedAt: new Date(),
      };
      d.notesRepo.findVersionById.mockResolvedValue(version);
      d.notesRepo.findHeaderById.mockResolvedValue(header);

      await d.service.signVersion('h1', 'v1', {}, actor);

      expect(version.signedByProfileId).toBe('s1');
      expect(d.notesRepo.createSignature).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ signerProfileId: 's1' }),
      );
    });

    it('C5: sin perfil profesional en la sesión y sin cuerpo, 403 y no firma', async () => {
      const d = build();
      const withoutProfile = { id: 'u-9', roles: [] } as any;
      await expect(
        d.service.signVersion('h1', 'v1', {}, withoutProfile),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.notesRepo.createSignature).not.toHaveBeenCalled();
    });
  });

  describe('cosignVersion (UC-15-04)', () => {
    it('C5: sin signerProfileId en el cuerpo, cofirma con el perfil de la sesión', async () => {
      const d = build();
      const version: any = {
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_SIGNED,
        contentHash: 'h',
      };
      d.notesRepo.findVersionById.mockResolvedValue(version);
      d.notesRepo.findHeaderById.mockResolvedValue({
        id: 'h1',
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_SIGNED,
        updatedAt: new Date(),
      });
      d.notesRepo.findSignatures.mockResolvedValue([
        {
          signatureTypeConceptId: CHART.SIGNATURE_AUTHOR,
          signerProfileId: 's1',
        },
      ]);

      await d.service.cosignVersion('h1', 'v1', {}, actor2);

      expect(d.notesRepo.createSignature).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          signerProfileId: 's2',
          signatureTypeConceptId: CHART.SIGNATURE_COSIGN,
        }),
      );
    });

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
          actor2,
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
        actor2,
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
          { authorProfileId: 's1', amendmentReasonText: 'typo' } as any,
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
        { authorProfileId: 's1', amendmentReasonText: 'clarify' },
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
      // MCH-007: toda mutación por id resuelve el paciente en la cabecera.
      d.notesRepo.findHeaderById.mockResolvedValue({
        id: 'h1',
        patientProfileId: 'p1',
      });
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
      // MCH-007: toda mutación por id resuelve el paciente en la cabecera.
      d.notesRepo.findHeaderById.mockResolvedValue({
        id: 'h1',
        patientProfileId: 'p1',
      });
      d.notesRepo.findVersionById.mockResolvedValue({
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_SIGNED,
      });
      await expect(
        d.service.recordExamFindings('v1', { findings: [{}] } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('inserts one finding per entry with a default body system', async () => {
      const d = build();
      // MCH-007: toda mutación por id resuelve el paciente en la cabecera.
      d.notesRepo.findHeaderById.mockResolvedValue({
        id: 'h1',
        patientProfileId: 'p1',
      });
      const version: any = {
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_DRAFT,
      };
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

describe('ChartNotesService · MCH-007, mutaciones por id', () => {
  const header = () => ({
    id: 'n1',
    patientProfileId: 'paciente-ajeno',
    lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
    currentVersionId: 'v1',
  });
  const version = () => ({
    id: 'v1',
    clinicalNoteId: 'n1',
    statusConceptId: CHART.VERSION_DRAFT,
    releaseEligibilityConceptId: CHART.ELIGIBILITY_ELIGIBLE,
  });

  function withoutPermission() {
    const d = build();
    d.notesRepo.findHeaderById.mockResolvedValue(header());
    d.notesRepo.findVersionById.mockResolvedValue(version());
    d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
      new ForbiddenException('sin permiso'),
    );
    return d;
  }

  it.each([
    [
      'addVersion',
      (d: any) => d.service.addVersion('n1', { authorProfileId: 's1' }, actor),
    ],
    [
      'signVersion',
      (d: any) =>
        d.service.signVersion('n1', 'v1', { signerProfileId: 's1' }, actor),
    ],
    [
      'cosignVersion',
      (d: any) =>
        d.service.cosignVersion('n1', 'v1', { signerProfileId: 's1' }, actor),
    ],
    [
      'amendNote',
      (d: any) => d.service.amendNote('n1', { authorProfileId: 's1' }, actor),
    ],
    ['releaseVersion', (d: any) => d.service.releaseVersion('v1', {}, actor)],
    ['withholdVersion', (d: any) => d.service.withholdVersion('v1', {}, actor)],
    [
      'recordExamFindings',
      (d: any) => d.service.recordExamFindings('v1', { findings: [] }, actor),
    ],
  ])(
    '%s pregunta por el paciente de la nota y, sin permiso, no escribe',
    async (_name, operate) => {
      const d = withoutPermission();
      await expect(operate(d)).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'paciente-ajeno',
        actor,
      );
      expect(d.notesRepo.createVersion).not.toHaveBeenCalled();
      expect(d.notesRepo.createSignature).not.toHaveBeenCalled();
      expect(d.notesRepo.createReleaseEvent).not.toHaveBeenCalled();
      expect(d.notesRepo.createExamFinding).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    },
  );
});

/**
 * Captura el rechazo para inspeccionar status, reason y details.
 *
 * @param promise - Operación que debe fallar.
 * @returns La excepción lanzada.
 */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba un rechazo');
}

describe('ChartNotesService.createNote · encuentro del paciente (CHART-01)', () => {
  const dto = (extra: Record<string, unknown> = {}) =>
    ({
      patientProfileId: 'p1',
      authorProfileId: 's1',
      subjectiveText: 's',
      ...extra,
    }) as any;

  /**
   * Prepara la cabecera y la versión que devuelve el repositorio.
   *
   * @param d - Doble del servicio.
   */
  function withRepos(d: ReturnType<typeof build>) {
    d.notesRepo.createHeader.mockReturnValue({
      id: 'h1',
      lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
      updatedAt: new Date(),
    });
    d.notesRepo.createVersion.mockReturnValue({
      id: 'v1',
      versionNumber: 1,
      statusConceptId: CHART.VERSION_DRAFT,
    });
  }

  it('correcto: la nota de A con un encuentro abierto de A conserva la relación', async () => {
    const d = build();
    withRepos(d);

    await d.service.createNote(dto({ encounterId: 'enc-1' }), actor);

    expect(d.notesRepo.createHeader.mock.calls[0][1]).toMatchObject({
      patientProfileId: 'p1',
      encounterId: 'enc-1',
    });
  });

  it('límite: sin encounterId la nota se crea sin consultar encuentros', async () => {
    const d = build();
    withRepos(d);

    await d.service.createNote(dto(), actor);

    expect(d.encountersRepo.findById).not.toHaveBeenCalled();
    expect(d.notesRepo.createHeader).toHaveBeenCalledTimes(1);
  });

  it('error: el encuentro abierto de B usado desde A responde como un encuentro inexistente, sin cabecera', async () => {
    const foreign = build();
    foreign.encountersRepo.findById.mockResolvedValue({
      id: 'enc-b',
      patientProfileId: 'p2',
      tenantId: TENANT_A,
    });
    const absent = build();
    absent.encountersRepo.findById.mockResolvedValue(null);

    const a = await rejection(
      foreign.service.createNote(dto({ encounterId: 'enc-b' }), actor),
    );
    const b = await rejection(
      absent.service.createNote(dto({ encounterId: 'enc-b' }), actor),
    );

    expect(a).toBeInstanceOf(ResourceNotFoundException);
    expect(a.getStatus()).toBe(404);
    expect(a.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_OUT_OF_SCOPE);
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.notesRepo.createHeader).not.toHaveBeenCalled();
    expect(foreign.notesRepo.createVersion).not.toHaveBeenCalled();
  });

  it('un encuentro del mismo paciente pero de otro tenant también es ajeno', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 'enc-1',
      patientProfileId: 'p1',
      tenantId: TENANT_B,
    });

    const error = await rejection(
      runWithTenant(TENANT_A, () =>
        d.service.createNote(dto({ encounterId: 'enc-1' }), actor),
      ),
    );

    expect(error.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_OUT_OF_SCOPE);
    expect(d.notesRepo.createHeader).not.toHaveBeenCalled();
  });

  it('falla catalogada: un encuentro sellado responde 422 CHART_ENCOUNTER_SEALED y no escribe', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 'enc-1',
      patientProfileId: 'p1',
      tenantId: TENANT_A,
      sealedAt: new Date(),
    });

    const error = await rejection(
      d.service.createNote(dto({ encounterId: 'enc-1' }), actor),
    );

    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error.getStatus()).toBe(422);
    expect(error.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_SEALED);
    expect(d.notesRepo.createHeader).not.toHaveBeenCalled();
  });
});
