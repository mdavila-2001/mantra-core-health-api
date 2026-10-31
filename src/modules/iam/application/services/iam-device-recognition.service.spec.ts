import { jest } from '@jest/globals';
import { CONCEPTS, loadAuthEnv } from '../../../../common';
import { readDeviceCookie, signDeviceCookie } from '../../domain/device-cookie';
import { IamDeviceRecognitionService } from './iam-device-recognition.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const ON = { newDeviceAlert: true } as any;
const OFF = { newDeviceAlert: false } as any;

function build(
  opts: {
    existing?: any;
    previous?: number;
    byId?: any;
    verifiedEmail?: string | null;
  } = {},
) {
  const tx = { flush: mockFn() };
  const em = {
    transactional: mockFn((fn: (t: unknown) => unknown) => fn(tx)),
  };
  const created: any[] = [];
  const devicesRepo = {
    findByFingerprint: mockFn().mockResolvedValue(opts.existing ?? null),
    findByIdAndUser: mockFn().mockResolvedValue(opts.byId ?? null),
    countByUser: mockFn().mockResolvedValue(opts.previous ?? 0),
    create: mockFn((_tx: unknown, data: any) => {
      const device = { id: 'dev-new', ...data };
      created.push(device);
      return device;
    }),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), warn: mockFn(), info: mockFn() };
  const emailRepo = {
    findLatestVerifiedByUser: mockFn().mockResolvedValue(
      opts.verifiedEmail === null
        ? null
        : { email: opts.verifiedEmail ?? 'ana@clinica.bo' },
    ),
  };
  const notices = { enqueueEmail: mockFn().mockResolvedValue(undefined) };
  const service = new IamDeviceRecognitionService(
    { ...em, fork: () => tx } as any,
    devicesRepo as any,
    eventsRepo as any,
    logger as any,
    emailRepo as any,
    notices as any,
  );
  return {
    service,
    devicesRepo,
    eventsRepo,
    created,
    tx,
    logger,
    emailRepo,
    notices,
  };
}

describe('IamDeviceRecognitionService', () => {
  it('N7: sin User-Agent el cliente cuenta como desconocido: se registra sin confianza y AVISA', async () => {
    const d = build({ previous: 3 });
    const res = await d.service.recognize('u1', undefined, '1.1.1.1', ON);
    expect(res.notice).toMatchObject({
      deviceId: 'dev-new',
      label: 'Cliente sin identificar',
      ip: '1.1.1.1',
    });
    expect(d.created[0]).toMatchObject({
      userId: 'u1',
      trusted: false,
      name: 'Cliente sin identificar',
    });
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        detailJson: expect.objectContaining({ flow: 'new-device' }),
      }),
    );
  });

  it('N7: sin User-Agent avisa en CADA inicio de sesión aunque el dispositivo figure de confianza', async () => {
    const existing: any = { id: 'dev-ua', userId: 'u1', trusted: true };
    const d = build({ existing, previous: 3 });
    const res = await d.service.recognize('u1', undefined, '1.1.1.1', ON);
    expect(res.deviceId).toBe('dev-ua');
    expect(res.notice).toMatchObject({ label: 'Cliente sin identificar' });
  });

  it('N7: sin User-Agent y siendo el primer dispositivo no avisa (no hay con qué comparar)', async () => {
    const d = build({ previous: 0 });
    const res = await d.service.recognize('u1', undefined, '1.1.1.1', ON);
    expect(res.notice).toBeUndefined();
  });

  it('el primer dispositivo de la persona nunca avisa: queda de confianza como punto de partida', async () => {
    const d = build({ previous: 0 });
    const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
    expect(res.notice).toBeUndefined();
    expect(res.deviceId).toBe('dev-new');
    expect(d.created[0]).toMatchObject({
      userId: 'u1',
      trusted: true,
      name: 'Chrome en Windows',
      platformConceptId: CONCEPTS.PLATFORM_WEB,
    });
    expect(d.eventsRepo.record).not.toHaveBeenCalled();
  });

  it('un dispositivo desconocido, con dispositivos previos y el aviso encendido, se registra sin confianza y avisa', async () => {
    const d = build({ previous: 2 });
    const res = await d.service.recognize('u1', CHROME_WIN, '203.0.113.9', ON);
    expect(res.notice).toMatchObject({
      deviceId: 'dev-new',
      label: 'Chrome en Windows',
      ip: '203.0.113.9',
    });
    expect(res.notice?.occurredAt).toBeInstanceOf(Date);
    expect(d.created[0]).toMatchObject({ trusted: false });
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventTypeConceptId: CONCEPTS.SEC_LOGIN,
        detailJson: { flow: 'new-device', deviceId: 'dev-new' },
      }),
    );
  });

  it('con el aviso apagado lo registra de confianza y no avisa, para que encenderlo después no trate lo conocido como nuevo', async () => {
    const d = build({ previous: 2 });
    const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', OFF);
    expect(res.notice).toBeUndefined();
    expect(d.created[0]).toMatchObject({ trusted: true });
    const withoutRules = await build({ previous: 2 }).service.recognize(
      'u1',
      CHROME_WIN,
      '1.1.1.1',
      undefined,
    );
    expect(withoutRules.notice).toBeUndefined();
  });

  it('la huella guardada es la del servidor (sin User-Agent ni persona en claro) y es la misma entre inicios de sesión', async () => {
    const d = build({ previous: 1 });
    await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
    const fingerprint = d.created[0].deviceFingerprint as string;
    expect(fingerprint).toMatch(/^srv1:[0-9a-f]{64}$/);
    expect(d.devicesRepo.findByFingerprint).toHaveBeenCalledWith(
      d.tx,
      fingerprint,
    );
    const again = build({ previous: 1 });
    await again.service.recognize('u1', CHROME_WIN, '9.9.9.9', ON);
    expect(again.created[0].deviceFingerprint).toBe(fingerprint);
  });

  it('un dispositivo ya de confianza no avisa y se anota como visto', async () => {
    const existing: any = {
      id: 'dev-1',
      userId: 'u1',
      trusted: true,
      updatedAt: new Date(0),
    };
    const d = build({ existing, previous: 3 });
    const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
    expect(res).toEqual({ deviceId: 'dev-1', notice: undefined });
    expect(existing.lastSeenAt).toBeInstanceOf(Date);
    expect(d.devicesRepo.create).not.toHaveBeenCalled();
  });

  it('uno que la persona todavía no confirmó sigue avisando hasta que diga «Fui yo»', async () => {
    const existing: any = { id: 'dev-1', userId: 'u1', trusted: false };
    const d = build({ existing, previous: 3 });
    const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
    expect(res.deviceId).toBe('dev-1');
    expect(res.notice).toMatchObject({
      deviceId: 'dev-1',
      label: 'Chrome en Windows',
    });
  });

  it('una huella que pertenece a otra persona no se reutiliza', async () => {
    const existing: any = { id: 'dev-x', userId: 'otra', trusted: true };
    const d = build({ existing, previous: 0 });
    const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
    expect(res.deviceId).toBe('dev-new');
  });

  it('si algo falla, el inicio de sesión sigue sin dispositivo', async () => {
    const d = build();
    d.devicesRepo.findByFingerprint.mockRejectedValue(new Error('db caída'));
    await expect(
      d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON),
    ).resolves.toEqual({});
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('ante dos inicios simultáneos desde el mismo equipo nuevo, reintenta y reconoce el que ganó', async () => {
    const d = build({ previous: 1 });
    const winner: any = { id: 'dev-won', userId: 'u1', trusted: false };
    d.devicesRepo.findByFingerprint
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winner);
    d.tx.flush.mockRejectedValueOnce(
      Object.assign(new Error('duplicate key'), { code: '23505' }),
    );
    const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
    expect(res.deviceId).toBe('dev-won');
  });

  describe('N7: aviso fuera de banda al titular', () => {
    it('manda un correo al correo VERIFICADO cuando hay aviso, sin el código ni secretos', async () => {
      const d = build({ previous: 2, verifiedEmail: 'ana@clinica.bo' });
      await d.service.recognize('u1', CHROME_WIN, '203.0.113.9', ON);
      expect(d.emailRepo.findLatestVerifiedByUser).toHaveBeenCalled();
      expect(d.notices.enqueueEmail).toHaveBeenCalledTimes(1);
      const [mail] = d.notices.enqueueEmail.mock.calls[0];
      expect(mail).toMatchObject({
        recipientUserId: 'u1',
        recipientAddress: 'ana@clinica.bo',
        subject: expect.stringContaining('inicio de sesión'),
      });
      expect(mail.bodyText).toContain('Chrome en Windows');
      expect(mail.bodyText).toContain('203.0.113.9');
      expect(mail.bodyText).toContain('No fui yo');
    });

    it('sin aviso (primer dispositivo, de confianza o alerta apagada) no manda nada', async () => {
      await build({ previous: 0 }).service.recognize(
        'u1',
        CHROME_WIN,
        '1.1.1.1',
        ON,
      );
      const off = build({ previous: 2 });
      await off.service.recognize('u1', CHROME_WIN, '1.1.1.1', OFF);
      expect(off.notices.enqueueEmail).not.toHaveBeenCalled();
      const trusted = build({
        existing: { id: 'd', userId: 'u1', trusted: true },
        previous: 3,
      });
      await trusted.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
      expect(trusted.notices.enqueueEmail).not.toHaveBeenCalled();
    });

    it('sin correo verificado no hay canal: solo queda el aviso en pantalla y el login sigue', async () => {
      const d = build({ previous: 2, verifiedEmail: null });
      const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
      expect(res.notice).toBeDefined();
      expect(d.notices.enqueueEmail).not.toHaveBeenCalled();
    });

    it('si la mensajería falla, el inicio de sesión sigue con su aviso', async () => {
      const d = build({ previous: 2 });
      d.notices.enqueueEmail.mockRejectedValue(new Error('proveedor caído'));
      const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
      expect(res.notice).toBeDefined();
      expect(d.logger.warn).toHaveBeenCalled();
    });
  });

  describe('N7: cookie de dispositivo firmada (AUTH_DEVICE_COOKIE_ENABLED=true)', () => {
    const original = process.env.AUTH_DEVICE_COOKIE_ENABLED;
    const SECRET = loadAuthEnv().secret;
    beforeEach(() => {
      process.env.AUTH_DEVICE_COOKIE_ENABLED = 'true';
    });
    afterEach(() => {
      if (original === undefined) delete process.env.AUTH_DEVICE_COOKIE_ENABLED;
      else process.env.AUTH_DEVICE_COOKIE_ENABLED = original;
    });
    const DEV = 'c5d1c8c3-2b86-4c2c-9d80-333333333333';

    it('con una cookie válida el dispositivo es el de la cookie: conocido, sin aviso', async () => {
      const byId: any = { id: DEV, userId: 'u1', trusted: true };
      const d = build({ byId, previous: 3 });
      const res = await d.service.recognize(
        'u1',
        CHROME_WIN,
        '1.1.1.1',
        ON,
        signDeviceCookie(SECRET, 'u1', DEV),
      );
      expect(res.deviceId).toBe(DEV);
      expect(res.notice).toBeUndefined();
      expect(d.devicesRepo.create).not.toHaveBeenCalled();
      expect(readDeviceCookie(SECRET, 'u1', res.deviceCookie)).toBe(DEV);
    });

    it('SIN cookie, coincidir por User-Agent con un equipo de confianza no autentica: queda en un dispositivo gemelo sin confianza y avisa', async () => {
      const trusted: any = { id: 'dev-1', userId: 'u1', trusted: true };
      const d = build({ existing: trusted, previous: 3 });
      // La gemela no existe todavía: se busca su huella y no está.
      d.devicesRepo.findByFingerprint
        .mockResolvedValueOnce(trusted)
        .mockResolvedValueOnce(null);
      const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
      expect(res.deviceId).toBe('dev-new');
      expect(d.created[0]).toMatchObject({ trusted: false, userId: 'u1' });
      expect(d.created[0].deviceFingerprint).not.toBe(undefined);
      expect(res.notice).toMatchObject({ deviceId: 'dev-new' });
      // El equipo de confianza original no se toca ni se le entrega cookie.
      expect(trusted.lastSeenAt).toBeUndefined();
      expect(res.deviceCookie).toMatch(/^dev-new\./);
    });

    it('una cookie de OTRA persona o con la firma alterada se trata como si no hubiera cookie', async () => {
      const trusted: any = { id: 'dev-1', userId: 'u1', trusted: true };
      const d = build({ existing: trusted, previous: 3 });
      d.devicesRepo.findByFingerprint
        .mockResolvedValueOnce(trusted)
        .mockResolvedValueOnce(null);
      const res = await d.service.recognize(
        'u1',
        CHROME_WIN,
        '1.1.1.1',
        ON,
        signDeviceCookie(SECRET, 'otra-persona', DEV),
      );
      expect(d.devicesRepo.findByIdAndUser).not.toHaveBeenCalled();
      expect(res.notice).toBeDefined();
    });

    it('con un solo dispositivo registrado no hay con qué comparar: no crea gemela', async () => {
      const trusted: any = { id: 'dev-1', userId: 'u1', trusted: true };
      const d = build({ existing: trusted, previous: 1 });
      const res = await d.service.recognize('u1', CHROME_WIN, '1.1.1.1', ON);
      expect(res.deviceId).toBe('dev-1');
      expect(res.notice).toBeUndefined();
      expect(d.devicesRepo.create).not.toHaveBeenCalled();
    });

    it('sin User-Agent no se entrega cookie', async () => {
      const d = build({ previous: 2 });
      const res = await d.service.recognize('u1', undefined, '1.1.1.1', ON);
      expect(res.deviceCookie).toBeUndefined();
    });
  });

  it('apagada (por defecto) ignora la cookie y no entrega ninguna', async () => {
    delete process.env.AUTH_DEVICE_COOKIE_ENABLED;
    const byId: any = { id: 'x', userId: 'u1', trusted: true };
    const d = build({ byId, previous: 2 });
    const res = await d.service.recognize(
      'u1',
      CHROME_WIN,
      '1.1.1.1',
      ON,
      'lo-que-sea.firma',
    );
    expect(res.deviceCookie).toBeUndefined();
    expect(d.devicesRepo.findByIdAndUser).not.toHaveBeenCalled();
  });
});
