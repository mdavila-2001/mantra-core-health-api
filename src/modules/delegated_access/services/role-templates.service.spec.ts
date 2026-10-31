import { jest } from '@jest/globals';
import { RoleTemplatesService } from './role-templates.service';
import { runWithTenant } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { DelegationScopeService } from './delegation-scope.service';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

const ownTemplate = (overrides: Record<string, unknown> = {}): any => ({
  id: 'tpl-1',
  tenantId: TENANT,
  code: 'MI_PLANTILLA',
  name: 'Mi plantilla',
  defaultActionsJson: ['schedule.view'],
  statusConceptId: DELEG.ROLE_TEMPLATE_ACTIVE,
  versionNumber: 1,
  ...overrides,
});

/** Construye el servicio con repositorio en doble. */
function build(row: any = ownTemplate()) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const created: any[] = [];
  const templates = {
    findById: mockFn().mockResolvedValue(row),
    findEffectiveByCode: mockFn().mockResolvedValue(null),
    create: mockFn((_: unknown, data: any) => {
      const next = { id: 'tpl-2', createdAt: new Date(), ...data };
      created.push(next);
      return next;
    }),
  };
  const scope = new DelegationScopeService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new RoleTemplatesService(
    em as any,
    templates as any,
    scope,
    logger as any,
  );
  return { service, templates, created, row };
}

describe('RoleTemplatesService.update (B3: se versiona, no se modifica)', () => {
  it('publica una versión nueva con las acciones nuevas y retira la anterior', async () => {
    const d = build();
    await runWithTenant(TENANT, () =>
      d.service.update(
        'tpl-1',
        { defaultActions: ['schedule.view', 'schedule.create'] } as any,
        ADMIN,
      ),
    );
    expect(d.created).toHaveLength(1);
    expect(d.created[0]).toMatchObject({
      tenantId: TENANT,
      code: 'MI_PLANTILLA',
      versionNumber: 2,
      statusConceptId: DELEG.ROLE_TEMPLATE_ACTIVE,
    });
    expect([...d.created[0].defaultActions]).toEqual([
      'schedule.view',
      'schedule.create',
    ]);
    expect(d.row.statusConceptId).toBe(DELEG.ROLE_TEMPLATE_RETIRED);
  });

  it('la versión anterior conserva sus acciones: los vínculos que la usan no cambian', async () => {
    const d = build();
    await runWithTenant(TENANT, () =>
      d.service.update(
        'tpl-1',
        { defaultActions: ['schedule.cancel'] } as any,
        ADMIN,
      ),
    );
    expect(d.row.defaultActionsJson).toEqual(['schedule.view']);
    expect(d.row.versionNumber).toBe(1);
  });

  it('si solo cambia el nombre, las acciones pasan intactas a la versión nueva', async () => {
    const d = build();
    await runWithTenant(TENANT, () =>
      d.service.update('tpl-1', { name: 'Otro nombre' } as any, ADMIN),
    );
    expect(d.created[0].name).toBe('Otro nombre');
    expect([...d.created[0].defaultActions]).toEqual(['schedule.view']);
  });

  it('una versión ya retirada no se vuelve a editar', async () => {
    const d = build(
      ownTemplate({ statusConceptId: DELEG.ROLE_TEMPLATE_RETIRED }),
    );
    await expect(
      runWithTenant(TENANT, () =>
        d.service.update('tpl-1', { name: 'x' } as any, ADMIN),
      ),
    ).rejects.toMatchObject({ reason: Reason.SUPPORT_TEMPLATE_READ_ONLY });
    expect(d.created).toHaveLength(0);
  });

  it('la plantilla de plataforma no se edita', async () => {
    const d = build(ownTemplate({ tenantId: undefined }));
    await expect(
      runWithTenant(TENANT, () =>
        d.service.update('tpl-1', { name: 'x' } as any, ADMIN),
      ),
    ).rejects.toMatchObject({ reason: Reason.SUPPORT_TEMPLATE_READ_ONLY });
  });

  it('la plantilla de otra organización responde como inexistente', async () => {
    const d = build(ownTemplate({ tenantId: 'otra' }));
    await expect(
      runWithTenant(TENANT, () =>
        d.service.update('tpl-1', { name: 'x' } as any, ADMIN),
      ),
    ).rejects.toMatchObject({ reason: Reason.SUPPORT_TEMPLATE_NOT_FOUND });
  });
});

describe('A-M7: una plantilla propia hereda el techo más restrictivo (no relaja GP-2)', () => {
  it('al crear guarda el techo que hereda: el de plataforma más restrictivo que cubre sus acciones por defecto', async () => {
    const d = build();
    await runWithTenant(TENANT, () =>
      d.service.create(
        {
          code: 'SUPERVISOR',
          name: 'Supervisión',
          defaultActions: ['schedule.view', 'schedule.cancel'],
        } as any,
        ADMIN,
      ),
    );
    const ceiling = d.created[0].ceilingActions as string[];
    expect(ceiling).toContain('agenda.appointment.cancel');
    expect(ceiling).not.toContain('billing.payment.refund');
    expect(ceiling).not.toContain('team.guardrails.manage');
  });

  it('al versionar con acciones nuevas recalcula el techo; si solo cambia el nombre lo conserva', async () => {
    const d = build(
      ownTemplate({ ceilingActionsJson: ['agenda.appointment.view'] }),
    );
    await runWithTenant(TENANT, () =>
      d.service.update('tpl-1', { name: 'Otro' } as any, ADMIN),
    );
    expect(d.created[0].ceilingActions).toEqual(['agenda.appointment.view']);
    const e = build();
    await runWithTenant(TENANT, () =>
      e.service.update(
        'tpl-1',
        { defaultActions: ['schedule.view', 'schedule.create'] } as any,
        ADMIN,
      ),
    );
    expect(e.created[0].ceilingActions).toContain('agenda.appointment.create');
  });
});
