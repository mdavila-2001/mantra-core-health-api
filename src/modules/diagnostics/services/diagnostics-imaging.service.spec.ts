import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsImagingService } from './diagnostics-imaging.service';
import { DIAG } from '../diagnostics.concepts';
import { ConflictException } from '../../../common';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { DiagnosticsScopeService } from './diagnostics-scope.service';
import { DiagnosticsPatientAccessService } from './diagnostics-patient-access.service';
import { T1, T2, expectNotAvailable, inTenant } from './diagnostics.testing';

const PATIENT = 'p1';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findEndpoint: mockFn(),
    findStudiesByPatient: mockFn().mockResolvedValue([]),
    findStudy: mockFn(),
    findSeriesInStudy: mockFn(),
    findStudyByUid: mockFn(),
    createEndpoint: mockFn(),
    createStudy: mockFn(),
    createSeries: mockFn(),
    createInstance: mockFn(),
    createObjectLocation: mockFn(),
    recordDoseEvent: mockFn(),
  };
  const refsRepo = {
    findEncounter: mockFn(),
    findServiceRequest: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = new DiagnosticsScopeService(
    {} as any,
    repo as any,
    {} as any,
    {} as any,
    refsRepo as any,
  );
  const accountLinksRepo = { findActiveByUser: mockFn() };
  const practitionerProfilesRepo = { findById: mockFn() };
  const careRepo = { findActiveForPractitionerPatient: mockFn() };
  const patientAccess = new DiagnosticsPatientAccessService(
    { fork: mockFn(() => ({})) } as any,
    accountLinksRepo as any,
    practitionerProfilesRepo as any,
    careRepo as any,
  );
  const raw = new DiagnosticsImagingService(
    em as any,
    repo,
    scope,
    patientAccess,
    logger as any,
  );
  return {
    raw,
    service: inTenant(raw),
    tx,
    repo,
    refsRepo,
    accountLinksRepo,
    practitionerProfilesRepo,
    careRepo,
  };
}

describe('DiagnosticsImagingService', () => {
  describe('storeStudy (UC-20-11)', () => {
    it('throws when endpoint missing', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue(null);
      await expectNotAvailable(
        d.service.storeStudy(
          {
            imagingEndpointId: 'e1',
            patientProfileId: 'p1',
            dicomStudyInstanceUid: 'u1',
            series: [],
          } as any,
          actor,
        ),
      );
    });

    it('conflicts on duplicate study uid (idempotent resend)', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: T1 });
      d.repo.findStudyByUid.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.storeStudy(
          {
            imagingEndpointId: 'e1',
            patientProfileId: 'p1',
            dicomStudyInstanceUid: 'u1',
            series: [],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('stores study, series and instances (no object location without backend)', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: T1 });
      d.repo.findStudyByUid.mockResolvedValue(null);
      d.repo.createStudy.mockReturnValue({
        id: 'st1',
        statusConceptId: DIAG.IMAGING_STUDY_STORED,
      });
      d.repo.createSeries.mockReturnValue({ id: 'se1' });
      d.repo.createInstance.mockReturnValue({ id: 'in1' });

      const res = await d.service.storeStudy(
        {
          imagingEndpointId: 'e1',
          patientProfileId: 'p1',
          dicomStudyInstanceUid: 'u1',
          series: [
            {
              dicomSeriesInstanceUid: 's-uid',
              instances: [{ dicomSopInstanceUid: 'i-uid' }],
            },
          ],
        },
        actor,
      );

      expect(res).toEqual({
        id: 'st1',
        status: DIAG.IMAGING_STUDY_STORED,
        numberOfSeries: 1,
        numberOfInstances: 1,
      });
      expect(d.repo.createObjectLocation).not.toHaveBeenCalled();
    });
  });

  describe('recordDoseEvent (UC-20-13)', () => {
    it('throws when study missing', async () => {
      const d = build();
      d.repo.findStudy.mockResolvedValue(null);
      await expectNotAvailable(
        d.service.recordDoseEvent('missing', {} as any, actor),
      );
    });

    it('records a dose event on the study', async () => {
      const d = build();
      d.repo.findStudy.mockResolvedValue({
        id: 'st1',
        custodianTenantId: T1,
        patientProfileId: 'p1',
        statusConceptId: DIAG.IMAGING_STUDY_STORED,
        updatedAt: new Date(),
      });
      d.repo.recordDoseEvent.mockReturnValue({ id: 'dose1' });
      const res = await d.service.recordDoseEvent(
        'st1',
        { doseLengthProduct: '10' },
        actor,
      );
      expect(res.id).toBe('dose1');
    });
  });

  describe('createEndpoint (soporte)', () => {
    it('toma el tenant del contexto cuando el cuerpo no lo declara', async () => {
      const d = build();
      d.repo.createEndpoint.mockReturnValue({
        id: 'e1',
        statusConceptId: DIAG.IMAGING_ENDPOINT_ACTIVE,
      });
      await d.service.createEndpoint({ baseUri: 'http://x' } as any, actor);
      expect(d.repo.createEndpoint).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: T1 }),
      );
    });

    it('rechaza un tenantId del cuerpo distinto del activo y no crea nada', async () => {
      const d = build();
      await expectNotAvailable(
        d.service.createEndpoint(
          { baseUri: 'http://x', tenantId: T2 } as any,
          actor,
        ),
      );
      expect(d.repo.createEndpoint).not.toHaveBeenCalled();
    });

    it('creates an active endpoint', async () => {
      const d = build();
      d.repo.createEndpoint.mockReturnValue({
        id: 'e1',
        statusConceptId: DIAG.IMAGING_ENDPOINT_ACTIVE,
      });
      const res = await d.service.createEndpoint(
        { baseUri: 'http://x', tenantId: T1 },
        actor,
      );
      expect(res).toEqual({ id: 'e1', status: DIAG.IMAGING_ENDPOINT_ACTIVE });
    });
  });

  describe('alcance de tenant (DIAG-01)', () => {
    const storeDto = {
      imagingEndpointId: 'e1',
      patientProfileId: PATIENT,
      dicomStudyInstanceUid: 'u1',
      series: [],
    } as any;

    it('correcto: la cadena endpoint/encuentro/orden/paciente de T1 escribe el estudio en T1', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: T1 });
      d.refsRepo.findEncounter.mockResolvedValue({
        id: 'enc1',
        tenantId: T1,
        patientProfileId: PATIENT,
      });
      d.refsRepo.findServiceRequest.mockResolvedValue({
        id: 'sr1',
        custodianTenantId: T1,
        patientProfileId: PATIENT,
      });
      d.repo.findStudyByUid.mockResolvedValue(null);
      d.repo.createStudy.mockReturnValue({
        id: 'st1',
        statusConceptId: DIAG.IMAGING_STUDY_STORED,
      });
      await d.service.storeStudy(
        { ...storeDto, encounterId: 'enc1', serviceRequestId: 'sr1' },
        actor,
      );
      expect(d.repo.createStudy).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ custodianTenantId: T1 }),
      );
    });

    it('un endpoint de T2 responde 404 uniforme y no escribe', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: T2 });
      await expectNotAvailable(d.service.storeStudy(storeDto, actor));
      expect(d.repo.createStudy).not.toHaveBeenCalled();
    });

    it('un endpoint ajeno responde igual que uno inexistente', async () => {
      const ajeno = build();
      ajeno.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: T2 });
      const inexistente = build();
      inexistente.repo.findEndpoint.mockResolvedValue(null);
      const a = await expectNotAvailable(
        ajeno.service.storeStudy(storeDto, actor),
      );
      const b = await expectNotAvailable(
        inexistente.service.storeStudy(storeDto, actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('un custodianTenantId del cuerpo distinto del activo no escribe', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: T1 });
      await expectNotAvailable(
        d.service.storeStudy({ ...storeDto, custodianTenantId: T2 }, actor),
      );
      expect(d.repo.createStudy).not.toHaveBeenCalled();
    });

    it('un encuentro de T2 combinado con un endpoint de T1 no escribe', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: T1 });
      d.refsRepo.findEncounter.mockResolvedValue({
        id: 'enc2',
        tenantId: T2,
        patientProfileId: PATIENT,
      });
      await expectNotAvailable(
        d.service.storeStudy({ ...storeDto, encounterId: 'enc2' }, actor),
      );
      expect(d.repo.createStudy).not.toHaveBeenCalled();
    });

    it('una orden de T1 de otro paciente no se enlaza al estudio', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: T1 });
      d.refsRepo.findServiceRequest.mockResolvedValue({
        id: 'sr1',
        custodianTenantId: T1,
        patientProfileId: 'otro-paciente',
      });
      await expectNotAvailable(
        d.service.storeStudy({ ...storeDto, serviceRequestId: 'sr1' }, actor),
      );
      expect(d.repo.createStudy).not.toHaveBeenCalled();
    });

    it('el centro ejecutor (performer) puede enlazar la orden que pidió otro tenant', async () => {
      const d = build();
      d.repo.findEndpoint.mockResolvedValue({ id: 'e1', tenantId: T1 });
      d.refsRepo.findServiceRequest.mockResolvedValue({
        id: 'sr1',
        custodianTenantId: T2,
        performerTenantId: T1,
        patientProfileId: PATIENT,
      });
      d.repo.findStudyByUid.mockResolvedValue(null);
      d.repo.createStudy.mockReturnValue({
        id: 'st1',
        statusConceptId: DIAG.IMAGING_STUDY_STORED,
      });
      await d.service.storeStudy(
        { ...storeDto, serviceRequestId: 'sr1' },
        actor,
      );
      expect(d.repo.createStudy).toHaveBeenCalled();
    });

    it('un estudio de T2 no recibe eventos de dosis', async () => {
      const d = build();
      const study: any = {
        id: 'st2',
        custodianTenantId: T2,
        patientProfileId: PATIENT,
        updatedAt: new Date(),
      };
      d.repo.findStudy.mockResolvedValue(study);
      await expectNotAvailable(
        d.service.recordDoseEvent('st2', { doseLengthProduct: '10' }, actor),
      );
      expect(d.repo.recordDoseEvent).not.toHaveBeenCalled();
    });

    it('una serie de otro estudio no se acepta en el evento de dosis', async () => {
      const d = build();
      d.repo.findStudy.mockResolvedValue({
        id: 'st1',
        custodianTenantId: T1,
        patientProfileId: PATIENT,
        updatedAt: new Date(),
      });
      d.repo.findSeriesInStudy.mockResolvedValue(null);
      await expectNotAvailable(
        d.service.recordDoseEvent(
          'st1',
          { imagingSeriesId: 'x' } as any,
          actor,
        ),
      );
      expect(d.repo.recordDoseEvent).not.toHaveBeenCalled();
    });
  });

  describe('listStudiesByPatient: política paciente–profesional (DIAG-02)', () => {
    const practitioner = { profileId: 'hp1' };
    const now = Date.now();
    const relation = (patch: Record<string, unknown> = {}) => ({
      purposeConceptId: undefined,
      validFrom: new Date(now - 86_400_000),
      validTo: undefined,
      ...patch,
    });

    /** Prepara un profesional con cuenta vinculada y las relaciones dadas. */
    function withPractitioner(
      d: ReturnType<typeof build>,
      relations: unknown[],
    ) {
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'person1',
      });
      d.practitionerProfilesRepo.findById.mockResolvedValue(practitioner);
      d.careRepo.findActiveForPractitionerPatient.mockResolvedValue(relations);
    }

    const clinician = { id: 'u-clin', roles: ['CLINICIAN'] } as any;

    it('profesional asignado: lista los estudios del paciente', async () => {
      const d = build();
      withPractitioner(d, [relation()]);
      d.repo.findStudiesByPatient.mockResolvedValue([
        {
          id: 'st1',
          patientProfileId: PATIENT,
          serviceRequestId: 'sr1',
          statusConceptId: DIAG.IMAGING_STUDY_STORED,
          dicomStudyInstanceUid: 'uid',
        },
      ]);
      const res = await d.service.listStudiesByPatient(T1, PATIENT, clinician);
      expect(res).toHaveLength(1);
      expect(d.careRepo.findActiveForPractitionerPatient).toHaveBeenCalledWith(
        expect.anything(),
        'hp1',
        PATIENT,
      );
    });

    it('profesional sin vínculo: 404 DIAGNOSTICS_PATIENT_NOT_AVAILABLE y no consulta estudios', async () => {
      const d = build();
      withPractitioner(d, []);
      await expectNotAvailable(
        d.service.listStudiesByPatient(T1, PATIENT, clinician),
        DiagnosticsErrorReason.DIAGNOSTICS_PATIENT_NOT_AVAILABLE,
      );
      expect(d.repo.findStudiesByPatient).not.toHaveBeenCalled();
    });

    it('una relación vencida o acotada a un propósito no habilita la lectura', async () => {
      const d = build();
      withPractitioner(d, [
        relation({ validTo: new Date(now - 1000) }),
        relation({ purposeConceptId: 'purpose-x' }),
        relation({ validFrom: new Date(now + 86_400_000) }),
      ]);
      await expectNotAvailable(
        d.service.listStudiesByPatient(T1, PATIENT, clinician),
        DiagnosticsErrorReason.DIAGNOSTICS_PATIENT_NOT_AVAILABLE,
      );
    });

    it('una cuenta sin perfil profesional no lee', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);
      await expectNotAvailable(
        d.service.listStudiesByPatient(T1, PATIENT, clinician),
        DiagnosticsErrorReason.DIAGNOSTICS_PATIENT_NOT_AVAILABLE,
      );
      expect(
        d.careRepo.findActiveForPractitionerPatient,
      ).not.toHaveBeenCalled();
    });

    it('el paciente ajeno responde igual que el inexistente', async () => {
      const sinVinculo = build();
      withPractitioner(sinVinculo, []);
      const sinCuenta = build();
      sinCuenta.accountLinksRepo.findActiveByUser.mockResolvedValue(null);
      const a = await expectNotAvailable(
        sinVinculo.service.listStudiesByPatient(T1, PATIENT, clinician),
        DiagnosticsErrorReason.DIAGNOSTICS_PATIENT_NOT_AVAILABLE,
      );
      const b = await expectNotAvailable(
        sinCuenta.service.listStudiesByPatient(T1, PATIENT, clinician),
        DiagnosticsErrorReason.DIAGNOSTICS_PATIENT_NOT_AVAILABLE,
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('SUPERADMIN conserva el comodín de plataforma', async () => {
      const d = build();
      await d.service.listStudiesByPatient(T1, PATIENT, {
        id: 'su',
        roles: ['SUPERADMIN'],
      } as any);
      expect(d.accountLinksRepo.findActiveByUser).not.toHaveBeenCalled();
      expect(d.repo.findStudiesByPatient).toHaveBeenCalled();
    });

    it('SUPERADMIN acotado (a este tenant o a otro) no tiene comodín: sigue la regla de quien atiende (#1241)', async () => {
      for (const tenantId of [T1, T2]) {
        const d = build();
        d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);
        await expectNotAvailable(
          d.service.listStudiesByPatient(T1, PATIENT, {
            id: 'su-scoped',
            roles: ['SUPERADMIN'],
            scopedRoles: { [tenantId]: ['SUPERADMIN'] },
          } as any),
          DiagnosticsErrorReason.DIAGNOSTICS_PATIENT_NOT_AVAILABLE,
        );
        expect(d.repo.findStudiesByPatient).not.toHaveBeenCalled();
      }
    });
  });
});
