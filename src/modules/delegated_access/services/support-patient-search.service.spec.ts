import { jest } from '@jest/globals';
import { SupportPatientSearchService } from './support-patient-search.service';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ANA = { id: 'user-ana', roles: ['SUPPORT_STAFF'] } as any;
const TENANT = 'tenant-1';

/** Un adulto hallado por la búsqueda. */
const JUAN = {
  profileId: 'pat-1',
  displayName: 'Juan Pérez',
  birthDate: '1990-05-17',
  nationalId: '1234556',
  phone: '+591 71234567',
};

/** Un menor hallado por la búsqueda. */
const MARTIN = {
  profileId: 'pat-2',
  displayName: 'Martín Rocha Antelo',
  birthDate: '2018-03-02',
  nationalId: '9876543',
  phone: '+591 70000001',
};

/** Vínculo vigente cuyo único permiso trae las acciones indicadas. */
const facts = (
  actions: string[],
  overrides: Record<string, unknown> = {},
): any[] => [
  {
    engagementId: 'eng-1',
    active: true,
    validFrom: new Date('2026-01-01T00:00:00Z'),
    acceptances: [],
    grants: [
      {
        grantId: 'g1',
        targetKind: 'ALL',
        expansionMode: 'DYNAMIC',
        active: true,
        actions,
      },
    ],
    ...overrides,
  },
];

/**
 * Construye el servicio con política, vínculos, pacientes, contador y auditoría
 * en doble. `access`: `true` (puede buscar), `false` (vínculo vivo sin permiso
 * que trate con pacientes) o `'unlinked'` (ningún vínculo en la organización).
 */
function build(
  access: boolean | 'unlinked' = true,
  probe: Record<string, unknown> = {},
  found: unknown[] = [JUAN],
) {
  // Simula el contexto de RLS de la transacción para ver en qué contexto se sella.
  const ctx = { system: 'false', tenant: '' };
  const tx = {
    execute: mockFn((sql: string, params?: unknown[]) => {
      if (sql.includes('current_setting')) {
        return Promise.resolve([{ sc: ctx.system, tid: ctx.tenant }]);
      }
      if (sql.includes("'app.system_context', 'true'")) ctx.system = 'true';
      else if (sql.includes("'app.system_context', 'false'"))
        ctx.system = 'false';
      else if (sql.includes("'app.system_context', ?"))
        ctx.system = String(params![0]);
      else if (sql.includes("'app.current_tenant_id', ?"))
        ctx.tenant = String(params![0]);
      else if (sql.includes("'app.current_tenant_id', ''")) ctx.tenant = '';
      return Promise.resolve([]);
    }),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const policy = {
    loadFacts: mockFn().mockResolvedValue(
      facts(access === true ? ['schedule.create'] : ['schedule.view']),
    ),
  };
  const engagements = {
    findEngagements: mockFn().mockResolvedValue(
      access === 'unlinked' ? [] : [{ assignment: { id: 'e' } }],
    ),
  };
  const patients = {
    findExact: mockFn().mockResolvedValue(found),
    findRepresentatives: mockFn().mockResolvedValue(
      new Map([
        [
          'pat-2',
          [
            {
              id: 'rel-1',
              name: 'Sandra Antelo Vaca',
              relationshipConceptId: 'x',
              legalRepresentation: false,
            },
          ],
        ],
      ]),
    ),
  };
  // Lo que el contador de consultas (fuera de la transacción) responde al intento.
  const probes = {
    hit: mockFn().mockResolvedValue({
      allowed: true,
      firstOverflow: false,
      ...probe,
    }),
  };
  const sealContext: string[] = [];
  const audit = {
    record: mockFn(async () => {
      sealContext.push(ctx.system);
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SupportPatientSearchService(
    em as any,
    policy as any,
    engagements as any,
    patients as any,
    audit as any,
    probes as any,
    logger as any,
  );
  return {
    service,
    em,
    policy,
    engagements,
    patients,
    audit,
    probes,
    logger,
    ctx,
    sealContext,
  };
}

/** Organizaciones en cuya cadena se selló algo (`undefined`: partición propia, sin tenant). */
const sealedTenants = (d: ReturnType<typeof build>): unknown[] =>
  d.audit.record.mock.calls.map(([, , entry]: any[]) => entry.tenantId);

describe('SupportPatientSearchService', () => {
  it('con documento exacto devuelve lo mínimo (documento y teléfono tapados) y deja la búsqueda auditada', async () => {
    const d = build();
    const res = await d.service.search(
      { tenantId: TENANT, nationalId: '1234556' },
      ANA,
    );
    expect(res.count).toBe(1);
    expect(res.items[0]).toEqual({
      patientProfileId: 'pat-1',
      profileId: 'pat-1',
      displayName: 'Juan Pérez',
      documentMasked: '***556',
      phoneMasked: '7******7',
      ageYears: expect.any(Number),
      isMinor: false,
    });
    // Ni el documento ni el teléfono completos salen de la API.
    expect(JSON.stringify(res)).not.toContain('1234556');
    expect(JSON.stringify(res)).not.toContain('71234567');
    expect(d.patients.findExact).toHaveBeenCalledWith(
      expect.anything(),
      'NATIONAL_ID',
      expect.objectContaining({ nationalId: '1234556' }),
    );
    expect(d.audit.record).toHaveBeenCalledWith(
      expect.anything(),
      ANA,
      expect.objectContaining({
        action: 'SUPPORT_PATIENT_SEARCHED',
        tenantId: TENANT,
        success: true,
      }),
    );
  });

  it('acepta `org` y `document` como alias de `tenantId` y `nationalId`', async () => {
    const d = build();
    await d.service.search({ org: TENANT, document: '1234556' }, ANA);
    expect(d.engagements.findEngagements).toHaveBeenCalledWith(
      expect.anything(),
      { userId: 'user-ana', tenantId: TENANT },
    );
    expect(d.patients.findExact).toHaveBeenCalledWith(
      expect.anything(),
      'NATIONAL_ID',
      expect.objectContaining({ nationalId: '1234556' }),
    );
    expect(d.audit.record).toHaveBeenCalledWith(
      expect.anything(),
      ANA,
      expect.objectContaining({ tenantId: TENANT }),
    );
  });

  it('si llegan `org` y `tenantId` distintos, o `document` y `nationalId` distintos, responde 400', async () => {
    const d = build();
    await expect(
      d.service.search(
        { org: TENANT, tenantId: 'tenant-2', nationalId: '1234556' },
        ANA,
      ),
    ).rejects.toMatchObject({
      reason: Reason.SUPPORT_PATIENT_INPUT_CONFLICT,
      status: 400,
    });
    await expect(
      d.service.search(
        { tenantId: TENANT, nationalId: '1234556', document: '7654321' },
        ANA,
      ),
    ).rejects.toMatchObject({ reason: Reason.SUPPORT_PATIENT_INPUT_CONFLICT });
    expect(d.patients.findExact).not.toHaveBeenCalled();
  });

  it('en un menor trae a sus representantes, pedidos solo de la organización indicada', async () => {
    const d = build(true, {}, [MARTIN]);
    const res = await d.service.search(
      { tenantId: TENANT, nationalId: '9876543' },
      ANA,
    );
    expect(res.items[0].isMinor).toBe(true);
    expect(res.items[0].representatives).toEqual([
      {
        id: 'rel-1',
        name: 'Sandra Antelo Vaca',
        relationship: 'Familiar autorizado',
      },
    ]);
    expect(d.patients.findRepresentatives).toHaveBeenCalledWith(
      expect.anything(),
      TENANT,
      ['pat-2'],
    );
  });

  it('en un adulto no devuelve representantes', async () => {
    const d = build();
    const res = await d.service.search(
      { tenantId: TENANT, nationalId: '1234556' },
      ANA,
    );
    expect(res.items[0].representatives).toBeUndefined();
    expect(d.patients.findRepresentatives).toHaveBeenCalledWith(
      expect.anything(),
      TENANT,
      [],
    );
  });

  it('caso 13: buscar «Juan» se niega con 422 y un mensaje de cómo buscar, y el intento queda auditado', async () => {
    const d = build();
    await expect(
      d.service.search({ tenantId: TENANT, fullName: 'Juan' }, ANA),
    ).rejects.toMatchObject({
      reason: Reason.SUPPORT_PATIENT_SEARCH_INEXACT,
      status: 422,
      message: expect.stringContaining('documento completo'),
    });
    expect(d.patients.findExact).not.toHaveBeenCalled();
    expect(d.audit.record).toHaveBeenCalledWith(
      expect.anything(),
      ANA,
      expect.objectContaining({ success: false, tenantId: TENANT }),
    );
  });

  it.each([
    ['nombre y apellido sin fecha', { fullName: 'Juan Pérez' }],
    ['fecha de nacimiento sin nombre', { birthDate: '1990-05-17' }],
    [
      'fecha de nacimiento que no existe',
      { fullName: 'Juan Pérez', birthDate: '1990-02-31' },
    ],
    ['fragmento de documento', { nationalId: '123' }],
    ['teléfono incompleto', { phone: '7123' }],
  ])(
    'búsqueda parcial (%s): 422 y no consulta pacientes',
    async (_n, criteria) => {
      const d = build();
      await expect(
        d.service.search({ tenantId: TENANT, ...criteria }, ANA),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_PATIENT_SEARCH_INEXACT,
        status: 422,
      });
      expect(d.patients.findExact).not.toHaveBeenCalled();
    },
  );

  it('nombre completo con fecha de nacimiento es exacto', async () => {
    const d = build();
    await d.service.search(
      { tenantId: TENANT, fullName: 'Juan Pérez', birthDate: '1990-05-17' },
      ANA,
    );
    expect(d.patients.findExact).toHaveBeenCalledWith(
      expect.anything(),
      'FULL_NAME_BIRTH_DATE',
      expect.anything(),
    );
  });

  it('quien tiene vínculo pero no un permiso que trate con pacientes recibe 403 y la negativa se audita en la organización (es su personal)', async () => {
    const d = build(false);
    await expect(
      d.service.search({ tenantId: TENANT, nationalId: '1234567' }, ANA),
    ).rejects.toMatchObject({
      reason: Reason.SUPPORT_PATIENT_SEARCH_DENIED,
      status: 403,
    });
    expect(d.patients.findExact).not.toHaveBeenCalled();
    expect(d.audit.record).toHaveBeenCalledWith(
      expect.anything(),
      ANA,
      expect.objectContaining({
        action: 'SUPPORT_PATIENT_SEARCH_DENIED',
        tenantId: TENANT,
        success: false,
      }),
    );
  });

  describe('N5: el rechazo de quien no tiene vínculo no se sella en la organización del cuerpo', () => {
    it('sin vínculo en la organización: 403 y el asiento va a la partición propia (sin tenant), nunca a la organización indicada', async () => {
      const d = build('unlinked');
      await expect(
        d.service.search({ tenantId: TENANT, nationalId: '1234567' }, ANA),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_PATIENT_SEARCH_DENIED,
        status: 403,
      });
      expect(d.patients.findExact).not.toHaveBeenCalled();
      expect(d.audit.record).toHaveBeenCalledTimes(1);
      expect(sealedTenants(d)).toEqual([undefined]);
      expect(d.audit.record).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('una organización inventada responde 403 igual y se sella igual en la partición propia', async () => {
      const d = build('unlinked');
      await expect(
        d.service.search(
          {
            tenantId: '00000000-0000-4000-8000-00000000dead',
            nationalId: '1234567',
          },
          ANA,
        ),
      ).rejects.toMatchObject({ status: 403 });
      expect(sealedTenants(d)).toEqual([undefined]);
    });

    it('un vínculo que ya no rige cuenta como sin vínculo', async () => {
      const d = build(true);
      d.policy.loadFacts.mockResolvedValue(
        facts(['schedule.create'], { active: false }),
      );
      await expect(
        d.service.search({ tenantId: TENANT, nationalId: '1234567' }, ANA),
      ).rejects.toMatchObject({ status: 403 });
      expect(sealedTenants(d)).toEqual([undefined]);
    });

    it('con RLS, el sello propio abre el contexto de sistema solo mientras se escribe', async () => {
      const before = process.env.RLS_ENFORCE;
      process.env.RLS_ENFORCE = 'true';
      try {
        const d = build('unlinked');
        await expect(
          d.service.search({ tenantId: TENANT, nationalId: '1234567' }, ANA),
        ).rejects.toMatchObject({ status: 403 });
        expect(d.sealContext).toEqual(['true']);
        expect(d.ctx.system).toBe('false');
      } finally {
        if (before === undefined) delete process.env.RLS_ENFORCE;
        else process.env.RLS_ENFORCE = before;
      }
    });

    it('la búsqueda de quien sí tiene permiso se sella en su organización', async () => {
      const d = build();
      await d.service.search({ tenantId: TENANT, nationalId: '1234556' }, ANA);
      expect(new Set(sealedTenants(d))).toEqual(new Set([TENANT]));
    });
  });

  it('A1: audita un asiento por cada paciente devuelto, para poder responder quién buscó a quién', async () => {
    const d = build();
    await d.service.search({ tenantId: TENANT, nationalId: '1234556' }, ANA);
    expect(d.audit.record).toHaveBeenCalledWith(
      expect.anything(),
      ANA,
      expect.objectContaining({
        action: 'SUPPORT_PATIENT_SEARCH_MATCH',
        entity: 'patient',
        entityId: 'pat-1',
        tenantId: TENANT,
      }),
    );
  });

  describe('N4: tope de consultas (contador propio, antes y fuera de la transacción)', () => {
    it('cuenta el intento con la persona y la IP antes de abrir la transacción de negocio', async () => {
      const d = build();
      await d.service.search(
        { tenantId: TENANT, nationalId: '1234556' },
        ANA,
        '203.0.113.9',
      );
      expect(d.probes.hit).toHaveBeenCalledTimes(1);
      expect(d.probes.hit).toHaveBeenCalledWith('user-ana', '203.0.113.9');
      expect(d.probes.hit.mock.invocationCallOrder[0]).toBeLessThan(
        d.em.transactional.mock.invocationCallOrder[0],
      );
    });

    it('al superar el tope por minuto responde 429, no abre transacción ni consulta pacientes', async () => {
      const d = build(true, {
        allowed: false,
        exceeded: { scope: 'PERSON', window: 'MINUTE' },
      });
      await expect(
        d.service.search({ tenantId: TENANT, nationalId: '1234567' }, ANA),
      ).rejects.toMatchObject({
        reason: Reason.SUPPORT_PATIENT_SEARCH_THROTTLED,
        status: 429,
        details: expect.objectContaining({
          limit: 'PER_MINUTE',
          scope: 'PERSON',
        }),
      });
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.patients.findExact).not.toHaveBeenCalled();
    });

    it('al superar el tope diario o el de IP responde 429 con su alcance', async () => {
      const day = build(true, {
        allowed: false,
        exceeded: { scope: 'PERSON', window: 'DAY' },
      });
      await expect(
        day.service.search({ tenantId: TENANT, nationalId: '1234567' }, ANA),
      ).rejects.toMatchObject({
        status: 429,
        details: expect.objectContaining({ limit: 'PER_DAY' }),
      });
      const ip = build(true, {
        allowed: false,
        exceeded: { scope: 'IP', window: 'MINUTE' },
      });
      await expect(
        ip.service.search(
          { tenantId: TENANT, nationalId: '1234567' },
          ANA,
          '1.1.1.1',
        ),
      ).rejects.toMatchObject({
        status: 429,
        details: expect.objectContaining({ scope: 'IP' }),
      });
    });

    it('el primer rechazo de la racha deja un sello en la partición propia (sin tenant); los siguientes no', async () => {
      const first = build(true, {
        allowed: false,
        firstOverflow: true,
        exceeded: { scope: 'PERSON', window: 'MINUTE' },
      });
      await expect(
        first.service.search({ tenantId: TENANT, nationalId: '1234567' }, ANA),
      ).rejects.toMatchObject({ status: 429 });
      expect(first.audit.record).toHaveBeenCalledWith(
        expect.anything(),
        ANA,
        expect.objectContaining({
          action: 'SUPPORT_PATIENT_SEARCH_THROTTLED',
          success: false,
        }),
      );
      expect(sealedTenants(first)).toEqual([undefined]);

      const next = build(true, {
        allowed: false,
        firstOverflow: false,
        exceeded: { scope: 'PERSON', window: 'MINUTE' },
      });
      await expect(
        next.service.search({ tenantId: TENANT, nationalId: '1234567' }, ANA),
      ).rejects.toMatchObject({ status: 429 });
      expect(next.audit.record).not.toHaveBeenCalled();
    });

    it('un intento que acaba en excepción dentro de la transacción ya quedó contado', async () => {
      const d = build();
      d.patients.findExact.mockRejectedValue(new Error('boom'));
      await expect(
        d.service.search({ tenantId: TENANT, nationalId: '1234556' }, ANA),
      ).rejects.toThrow('boom');
      expect(d.probes.hit).toHaveBeenCalledTimes(1);
    });

    it('el rechazo por falta de permiso, la búsqueda inexacta y la entrada inválida también cuentan', async () => {
      const denied = build(false);
      await expect(
        denied.service.search({ tenantId: TENANT, nationalId: '1234567' }, ANA),
      ).rejects.toMatchObject({ status: 403 });
      expect(denied.probes.hit).toHaveBeenCalledTimes(1);
      const inexact = build();
      await expect(
        inexact.service.search({ tenantId: TENANT, fullName: 'Juan' }, ANA),
      ).rejects.toMatchObject({ status: 422 });
      expect(inexact.probes.hit).toHaveBeenCalledTimes(1);
      const conflict = build();
      await expect(
        conflict.service.search(
          { org: TENANT, tenantId: 'otra', nationalId: '1234567' },
          ANA,
        ),
      ).rejects.toMatchObject({ status: 400 });
      expect(conflict.probes.hit).toHaveBeenCalledTimes(1);
    });
  });
});
