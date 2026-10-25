import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { runWithTenant } from '../../../common';
import { DiagnosticsImagingController } from './diagnostics-imaging.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const imaging = {
    createEndpoint: mockFn(),
    storeStudy: mockFn(),
    recordDoseEvent: mockFn(),
    listStudiesByPatient: mockFn(),
  };
  const mediaQuality = {
    attachMedia: mockFn(),
    recordDataQualityEvent: mockFn(),
  };
  return {
    controller: new DiagnosticsImagingController(
      imaging as any,
      mediaQuality as any,
    ),
    imaging,
    mediaQuality,
  };
}

describe('DiagnosticsImagingController', () => {
  it('delegates createEndpoint (soporte)', async () => {
    const d = build();
    await d.controller.createEndpoint({ baseUri: 'http://x' }, actor);
    expect(d.imaging.createEndpoint).toHaveBeenCalledWith(
      { baseUri: 'http://x' },
      actor,
    );
  });

  it('listStudies (DIAG-02) pasa tenant del contexto, paciente y actor al servicio', async () => {
    const d = build();
    await runWithTenant('t-activo', () =>
      d.controller.listStudies('p1', 50, 0, actor),
    );
    expect(d.imaging.listStudiesByPatient).toHaveBeenCalledWith(
      't-activo',
      'p1',
      actor,
      50,
      0,
    );
  });

  it('delegates storeStudy (UC-20-11)', async () => {
    const d = build();
    const dto = {
      imagingEndpointId: 'e1',
      patientProfileId: 'p1',
      dicomStudyInstanceUid: 'u',
      series: [],
    };
    await d.controller.storeStudy(dto, actor);
    expect(d.imaging.storeStudy).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates attachMedia (UC-20-12)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', fileId: 'f1' };
    await d.controller.attachMedia(dto, actor);
    expect(d.mediaQuality.attachMedia).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates recordDose (UC-20-13)', async () => {
    const d = build();
    await d.controller.recordDose('st1', { doseLengthProduct: '1' }, actor);
    expect(d.imaging.recordDoseEvent).toHaveBeenCalledWith(
      'st1',
      { doseLengthProduct: '1' },
      actor,
    );
  });

  it('delegates recordDataQuality (UC-20-14)', async () => {
    const d = build();
    const dto = { targetId: 't', ruleCode: 'R1' };
    await d.controller.recordDataQuality(dto, actor);
    expect(d.mediaQuality.recordDataQualityEvent).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });
});
