import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { CommonPaymentReceiptFilesAdapter } from './common-payment-receipt-files.adapter';
import { PAYMENT_RECEIPT_MIME_TYPES } from '../../domain/booking/payment-receipt';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const FILE = '77777777-7777-7777-7777-777777777777';
const actor = { id: 'patient-user', roles: ['PATIENT'] } as any;
const em = {} as any;

function build(sizeBytes = String(1024 * 1024)) {
  const attachable = {
    assertUsableBy: mockFn().mockResolvedValue({
      file: { id: FILE, originalName: 'transferencia.pdf' },
      version: { mimeType: 'application/pdf', sizeBytes },
    }),
  };
  const uploads = { downloadForAuthorizedContext: mockFn() };
  return {
    attachable,
    uploads,
    adapter: new CommonPaymentReceiptFilesAdapter(
      attachable as any,
      uploads as any,
    ),
  };
}

describe('CommonPaymentReceiptFilesAdapter · qué archivo sirve de comprobante', () => {
  it('acepta un archivo propio de los tipos admitidos y devuelve tipo y nombre', async () => {
    const d = build();

    const info = await d.adapter.assertAttachable(em, FILE, actor);

    expect(info).toEqual({
      mimeType: 'application/pdf',
      originalName: 'transferencia.pdf',
    });
    const [, fileId, who, options] = d.attachable.assertUsableBy.mock.calls[0];
    expect(fileId).toBe(FILE);
    expect(who).toBe(actor);
    expect(options.allowedMimeTypes).toEqual(PAYMENT_RECEIPT_MIME_TYPES);
  });

  it('un archivo de 6 MB responde 422', async () => {
    const d = build(String(6 * 1024 * 1024));

    await expect(
      d.adapter.assertAttachable(em, FILE, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('un .exe (tipo no admitido) responde 422', async () => {
    const d = build();
    d.attachable.assertUsableBy.mockRejectedValue(
      new PreconditionFailedException(
        'El comprobante no es de un formato admitido para este uso',
      ),
    );

    await expect(
      d.adapter.assertAttachable(em, FILE, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('un archivo de otro usuario responde 422, no 403', async () => {
    const d = build();
    d.attachable.assertUsableBy.mockRejectedValue(
      new ForbiddenException('El comprobante no le pertenece'),
    );

    await expect(
      d.adapter.assertAttachable(em, FILE, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('un archivo que no existe responde 422, no 404', async () => {
    const d = build();
    d.attachable.assertUsableBy.mockRejectedValue(
      new ResourceNotFoundException('El comprobante no existe'),
    );

    await expect(
      d.adapter.assertAttachable(em, FILE, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('descarga por el camino de contexto ya autorizado', async () => {
    const d = build();

    await d.adapter.download(FILE);

    expect(d.uploads.downloadForAuthorizedContext).toHaveBeenCalledWith(
      FILE,
      'scheduling.booking.payment-receipt',
    );
  });
});
