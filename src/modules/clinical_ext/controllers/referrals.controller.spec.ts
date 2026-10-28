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
import {
  CreateReferralDto,
  ListReferralTargetServicesQueryDto,
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

    it('create: referralType sólo admite los cinco códigos', async () => {
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
      ]) {
        expect(
          await errorsOf(CreateReferralDto, { ...base, referralType }),
        ).toEqual([]);
      }
    });
  });
});
