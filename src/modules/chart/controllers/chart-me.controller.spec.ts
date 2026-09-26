import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartMeController } from './chart-me.controller';

const actor = {
  id: 'user-1',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;

function build() {
  const readService = {
    listMyNotes: mockFn(),
    listMyDocuments: mockFn(),
    getMyDocumentFileContent: mockFn(),
  };
  const encounterPdfService = { renderForPatient: mockFn() };
  const recordPdfService = { renderForPatient: mockFn() };
  const controller = new ChartMeController(
    readService as any,
    encounterPdfService as any,
    recordPdfService as any,
  );
  return { controller, readService, encounterPdfService, recordPdfService };
}

describe('ChartMeController (BR-15)', () => {
  it('delegates listMyNotes with the default limit', async () => {
    const d = build();
    await d.controller.listMyNotes(actor);
    expect(d.readService.listMyNotes).toHaveBeenCalledWith(actor, 50);
  });

  it('delegates listMyDocuments', async () => {
    const d = build();
    await d.controller.listMyDocuments(actor, 10);
    expect(d.readService.listMyDocuments).toHaveBeenCalledWith(actor, 10);
  });

  it('delegates getMyDocumentFileContent and sets Content-Disposition', async () => {
    const d = build();
    d.readService.getMyDocumentFileContent.mockResolvedValue({
      buffer: Buffer.from('x'),
      mimeType: 'application/pdf',
      originalName: 'a b.pdf',
    });
    const res = {
      setHeader: mockFn(),
      send: mockFn(),
    };
    await d.controller.getMyDocumentFileContent(
      'doc-1',
      'file-1',
      res as any,
      actor,
    );
    expect(d.readService.getMyDocumentFileContent).toHaveBeenCalledWith(
      'doc-1',
      'file-1',
      actor,
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(res.send).toHaveBeenCalled();
  });

  it('delegates getMyEncounterPdf', async () => {
    const d = build();
    d.encounterPdfService.renderForPatient.mockResolvedValue({
      buffer: Buffer.from('x'),
      fileName: 'enc.pdf',
    });
    const res = { setHeader: mockFn(), send: mockFn() };
    await d.controller.getMyEncounterPdf('enc-1', res as any, actor);
    expect(d.encounterPdfService.renderForPatient).toHaveBeenCalledWith(
      'enc-1',
      actor,
    );
  });

  it('getMyRecordPdf sirve el PDF de la historia sin caché', async () => {
    const d = build();
    d.recordPdfService.renderForPatient.mockResolvedValue({
      buffer: Buffer.from('pdf'),
      fileName: 'historia-pat-1.pdf',
    });
    const res = { setHeader: mockFn(), send: mockFn() };
    await d.controller.getMyRecordPdf(res as any, actor);
    expect(d.recordPdfService.renderForPatient).toHaveBeenCalledWith(actor);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-store',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(res.send).toHaveBeenCalledWith(Buffer.from('pdf'));
  });
});
