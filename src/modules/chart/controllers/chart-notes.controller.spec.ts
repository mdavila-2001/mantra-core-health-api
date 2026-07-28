import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartNotesController } from './chart-notes.controller';

const actor = { id: 'clin-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const notesService = {
    createNote: mockFn(),
    addVersion: mockFn(),
    signVersion: mockFn(),
    cosignVersion: mockFn(),
    amendNote: mockFn(),
    releaseVersion: mockFn(),
    withholdVersion: mockFn(),
    recordExamFindings: mockFn(),
  };
  const controller = new ChartNotesController(notesService as any);
  return { controller, notesService };
}

describe('ChartNotesController', () => {
  it('delegates createNote (UC-15-01)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', authorProfileId: 'a1' };
    await d.controller.createNote(dto, actor);
    expect(d.notesService.createNote).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates addVersion (UC-15-02)', async () => {
    const d = build();
    const dto = { authorProfileId: 'a1' };
    await d.controller.addVersion('n1', dto, actor);
    expect(d.notesService.addVersion).toHaveBeenCalledWith('n1', dto, actor);
  });

  it('delegates signVersion (UC-15-03)', async () => {
    const d = build();
    const dto = { signerProfileId: 's1' };
    await d.controller.signVersion('n1', 'v1', dto, actor);
    expect(d.notesService.signVersion).toHaveBeenCalledWith(
      'n1',
      'v1',
      dto,
      actor,
    );
  });

  it('delegates cosignVersion (UC-15-04)', async () => {
    const d = build();
    const dto = { signerProfileId: 's2' };
    await d.controller.cosignVersion('n1', 'v1', dto, actor);
    expect(d.notesService.cosignVersion).toHaveBeenCalledWith(
      'n1',
      'v1',
      dto,
      actor,
    );
  });

  it('delegates amendNote (UC-15-05)', async () => {
    const d = build();
    const dto = { authorProfileId: 'a1', amendmentReasonText: 'x' };
    await d.controller.amendNote('n1', dto, actor);
    expect(d.notesService.amendNote).toHaveBeenCalledWith('n1', dto, actor);
  });

  it('delegates releaseVersion (UC-15-06)', async () => {
    const d = build();
    await d.controller.releaseVersion('v1', {}, actor);
    expect(d.notesService.releaseVersion).toHaveBeenCalledWith('v1', {}, actor);
  });

  it('delegates withholdVersion (UC-15-07)', async () => {
    const d = build();
    await d.controller.withholdVersion('v1', {}, actor);
    expect(d.notesService.withholdVersion).toHaveBeenCalledWith(
      'v1',
      {},
      actor,
    );
  });

  it('delegates recordExamFindings (UC-15-08)', async () => {
    const d = build();
    const dto = { findings: [{}] };
    await d.controller.recordExamFindings('v1', dto, actor);
    expect(d.notesService.recordExamFindings).toHaveBeenCalledWith(
      'v1',
      dto,
      actor,
    );
  });
});
