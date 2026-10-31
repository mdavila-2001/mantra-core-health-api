import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsMediaQualityService } from './diagnostics-media-quality.service';
import { DIAG } from '../diagnostics.concepts';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { DiagnosticsScopeService } from './diagnostics-scope.service';
import { T1, T2, expectNotAvailable, inTenant } from './diagnostics.testing';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findMediaByFile: mockFn().mockResolvedValue(null),
    createMedia: mockFn(),
    addAnnotation: mockFn(),
    createDataQualityEvent: mockFn(),
    addProvenanceLink: mockFn(),
  };
  const refsRepo = {
    findFile: mockFn().mockResolvedValue({ id: 'f1', tenantId: T1 }),
    findEncounter: mockFn(),
    findObservation: mockFn(),
  };
  const specimensRepo = { findSpecimen: mockFn().mockResolvedValue(null) };
  const imagingRepo = { findStudy: mockFn().mockResolvedValue(null) };
  const ordersRepo = { findReportById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = new DiagnosticsScopeService(
    specimensRepo as any,
    imagingRepo as any,
    {} as any,
    ordersRepo as any,
    refsRepo as any,
  );
  const raw = new DiagnosticsMediaQualityService(
    em as any,
    repo as any,
    scope,
    logger as any,
  );
  return {
    raw,
    service: inTenant(raw),
    tx,
    repo,
    refsRepo,
    specimensRepo,
    imagingRepo,
    ordersRepo,
  };
}

describe('DiagnosticsMediaQualityService', () => {
  describe('attachMedia (UC-20-12)', () => {
    it('requires an active tenant in the context', async () => {
      const d = build();
      await expect(
        d.raw.attachMedia(
          { patientProfileId: 'p1', fileId: 'f1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.repo.createMedia).not.toHaveBeenCalled();
    });

    it('conflicts when file already attached', async () => {
      const d = build();
      d.repo.findMediaByFile.mockResolvedValue({ id: 'm0' });
      await expect(
        d.service.attachMedia(
          {
            patientProfileId: 'p1',
            fileId: 'f1',
            custodianTenantId: T1,
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('attaches media and its annotations', async () => {
      const d = build();
      d.repo.createMedia.mockReturnValue({
        id: 'm1',
        statusConceptId: DIAG.MEDIA_STATUS_ACTIVE,
      });
      const res = await d.service.attachMedia(
        {
          patientProfileId: 'p1',
          fileId: 'f1',
          custodianTenantId: T1,
          annotations: [{ labelText: 'x' }],
        },
        actor,
      );
      expect(res).toEqual({ id: 'm1', status: DIAG.MEDIA_STATUS_ACTIVE });
      expect(d.repo.addAnnotation).toHaveBeenCalled();
    });
  });

  describe('recordDataQualityEvent (UC-20-14)', () => {
    it('requires an active tenant in the context', async () => {
      const d = build();
      await expect(
        d.raw.recordDataQualityEvent(
          { targetId: 't', ruleCode: 'R1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.repo.createDataQualityEvent).not.toHaveBeenCalled();
    });

    it('records event and provenance link when source given', async () => {
      const d = build();
      d.repo.createDataQualityEvent.mockReturnValue({
        id: 'dq1',
        statusConceptId: DIAG.DQ_OPEN,
      });
      d.specimensRepo.findSpecimen.mockResolvedValue({
        id: 'tgt',
        custodianTenantId: T1,
      });
      d.refsRepo.findObservation.mockResolvedValue({
        id: 'src',
        custodianTenantId: T1,
      });
      const res = await d.service.recordDataQualityEvent(
        {
          targetId: 'tgt',
          ruleCode: 'R1',
          custodianTenantId: T1,
          provenanceSourceId: 'src',
        },
        actor,
      );
      expect(res).toEqual({ id: 'dq1', status: DIAG.DQ_OPEN });
      expect(d.repo.addProvenanceLink).toHaveBeenCalled();
    });

    it('records event without provenance when no source', async () => {
      const d = build();
      d.repo.createDataQualityEvent.mockReturnValue({
        id: 'dq2',
        statusConceptId: DIAG.DQ_OPEN,
      });
      d.specimensRepo.findSpecimen.mockResolvedValue({
        id: 'tgt',
        custodianTenantId: T1,
      });
      await d.service.recordDataQualityEvent(
        { targetId: 'tgt', ruleCode: 'R1', custodianTenantId: T1 },
        actor,
      );
      expect(d.repo.addProvenanceLink).not.toHaveBeenCalled();
    });
  });

  describe('alcance de tenant (DIAG-01)', () => {
    const mediaDto = { patientProfileId: 'p1', fileId: 'f1' } as any;

    it('correcto: archivo, encuentro e informe de T1 con el mismo paciente escriben media en T1', async () => {
      const d = build();
      d.refsRepo.findEncounter.mockResolvedValue({
        id: 'enc1',
        tenantId: T1,
        patientProfileId: 'p1',
      });
      d.ordersRepo.findReportById.mockResolvedValue({
        id: 'rep1',
        custodianTenantId: T1,
        patientProfileId: 'p1',
      });
      d.repo.createMedia.mockReturnValue({
        id: 'm1',
        statusConceptId: DIAG.MEDIA_STATUS_ACTIVE,
      });
      await d.service.attachMedia(
        { ...mediaDto, encounterId: 'enc1', diagnosticReportId: 'rep1' },
        actor,
      );
      expect(d.repo.createMedia).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ custodianTenantId: T1 }),
      );
    });

    it('un archivo de T2 responde 404 uniforme y no escribe', async () => {
      const d = build();
      d.refsRepo.findFile.mockResolvedValue({ id: 'f1', tenantId: T2 });
      await expectNotAvailable(d.service.attachMedia(mediaDto, actor));
      expect(d.repo.createMedia).not.toHaveBeenCalled();
      expect(d.repo.addAnnotation).not.toHaveBeenCalled();
    });

    it('un archivo ajeno responde igual que uno inexistente', async () => {
      const ajeno = build();
      ajeno.refsRepo.findFile.mockResolvedValue({ id: 'f1', tenantId: T2 });
      const inexistente = build();
      inexistente.refsRepo.findFile.mockResolvedValue(null);
      const a = await expectNotAvailable(
        ajeno.service.attachMedia(mediaDto, actor),
      );
      const b = await expectNotAvailable(
        inexistente.service.attachMedia(mediaDto, actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('un archivo ya adjunto en otra organización no filtra el 409 a T1', async () => {
      const d = build();
      d.refsRepo.findFile.mockResolvedValue({ id: 'f1', tenantId: T2 });
      d.repo.findMediaByFile.mockResolvedValue({ id: 'm-de-T2' });
      await expectNotAvailable(d.service.attachMedia(mediaDto, actor));
    });

    it('un custodianTenantId del cuerpo distinto del activo no escribe', async () => {
      const d = build();
      await expectNotAvailable(
        d.service.attachMedia({ ...mediaDto, custodianTenantId: T2 }, actor),
      );
      expect(d.repo.createMedia).not.toHaveBeenCalled();
    });

    it('un encuentro de otro paciente no se combina con la media', async () => {
      const d = build();
      d.refsRepo.findEncounter.mockResolvedValue({
        id: 'enc1',
        tenantId: T1,
        patientProfileId: 'otro',
      });
      await expectNotAvailable(
        d.service.attachMedia({ ...mediaDto, encounterId: 'enc1' }, actor),
      );
      expect(d.repo.createMedia).not.toHaveBeenCalled();
    });

    it('un informe de T2 no se enlaza a la media de T1', async () => {
      const d = build();
      d.ordersRepo.findReportById.mockResolvedValue({
        id: 'rep2',
        custodianTenantId: T2,
        patientProfileId: 'p1',
      });
      await expectNotAvailable(
        d.service.attachMedia(
          { ...mediaDto, diagnosticReportId: 'rep2' },
          actor,
        ),
      );
      expect(d.repo.createMedia).not.toHaveBeenCalled();
    });

    it('un evento de calidad sobre un objetivo de T2 no se registra', async () => {
      const d = build();
      d.specimensRepo.findSpecimen.mockResolvedValue({
        id: 'tgt',
        custodianTenantId: T2,
      });
      await expectNotAvailable(
        d.service.recordDataQualityEvent(
          { targetId: 'tgt', ruleCode: 'R1' } as any,
          actor,
        ),
      );
      expect(d.repo.createDataQualityEvent).not.toHaveBeenCalled();
      expect(d.repo.addProvenanceLink).not.toHaveBeenCalled();
    });

    it('una fuente de provenance de T2 no se enlaza', async () => {
      const d = build();
      d.specimensRepo.findSpecimen.mockImplementation(
        (_tx: unknown, id: string) =>
          Promise.resolve(
            id === 'tgt'
              ? { id: 'tgt', custodianTenantId: T1 }
              : { id, custodianTenantId: T2 },
          ),
      );
      await expectNotAvailable(
        d.service.recordDataQualityEvent(
          { targetId: 'tgt', ruleCode: 'R1', provenanceSourceId: 'src' } as any,
          actor,
        ),
      );
      expect(d.repo.createDataQualityEvent).not.toHaveBeenCalled();
    });

    it('el objetivo puede ser un estudio de imagen del tenant', async () => {
      const d = build();
      d.imagingRepo.findStudy.mockResolvedValue({
        id: 'tgt',
        custodianTenantId: T1,
      });
      d.repo.createDataQualityEvent.mockReturnValue({
        id: 'dq1',
        statusConceptId: DIAG.DQ_OPEN,
      });
      await d.service.recordDataQualityEvent(
        { targetId: 'tgt', ruleCode: 'R1' } as any,
        actor,
      );
      expect(d.repo.createDataQualityEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ custodianTenantId: T1 }),
      );
    });

    it('el agente declarado debe ser el profesional que firma', async () => {
      const d = build();
      d.specimensRepo.findSpecimen.mockResolvedValue({
        id: 'tgt',
        custodianTenantId: T1,
      });
      d.repo.createDataQualityEvent.mockReturnValue({
        id: 'dq1',
        statusConceptId: DIAG.DQ_OPEN,
      });
      const clinician = {
        id: 'u1',
        roles: ['CLINICIAN'],
        practitionerProfileId: 'hp1',
      } as any;
      await expect(
        d.service.recordDataQualityEvent(
          {
            targetId: 'tgt',
            ruleCode: 'R1',
            provenanceSourceId: 'tgt',
            agentProfileId: 'otro-profesional',
          } as any,
          clinician,
        ),
      ).rejects.toMatchObject({
        reason: DiagnosticsErrorReason.DIAGNOSTICS_AUTHOR_NOT_ACTOR,
      });
      expect(d.repo.addProvenanceLink).not.toHaveBeenCalled();
    });

    it('T2 no puede ver el estudio de T1 como objetivo', async () => {
      const d = build();
      d.imagingRepo.findStudy.mockResolvedValue({
        id: 'tgt',
        custodianTenantId: T1,
      });
      const desdeT2 = inTenant(d.raw, T2);
      await expectNotAvailable(
        desdeT2.recordDataQualityEvent(
          { targetId: 'tgt', ruleCode: 'R1' } as any,
          actor,
        ),
      );
    });
  });
});
