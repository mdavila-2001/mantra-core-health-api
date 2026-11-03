import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyOpeningHoursService } from './pharmacy-opening-hours.service';
import {
  onCallWindowProblem,
  siteTimeZone,
  toZonedIso,
} from './opening-hours.time';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import { PHARM } from '../pharmacy.concepts';

const T1 = 't1';
/** 2026-10-26 03:00 en La Paz (UTC−4). */
const NOW = new Date('2026-10-26T07:00:00Z');

const staff = {
  id: 'staff-1',
  roles: ['PHARMACY_STAFF'],
  tenantIds: [T1],
} as any;
const platform = {
  id: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [T1],
} as any;

const inTenant = <T>(fn: () => Promise<T>): Promise<T> => runWithTenant(T1, fn);

async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('no rechazó');
}

const site = (extra: object = {}) => ({
  id: 'site-1',
  pharmacyId: 'ph1',
  practiceSiteId: 'ps-1',
  name: 'Central',
  statusConceptId: PHARM.SITE_ACTIVE,
  ...extra,
});

const shift = (extra: object = {}) => ({
  id: 'shift-1',
  pharmacySiteId: 'site-1',
  startsAt: new Date('2026-10-26T00:00:00Z'),
  endsAt: new Date('2026-10-26T12:00:00Z'),
  sourceConceptId: PHARM.ON_CALL_SOURCE_PHARMACY,
  statusConceptId: PHARM.ON_CALL_SHIFT_ACTIVE,
  ...extra,
});

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    fork: mockFn(() => tx),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const pharmaciesRepo = {
    findByIdInTenant: mockFn().mockResolvedValue({
      id: 'ph1',
      tenantId: T1,
      statusConceptId: PHARM.PHARMACY_ACTIVE,
    }),
  };
  const sitesRepo = { findById: mockFn().mockResolvedValue(site()) };
  const shiftsRepo = {
    findById: mockFn().mockResolvedValue(null),
    findUpcomingBySites: mockFn().mockResolvedValue([]),
    findOverlapping: mockFn().mockResolvedValue(null),
    create: mockFn((_em: unknown, data: any) => ({
      id: 'shift-new',
      ...data,
      statusConceptId: PHARM.ON_CALL_SHIFT_ACTIVE,
    })),
    findOpenNow: mockFn().mockResolvedValue([]),
  };
  const readRepo = {
    findActiveSites: mockFn().mockResolvedValue([site()]),
    findPracticeSites: mockFn().mockResolvedValue([
      { id: 'ps-1', timeZone: 'America/La_Paz' },
    ]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacyOpeningHoursService(
    em as any,
    pharmaciesRepo as any,
    sitesRepo as any,
    shiftsRepo as any,
    readRepo as any,
    logger as any,
  );
  return { service, tx, pharmaciesRepo, sitesRepo, shiftsRepo, readRepo };
}

describe('opening-hours.time (P34)', () => {
  it('escribe el instante en la hora de Bolivia con su desplazamiento', () => {
    expect(toZonedIso(NOW, 'America/La_Paz')).toBe('2026-10-26T03:00:00-04:00');
    expect(toZonedIso(NOW, 'UTC')).toBe('2026-10-26T07:00:00+00:00');
  });

  it('cae a America/La_Paz si la sede no declaró huso o declaró uno inexistente', () => {
    expect(siteTimeZone(null)).toBe('America/La_Paz');
    expect(siteTimeZone('  ')).toBe('America/La_Paz');
    expect(siteTimeZone('Marte/Olympus')).toBe('America/La_Paz');
    expect(siteTimeZone('America/Santiago')).toBe('America/Santiago');
  });

  it('acepta 72 h justas y rechaza un minuto más (borde del CHECK)', () => {
    const start = new Date('2026-10-26T08:00:00Z');
    expect(
      onCallWindowProblem(start, new Date('2026-10-29T08:00:00Z'), NOW),
    ).toBeNull();
    expect(
      onCallWindowProblem(start, new Date('2026-10-29T08:01:00Z'), NOW),
    ).toBe('TOO_LONG');
  });

  it('rechaza fin no posterior, turno ya terminado y uno a más de 62 días', () => {
    const start = new Date('2026-10-26T08:00:00Z');
    expect(onCallWindowProblem(start, start, NOW)).toBe('END_NOT_AFTER_START');
    expect(
      onCallWindowProblem(
        new Date('2026-10-25T00:00:00Z'),
        new Date('2026-10-26T07:00:00Z'),
        NOW,
      ),
    ).toBe('ALREADY_ENDED');
    expect(
      onCallWindowProblem(
        new Date('2026-12-28T00:00:00Z'),
        new Date('2026-12-28T12:00:00Z'),
        NOW,
      ),
    ).toBe('TOO_FAR_AHEAD');
  });
});

describe('PharmacyOpeningHoursService (P34)', () => {
  describe('createShift', () => {
    const dto = {
      startsAt: '2026-10-26T20:00:00-04:00',
      endsAt: '2026-10-27T08:00:00-04:00',
    };

    it('registra el turno de la farmacia con su hora local y procedencia PHARMACY', async () => {
      const d = build();
      const result = await inTenant(() =>
        d.service.createShift('ph1', 'site-1', dto, staff, NOW),
      );
      expect(d.shiftsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          pharmacySiteId: 'site-1',
          startsAt: new Date('2026-10-27T00:00:00Z'),
          endsAt: new Date('2026-10-27T12:00:00Z'),
          sourceConceptId: PHARM.ON_CALL_SOURCE_PHARMACY,
        }),
      );
      expect(d.tx.flush).toHaveBeenCalled();
      expect(result).toMatchObject({
        startsAt: '2026-10-27T00:00:00.000Z',
        startsAtLocal: '2026-10-26T20:00:00-04:00',
        endsAtLocal: '2026-10-27T08:00:00-04:00',
        timeZone: 'America/La_Paz',
        source: 'PHARMACY',
        status: 'ACTIVE',
        current: false,
      });
    });

    it('marca PLATFORM cuando carga la plataforma en nombre de la farmacia', async () => {
      const d = build();
      const result = await inTenant(() =>
        d.service.createShift('ph1', 'site-1', dto, platform, NOW),
      );
      expect(result.source).toBe('PLATFORM');
    });

    it('rechaza con 422 un turno que ya terminó, sin tocar la base', async () => {
      const d = build();
      const error = await rejection(
        inTenant(() =>
          d.service.createShift(
            'ph1',
            'site-1',
            {
              startsAt: '2026-10-25T20:00:00-04:00',
              endsAt: '2026-10-26T02:00:00-04:00',
            },
            staff,
            NOW,
          ),
        ),
      );
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.getResponse().reason).toBe(
        PharmacyErrorReason.ON_CALL_SHIFT_WINDOW_INVALID,
      );
      expect(d.shiftsRepo.create).not.toHaveBeenCalled();
    });

    it('rechaza con 409 un turno solapado con otro activo de la sede', async () => {
      const d = build();
      d.shiftsRepo.findOverlapping.mockResolvedValue(shift());
      const error = await rejection(
        inTenant(() => d.service.createShift('ph1', 'site-1', dto, staff, NOW)),
      );
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse().reason).toBe(
        PharmacyErrorReason.ON_CALL_SHIFT_OVERLAP,
      );
    });

    it('traduce la exclusión de la base (23P01, alta concurrente) al mismo 409', async () => {
      const d = build();
      d.tx.flush.mockRejectedValue(
        Object.assign(new Error('exclusion'), {
          cause: { code: '23P01' },
        }),
      );
      const error = await rejection(
        inTenant(() => d.service.createShift('ph1', 'site-1', dto, staff, NOW)),
      );
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse().reason).toBe(
        PharmacyErrorReason.ON_CALL_SHIFT_OVERLAP,
      );
    });

    it('una sede de otra farmacia responde 404 igual que una inexistente', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(site({ pharmacyId: 'ph-otra' }));
      const ajena = await rejection(
        inTenant(() => d.service.createShift('ph1', 'site-1', dto, staff, NOW)),
      );
      d.sitesRepo.findById.mockResolvedValue(null);
      const inexistente = await rejection(
        inTenant(() => d.service.createShift('ph1', 'site-1', dto, staff, NOW)),
      );
      expect(ajena).toBeInstanceOf(ResourceNotFoundException);
      expect(ajena.getResponse()).toEqual(inexistente.getResponse());
    });

    it('la farmacia de otro tenant responde 404 PHARMACY_NOT_AVAILABLE', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
      const error = await rejection(
        inTenant(() => d.service.createShift('ph1', 'site-1', dto, staff, NOW)),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getResponse().reason).toBe(
        PharmacyErrorReason.PHARMACY_NOT_AVAILABLE,
      );
    });
  });

  describe('setOpen24h', () => {
    it('guarda true y lo devuelve', async () => {
      const d = build();
      const target = site();
      d.sitesRepo.findById.mockResolvedValue(target);
      const result = await inTenant(() =>
        d.service.setOpen24h('ph1', 'site-1', { open24h: true }, staff, NOW),
      );
      expect((target as any).open24h).toBe(true);
      expect((target as any).updatedByUserId).toBe('staff-1');
      expect(result.open24h).toBe(true);
    });

    it('null vuelve a «no declarado», no a false', async () => {
      const d = build();
      const target = site({ open24h: true });
      d.sitesRepo.findById.mockResolvedValue(target);
      const result = await inTenant(() =>
        d.service.setOpen24h('ph1', 'site-1', { open24h: null }, staff, NOW),
      );
      expect((target as any).open24h).toBeNull();
      expect(result.open24h).toBeNull();
    });
  });

  describe('cancelShift', () => {
    it('cancela un turno vigente', async () => {
      const d = build();
      const target = shift();
      d.shiftsRepo.findById.mockResolvedValue(target);
      const result = await inTenant(() =>
        d.service.cancelShift('ph1', 'shift-1', staff, NOW),
      );
      expect(target.statusConceptId).toBe(PHARM.ON_CALL_SHIFT_CANCELLED);
      expect(result).toMatchObject({ status: 'CANCELLED', current: false });
    });

    it('rechaza cancelar un turno ya terminado', async () => {
      const d = build();
      d.shiftsRepo.findById.mockResolvedValue(
        shift({ endsAt: new Date('2026-10-26T06:00:00Z') }),
      );
      const error = await rejection(
        inTenant(() => d.service.cancelShift('ph1', 'shift-1', staff, NOW)),
      );
      expect(error.getResponse().reason).toBe(
        PharmacyErrorReason.ON_CALL_SHIFT_NOT_CANCELLABLE,
      );
    });

    it('un turno de otra farmacia responde 404', async () => {
      const d = build();
      d.shiftsRepo.findById.mockResolvedValue(shift());
      d.sitesRepo.findById.mockResolvedValue(site({ pharmacyId: 'ph-otra' }));
      await expect(
        inTenant(() => d.service.cancelShift('ph1', 'shift-1', staff, NOW)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('getOpeningHours', () => {
    it('lista las sedes con su 24 h y sus turnos, marcando el vigente', async () => {
      const d = build();
      d.readRepo.findActiveSites.mockResolvedValue([site({ open24h: false })]);
      d.shiftsRepo.findUpcomingBySites.mockResolvedValue([shift()]);
      const result = await inTenant(() =>
        d.service.getOpeningHours('ph1', staff, NOW),
      );
      expect(d.shiftsRepo.findUpcomingBySites).toHaveBeenCalledWith(
        d.tx,
        ['site-1'],
        NOW,
      );
      expect(result.sites).toHaveLength(1);
      expect(result.sites[0]).toMatchObject({
        open24h: false,
        timeZone: 'America/La_Paz',
      });
      expect(result.sites[0].shifts[0]).toMatchObject({
        current: true,
        endsAtLocal: '2026-10-26T08:00:00-04:00',
      });
    });
  });

  describe('openNow', () => {
    const row = (id: string, extra: object = {}) => ({
      siteId: id,
      siteName: `Sede ${id}`,
      pharmacyName: `Farmacia ${id}`,
      pharmacySlug: `farmacia-${id}`,
      open24h: false,
      timeZone: null,
      addressLines: 'Av. Siempre Viva 1',
      city: 'La Paz',
      latitude: null,
      longitude: null,
      shift: null,
      ...extra,
    });

    it('pasa el instante y el modo a la consulta y declara el huso de Bolivia', async () => {
      const d = build();
      d.shiftsRepo.findOpenNow.mockResolvedValue([
        row('a', {
          shift: {
            startsAt: new Date('2026-10-26T00:00:00Z'),
            endsAt: new Date('2026-10-26T12:00:00Z'),
            sourceConceptId: PHARM.ON_CALL_SOURCE_PHARMACY,
          },
        }),
      ]);
      const page = await d.service.openNow({ mode: 'on-call' }, NOW);
      expect(d.shiftsRepo.findOpenNow).toHaveBeenCalledWith(d.tx, {
        now: NOW,
        mode: 'on-call',
        city: undefined,
      });
      expect(page).toMatchObject({
        asOf: '2026-10-26T07:00:00.000Z',
        asOfLocal: '2026-10-26T03:00:00-04:00',
        timeZone: 'America/La_Paz',
        nextCursor: null,
      });
      expect(page.items[0]).toMatchObject({
        addressText: 'Av. Siempre Viva 1, La Paz',
        onCall: {
          endsAtLocal: '2026-10-26T08:00:00-04:00',
          source: 'PHARMACY',
        },
      });
    });

    it('pagina con cursor estable, sin repetir ni saltar sedes', async () => {
      const d = build();
      d.shiftsRepo.findOpenNow.mockResolvedValue(
        ['c', 'a', 'b'].map((id) => row(id, { open24h: true })),
      );
      const first = await d.service.openNow({ limit: 2 }, NOW);
      expect(first.items.map((item) => item.siteId)).toEqual(['a', 'b']);
      expect(first.nextCursor).not.toBeNull();
      const second = await d.service.openNow(
        { limit: 2, cursor: first.nextCursor! },
        NOW,
      );
      expect(second.items.map((item) => item.siteId)).toEqual(['c']);
      expect(second.nextCursor).toBeNull();
    });

    it('ordena por distancia cuando viaja el origen, las sin punto al final', async () => {
      const d = build();
      d.shiftsRepo.findOpenNow.mockResolvedValue([
        row('lejos', { open24h: true, latitude: -16.0, longitude: -68.0 }),
        row('sin-punto', { open24h: true }),
        row('cerca', { open24h: true, latitude: -16.5, longitude: -68.15 }),
      ]);
      const page = await d.service.openNow(
        { origin: { lat: -16.5, lng: -68.15 } },
        NOW,
      );
      expect(page.items.map((item) => item.siteId)).toEqual([
        'cerca',
        'lejos',
        'sin-punto',
      ]);
      expect(page.items[0].distanceKm).toBe(0);
    });

    it('un cursor más allá del final devuelve una página vacía', async () => {
      const d = build();
      d.shiftsRepo.findOpenNow.mockResolvedValue([row('a', { open24h: true })]);
      const page = await d.service.openNow(
        {
          cursor: encodeKeysetCursor({
            d: null,
            n: 'Zzz',
            s: 'Zzz',
            id: 'zzz',
          }),
        },
        NOW,
      );
      expect(page.items).toEqual([]);
      expect(page.nextCursor).toBeNull();
    });

    it('rechaza un cursor corrupto con 400', async () => {
      const d = build();
      await expect(
        d.service.openNow({ cursor: 'no-es-un-cursor' }, NOW),
      ).rejects.toThrow();
    });
  });
});
