import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsOrdersService } from './diagnostics-orders.service';
import { DIAG } from '../diagnostics.concepts';
import { CLIN } from '../../clinical/clinical.concepts';

const TENANT = 't1';
const PATIENT = 'p1';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const fork = {};
  const em = { fork: mockFn().mockReturnValue(fork) };
  const repo = {
    findOrdersByPatient: mockFn().mockResolvedValue([]),
    findReportsByPatient: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticsOrdersService(
    em as any,
    repo as any,
    logger as any,
  );
  return { service, repo, em, fork };
}

/**
 * Una orden con los campos que el servicio proyecta.
 *
 * @param id - Identificador de la orden.
 * @returns La fila simulada.
 */
function order(id: string) {
  return {
    id,
    patientProfileId: PATIENT,
    encounterId: 'e1',
    codeConceptId: 'code-1',
    categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
    priorityConceptId: 'prio-1',
    requesterProfileId: 'prof-1',
    createdAt: new Date('2026-08-14T10:00:00Z'),
  };
}

/**
 * Un informe con los campos que el servicio proyecta.
 *
 * @param id - Identificador del informe.
 * @returns La fila simulada.
 */
function report(id: string) {
  return {
    id,
    patientProfileId: PATIENT,
    serviceRequestId: 'sr-1',
    encounterId: 'e1',
    codeConceptId: 'code-1',
    categoryConceptId: undefined,
    lifecycleStatusConceptId: CLIN.REPORT_FINAL,
    currentVersionId: 'v1',
    currentReleasedVersionId: undefined,
    resultReleaseStatusConceptId: CLIN.RELEASE_HELD,
    createdAt: new Date('2026-08-14T11:00:00Z'),
  };
}

describe('DiagnosticsOrdersService', () => {
  describe('getPatientOrders', () => {
    it('acota la lectura al tenant y al paciente', async () => {
      const d = build();

      await d.service.getPatientOrders(TENANT, PATIENT, 50);

      expect(d.repo.findOrdersByPatient).toHaveBeenCalledWith(
        d.fork,
        TENANT,
        PATIENT,
        expect.any(Array),
        51,
      );
      expect(d.repo.findReportsByPatient).toHaveBeenCalledWith(
        d.fork,
        TENANT,
        PATIENT,
        51,
      );
    });

    it('pide exactamente las dos categorías diagnósticas', async () => {
      const d = build();

      await d.service.getPatientOrders(TENANT, PATIENT, 50);

      const categories = d.repo.findOrdersByPatient.mock.calls[0][3];
      expect(categories).toEqual([
        CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
      ]);
    });

    it('proyecta órdenes e informes con el tope aplicado', async () => {
      const d = build();
      d.repo.findOrdersByPatient.mockResolvedValue([order('o1')]);
      d.repo.findReportsByPatient.mockResolvedValue([report('r1')]);

      const out = await d.service.getPatientOrders(TENANT, PATIENT, 50);

      expect(out.patientProfileId).toBe(PATIENT);
      expect(out.orders).toHaveLength(1);
      expect(out.orders[0].id).toBe('o1');
      expect(out.reports).toHaveLength(1);
      expect(out.reports[0].serviceRequestId).toBe('sr-1');
      expect(out.limit).toBe(50);
      expect(out.truncated).toEqual([]);
    });

    it('recorta al tope y anota el bloque que sobraba', async () => {
      const d = build();
      // Dos filas con tope 1: la de más es la señal de que hay más.
      d.repo.findOrdersByPatient.mockResolvedValue([order('o1'), order('o2')]);
      d.repo.findReportsByPatient.mockResolvedValue([report('r1')]);

      const out = await d.service.getPatientOrders(TENANT, PATIENT, 1);

      expect(out.orders).toHaveLength(1);
      expect(out.orders[0].id).toBe('o1');
      expect(out.truncated).toEqual(['orders']);
    });

    it('anota cada bloque recortado por separado', async () => {
      const d = build();
      d.repo.findOrdersByPatient.mockResolvedValue([order('o1'), order('o2')]);
      d.repo.findReportsByPatient.mockResolvedValue([
        report('r1'),
        report('r2'),
      ]);

      const out = await d.service.getPatientOrders(TENANT, PATIENT, 1);

      expect(out.truncated).toEqual(['orders', 'reports']);
    });

    it('devuelve bloques vacíos sin inventar nada cuando no hay filas', async () => {
      const d = build();

      const out = await d.service.getPatientOrders(TENANT, PATIENT, 50);

      expect(out.orders).toEqual([]);
      expect(out.reports).toEqual([]);
      expect(out.truncated).toEqual([]);
    });
  });
});
