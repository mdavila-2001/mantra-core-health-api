import { jest } from '@jest/globals';
import { generate, generateSecret } from 'otplib';
import { CONCEPTS, encryptSecret } from '../../../../common';
import { IamTotpService } from './iam-totp.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** El paso usado queda en memoria, como quedaría en `iam.security_events`. */
function build() {
  const tx = { execute: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const steps = new Map<string, number>();
  const eventsRepo = {
    lastMfaTimeStep: mockFn(
      async (_tx: unknown, _user: string, factor: string) => steps.get(factor),
    ),
    record: mockFn((_tx: unknown, data: any) => {
      steps.set(data.detailJson.factorId, data.detailJson.timeStep);
    }),
  };
  return {
    service: new IamTotpService(em as any, eventsRepo as any),
    tx,
    em,
    eventsRepo,
    steps,
  };
}

const factorOf = (secret: string, id = 'f1'): any => ({
  id,
  secretEncrypted: encryptSecret(secret),
});

describe('IamTotpService (códigos TOTP de un solo uso)', () => {
  it('un código vigente vale y deja registrado su paso de tiempo, no el código', async () => {
    const d = build();
    const secret = generateSecret();
    const code = await generate({ secret });
    await expect(
      d.service.consume('u1', [factorOf(secret)], code),
    ).resolves.toEqual({ valid: true, factorId: 'f1' });
    const [, event] = d.eventsRepo.record.mock.calls[0];
    expect(event).toMatchObject({
      eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
      outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
      userId: 'u1',
      detailJson: {
        action: 'code-used',
        factorId: 'f1',
        timeStep: expect.any(Number),
      },
    });
    expect(JSON.stringify(event)).not.toContain(code);
  });

  it('el MISMO código presentado otra vez dentro de su ventana ya no vale', async () => {
    const d = build();
    const secret = generateSecret();
    const code = await generate({ secret });
    expect(
      (await d.service.consume('u1', [factorOf(secret)], code)).valid,
    ).toBe(true);
    expect(
      (await d.service.consume('u1', [factorOf(secret)], code)).valid,
    ).toBe(false);
    // Solo se registró el primer uso.
    expect(d.eventsRepo.record).toHaveBeenCalledTimes(1);
  });

  it('un código incorrecto no vale ni deja registro', async () => {
    const d = build();
    const secret = generateSecret();
    await expect(
      d.service.consume('u1', [factorOf(secret)], '000000'),
    ).resolves.toEqual({ valid: false });
    expect(d.eventsRepo.record).not.toHaveBeenCalled();
  });

  it('con varios factores acepta el código del que corresponda y recuerda el paso de ESE factor', async () => {
    const d = build();
    const a = generateSecret();
    const b = generateSecret();
    const code = await generate({ secret: b });
    const res = await d.service.consume(
      'u1',
      [factorOf(a, 'fa'), factorOf(b, 'fb')],
      code,
    );
    expect(res).toEqual({ valid: true, factorId: 'fb' });
    expect(d.steps.has('fa')).toBe(false);
  });

  it('un factor sin secreto se ignora', async () => {
    const d = build();
    await expect(
      d.service.consume(
        'u1',
        [{ id: 'f9', secretEncrypted: undefined } as any],
        '123456',
      ),
    ).resolves.toEqual({ valid: false });
  });

  it('toma un cerrojo por persona dentro de la transacción: dos peticiones con el mismo código no pasan las dos', async () => {
    const d = build();
    const secret = generateSecret();
    await d.service.consume(
      'u1',
      [factorOf(secret)],
      await generate({ secret }),
    );
    expect(d.tx.execute).toHaveBeenCalledWith(
      'select pg_advisory_xact_lock(hashtextextended(?, 0))',
      ['iam:totp:u1'],
    );
    expect(d.em.transactional).toHaveBeenCalledTimes(1);
  });
});
