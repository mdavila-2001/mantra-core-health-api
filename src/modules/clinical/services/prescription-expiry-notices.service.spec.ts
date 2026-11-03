import { jest } from '@jest/globals';
import {
  PRESCRIPTION_EXPIRY_NOTICE_DAYS,
  PRESCRIPTION_EXPIRY_NOTICE_KEY_PREFIX,
  PrescriptionExpiryNoticesService,
} from './prescription-expiry-notices.service';
import { CLIN } from '../clinical.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const SYSTEM = { id: 'system-user', roles: ['SYSTEM'] } as any;
const NOW = new Date('2026-10-25T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

interface Rx {
  id: string;
  custodian_tenant_id: string;
  recipient_user_id: string;
}

const RX1: Rx = {
  id: 'rx-1',
  custodian_tenant_id: 't1',
  recipient_user_id: 'u-a',
};
const RX2: Rx = {
  id: 'rx-2',
  custodian_tenant_id: 't1',
  recipient_user_id: 'u-b',
};

function build(options: { lock?: boolean; candidates?: Rx[] } = {}) {
  const tx: any = {
    execute: mockFn().mockResolvedValue([{ locked: options.lock ?? true }]),
  };
  const em: any = { transactional: mockFn(async (fn: any) => fn(tx)) };
  // Los avisos ya pedidos, como los vería `messaging.notification_requests`.
  const requested = new Set<string>();
  const repo = {
    // Doble fiel de la consulta: excluye las recetas con clave de aviso existente.
    findToNotify: mockFn(async (_em: any, f: any) =>
      (options.candidates ?? [RX1, RX2])
        .filter((r) => !requested.has(`${f.noticeKeyPrefix}${r.id}`))
        .slice(0, f.limit),
    ),
  };
  const notifications = {
    emitInApp: mockFn(async (input: any) => {
      requested.add(input.debounceKey);
      return {
        suppressed: false,
        inAppNotificationId: `n-${input.destination.id}`,
      };
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PrescriptionExpiryNoticesService(
    em,
    repo as any,
    notifications as any,
    logger as any,
  );
  return { service, tx, em, repo, notifications, logger, requested };
}

describe('PrescriptionExpiryNoticesService (PAC-REC-002)', () => {
  it('busca recetas emitidas que vencen entre ahora y 3 días', async () => {
    const d = build();

    await d.service.sweep(SYSTEM, 50, NOW);

    const [, filter] = d.repo.findToNotify.mock.calls[0] as any[];
    expect(filter.issuedStatusConceptId).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
    expect(filter.after).toEqual(NOW);
    expect(filter.until).toEqual(
      new Date(NOW.getTime() + PRESCRIPTION_EXPIRY_NOTICE_DAYS * DAY),
    );
    expect(PRESCRIPTION_EXPIRY_NOTICE_DAYS).toBe(3);
    expect(filter.noticeKeyPrefix).toBe(PRESCRIPTION_EXPIRY_NOTICE_KEY_PREFIX);
    expect(filter.limit).toBe(50);
  });

  it('avisa a cada paciente por la bandeja in-app, en su categoría y con destino navegable', async () => {
    const d = build();

    const result = await d.service.sweep(SYSTEM, 200, NOW);

    expect(result).toEqual({
      scanned: 2,
      notified: 2,
      suppressed: 0,
      failed: 0,
      skipped: false,
    });
    const inputs = d.notifications.emitInApp.mock.calls.map((c: any[]) => c[0]);
    expect(inputs[0]).toMatchObject({
      recipientUserId: 'u-a',
      category: 'CLINICAL',
      destination: { type: 'PRESCRIPTION_EXPIRING', id: 'rx-1' },
      tenantId: 't1',
      debounceKey: 'clinical:PRESCRIPTION_EXPIRING:rx-1',
      actorUserId: 'system-user',
    });
    expect(inputs[1].recipientUserId).toBe('u-b');
  });

  it('el aviso no nombra el medicamento ni lleva datos clínicos', async () => {
    const d = build();

    await d.service.sweep(SYSTEM, 200, NOW);

    const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
    expect(input.payloadJson).toBeUndefined();
    expect(input.subject).toBe('Su receta está por vencer');
    expect(input.bodyText).toContain('3 días');
  });

  it('es idempotente: un segundo barrido no repite ningún aviso', async () => {
    const d = build();

    const first = await d.service.sweep(SYSTEM, 200, NOW);
    const second = await d.service.sweep(SYSTEM, 200, NOW);

    expect(first.notified).toBe(2);
    expect(second).toEqual({
      scanned: 0,
      notified: 0,
      suppressed: 0,
      failed: 0,
      skipped: false,
    });
    expect(d.notifications.emitInApp).toHaveBeenCalledTimes(2);
  });

  it('un aviso suprimido por preferencia cuenta aparte y no se reintenta', async () => {
    const d = build();
    d.notifications.emitInApp.mockImplementation(async (input: any) => {
      d.requested.add(input.debounceKey);
      return { suppressed: true, suppressionReason: 'opt-out' };
    });

    const first = await d.service.sweep(SYSTEM, 200, NOW);
    const second = await d.service.sweep(SYSTEM, 200, NOW);

    expect(first).toMatchObject({ scanned: 2, notified: 0, suppressed: 2 });
    expect(second.scanned).toBe(0);
  });

  it('un aviso que falla no frena al resto y se reintenta en el barrido siguiente', async () => {
    const d = build();
    d.notifications.emitInApp.mockImplementationOnce(async () => ({
      suppressed: false,
      failed: true,
    }));

    const first = await d.service.sweep(SYSTEM, 200, NOW);
    const second = await d.service.sweep(SYSTEM, 200, NOW);

    expect(first).toMatchObject({ scanned: 2, notified: 1, failed: 1 });
    // El que falló no dejó clave: vuelve a ser candidato.
    expect(second).toMatchObject({ scanned: 1, notified: 1, failed: 0 });
  });

  it('si otro barrido tiene el bloqueo, no hace nada', async () => {
    const d = build({ lock: false });

    const result = await d.service.sweep(SYSTEM, 200, NOW);

    expect(result).toEqual({
      scanned: 0,
      notified: 0,
      suppressed: 0,
      failed: 0,
      skipped: true,
    });
    expect(d.repo.findToNotify).not.toHaveBeenCalled();
    expect(d.notifications.emitInApp).not.toHaveBeenCalled();
  });

  it('corre en una transacción con bloqueo consultivo de transacción', async () => {
    const d = build();

    await d.service.sweep(SYSTEM, 200, NOW);

    expect(d.em.transactional).toHaveBeenCalledTimes(1);
    expect(d.tx.execute.mock.calls[0][0]).toContain(
      'pg_try_advisory_xact_lock',
    );
  });

  it('registra sólo conteos, sin identificadores de receta ni de paciente', async () => {
    const d = build();

    await d.service.sweep(SYSTEM, 200, NOW);

    const [fields] = d.logger.info.mock.calls[0] as any[];
    expect(fields).toEqual({
      operation: 'clinical.prescription-expiry.sweep',
      scanned: 2,
      notified: 2,
      suppressed: 0,
      failed: 0,
      skipped: false,
    });
  });
});
