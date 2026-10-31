import { jest } from '@jest/globals';
import { SessionPoliciesService } from './session-policies.service';
import { CONCEPTS, runWithTenant } from '../../../../common';
import { IAMC } from '../../iam.concepts';
import { IamErrorReason } from '../../iam.error-reasons';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/** Construye el servicio con repositorio en doble. */
function build(current: any[] = []) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn().mockReturnValue(tx),
  };
  const repo = {
    findByTenant: mockFn().mockResolvedValue(current),
    findByTenants: mockFn().mockResolvedValue(current),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const ipRules = {
    assertActorKeepsStoredRules: mockFn().mockResolvedValue(undefined),
  };
  const service = new SessionPoliciesService(
    em as any,
    repo as any,
    logger as any,
    ipRules as any,
  );
  return { service, repo, ipRules, logger };
}

const policy = (overrides: Record<string, unknown> = {}) => ({
  scope: 'ORG_STAFF',
  idleTimeoutMinutes: 30,
  newDeviceAlert: true,
  enforceIpRules: false,
  requireMfa: true,
  ...overrides,
});

describe('SessionPoliciesService', () => {
  it('PUT reemplaza el conjunto: retira las vigentes y crea las nuevas con el tenant activo', async () => {
    const old = {
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      updatedAt: new Date(0),
    };
    const d = build([old]);
    await runWithTenant(TENANT, () =>
      d.service.put({ policies: [policy() as any] }, ADMIN),
    );
    expect(old.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    const [[, tenantId, data]] = d.repo.create.mock.calls;
    expect(tenantId).toBe(TENANT);
    expect(data.scopeConceptId).toBe(IAMC.SESSION_POLICY_SCOPE_ORG_STAFF);
    expect(data.requireMfa).toBe(true);
  });

  it('el alcance ROLE exige su rol y los demás no lo admiten', async () => {
    const d = build();
    await expect(
      runWithTenant(TENANT, () =>
        d.service.put({ policies: [policy({ scope: 'ROLE' }) as any] }, ADMIN),
      ),
    ).rejects.toThrow();
    await expect(
      runWithTenant(TENANT, () =>
        d.service.put(
          { policies: [policy({ scope: 'ORG_STAFF', roleCode: 'X' }) as any] },
          ADMIN,
        ),
      ),
    ).rejects.toThrow();
    expect(d.repo.create).not.toHaveBeenCalled();
  });

  it('no admite repetir un alcance', async () => {
    const d = build();
    await expect(
      runWithTenant(TENANT, () =>
        d.service.put({ policies: [policy() as any, policy() as any] }, ADMIN),
      ),
    ).rejects.toThrow();
  });

  it('rulesFor combina las políticas que aplican a los roles del titular', async () => {
    const row = (scope: string, extra: Record<string, unknown> = {}) => ({
      tenantId: TENANT,
      scopeConceptId:
        scope === 'ROLE'
          ? IAMC.SESSION_POLICY_SCOPE_ROLE
          : IAMC.SESSION_POLICY_SCOPE_ORG_STAFF,
      idleTimeoutMinutes: 30,
      newDeviceAlert: false,
      enforceIpRules: false,
      requireMfa: false,
      ...extra,
    });
    const d = build([
      row('ORG_STAFF'),
      row('ROLE', {
        roleCode: 'SUPPORT_STAFF',
        requireMfa: true,
        idleTimeoutMinutes: 10,
      }),
    ]);
    const rules = await d.service.rulesFor(
      {} as any,
      [TENANT],
      ['SUPPORT_STAFF'],
    );
    expect(rules.idleTimeoutMinutes).toBe(10);
    expect(rules.requireMfa).toBe(true);
  });

  it('rulesFor recuerda en qué organizaciones se exigen las reglas de red (cada una con las suyas)', async () => {
    const row = (tenantId: string, enforceIpRules: boolean) => ({
      tenantId,
      scopeConceptId: IAMC.SESSION_POLICY_SCOPE_ALL_ACCOUNTS,
      idleTimeoutMinutes: 30,
      newDeviceAlert: false,
      enforceIpRules,
      requireMfa: false,
    });
    const d = build([row('A', true), row('B', false), row('C', true)]);
    const rules = await d.service.rulesFor(
      {} as any,
      ['A', 'B', 'C'],
      ['USER'],
    );
    expect(rules.enforceIpRules).toBe(true);
    expect(rules.ipRuleTenantIds).toEqual(['A', 'C']);
    const none = await d.service.rulesFor({} as any, ['B'], ['USER']);
    expect(none.enforceIpRules).toBe(false);
    expect(none.ipRuleTenantIds).toEqual([]);
  });

  it('GET devuelve las políticas del tenant activo', async () => {
    const d = build([
      {
        scopeConceptId: IAMC.SESSION_POLICY_SCOPE_ALL_ACCOUNTS,
        idleTimeoutMinutes: 60,
        newDeviceAlert: true,
        enforceIpRules: false,
        requireMfa: false,
        allowedHoursJson: { from: '07:00', to: '20:00', days: [1, 2] },
      },
    ]);
    const res = await runWithTenant(TENANT, () => d.service.get());
    expect(res.policies[0]).toMatchObject({
      scope: 'ALL_ACCOUNTS',
      allowedHours: { from: '07:00', to: '20:00', days: [1, 2] },
    });
    expect(d.repo.findByTenant).toHaveBeenCalledWith(
      expect.anything(),
      TENANT,
      CONCEPTS.STATE_ACTIVE,
    );
  });

  it('A5: un horario con zona inválida se rechaza al guardar', async () => {
    const d = build();
    await expect(
      runWithTenant(TENANT, () =>
        d.service.put(
          {
            policies: [
              policy({
                allowedHours: {
                  from: '08:00',
                  to: '18:00',
                  timeZone: 'Marte/Olimpo',
                },
              }) as any,
            ],
          },
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(d.repo.create).not.toHaveBeenCalled();
  });

  it('A5: rulesFor evalúa cada organización con los roles que la persona tiene EN ella', async () => {
    const rows = [
      {
        tenantId: 'A',
        scopeConceptId: IAMC.SESSION_POLICY_SCOPE_ROLE,
        roleCode: 'ADMIN',
        idleTimeoutMinutes: 5,
        newDeviceAlert: false,
        enforceIpRules: false,
        requireMfa: true,
      },
    ];
    const d = build(rows);
    // ADMIN rige solo en B: la política ROLE:ADMIN de la organización A no le aplica.
    const rules = await d.service.rulesFor(
      {} as any,
      ['A', 'B'],
      ['USER', 'ADMIN'],
      { B: ['ADMIN'] },
    );
    expect(rules.requireMfa).toBe(false);
    expect(rules.idleTimeoutMinutes).toBeUndefined();
  });

  it('A5: la política de una organización sí aplica a quien tiene el rol allí', async () => {
    const rows = [
      {
        tenantId: 'A',
        scopeConceptId: IAMC.SESSION_POLICY_SCOPE_ROLE,
        roleCode: 'ADMIN',
        idleTimeoutMinutes: 5,
        newDeviceAlert: false,
        enforceIpRules: false,
        requireMfa: true,
      },
    ];
    const d = build(rows);
    const rules = await d.service.rulesFor(
      {} as any,
      ['A', 'B'],
      ['USER', 'ADMIN'],
      { A: ['ADMIN'] },
    );
    expect(rules.requireMfa).toBe(true);
    expect(rules.idleTimeoutMinutes).toBe(5);
  });

  describe('N2: validación de la franja horaria al guardar', () => {
    const put = (d: ReturnType<typeof build>, hours: any, ip?: string) =>
      runWithTenant(TENANT, () =>
        d.service.put(
          { policies: [policy({ allowedHours: hours }) as any] },
          ADMIN,
          ip,
        ),
      );
    /** Una franja de `hours` horas que contiene «ahora» en La Paz. */
    const aroundNow = (hours: number) => {
      const hhmm = (offsetMin: number) =>
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'America/La_Paz',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).format(new Date(Date.now() + offsetMin * 60_000));
      return { from: hhmm(-30), to: hhmm(hours * 60 - 30) };
    };

    it('rechaza from == to: es una franja vacía que cierra a todos', async () => {
      const d = build();
      await expect(
        put(d, { from: '08:00', to: '08:00' }),
      ).rejects.toMatchObject({
        status: 422,
        reason: IamErrorReason.SESSION_POLICY_HOURS_EMPTY,
      });
      expect(d.repo.create).not.toHaveBeenCalled();
    });

    it('rechaza una franja de menos de 4 horas', async () => {
      const d = build();
      await expect(
        put(d, { from: '08:00', to: '11:59' }),
      ).rejects.toMatchObject({
        status: 422,
        reason: IamErrorReason.SESSION_POLICY_HOURS_TOO_SHORT,
      });
      await expect(
        put(d, { from: '22:00', to: '01:00' }),
      ).rejects.toMatchObject({
        reason: IamErrorReason.SESSION_POLICY_HOURS_TOO_SHORT,
      });
    });

    it('acepta una franja de exactamente 4 horas que contiene a quien guarda', async () => {
      const d = build();
      await expect(put(d, aroundNow(4))).resolves.toBeDefined();
      expect(d.repo.create).toHaveBeenCalled();
    });

    it('rechaza una franja que deja a quien guarda fuera AHORA', async () => {
      const d = build();
      const now = aroundNow(6);
      // La misma franja desplazada 8 horas: no contiene «ahora».
      const [h, m] = now.from.split(':').map(Number);
      const shift = (hh: number) =>
        `${String((hh + 8) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const outside = { from: shift(h), to: shift(h + 6) };
      await expect(put(d, outside)).rejects.toMatchObject({
        status: 422,
        reason: IamErrorReason.SESSION_POLICY_WOULD_LOCK_OUT_ACTOR,
      });
      expect(d.repo.create).not.toHaveBeenCalled();
    });

    it('una franja ROLE para otro rol no cuenta para el cierre propio: no aplica a quien guarda', async () => {
      const d = build();
      // ROLE:OTRO con una franja que no contiene «ahora», pero a ADMIN no le aplica.
      const now = aroundNow(6);
      const [h, m] = now.from.split(':').map(Number);
      const shift = (hh: number) =>
        `${String((hh + 8) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      await expect(
        runWithTenant(TENANT, () =>
          d.service.put(
            {
              policies: [
                policy({
                  scope: 'ROLE',
                  roleCode: 'OTRO',
                  allowedHours: { from: shift(h), to: shift(h + 6) },
                }) as any,
              ],
            },
            ADMIN,
          ),
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('N2: PUT /org/session-policies con la misma comprobación de bloqueo propio que el de red', () => {
    it('si la política exige las reglas de red y el origen del actor queda fuera de las guardadas, se rechaza', async () => {
      const d = build();
      d.ipRules.assertActorKeepsStoredRules.mockRejectedValue(
        Object.assign(new Error('lock'), {
          reason: IamErrorReason.IP_RULES_WOULD_LOCK_OUT_ACTOR,
        }),
      );
      await expect(
        runWithTenant(TENANT, () =>
          d.service.put(
            { policies: [policy({ enforceIpRules: true }) as any] },
            ADMIN,
            '203.0.113.9',
          ),
        ),
      ).rejects.toMatchObject({
        reason: IamErrorReason.IP_RULES_WOULD_LOCK_OUT_ACTOR,
      });
      expect(d.ipRules.assertActorKeepsStoredRules).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        '203.0.113.9',
      );
      expect(d.repo.create).not.toHaveBeenCalled();
    });

    it('si ninguna política aplicable exige reglas de red no consulta las reglas guardadas', async () => {
      const d = build();
      await runWithTenant(TENANT, () =>
        d.service.put({ policies: [policy() as any] }, ADMIN, '1.1.1.1'),
      );
      expect(d.ipRules.assertActorKeepsStoredRules).not.toHaveBeenCalled();
    });
  });

  describe('N2: rulesFor devuelve el desglose por organización', () => {
    const row = (tenantId: string, extra: Record<string, unknown> = {}) => ({
      tenantId,
      scopeConceptId: IAMC.SESSION_POLICY_SCOPE_ALL_ACCOUNTS,
      idleTimeoutMinutes: 30,
      newDeviceAlert: false,
      enforceIpRules: false,
      requireMfa: false,
      ...extra,
    });

    it('cada organización con política tiene sus reglas; las demás no figuran', async () => {
      const d = build([
        row('A', {
          requireMfa: true,
          idleTimeoutMinutes: 5,
          allowedHoursJson: { from: '08:00', to: '12:00' },
        }),
        row('B'),
      ]);
      const rules = await d.service.rulesFor(
        {} as any,
        ['A', 'B', 'C'],
        ['USER'],
      );
      expect(rules.tenantIds).toEqual(['A', 'B', 'C']);
      expect(Object.keys(rules.byTenant ?? {})).toEqual(['A', 'B']);
      expect(rules.byTenant?.A).toMatchObject({
        requireMfa: true,
        idleTimeoutMinutes: 5,
      });
      expect(rules.byTenant?.A.allowedHours).toEqual([
        expect.objectContaining({ from: '08:00', to: '12:00' }),
      ]);
      expect(rules.byTenant?.B.requireMfa).toBe(false);
      // El agregado sigue siendo el más estricto de todas.
      expect(rules.requireMfa).toBe(true);
    });
  });

  it('N2: clearForTenant retira las políticas activas de la organización (rescate)', async () => {
    const a = {
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      updatedAt: new Date(0),
    };
    const b = {
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      updatedAt: new Date(0),
    };
    const d = build([a, b]);
    await expect(d.service.clearForTenant(TENANT, 'sys-1')).resolves.toBe(2);
    expect(a.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    expect(b.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    expect((a as any).updatedByUserId).toBe('sys-1');
    expect(d.logger.warn).toHaveBeenCalled();
  });
});
