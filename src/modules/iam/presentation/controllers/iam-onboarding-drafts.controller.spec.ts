import { jest } from '@jest/globals';
import type { Response } from 'express';
import { IamOnboardingDraftsController } from './iam-onboarding-drafts.controller';
import {
  IamOnboardingDraftsService,
  CONFIRM_MIN_AGE_MS,
  DraftStoreFullError,
  MAX_DRAFTS_PER_AGGREGATE,
  MAX_DRAFTS_PER_ORIGIN,
  MAX_DRAFTS_TOTAL,
  MAX_DRAFT_BYTES,
  UNCONFIRMED_TTL_MS,
  normalizeOrigin,
  originKeys,
  type OnboardingDraftPayload,
} from '../../application/services/iam-onboarding-drafts.service';

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';
const IP = '203.0.113.7';
const DAY = 24 * 60 * 60 * 1000;

function failure(fn: () => unknown): { status: number; body: string } {
  try {
    fn();
  } catch (error) {
    const http = error as { getStatus(): number; getResponse(): unknown };
    return {
      status: http.getStatus(),
      body: JSON.stringify(http.getResponse()),
    };
  }
  throw new Error('la operación debía fallar');
}

describe('IamOnboardingDraftsController', () => {
  let controller: IamOnboardingDraftsController;
  let service: IamOnboardingDraftsService;

  beforeEach(() => {
    service = new IamOnboardingDraftsService();
    controller = new IamOnboardingDraftsController(service);
  });

  const payload = (
    over: Partial<OnboardingDraftPayload> = {},
  ): OnboardingDraftPayload => ({
    draftId: ID_A,
    formType: 'patient',
    stepIndex: 1,
    stepKey: 'contacto',
    stepTitle: 'Datos de contacto',
    data: { name: 'Maria', password: 'plain-password-to-strip' },
    createdAt: '2026-10-21T00:00:00Z',
    updatedAt: '2026-10-21T00:00:00Z',
    percentComplete: 50,
    ...over,
  });

  const create = (id = ID_A, ip = IP): string => {
    const res = controller.saveDraft('patient', id, payload(), ip);
    expect(res.draftSecret).toBeDefined();
    return res.draftSecret as string;
  };

  it('el primer PUT emite un secreto de al menos 128 bits y no lo repite al actualizar', () => {
    const secret = create();
    expect(Buffer.from(secret, 'base64url').length).toBeGreaterThanOrEqual(16);
    expect(create(ID_B)).not.toBe(secret);

    const update = controller.saveDraft('patient', ID_A, payload(), IP, secret);
    expect(update.ok).toBe(true);
    expect(update.draftSecret).toBeUndefined();
  });

  it('guarda un borrador sin contraseñas y lo recupera con el secreto', () => {
    const secret = create();
    const got = controller.getDraft('patient', ID_A, secret);
    expect(got.data['name']).toBe('Maria');
    expect(got.data['password']).toBeUndefined();
  });

  it('no guarda contraseñas en extraData ni campos ajenos al contrato', () => {
    const secret = controller.saveDraft(
      'patient',
      ID_A,
      {
        ...payload(),
        extraData: { confirmPassword: 'x', otro: 1 },
        isAdmin: true,
      } as unknown as OnboardingDraftPayload,
      IP,
    ).draftSecret as string;
    const got = controller.getDraft('patient', ID_A, secret);
    expect(got.extraData).toEqual({ otro: 1 });
    expect(got).not.toHaveProperty('isAdmin');
  });

  it('secreto ausente, erróneo, ajeno o id inexistente dan el mismo 404', () => {
    const secretA = create(ID_A);
    const secretB = create(ID_B);
    const results = [
      failure(() => controller.getDraft('patient', ID_A)),
      failure(() => controller.getDraft('patient', ID_A, 'secreto-erroneo')),
      failure(() => controller.getDraft('patient', ID_A, secretB)),
      failure(() =>
        controller.getDraft(
          'patient',
          '33333333-3333-4333-8333-333333333333',
          secretA,
        ),
      ),
      failure(() => controller.getDraft('patient', 'corto', secretA)),
      failure(() => controller.saveDraft('patient', ID_A, payload(), IP)),
      failure(() =>
        controller.saveDraft('patient', ID_A, payload(), IP, secretB),
      ),
      failure(() => controller.deleteDraft('patient', ID_A)),
      failure(() => controller.deleteDraft('patient', ID_A, secretB)),
    ];
    expect(new Set(results.map((r) => r.status))).toEqual(new Set([404]));
    expect(new Set(results.map((r) => r.body)).size).toBe(1);
    // el borrador legítimo sigue intacto y con su contenido original
    expect(controller.getDraft('patient', ID_A, secretA).data['name']).toBe(
      'Maria',
    );
  });

  it('un secreto válido no abre el borrador bajo otro formType', () => {
    const secret = create();
    expect(
      failure(() => controller.getDraft('practitioner', ID_A, secret)).status,
    ).toBe(404);
  });

  it('elimina el borrador con el secreto y lo deja inaccesible', () => {
    const secret = create();
    expect(controller.deleteDraft('patient', ID_A, secret).ok).toBe(true);
    expect(
      failure(() => controller.getDraft('patient', ID_A, secret)).status,
    ).toBe(404);
    expect(service.size).toBe(0);
  });

  it('rechaza con 413 el cuerpo que supera el tope y con 400 el que no trae objetos', () => {
    const big = payload({ data: { blob: 'x'.repeat(MAX_DRAFT_BYTES) } });
    expect(
      failure(() => controller.saveDraft('patient', ID_A, big, IP)).status,
    ).toBe(413);
    const bad = {
      ...payload(),
      data: 'no-objeto',
    } as unknown as OnboardingDraftPayload;
    expect(
      failure(() => controller.saveDraft('patient', ID_A, bad, IP)).status,
    ).toBe(400);
    expect(service.size).toBe(0);
  });

  it('topa los borradores por origen (429) y otro origen sigue pudiendo crear', () => {
    for (let i = 0; i < MAX_DRAFTS_PER_ORIGIN; i += 1) {
      create(`borrador-origen-${String(i).padStart(4, '0')}`);
    }
    expect(
      failure(() =>
        controller.saveDraft(
          'patient',
          'borrador-origen-extra0',
          payload(),
          IP,
        ),
      ).status,
    ).toBe(429);
    expect(
      controller.saveDraft(
        'patient',
        'borrador-otro-origen',
        payload(),
        '198.51.100.1',
      ).ok,
    ).toBe(true);
  });

  describe('origen IPv6', () => {
    it('normaliza al prefijo /64 y deja IPv4 (también la mapeada) igual', () => {
      expect(normalizeOrigin('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe(
        '2001:0db8:0001:0002::/64',
      );
      expect(normalizeOrigin('2001:db8:1:2::1')).toBe(
        '2001:0db8:0001:0002::/64',
      );
      expect(normalizeOrigin('2001:DB8::ff')).toBe('2001:0db8:0000:0000::/64');
      expect(normalizeOrigin('::1')).toBe('0000:0000:0000:0000::/64');
      expect(normalizeOrigin('::ffff:203.0.113.7')).toBe('203.0.113.7');
      expect(normalizeOrigin('203.0.113.7')).toBe('203.0.113.7');
    });

    it('llenar desde un mismo /64 cuenta como un solo origen', () => {
      for (let i = 0; i < MAX_DRAFTS_PER_ORIGIN; i += 1) {
        controller.saveDraft(
          'patient',
          `borrador-v6-${String(i).padStart(6, '0')}`,
          payload(),
          `2001:db8:1:2:${i.toString(16)}::${i.toString(16)}`,
        );
      }
      expect(
        failure(() =>
          controller.saveDraft(
            'patient',
            'borrador-v6-extra000',
            payload(),
            '2001:db8:1:2:ffff:ffff:ffff:ffff',
          ),
        ).status,
      ).toBe(429);
      // Otro /64 distinto sí puede crear.
      expect(
        controller.saveDraft(
          'patient',
          'borrador-v6-otro-64',
          payload(),
          '2001:db8:1:3::1',
        ).ok,
      ).toBe(true);
    });
  });

  describe('prefijo agregado', () => {
    it('originKeys da /64 y /48 en IPv6 y la propia dirección en IPv4', () => {
      expect(originKeys('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toEqual({
        origin: '2001:0db8:0001:0002::/64',
        aggregate: '2001:0db8:0001::/48',
      });
      expect(originKeys('203.0.113.7')).toEqual({
        origin: '203.0.113.7',
        aggregate: '203.0.113.7',
      });
      expect(originKeys('::ffff:203.0.113.7').aggregate).toBe('203.0.113.7');
    });

    it('el tope por /48 se aplica aunque cada /64 esté bajo su cuota', () => {
      for (let i = 0; i < MAX_DRAFTS_PER_AGGREGATE; i += 1) {
        controller.saveDraft(
          'patient',
          `borrador-48-${String(i).padStart(6, '0')}`,
          payload(),
          `2001:db8:1:${i.toString(16)}::1`,
        );
      }
      expect(
        failure(() =>
          controller.saveDraft(
            'patient',
            'borrador-48-extra000',
            payload(),
            '2001:db8:1:ffff::1',
          ),
        ).status,
      ).toBe(429);
      // Otro /48 sí puede crear.
      expect(
        controller.saveDraft(
          'patient',
          'borrador-48-otro-48',
          payload(),
          '2001:db8:2::1',
        ).ok,
      ).toBe(true);
    });
  });

  describe('almacén lleno', () => {
    /** Llena el almacén con un borrador por origen distinto, sin confirmar. */
    function fill(
      store: IamOnboardingDraftsService,
      count = MAX_DRAFTS_TOTAL,
    ): string[] {
      const secrets: string[] = [];
      for (let i = 0; i < count; i += 1) {
        const id = `borrador-total-${String(i).padStart(6, '0')}`;
        const res = store.saveDraft(
          'patient',
          id,
          payload({ draftId: id }),
          undefined,
          `ip-${i}`,
        );
        secrets.push(res.draftSecret as string);
      }
      return secrets;
    }

    it('un origen no puede desalojar borradores de otro: con el almacén lleno y sin borradores propios responde 503 con los ajenos intactos', () => {
      const store = new IamOnboardingDraftsService();
      const secrets = fill(store);
      expect(store.size).toBe(MAX_DRAFTS_TOTAL);

      const error = (() => {
        try {
          store.saveDraft(
            'patient',
            'borrador-legitimo-1',
            payload(),
            undefined,
            'ip-sin-borradores',
          );
        } catch (e) {
          return e;
        }
        throw new Error('debía fallar');
      })();

      expect(error).toBeInstanceOf(DraftStoreFullError);
      expect((error as DraftStoreFullError).getStatus()).toBe(503);
      expect(
        (error as DraftStoreFullError).retryAfterSeconds,
      ).toBeGreaterThanOrEqual(1);
      expect(store.size).toBe(MAX_DRAFTS_TOTAL);
      for (const i of [0, 1, MAX_DRAFTS_TOTAL - 1]) {
        expect(
          store.getDraft(
            'patient',
            `borrador-total-${String(i).padStart(6, '0')}`,
            secrets[i],
          ).formType,
        ).toBe('patient');
      }
    });

    it('con el almacén lleno, un origen desaloja como máximo su propio borrador no confirmado más viejo', () => {
      const store = new IamOnboardingDraftsService();
      const secrets = fill(store, MAX_DRAFTS_TOTAL - 2);
      const own1 = store.saveDraft(
        'patient',
        'borrador-propio-0001',
        payload(),
        undefined,
        'ip-propia',
      ).draftSecret as string;
      store.saveDraft(
        'patient',
        'borrador-propio-0002',
        payload(),
        undefined,
        'ip-propia',
      );
      expect(store.size).toBe(MAX_DRAFTS_TOTAL);

      const fresh = store.saveDraft(
        'patient',
        'borrador-propio-0003',
        payload(),
        undefined,
        'ip-propia',
      );

      expect(fresh.draftSecret).toBeDefined();
      expect(store.size).toBe(MAX_DRAFTS_TOTAL);
      // Cayó el más viejo del propio origen...
      expect(
        failure(() => store.getDraft('patient', 'borrador-propio-0001', own1))
          .status,
      ).toBe(404);
      // ...y ninguno de los ajenos.
      expect(
        store.getDraft('patient', 'borrador-total-000000', secrets[0]).formType,
      ).toBe('patient');
    });

    it('un borrador confirmado del propio origen no se desaloja: 503', () => {
      jest.useFakeTimers().setSystemTime(Date.UTC(2026, 9, 25, 12, 0, 0));
      try {
        const store = new IamOnboardingDraftsService();
        fill(store, MAX_DRAFTS_TOTAL - 1);
        const id = 'borrador-confirmado-1';
        const secret = store.saveDraft(
          'patient',
          id,
          payload(),
          undefined,
          'ip-propia',
        ).draftSecret;
        jest.setSystemTime(Date.now() + CONFIRM_MIN_AGE_MS + 1000);
        store.saveDraft('patient', id, payload(), secret, 'ip-propia');

        expect(
          failure(() =>
            store.saveDraft(
              'patient',
              'borrador-propio-nuevo',
              payload(),
              undefined,
              'ip-propia',
            ),
          ).status,
        ).toBe(503);
        expect(store.getDraft('patient', id, secret as string).formType).toBe(
          'patient',
        );
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('vigencia', () => {
    it('un borrador sin segunda escritura vence rápido y su cuota vuelve al origen', () => {
      const secret = create();
      jest
        .useFakeTimers()
        .setSystemTime(Date.now() + UNCONFIRMED_TTL_MS + 1000);
      try {
        expect(
          failure(() => controller.getDraft('patient', ID_A, secret)).status,
        ).toBe(404);
        expect(service.size).toBe(0);
      } finally {
        jest.useRealTimers();
      }
    });

    it('una segunda escritura antes de 60 s no confirma: el borrador sigue venciendo a la hora', () => {
      const secret = create();
      controller.saveDraft('patient', ID_A, payload(), IP, secret);
      jest
        .useFakeTimers()
        .setSystemTime(Date.now() + UNCONFIRMED_TTL_MS + 1000);
      try {
        expect(
          failure(() => controller.getDraft('patient', ID_A, secret)).status,
        ).toBe(404);
      } finally {
        jest.useRealTimers();
      }
    });

    it('una segunda escritura del dueño pasados 60 s confirma y extiende la vida a 30 días', () => {
      jest.useFakeTimers().setSystemTime(Date.UTC(2026, 9, 25, 12, 0, 0));
      try {
        const secret = create();
        jest.setSystemTime(Date.now() + CONFIRM_MIN_AGE_MS + 1000);
        controller.saveDraft('patient', ID_A, payload(), IP, secret);

        jest.setSystemTime(Date.now() + UNCONFIRMED_TTL_MS + 60_000);
        expect(controller.getDraft('patient', ID_A, secret).formType).toBe(
          'patient',
        );
        jest.setSystemTime(Date.now() + 31 * DAY);
        expect(
          failure(() => controller.getDraft('patient', ID_A, secret)).status,
        ).toBe(404);
        expect(
          failure(() =>
            controller.saveDraft('patient', ID_A, payload(), IP, secret),
          ).status,
        ).toBe(404);
      } finally {
        jest.useRealTimers();
      }
    });

    it('el barrido libera vencidos que nadie vuelve a leer y devuelve la cuota del origen', () => {
      jest.useFakeTimers().setSystemTime(Date.UTC(2026, 9, 25, 12, 0, 0));
      try {
        const secretA = create(ID_A);
        create(ID_B);
        jest.setSystemTime(Date.now() + CONFIRM_MIN_AGE_MS + 1000);
        controller.saveDraft('patient', ID_A, payload(), IP, secretA);
        expect(service.size).toBe(2);
        // El no confirmado vence a la hora; el confirmado, a los 30 días.
        expect(service.sweepExpired(Date.now() + 2 * UNCONFIRMED_TTL_MS)).toBe(
          1,
        );
        expect(service.sweepExpired(Date.now() + 29 * DAY)).toBe(0);
        expect(service.sweepExpired(Date.now() + 31 * DAY)).toBe(1);
        expect(service.size).toBe(0);
        for (let i = 0; i < MAX_DRAFTS_PER_ORIGIN; i += 1) {
          create(`borrador-liberado-${String(i).padStart(4, '0')}`);
        }
      } finally {
        jest.useRealTimers();
      }
    });
  });

  it('el 503 por almacén lleno lleva Retry-After', () => {
    for (let i = 0; i < MAX_DRAFTS_TOTAL; i += 1) {
      service.saveDraft(
        'patient',
        `borrador-retry-${String(i).padStart(6, '0')}`,
        payload(),
        undefined,
        `ip-${i}`,
      );
    }
    const setHeader = jest.fn();
    const res = { setHeader } as unknown as Response;

    expect(
      failure(() =>
        controller.saveDraft(
          'patient',
          'borrador-retry-nuevo0',
          payload(),
          'ip-nueva',
          undefined,
          res,
        ),
      ).status,
    ).toBe(503);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(Number(setHeader.mock.calls[0][1])).toBeGreaterThanOrEqual(1);
  });

  it('el temporizador de barrido arranca y se detiene con el módulo', () => {
    service.onModuleInit();
    service.onModuleDestroy();
    service.onModuleDestroy();
  });
});
