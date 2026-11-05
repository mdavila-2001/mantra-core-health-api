import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../../common';
import { SchedulingBookingsController } from '../../../presentation/controllers/scheduling-bookings.controller';
import {
  BOOKING,
  FILE,
  RECEIPT,
  buildReceipts,
  notTheirs,
  otherPractitioner,
  patient,
  practitioner,
} from '../payment-receipts.testing';

describe('GetPaymentReceiptContentUseCase · el archivo de un comprobante', () => {
  it('el médico de la agenda recibe los bytes', async () => {
    const d = buildReceipts();

    const res = await d.content.execute(BOOKING, RECEIPT, practitioner);

    expect(res.mimeType).toBe('image/png');
    expect(d.files.download).toHaveBeenCalledWith(FILE);
  });

  it('el paciente de la cita también', async () => {
    const d = buildReceipts();

    await d.content.execute(BOOKING, RECEIPT, patient);

    expect(d.files.download).toHaveBeenCalledWith(FILE);
  });

  it('la misma autorización que la lista: otro médico recibe 404 y no se lee nada', async () => {
    const d = buildReceipts();

    await expect(
      d.content.execute(BOOKING, RECEIPT, otherPractitioner),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.files.download).not.toHaveBeenCalled();
  });

  it('un paciente con una cita ajena recibe 404', async () => {
    const d = buildReceipts();
    notTheirs(d.representation);

    await expect(
      d.content.execute(BOOKING, RECEIPT, patient),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.files.download).not.toHaveBeenCalled();
  });

  it('un comprobante de otra cita responde 404', async () => {
    const d = buildReceipts();
    d.receiptsRepo.findOfBooking.mockResolvedValue(null);

    await expect(
      d.content.execute(BOOKING, RECEIPT, practitioner),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('si la versión vigente dejó de ser de un tipo admitido, responde 422', async () => {
    const d = buildReceipts();
    d.files.download.mockResolvedValue({
      buffer: Buffer.from('<script>'),
      mimeType: 'text/html',
    });

    await expect(
      d.content.execute(BOOKING, RECEIPT, practitioner),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('la respuesta HTTP lleva Cache-Control: private, no-store', () => {
    // El encabezado lo declara la ruta con `@Header`: se lee de los metadatos
    // del controlador, que es lo que Nest aplica al responder.
    const handler = Object.getOwnPropertyDescriptor(
      SchedulingBookingsController.prototype,
      'paymentReceiptContent',
    )?.value as object;
    const headers: unknown = Reflect.getMetadata('__headers__', handler);
    expect(headers).toEqual(
      expect.arrayContaining([
        { name: 'Cache-Control', value: 'private, no-store' },
        {
          name: 'Content-Security-Policy',
          value: "sandbox; default-src 'none'",
        },
      ]),
    );
  });
});
