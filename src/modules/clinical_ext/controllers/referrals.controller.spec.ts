import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReferralsController } from './referrals.controller';
import { AUDITED_KEY } from '../../../common/audit-trail/audit-trail.decorators';
import {
  CreateReferralDto,
  ListReferralTargetServicesQueryDto,
  ReferralArrivalDto,
  ReferralTransferDto,
  SearchReferralTargetsQueryDto,
} from '../dto';

const actor = { id: 'md-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const referralsService = {
    create: mockFn(),
    respond: mockFn(),
    listMine: mockFn(),
    listByPatient: mockFn(),
    get: mockFn(),
    counterReferral: mockFn(),
    cancel: mockFn(),
    updateTransfer: mockFn(),
    recordArrival: mockFn(),
    searchTargets: mockFn(),
    listTargetServices: mockFn(),
  };
  const controller = new ReferralsController(referralsService as any);
  return { controller, referralsService };
}

describe('ReferralsController', () => {
  it('delegates create (UC-18-07)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1' };
    await d.controller.create(dto, actor);
    expect(d.referralsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates respond (UC-18-08)', async () => {
    const d = build();
    const dto = { decision: 'ACCEPT' };
    await d.controller.respond('ref1', dto as any, actor);
    expect(d.referralsService.respond).toHaveBeenCalledWith('ref1', dto, actor);
  });

  it('delegates listByPatient with the actor so the service can authorize', async () => {
    const d = build();
    await d.controller.listByPatient('p1', actor);
    expect(d.referralsService.listByPatient).toHaveBeenCalledWith('p1', actor);
  });

  it('delegates get, counter-referral and cancel (v4266)', async () => {
    const d = build();
    await d.controller.get('ref1', actor);
    expect(d.referralsService.get).toHaveBeenCalledWith('ref1', actor);
    const dto = { counterReferralText: 'Alta de fisioterapia' };
    await d.controller.counterReferral('ref1', dto, actor);
    expect(d.referralsService.counterReferral).toHaveBeenCalledWith(
      'ref1',
      dto,
      actor,
    );
    await d.controller.cancel('ref1', actor);
    expect(d.referralsService.cancel).toHaveBeenCalledWith('ref1', actor);
  });

  it('delegates transfer and arrival (v4274)', async () => {
    const d = build();
    const transfer = { required: false };
    await d.controller.updateTransfer('ref1', transfer, actor);
    expect(d.referralsService.updateTransfer).toHaveBeenCalledWith(
      'ref1',
      transfer,
      actor,
    );
    const arrival = {
      arrivedAt: '2026-10-31T11:30:00Z',
      arrivalCondition: 'STABLE' as const,
    };
    await d.controller.recordArrival('ref1', arrival, actor);
    expect(d.referralsService.recordArrival).toHaveBeenCalledWith(
      'ref1',
      arrival,
      actor,
    );
  });

  it('transfer y arrival son PATCH auditados (v4274)', () => {
    const proto = ReferralsController.prototype as any;
    for (const [handler, path, action] of [
      [proto.updateTransfer, ':id/transfer', 'REFERRAL_TRANSFER_UPDATED'],
      [proto.recordArrival, ':id/arrival', 'REFERRAL_ARRIVAL_RECORDED'],
    ]) {
      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(path);
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
        RequestMethod.PATCH,
      );
      expect(Reflect.getMetadata(AUDITED_KEY, handler)).toEqual({
        action,
        entity: 'referral',
        entityId: 'param:id',
      });
    }
  });

  it('delegates listMine (CV-10) to the authenticated actor', async () => {
    const d = build();
    await d.controller.listMine(actor);
    expect(d.referralsService.listMine).toHaveBeenCalledWith(actor);
  });

  it('delegates searchTargets (destinos de derivación)', async () => {
    const d = build();
    const query = { q: 'card', kind: 'PRACTITIONER' as const };
    await d.controller.searchTargets(query);
    expect(d.referralsService.searchTargets).toHaveBeenCalledWith(query);
  });

  it('delegates listTargetServices (servicios del destino)', async () => {
    const d = build();
    const query = { targetTenantId: '6f1c1b1e-1111-4111-8111-111111111111' };
    await d.controller.listTargetServices(query);
    expect(d.referralsService.listTargetServices).toHaveBeenCalledWith(query);
  });

  it('declara targets y target-services antes de cualquier ruta con :id', () => {
    const proto = ReferralsController.prototype as any;
    const routes = Object.getOwnPropertyNames(proto)
      .filter((name) => name !== 'constructor')
      .map((name) => ({
        path: Reflect.getMetadata(PATH_METADATA, proto[name]) as string,
        method: Reflect.getMetadata(METHOD_METADATA, proto[name]),
      }))
      .filter((route) => route.path !== undefined);
    const index = (path: string) =>
      routes.findIndex(
        (route) => route.path === path && route.method === RequestMethod.GET,
      );
    const firstParam = routes.findIndex((route) => route.path.includes(':'));
    expect(index('targets')).toBeGreaterThanOrEqual(0);
    expect(index('target-services')).toBeGreaterThanOrEqual(0);
    expect(index('targets')).toBeLessThan(firstParam);
    expect(index('target-services')).toBeLessThan(firstParam);
  });

  it('las búsquedas de destino tienen techo de tasa (60/min, como el directorio)', () => {
    const proto = ReferralsController.prototype as any;
    for (const handler of [proto.searchTargets, proto.listTargetServices]) {
      expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(60);
      expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(60_000);
    }
  });

  describe('validación del contrato', () => {
    const errorsOf = async (cls: any, plain: object) =>
      (await validate(plainToInstance(cls, plain))).map((e) => e.property);

    it('targets: q de un carácter y kind ajeno se rechazan', async () => {
      expect(
        await errorsOf(SearchReferralTargetsQueryDto, { q: 'a', kind: 'X' }),
      ).toEqual(['q', 'kind']);
      expect(
        await errorsOf(SearchReferralTargetsQueryDto, {
          q: 'ca',
          kind: 'ORGANIZATION',
        }),
      ).toEqual([]);
    });

    it('target-services: los ids tienen que ser uuid', async () => {
      expect(
        await errorsOf(ListReferralTargetServicesQueryDto, {
          targetProfileId: 'x',
        }),
      ).toEqual(['targetProfileId']);
    });

    it('transfer: enumeraciones, tipos de los signos y fechas ISO (v4274)', async () => {
      expect(
        await errorsOf(ReferralTransferDto, {
          transportMode: 'TAXI',
          departureCondition: 'BAD',
          departedAt: 'ayer',
        }),
      ).toEqual(['transportMode', 'departureCondition', 'departedAt']);
      const nested = await validate(
        plainToInstance(ReferralTransferDto, {
          vitals: { systolicBp: 'alta', temperatureC: 36.55 },
        }),
      );
      expect(nested.map((e) => e.property)).toEqual(['vitals']);
      expect(nested[0].children?.map((e) => e.property).sort()).toEqual([
        'systolicBp',
        'temperatureC',
      ]);
      expect(
        await errorsOf(ReferralTransferDto, {
          required: true,
          transportMode: 'AIR_AMBULANCE',
          departureCondition: 'CRITICAL',
          vitals: { systolicBp: 90, temperatureC: 36.5, glasgow: 14 },
          departedAt: '2026-10-31T10:00:00Z',
        }),
      ).toEqual([]);
    });

    it('create: el objeto transfer se valida anidado (v4274)', async () => {
      expect(
        await errorsOf(CreateReferralDto, {
          patientProfileId: '6f1c1b1e-1111-4111-8111-111111111111',
          transfer: { transportMode: 'TAXI' },
        }),
      ).toEqual(['transfer']);
    });

    it('arrival: arrivedAt y arrivalCondition son obligatorios (v4274)', async () => {
      expect(await errorsOf(ReferralArrivalDto, {})).toEqual([
        'arrivedAt',
        'arrivalCondition',
      ]);
      expect(
        await errorsOf(ReferralArrivalDto, {
          arrivedAt: '2026-10-31T11:30:00Z',
          arrivalCondition: 'DECEASED',
        }),
      ).toEqual([]);
    });

    it('create: referralType sólo admite los ocho códigos', async () => {
      const base = {
        patientProfileId: '6f1c1b1e-1111-4111-8111-111111111111',
        targetServiceCatalogId: '6f1c1b1e-2222-4222-8222-222222222222',
      };
      expect(
        await errorsOf(CreateReferralDto, { ...base, referralType: 'OTRO' }),
      ).toEqual(['referralType']);
      for (const referralType of [
        'TREATMENT',
        'CONSULTATION',
        'DIAGNOSTIC_STUDY',
        'PROCEDURE',
        'SECOND_OPINION',
        'THERAPY',
        'HOSPITALIZATION',
        'OTHER',
      ]) {
        expect(
          await errorsOf(CreateReferralDto, { ...base, referralType }),
        ).toEqual([]);
      }
    });
  });
});
