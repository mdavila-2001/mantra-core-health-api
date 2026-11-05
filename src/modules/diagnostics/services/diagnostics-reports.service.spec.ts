import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsReportsService } from './diagnostics-reports.service';
import { DIAG } from '../diagnostics.concepts';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { DiagnosticsScopeService } from './diagnostics-scope.service';
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
    findVersion: mockFn(),
    findVersionInReport: mockFn(),
    findCriticalNotification: mockFn(),
    maxVersionNumber: mockFn().mockResolvedValue(0),
    createVersion: mockFn(),
    addResult: mockFn(),
    addFile: mockFn(),
    recordReleaseEvent: mockFn(),
    createCriticalNotification: mockFn(),
    criticalExistsForObservation: mockFn().mockResolvedValue(false),
    findVersionsByReports: mockFn().mockResolvedValue([]),
    findReleaseEventsByVersions: mockFn().mockResolvedValue([]),
    findFilesByVersions: mockFn().mockResolvedValue([]),
    findResultsByVersions: mockFn().mockResolvedValue([]),
  };
  // Liberar una versión también deja marcado el informe en `clinical`, y esa
  // tabla la toca `DiagnosticOrdersRepository`. Por defecto devuelve un informe:
  // el caso de que no exista se prueba aparte.
  const ownReport = {
    id: 'r1',
    custodianTenantId: T1,
    patientProfileId: PATIENT,
  };
  const ordersRepo = {
    findReportById: mockFn().mockResolvedValue(ownReport),
    markReportReleased: mockFn(),
  };
  const refsRepo = {
    findObservation: mockFn().mockResolvedValue({
      id: 'o1',
      custodianTenantId: T1,
      patientProfileId: PATIENT,
    }),
    findFile: mockFn().mockResolvedValue({ id: 'f1', tenantId: T1 }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = new DiagnosticsScopeService(
    {} as any,
    {} as any,
    repo as any,
    ordersRepo as any,
    refsRepo as any,
  );
  const raw = new DiagnosticsReportsService(
    em as any,
    repo,
    ordersRepo as any,
    scope,
    logger as any,
  );
  return {
    raw,
    service: inTenant(raw),
    tx,
    repo,
    ordersRepo,
    refsRepo,
    ownReport,
  };
}

describe('DiagnosticsReportsService', () => {
  describe('createReportVersion (UC-20-07)', () => {
    it('requires an active tenant in the context', async () => {
      const d = build();
      await expect(
        d.raw.createReportVersion('r1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.repo.createVersion).not.toHaveBeenCalled();
    });

    it('creates version numbered next and links results', async () => {
      const d = build();
      d.repo.maxVersionNumber.mockResolvedValue(2);
      d.repo.createVersion.mockReturnValue({
        id: 'v3',
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
      });

      const res = await d.service.createReportVersion(
        'r1',
        { custodianTenantId: T1, results: [{ observationId: 'o1' }] },
        actor,
      );

      expect(res).toEqual({ id: 'v3', status: DIAG.REPORT_PRELIMINARY });
      expect(d.repo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          versionNumber: 3,
          releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        }),
      );
      expect(d.repo.addResult).toHaveBeenCalled();
    });

    it('throws when superseded version not in report', async () => {
      const d = build();
      d.repo.findVersionInReport.mockResolvedValue(null);
      await expect(
        d.service.createReportVersion(
          'r1',
          { custodianTenantId: T1, supersedesVersionId: 'vX' } as any,
          actor,
        ),
      ).rejects.toMatchObject({ status: 404 });
      expect(d.repo.createVersion).not.toHaveBeenCalled();
    });
  });

  describe('releaseVersion (UC-20-08)', () => {
    it('throws when version missing', async () => {
      const d = build();
      d.repo.findVersionInReport.mockResolvedValue(null);
      await expect(
        d.service.releaseVersion('r1', 'v1', {} as any, actor),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('releases an eligible preliminary version', async () => {
      const d = build();
      const version = {
        id: 'v1',
        releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
      };
      d.repo.findVersionInReport.mockResolvedValue(version);

      const res = await d.service.releaseVersion('r1', 'v1', {}, actor);

      expect(res).toEqual({ id: 'v1', status: DIAG.REPORT_FINAL });
      expect(version.clinicalStatusConceptId).toBe(DIAG.REPORT_FINAL);
      expect(d.repo.recordReleaseEvent).toHaveBeenCalled();
      // Y el informe queda sabiendo cuál es su versión liberada: sin esto,
      // `current_released_version_id` se quedaba en `null` para siempre.
      expect(d.ordersRepo.markReportReleased).toHaveBeenCalledWith(
        d.tx,
        d.ownReport,
        'v1',
        DIAG.VISIBILITY_PATIENT_VISIBLE,
        actor.id,
      );
    });

    it('marks the report hidden when released as hidden', async () => {
      const d = build();
      d.repo.findVersionInReport.mockResolvedValue({
        id: 'v1',
        releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
      });

      await d.service.releaseVersion(
        'r1',
        'v1',
        { patientVisibility: 'HIDDEN' },
        actor,
      );

      expect(d.ordersRepo.markReportReleased).toHaveBeenCalledWith(
        d.tx,
        d.ownReport,
        'v1',
        DIAG.VISIBILITY_PATIENT_HIDDEN,
        actor.id,
      );
    });

    it('refuses to release when the clinical report row is gone (no orphan release)', async () => {
      const d = build();
      const version = {
        id: 'v1',
        releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
      };
      d.repo.findVersionInReport.mockResolvedValue(version);
      d.ordersRepo.findReportById.mockResolvedValue(null);

      await expectNotAvailable(d.service.releaseVersion('r1', 'v1', {}, actor));

      expect(version.clinicalStatusConceptId).toBe(DIAG.REPORT_PRELIMINARY);
      expect(d.repo.recordReleaseEvent).not.toHaveBeenCalled();
      expect(d.ordersRepo.markReportReleased).not.toHaveBeenCalled();
    });

    it('conflicts when already released', async () => {
      const d = build();
      d.repo.findVersionInReport.mockResolvedValue({
        id: 'v1',
        releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        clinicalStatusConceptId: DIAG.REPORT_FINAL,
      });
      await expect(
        d.service.releaseVersion('r1', 'v1', {} as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('detectCritical (UC-20-09)', () => {
    it('conflicts on duplicate critical for observation', async () => {
      const d = build();
      d.repo.criticalExistsForObservation.mockResolvedValue(true);
      await expect(
        d.service.detectCritical(
          {
            observationId: 'o1',
            patientProfileId: 'p1',
            custodianTenantId: T1,
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a pending notification', async () => {
      const d = build();
      d.repo.createCriticalNotification.mockReturnValue({
        id: 'n1',
        notificationStatusConceptId: DIAG.CRITICAL_PENDING,
      });
      const res = await d.service.detectCritical(
        {
          observationId: 'o1',
          patientProfileId: 'p1',
          custodianTenantId: T1,
        },
        actor,
      );
      expect(res).toEqual({ id: 'n1', status: DIAG.CRITICAL_PENDING });
    });
  });

  describe('acknowledgeCritical (UC-20-10)', () => {
    it('escalates when SLA elapsed', async () => {
      const d = build();
      const notification = {
        id: 'n1',
        custodianTenantId: T1,
        notificationStatusConceptId: DIAG.CRITICAL_PENDING,
        escalationDueAt: new Date(Date.now() - 1000),
      };
      d.repo.findCriticalNotification.mockResolvedValue(notification);
      const res = await d.service.acknowledgeCritical(
        'n1',
        { acknowledgedByProfileId: 'p1' },
        actor,
      );
      expect(res.status).toBe(DIAG.CRITICAL_ESCALATED);
    });

    it('acknowledges within SLA', async () => {
      const d = build();
      d.repo.findCriticalNotification.mockResolvedValue({
        id: 'n1',
        custodianTenantId: T1,
        notificationStatusConceptId: DIAG.CRITICAL_PENDING,
        escalationDueAt: new Date(Date.now() + 60_000),
      });
      const res = await d.service.acknowledgeCritical(
        'n1',
        { acknowledgedByProfileId: 'p1' },
        actor,
      );
      expect(res.status).toBe(DIAG.CRITICAL_ACKNOWLEDGED);
    });
  });

  describe('alcance de tenant (DIAG-01)', () => {
    const foreignReport = {
      id: 'rB',
      custodianTenantId: T2,
      patientProfileId: PATIENT,
    };

    it('correcto: informe, observaciones y archivos de T1 escriben la versión en T1', async () => {
      const d = build();
      d.repo.createVersion.mockReturnValue({
        id: 'v1',
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
      });
      await d.service.createReportVersion(
        'r1',
        {
          results: [{ observationId: 'o1' }],
          files: [{ fileId: 'f1' }],
        } as any,
        actor,
      );
      expect(d.repo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ custodianTenantId: T1 }),
      );
    });

    it('un informe de T2 responde 404 uniforme y no crea versión', async () => {
      const d = build();
      d.ordersRepo.findReportById.mockResolvedValue(foreignReport);
      await expectNotAvailable(
        d.service.createReportVersion('rB', {} as any, actor),
      );
      expect(d.repo.createVersion).not.toHaveBeenCalled();
    });

    it('un informe ajeno responde igual que uno inexistente', async () => {
      const ajeno = build();
      ajeno.ordersRepo.findReportById.mockResolvedValue(foreignReport);
      const inexistente = build();
      inexistente.ordersRepo.findReportById.mockResolvedValue(null);
      const a = await expectNotAvailable(
        ajeno.service.createReportVersion('rB', {} as any, actor),
      );
      const b = await expectNotAvailable(
        inexistente.service.createReportVersion('rB', {} as any, actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('un custodianTenantId del cuerpo distinto del activo no escribe', async () => {
      const d = build();
      await expectNotAvailable(
        d.service.createReportVersion(
          'r1',
          { custodianTenantId: T2 } as any,
          actor,
        ),
      );
      expect(d.repo.createVersion).not.toHaveBeenCalled();
    });

    it('una observación de T2 combinada con un informe de T1 no escribe nada', async () => {
      const d = build();
      d.refsRepo.findObservation.mockResolvedValue({
        id: 'oB',
        custodianTenantId: T2,
        patientProfileId: PATIENT,
      });
      await expectNotAvailable(
        d.service.createReportVersion(
          'r1',
          { results: [{ observationId: 'oB' }] } as any,
          actor,
        ),
      );
      expect(d.repo.createVersion).not.toHaveBeenCalled();
      expect(d.repo.addResult).not.toHaveBeenCalled();
    });

    it('una observación de otro paciente no se enlaza al informe', async () => {
      const d = build();
      d.refsRepo.findObservation.mockResolvedValue({
        id: 'o9',
        custodianTenantId: T1,
        patientProfileId: 'otro-paciente',
      });
      await expectNotAvailable(
        d.service.createReportVersion(
          'r1',
          { results: [{ observationId: 'o9' }] } as any,
          actor,
        ),
      );
      expect(d.repo.createVersion).not.toHaveBeenCalled();
    });

    it('un archivo de T2 no se adjunta al informe de T1', async () => {
      const d = build();
      d.refsRepo.findFile.mockResolvedValue({ id: 'fB', tenantId: T2 });
      await expectNotAvailable(
        d.service.createReportVersion(
          'r1',
          { files: [{ fileId: 'fB' }] } as any,
          actor,
        ),
      );
      expect(d.repo.addFile).not.toHaveBeenCalled();
    });

    it('liberar una versión de un informe de T2 no cambia su estado', async () => {
      const d = build();
      const version = {
        id: 'vB',
        releaseEligibilityConceptId: DIAG.RELEASE_ELIGIBLE,
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
      };
      d.ordersRepo.findReportById.mockResolvedValue(foreignReport);
      d.repo.findVersionInReport.mockResolvedValue(version);
      await expectNotAvailable(
        d.service.releaseVersion('rB', 'vB', {} as any, actor),
      );
      expect(version.clinicalStatusConceptId).toBe(DIAG.REPORT_PRELIMINARY);
      expect(d.repo.recordReleaseEvent).not.toHaveBeenCalled();
    });

    it('detectar un crítico sobre una observación de T2 no crea notificación', async () => {
      const d = build();
      d.refsRepo.findObservation.mockResolvedValue({
        id: 'oB',
        custodianTenantId: T2,
        patientProfileId: PATIENT,
      });
      await expectNotAvailable(
        d.service.detectCritical(
          { observationId: 'oB', patientProfileId: PATIENT } as any,
          actor,
        ),
      );
      expect(d.repo.createCriticalNotification).not.toHaveBeenCalled();
    });

    it('detectar un crítico con paciente distinto al de la observación no escribe', async () => {
      const d = build();
      await expectNotAvailable(
        d.service.detectCritical(
          { observationId: 'o1', patientProfileId: 'otro-paciente' } as any,
          actor,
        ),
      );
      expect(d.repo.createCriticalNotification).not.toHaveBeenCalled();
    });

    it('detectar un crítico con un informe de T2 no escribe', async () => {
      const d = build();
      d.ordersRepo.findReportById.mockResolvedValue(foreignReport);
      await expectNotAvailable(
        d.service.detectCritical(
          {
            observationId: 'o1',
            patientProfileId: PATIENT,
            diagnosticReportId: 'rB',
          } as any,
          actor,
        ),
      );
      expect(d.repo.createCriticalNotification).not.toHaveBeenCalled();
    });

    it('acusar recibo de una notificación de T2 conserva su estado', async () => {
      const d = build();
      const notification: any = {
        id: 'nB',
        custodianTenantId: T2,
        notificationStatusConceptId: DIAG.CRITICAL_PENDING,
      };
      d.repo.findCriticalNotification.mockResolvedValue(notification);
      await expectNotAvailable(
        d.service.acknowledgeCritical(
          'nB',
          { acknowledgedByProfileId: 'p1' },
          actor,
        ),
      );
      expect(notification.notificationStatusConceptId).toBe(
        DIAG.CRITICAL_PENDING,
      );
      expect(notification.acknowledgedAt).toBeUndefined();
    });

    it('el autor declarado debe ser el profesional que firma', async () => {
      const d = build();
      const clinician = {
        id: 'u1',
        roles: ['CLINICIAN'],
        practitionerProfileId: 'hp1',
      } as any;
      await expect(
        d.service.createReportVersion(
          'r1',
          { authorProfileId: 'otro-profesional' } as any,
          clinician,
        ),
      ).rejects.toMatchObject({
        status: 403,
        reason: DiagnosticsErrorReason.DIAGNOSTICS_AUTHOR_NOT_ACTOR,
      });
      expect(d.repo.createVersion).not.toHaveBeenCalled();
    });

    it('sin autor en el cuerpo, el autor es el perfil del profesional que firma', async () => {
      const d = build();
      d.repo.createVersion.mockReturnValue({
        id: 'v1',
        clinicalStatusConceptId: DIAG.REPORT_PRELIMINARY,
      });
      await d.service.createReportVersion(
        'r1',
        {} as any,
        {
          id: 'u1',
          roles: ['CLINICIAN'],
          practitionerProfileId: 'hp1',
        } as any,
      );
      expect(d.repo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ authorProfileId: 'hp1' }),
      );
    });
  });
});
