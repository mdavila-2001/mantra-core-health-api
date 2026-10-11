import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import {
  BillingSimulatedService,
  entryProblems,
} from './billing-simulated.service';
import type { InvoicesService } from './invoices.service';
import type { PaymentsReceivedService } from './payments-received.service';

const CHARGE = '11111111-1111-4111-8111-111111111111';

function build(rows: unknown[] = []) {
  const execute = (jest.fn as any)().mockResolvedValue(rows) as any;
  const em = {
    getConnection: () => ({ execute }),
    getTransactionContext: () => undefined,
  } as unknown as EntityManager;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
  } as unknown as PinoLogger;
  const invoices = {
    issueFromEncounter: jest.fn(),
  } as unknown as InvoicesService;
  const payments = {
    apply: (jest.fn as any)(),
  } as unknown as PaymentsReceivedService;
  return {
    service: new BillingSimulatedService(em, invoices, payments, logger),
    execute,
    invoices,
    payments,
  };
}

const user = (over: Partial<AuthenticatedUser>): AuthenticatedUser => ({
  id: 'u1',
  roles: [],
  ...over,
});
const doctor = user({ roles: ['PRACTITIONER'], practitionerProfileId: 'h1' });
const patient = user({ roles: ['PATIENT'], patientProfileId: 'p1' });
const admin = user({ roles: ['SECURITY_ADMIN'], tenantIds: ['t1'] });

describe('BillingSimulatedService · permisos', () => {
  afterEach(() => {
    delete process.env['BILLING_SIMULATED_ENABLED'];
  });

  it('el paciente no opera cobros (403) pero sí ve «mis facturas» sin tocar los cobros', async () => {
    const { service, execute } = build();
    await expect(service.listCharges(patient)).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      service.registerPayment(patient, CHARGE, 1),
    ).rejects.toMatchObject({ status: 403 });
    const mine = await service.myInvoices(patient);
    expect(mine.view).toBe('RECEIVED');
    // El SQL de «mis facturas» se acota al perfil del paciente.
    const [sql, params] = execute.mock.calls.at(-1)!;
    expect(sql).toContain('s.patient_profile_id = ?');
    expect(params).toContain('p1');
  });

  it('el médico no anula, no revierte, no entrega ni ve la bandeja (403)', async () => {
    const { service } = build();
    await expect(
      service.annul(doctor, CHARGE, { reasonCode: 1 }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(service.revertAnnulment(doctor, CHARGE)).rejects.toMatchObject(
      { status: 403 },
    );
    await expect(
      service.email(doctor, CHARGE, { to: 'a@b.co' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(service.outbox(doctor)).rejects.toMatchObject({ status: 403 });
  });

  it('el alcance del médico llega al SQL: sólo sus consultas', async () => {
    const { service, execute } = build();
    await service.listCharges(doctor);
    const [sql, params] = execute.mock.calls[0]!;
    expect(sql).toContain('e.primary_practitioner_id = ?');
    expect(params).toContain('h1');
  });

  it('un cobro fuera del alcance es 404, no 403', async () => {
    const { service } = build([]);
    await expect(
      service.registerPayment(doctor, CHARGE, 1),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      service.registerInstancePayment(admin, CHARGE, 'i', {
        methodCode: 1,
        amount: '1',
      }),
    ).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      service.issueInvoice(doctor, 'no-es-uuid', {
        buyer: { name: 'x', documentTypeCode: 1, documentNumber: '1' },
      }),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it('un método de pago fuera del catálogo es 400', async () => {
    const { service } = build();
    await expect(
      service.registerPayment(doctor, CHARGE, 99),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('apagada por entorno, todo es 404', async () => {
    process.env['BILLING_SIMULATED_ENABLED'] = 'false';
    const { service } = build();
    await expect(service.listCharges(admin)).rejects.toMatchObject({
      status: 404,
    });
    expect(() => service.catalogs()).toThrow();
  });

  it('el catálogo declara que es simulado y lista los mensajes forzables', () => {
    const { service } = build();
    const c = service.catalogs();
    expect(c.simulated).toBe(true);
    expect(c.paymentMethods.map((m) => m.codigo)).toEqual([1, 2, 3]);
    expect(c.forceableMessages.some((m) => m.advertencia)).toBe(true);
  });
});

describe('entryProblems', () => {
  const ok = {
    buyer: { name: 'Ana Pérez', documentTypeCode: 1, documentNumber: '123' },
  };

  it('acepta un comprador válido', () => {
    expect(entryProblems(ok, '150.00')).toEqual([]);
  });

  it('señala nombre, documento, complemento, correo y descuento', () => {
    const problemas = entryProblems(
      {
        buyer: {
          name: '',
          documentTypeCode: 9,
          documentNumber: '',
          complement: '123456',
          email: 'x',
        },
        additionalDiscount: '200.00',
      },
      '150.00',
    ).map((p) => p.field);
    expect(problemas).toEqual([
      'buyer.name',
      'buyer.documentTypeCode',
      'buyer.documentNumber',
      'buyer.complement',
      'buyer.email',
      'additionalDiscount',
    ]);
  });
});
