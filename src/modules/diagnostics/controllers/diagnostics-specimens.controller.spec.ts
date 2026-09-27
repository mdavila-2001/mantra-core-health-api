import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsSpecimensController } from './diagnostics-specimens.controller';
import { runWithTenant } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = {
    createSpecimen: mockFn(),
    accession: mockFn(),
    reject: mockFn(),
    createContainer: mockFn(),
    recordCustodyEvent: mockFn(),
    getAccession: mockFn(),
    getSpecimen: mockFn(),
  };
  return {
    controller: new DiagnosticsSpecimensController(service as any),
    service,
  };
}

describe('DiagnosticsSpecimensController', () => {
  it('delegates createSpecimen', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1' };
    await d.controller.createSpecimen(dto as any, actor);
    expect(d.service.createSpecimen).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates accession (UC-20-01)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', specimenIds: ['s1'] };
    await d.controller.accession(dto, actor);
    expect(d.service.accession).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates reject (UC-20-02)', async () => {
    const d = build();
    await d.controller.reject('s1', { rejectionReasonConceptId: 'r1' }, actor);
    expect(d.service.reject).toHaveBeenCalledWith(
      's1',
      { rejectionReasonConceptId: 'r1' },
      actor,
    );
  });

  it('delegates createContainer (soporte)', async () => {
    const d = build();
    await d.controller.createContainer(
      's1',
      { containerIdentifier: 'c', containerTypeConceptId: 't' },
      actor,
    );
    expect(d.service.createContainer).toHaveBeenCalledWith(
      's1',
      { containerIdentifier: 'c', containerTypeConceptId: 't' },
      actor,
    );
  });

  it('delegates custodyEvent (UC-20-03)', async () => {
    const d = build();
    await d.controller.custodyEvent('c1', { specimenId: 's1' }, actor);
    expect(d.service.recordCustodyEvent).toHaveBeenCalledWith(
      'c1',
      { specimenId: 's1' },
      actor,
    );
  });

  describe('lecturas (CL-47)', () => {
    it('aceptado: getAccession delega con el tenant del contexto', async () => {
      const d = build();
      d.service.getAccession.mockResolvedValue({ id: 'acc1' });
      const res = await runWithTenant('t1', () =>
        d.controller.getAccession('acc1'),
      );
      expect(d.service.getAccession).toHaveBeenCalledWith('acc1', 't1');
      expect(res).toEqual({ id: 'acc1' });
    });

    it('aceptado: getSpecimen delega con el tenant del contexto', async () => {
      const d = build();
      d.service.getSpecimen.mockResolvedValue({ id: 's1' });
      const res = await runWithTenant('t1', () =>
        d.controller.getSpecimen('s1'),
      );
      expect(d.service.getSpecimen).toHaveBeenCalledWith('s1', 't1');
      expect(res).toEqual({ id: 's1' });
    });

    it('inválido: sin X-Tenant-Id, requireTenantId corta antes de llamar al servicio', async () => {
      const d = build();
      // requireTenantId() se evalúa antes de cualquier await: sin contexto de
      // tenant tira sincrónicamente, así que hay que envolver la llamada.
      await expect(async () =>
        d.controller.getAccession('acc1'),
      ).rejects.toThrow(/tenant/i);
      expect(d.service.getAccession).not.toHaveBeenCalled();
    });
  });
});
