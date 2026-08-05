import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalAlertsService } from './clinical-alerts.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';

const actor = { id: 'md-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const alertsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ClinicalAlertsService(
    em as any,
    alertsRepo as any,
    logger as any,
  );
  return { service, alertsRepo };
}

describe('ClinicalAlertsService (UC-18-05)', () => {
  it('acknowledges an active alert', async () => {
    const d = build();
    const alert = {
      id: 'a1',
      statusConceptId: CEXT.ALERT_ACTIVE,
      severityConceptId: CEXT.SEVERITY_LOW,
      updatedAt: new Date(),
    };
    d.alertsRepo.findById.mockResolvedValue(alert);
    const res = await d.service.acknowledge('a1', actor);
    expect(res.statusConceptId).toBe(CEXT.ALERT_ACKNOWLEDGED);
  });

  it('throws when the alert does not exist', async () => {
    const d = build();
    d.alertsRepo.findById.mockResolvedValue(null);
    await expect(d.service.acknowledge('a1', actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('rejects acknowledging a non-active alert (precondition)', async () => {
    const d = build();
    d.alertsRepo.findById.mockResolvedValue({
      id: 'a1',
      statusConceptId: CEXT.ALERT_ACKNOWLEDGED,
    });
    await expect(d.service.acknowledge('a1', actor)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('requires a reason to override a high-severity alert (precondition)', async () => {
    const d = build();
    d.alertsRepo.findById.mockResolvedValue({
      id: 'a1',
      statusConceptId: CEXT.ALERT_ACTIVE,
      severityConceptId: CEXT.SEVERITY_HIGH,
    });
    await expect(
      d.service.override('a1', {} as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('overrides an active alert with a reason', async () => {
    const d = build();
    const alert: any = {
      id: 'a1',
      statusConceptId: CEXT.ALERT_ACTIVE,
      severityConceptId: CEXT.SEVERITY_HIGH,
      updatedAt: new Date(),
    };
    d.alertsRepo.findById.mockResolvedValue(alert);
    const res = await d.service.override(
      'a1',
      { reason: 'clinical rationale' },
      actor,
    );
    expect(res.statusConceptId).toBe(CEXT.ALERT_OVERRIDDEN);
    expect(alert.overriddenByUserId).toBe('md-1');
  });
});
