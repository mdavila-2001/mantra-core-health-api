import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { mockFn } from '../../practice/services/infrastructure.testing';
import { BillingAccessService } from './billing-access.service';

const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PRACTICE = 'pppppppp-pppp-pppp-pppp-pppppppppppp';
const actor = { id: 'user-1', roles: ['USER'] } as any;
const notFound = () => new ResourceNotFoundException('Recurso no encontrado');
const forbidden = () =>
  new InsufficientRoleException('no', {}, 'INFRA_ACTION_NOT_ALLOWED');

function build(
  opts: {
    practiceExists?: boolean;
    sites?: string[];
    bySite?: Record<string, 'ok' | 'forbidden' | 'notFound'>;
    level?: string;
  } = {},
) {
  const access = {
    assertCan: mockFn(async (_actor: unknown, _action: string, target: any) => {
      const outcome =
        opts.bySite?.[target.siteId ?? target.careSpaceId] ?? 'ok';
      if (outcome === 'forbidden') throw forbidden();
      if (outcome === 'notFound') throw notFound();
      return { actingRoles: ['BILLING'] };
    }),
    structureLevel: mockFn().mockResolvedValue({ level: opts.level ?? 'NONE' }),
  };
  const tx = {
    execute: mockFn(async (sql: string) => {
      if (sql.includes('from practice.practices'))
        return opts.practiceExists === false ? [] : [{ id: PRACTICE }];
      if (sql.includes('from practice.practice_sites'))
        return (opts.sites ?? ['s1', 's2']).map((id) => ({ id }));
      return [];
    }),
  };
  const service = new BillingAccessService(access as any);
  const forPractice = (mode: 'any' | 'all', action = 'infra.charge.view') =>
    runWithTenant(TENANT, () =>
      service.forPractice(tx as any, actor, action, PRACTICE, mode),
    );
  return { service, access, tx, forPractice };
}

describe('BillingAccessService.forPractice', () => {
  it('una práctica de otro tenant (o inexistente) responde 404 sin consultar los roles', async () => {
    const d = build({ practiceExists: false });
    await expect(d.forPractice('any')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.access.assertCan).not.toHaveBeenCalled();
  });

  it('lectura (any): basta una sede de la práctica', async () => {
    const d = build({ bySite: { s1: 'notFound', s2: 'ok' } });
    await expect(d.forPractice('any')).resolves.toBeUndefined();
  });

  it('escritura (all): hace falta mandar en todas las sedes; si sólo cubre una, 403', async () => {
    const d = build({ bySite: { s1: 'ok', s2: 'notFound' } });
    await expect(
      d.forPractice('all', 'infra.tariff.write'),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'INFRA_ACTION_NOT_ALLOWED',
    });
    const todas = build({ bySite: { s1: 'ok', s2: 'ok' } });
    await expect(
      todas.forPractice('all', 'infra.tariff.write'),
    ).resolves.toBeUndefined();
  });

  it('sin ninguna sede cubierta es el mismo 404; si el rol ve pero no alcanza, 403', async () => {
    const ajeno = build({ bySite: { s1: 'notFound', s2: 'notFound' } });
    await expect(ajeno.forPractice('any')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    const sinPermiso = build({ bySite: { s1: 'forbidden', s2: 'notFound' } });
    await expect(sinPermiso.forPractice('any')).rejects.toMatchObject({
      status: 403,
    });
  });

  it('una práctica sin sedes sólo la maneja la estructura: organización sí, plataforma sólo lee, el resto 404/403', async () => {
    const org = build({ sites: [], level: 'ORG' });
    await expect(
      org.forPractice('all', 'infra.tariff.write'),
    ).resolves.toBeUndefined();
    const plataforma = build({ sites: [], level: 'PLATFORM' });
    await expect(
      plataforma.forPractice('any', 'infra.tariff.view'),
    ).resolves.toBeUndefined();
    await expect(
      plataforma.forPractice('all', 'infra.tariff.write'),
    ).rejects.toMatchObject({ status: 403 });
    const nadie = build({ sites: [], level: 'NONE' });
    await expect(nadie.forPractice('any')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('un error que no es de autorización se propaga (no se traga)', async () => {
    const d = build();
    d.access.assertCan.mockRejectedValue(new Error('boom'));
    await expect(d.forPractice('any')).rejects.toThrow('boom');
  });
});

describe('BillingAccessService.canOnSpace', () => {
  it('true si el evaluador lo permite; false ante 404 o 403', async () => {
    const d = build({
      bySite: { good: 'ok', hidden: 'notFound', deny: 'forbidden' },
    });
    const can = (id: string) =>
      runWithTenant(TENANT, () =>
        d.service.canOnSpace(d.tx as any, actor, 'infra.charge.view', id),
      );
    expect(await can('good')).toBe(true);
    expect(await can('hidden')).toBe(false);
    expect(await can('deny')).toBe(false);
  });
});
