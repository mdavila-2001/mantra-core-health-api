import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { TelemetryConsentController } from './telemetry-consent.controller';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const consent = {
    acceptDisclosure: mockFn(),
    grantConsent: mockFn(),
    provisionSubject: mockFn(),
    withdrawConsent: mockFn(),
  };
  const controller = new TelemetryConsentController(consent as any);
  return { controller, consent };
}

describe('TelemetryConsentController', () => {
  it('delegates acceptDisclosure (UC-28-04)', async () => {
    const d = build();
    const dto = { trackingDisclosureVersionId: 'v1' };
    await d.controller.acceptDisclosure(dto, actor);
    expect(d.consent.acceptDisclosure).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates grantConsent (UC-28-05)', async () => {
    const d = build();
    const dto = { purposeDefinitionId: 'p1' };
    await d.controller.grantConsent(dto, actor);
    expect(d.consent.grantConsent).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates provisionSubject (UC-28-06)', async () => {
    const d = build();
    const dto = { pseudonymousSubjectKey: 'k' };
    await d.controller.provisionSubject(dto);
    expect(d.consent.provisionSubject).toHaveBeenCalledWith(dto);
  });

  it('delegates withdrawConsent (UC-28-12)', async () => {
    const d = build();
    await d.controller.withdrawConsent('c1', actor);
    expect(d.consent.withdrawConsent).toHaveBeenCalledWith('c1', actor);
  });
});
