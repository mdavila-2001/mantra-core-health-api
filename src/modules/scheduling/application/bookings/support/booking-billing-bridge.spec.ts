import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../../../common';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import { createFakeBookingBilling } from '../booking-billing.testing';
import { BookingBillingBridge, amountsOf } from './booking-billing-bridge';

const PRACTICE = '11111111-1111-4111-8111-111111111111';
const RESOURCE = '22222222-2222-4222-8222-222222222222';
const BOOKING = '33333333-3333-4333-8333-333333333333';
const PATIENT = '44444444-4444-4444-8444-444444444444';
const APPOINTMENT = '55555555-5555-4555-8555-555555555555';
const ENCOUNTER = '66666666-6666-4666-8666-666666666666';
const ACTOR = '77777777-7777-4777-8777-777777777777';
const uow = {} as any;

const CONSULTATION = {
  serviceCatalogId: '88888888-8888-4888-8888-888888888888',
  name: 'Consulta médica',
  price: '150.00',
};

function build(
  options: {
    practiceId?: string | null;
    prices?: Record<string, typeof CONSULTATION>;
    encounters?: Map<string, string>;
  } = {},
) {
  const billing = createFakeBookingBilling(
    options.prices ?? { [PRACTICE]: CONSULTATION },
  );
  const catalogRepo = {
    findResourceById: jest.fn(async () =>
      options.practiceId === null
        ? { id: RESOURCE }
        : { id: RESOURCE, practiceId: options.practiceId ?? PRACTICE },
    ),
  };
  const appointments = {
    findLatestEncounterIds: jest.fn(
      async () => options.encounters ?? new Map(),
    ),
  };
  const bridge = new BookingBillingBridge(
    billing,
    catalogRepo as any,
    appointments as any,
  );
  return { bridge, billing, catalogRepo, appointments };
}

function booking(extra: Record<string, unknown> = {}) {
  return {
    id: BOOKING,
    resourceId: RESOURCE,
    patientProfileId: PATIENT,
    ...extra,
  } as any;
}

const cash = (amountCents: number) => ({
  amountCents,
  method: 'CASH' as const,
  capAtBalance: false,
});

describe('BookingBillingBridge · el pago de la agenda llega a facturación (FAC-01)', () => {
  it('el primer pago crea la cuenta por cobrar con el precio de la consulta y le asigna lo recibido', async () => {
    const { bridge, billing } = build();
    const row = {} as any;

    const link = await bridge.bill(uow, booking(), row, cash(15000), ACTOR);

    expect(link).toEqual({
      linked: true,
      invoiceId: row.invoiceId,
      amountBilled: 150,
      amountPaid: 150,
      currencyCode: 'BOB',
      reason: null,
    });
    const invoice = billing.invoices.get(row.invoiceId)!;
    expect(invoice.issued.practiceId).toBe(PRACTICE);
    expect(invoice.issued.serviceCatalogId).toBe(CONSULTATION.serviceCatalogId);
    expect(invoice.payments).toHaveLength(1);
    expect(invoice.payments[0].method).toBe('CASH');
  });

  it('un segundo pago va a la MISMA factura: nunca dos por cita', async () => {
    const { bridge, billing } = build();
    const row = {} as any;

    await bridge.bill(uow, booking(), row, cash(5000), ACTOR);
    const link = await bridge.bill(uow, booking(), row, cash(10000), ACTOR);

    expect(billing.invoices.size).toBe(1);
    expect(link.amountBilled).toBe(150);
    expect(link.amountPaid).toBe(150);
  });

  it('más de lo que falta pagar es 422 PAYMENT_AMOUNT_EXCEEDS_BALANCE y no registra nada', async () => {
    const { bridge, billing } = build();
    const row = {} as any;
    await bridge.bill(uow, booking(), row, cash(10000), ACTOR);

    const err = await bridge
      .bill(uow, booking(), row, cash(6000), ACTOR)
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(PreconditionFailedException);
    expect((err as any).reason).toBe(
      SchedulingErrorReason.PAYMENT_AMOUNT_EXCEEDS_BALANCE,
    );
    expect(billing.invoices.get(row.invoiceId)!.payments).toHaveLength(1);
  });

  it('con comprobante, lo que pasa del saldo se recorta en vez de rechazarse', async () => {
    const { bridge } = build();
    const link = await bridge.bill(
      uow,
      booking(),
      {} as any,
      { amountCents: 20000, method: 'TRANSFER', capAtBalance: true },
      ACTOR,
    );
    expect(link.amountPaid).toBe(150);
  });

  it('sin monto no toca facturación: NO_AMOUNT', async () => {
    const { bridge, billing, catalogRepo } = build();
    const link = await bridge.bill(uow, booking(), {} as any, undefined, ACTOR);
    expect(link).toMatchObject({ linked: false, reason: 'NO_AMOUNT' });
    expect(billing.invoices.size).toBe(0);
    expect(catalogRepo.findResourceById).not.toHaveBeenCalled();
  });

  it('sin monto pero con factura ya hecha, devuelve ese vínculo', async () => {
    const { bridge } = build();
    const row = {} as any;
    await bridge.bill(uow, booking(), row, cash(5000), ACTOR);

    const link = await bridge.bill(uow, booking(), row, undefined, ACTOR);

    expect(link).toMatchObject({
      linked: true,
      amountPaid: 50,
      amountBilled: 150,
    });
  });

  it('un recurso sin práctica: NO_PRACTICE, sin factura', async () => {
    const { bridge, billing } = build({ practiceId: null });
    const link = await bridge.bill(uow, booking(), {} as any, cash(100), ACTOR);
    expect(link.reason).toBe('NO_PRACTICE');
    expect(billing.invoices.size).toBe(0);
  });

  it('una práctica sin precio publicado, o con 0: NO_PRICE, nunca una factura de 0', async () => {
    const cases: Record<string, typeof CONSULTATION>[] = [
      {},
      { [PRACTICE]: { ...CONSULTATION, price: '0.00' } },
    ];
    for (const prices of cases) {
      const { bridge, billing } = build({ prices });
      const row = {} as any;
      const link = await bridge.bill(uow, booking(), row, cash(100), ACTOR);
      expect(link.reason).toBe('NO_PRICE');
      expect(row.invoiceId).toBeUndefined();
      expect(billing.invoices.size).toBe(0);
    }
  });

  it('una reserva de servicio factura el precio congelado en la reserva (S-4)', async () => {
    const { bridge, billing } = build();
    const row = {} as any;
    await bridge.bill(
      uow,
      booking({
        serviceSnapshot: {
          serviceCatalogId: 'svc',
          serviceName: 'Ecografía',
          price: '320.50',
        },
      }),
      row,
      cash(100),
      ACTOR,
    );
    const invoice = billing.invoices.get(row.invoiceId)!;
    expect(invoice.totalCents).toBe(32050);
    expect(invoice.issued.description).toBe('Ecografía');
  });

  it('si la cita ya tiene encuentro, la factura nace con él (S-3)', async () => {
    const { bridge, billing } = build({
      encounters: new Map([[APPOINTMENT, ENCOUNTER]]),
    });
    const row = {} as any;
    await bridge.bill(
      uow,
      booking({ appointmentId: APPOINTMENT }),
      row,
      cash(100),
      ACTOR,
    );
    expect(billing.invoices.get(row.invoiceId)!.issued.encounterId).toBe(
      ENCOUNTER,
    );
  });
});

describe('BookingBillingBridge.amountCents', () => {
  it.each([
    [150, 15000],
    [0.5, 50],
    [99.99, 9999],
  ])('%p Bs son %p centavos', (amount, cents) => {
    expect(BookingBillingBridge.amountCents(amount)).toBe(cents);
  });

  it.each([0, -5, 1.234, Number.NaN, Number.POSITIVE_INFINITY])(
    '%p es 422 PAYMENT_AMOUNT_INVALID',
    (amount) => {
      expect(() => BookingBillingBridge.amountCents(amount)).toThrow(
        PreconditionFailedException,
      );
    },
  );
});

describe('amountsOf', () => {
  it('solo pone lo cobrado cuando el pago está facturado', () => {
    expect(
      amountsOf({
        linked: true,
        invoiceId: 'x',
        amountBilled: 150,
        amountPaid: 50,
        currencyCode: 'BOB',
        reason: null,
      }),
    ).toEqual({ amountPaid: 50, currencyCode: 'BOB' });
    expect(
      amountsOf({
        linked: false,
        invoiceId: null,
        amountBilled: null,
        amountPaid: null,
        currencyCode: null,
        reason: 'NO_AMOUNT',
      }),
    ).toEqual({});
  });
});
