import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PharmacovigilanceService } from './pharmacovigilance.service';
import { PHL } from '../pharma_lab.concepts';

const LAB = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';
const PRODUCT = '33333333-3333-3333-3333-333333333333';
const REPORT = '44444444-4444-4444-4444-444444444444';
const ACTOR = { id: '99999999-9999-9999-9999-999999999999' } as any;

/** Reporte de farmacovigilancia. */
function report(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: REPORT,
    pharmaLabId: LAB,
    pharmaProductId: PRODUCT,
    caseCode: 'PV-2026-00001',
    statusConceptId: PHL.PV_RECEIVED,
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param options - Estado inicial de los dobles.
 * @returns El servicio y los dobles.
 */
function build(
  options: {
    /** Reporte devuelto por el repositorio. */
    reportRow?: Record<string, any>;
    /** Producto devuelto por el catálogo. */
    productRow?: Record<string, any> | null;
    /** Reportes ya registrados en el laboratorio. */
    reportCount?: number;
  } = {},
) {
  const reportRow = options.reportRow ?? report();

  const repo = {
    findReport: mockFn(async () => reportRow),
    findReportByCaseCode: mockFn(async () => null),
    countReports: mockFn(async () => options.reportCount ?? 0),
    listReports: mockFn(async () => [reportRow]),
    createReport: mockFn(() => reportRow),
    appendAction: mockFn(() => ({ id: 'action' })),
    listActions: mockFn(async () => []),
  };
  const catalog = {
    findProduct: mockFn(async () =>
      options.productRow === undefined
        ? { id: PRODUCT, pharmaLabId: LAB, tradeName: 'Andexal' }
        : options.productRow,
    ),
  };
  const access = {
    requireLab: mockFn(async () => ({ id: LAB, tenantId: TENANT })),
  };
  const organization = {
    listActiveStaffUserIds: mockFn(async () => ['staff-1', 'staff-2']),
  };
  const notifications = { notify: mockFn(), notifyAll: mockFn() };
  const audit = { record: mockFn(async () => undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const em: any = {
    transactional: mockFn((cb: any) => cb(em)),
    flush: mockFn(async () => undefined),
  };

  const service = new PharmacovigilanceService(
    em,
    repo as any,
    catalog as any,
    access as any,
    organization as any,
    notifications as any,
    audit as any,
    logger as any,
  );
  return { service, repo, notifications, audit, reportRow };
}

/** Cuerpo mínimo de un reporte válido. */
function createDto(overrides: Record<string, unknown> = {}) {
  return {
    pharmaProductId: PRODUCT,
    eventDate: '2026-08-20',
    eventTypeConceptId: PHL.PV_EVENT_ADVERSE_REACTION,
    description: 'Exantema generalizado tras la segunda dosis.',
    severityConceptId: PHL.PV_SEVERITY_MODERATE,
    reporterTypeConceptId: PHL.PV_REPORTER_DOCTOR,
    ...overrides,
  } as any;
}

describe('PharmacovigilanceService', () => {
  describe('alta del reporte', () => {
    it('asigna un código de caso correlativo por laboratorio y año', async () => {
      const { service, repo } = build({ reportCount: 41 });

      await service.createReport(LAB, createDto(), ACTOR);

      expect(repo.createReport).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          caseCode: expect.stringMatching(/^PV-\d{4}-00042$/),
        }),
      );
    });

    it('nace en «recibido» y con su primera acción de trazabilidad', async () => {
      const { service, repo } = build();

      await service.createReport(LAB, createDto(), ACTOR);

      expect(repo.createReport).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statusConceptId: PHL.PV_RECEIVED }),
      );
      expect(repo.appendAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          previousStatusConceptId: PHL.PV_RECEIVED,
          newStatusConceptId: PHL.PV_RECEIVED,
        }),
      );
    });

    it('avisa al personal del laboratorio', async () => {
      const { service, notifications } = build();

      await service.createReport(LAB, createDto(), ACTOR);

      expect(notifications.notifyAll).toHaveBeenCalledWith(
        expect.anything(),
        ['staff-1', 'staff-2'],
        expect.objectContaining({
          relatedResourceType: 'pharmacovigilance_report',
        }),
        ACTOR.id,
      );
    });

    it('rechaza un producto que no es del laboratorio', async () => {
      const { service } = build({ productRow: null });

      await expect(
        service.createReport(LAB, createDto(), ACTOR),
      ).rejects.toThrow('Producto no encontrado');
    });

    it('sella el alta en la cadena de auditoría', async () => {
      const { service, audit } = build();

      await service.createReport(LAB, createDto(), ACTOR);

      expect(audit.record).toHaveBeenCalledWith(
        expect.anything(),
        ACTOR,
        expect.objectContaining({
          action: 'PHARMACOVIGILANCE_REPORT_CREATED',
        }),
      );
    });
  });

  describe('seguimiento', () => {
    it('avanza de recibido a en evaluación dejando la acción', async () => {
      const { service, repo } = build();

      const result = await service.addAction(
        LAB,
        REPORT,
        {
          actionConceptId: PHL.PV_ACTION_ASSESSMENT,
          newStatusConceptId: PHL.PV_UNDER_ASSESSMENT,
          detail: 'Evaluación de causalidad iniciada.',
        },
        ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.PV_UNDER_ASSESSMENT);
      expect(repo.appendAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          previousStatusConceptId: PHL.PV_RECEIVED,
          newStatusConceptId: PHL.PV_UNDER_ASSESSMENT,
        }),
      );
    });

    it('registra la comunicación con la autoridad', async () => {
      const { service, repo } = build({
        reportRow: report({ statusConceptId: PHL.PV_UNDER_ASSESSMENT }),
      });

      await service.addAction(
        LAB,
        REPORT,
        {
          actionConceptId: PHL.PV_ACTION_AUTHORITY_COMMUNICATION,
          newStatusConceptId: PHL.PV_REPORTED_TO_AUTHORITY,
          detail: 'Notificación enviada.',
          authorityName: 'AGEMED',
          authorityReference: 'OF-2026-118',
        },
        ACTOR,
      );

      expect(repo.appendAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          authorityName: 'AGEMED',
          authorityReference: 'OF-2026-118',
        }),
      );
    });

    it('no reabre un reporte cerrado', async () => {
      const { service } = build({
        reportRow: report({ statusConceptId: PHL.PV_CLOSED }),
      });

      await expect(
        service.addAction(
          LAB,
          REPORT,
          {
            actionConceptId: PHL.PV_ACTION_FOLLOW_UP,
            newStatusConceptId: PHL.PV_UNDER_ASSESSMENT,
            detail: 'Reapertura',
          },
          ACTOR,
        ),
      ).rejects.toThrow('no está permitida');
    });

    it('el cierre sella la fecha', async () => {
      const reportRow = report({ statusConceptId: PHL.PV_UNDER_ASSESSMENT });
      const { service } = build({ reportRow });

      await service.addAction(
        LAB,
        REPORT,
        {
          actionConceptId: PHL.PV_ACTION_FOLLOW_UP,
          newStatusConceptId: PHL.PV_CLOSED,
          detail: 'Caso concluido.',
        },
        ACTOR,
      );

      expect(reportRow.closedAt).toBeInstanceOf(Date);
    });
  });
});
