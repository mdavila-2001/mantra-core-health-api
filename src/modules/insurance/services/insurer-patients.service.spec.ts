import { jest } from '@jest/globals';
import { context } from '@opentelemetry/api';
import { isTracingSuppressed } from '@opentelemetry/core';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { INS } from '../insurance.concepts';
import { ageAt, InsurerPatientsService } from './insurer-patients.service';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const CARRIER = 'carrier-1';
const actor = { id: 'u-op', roles: ['USER', 'INSURANCE_OPERATOR'] } as any;
// 2026-10-04 15:00 en La Paz (UTC-4).
const AHORA = new Date('2026-10-04T19:00:00Z');

function persona(id: string, extra: Record<string, unknown> = {}) {
  return {
    patient_profile_id: id,
    full_name: `Paciente ${id}`,
    birth_date: '1990-10-05',
    phone: '+591 70000001',
    email: null,
    gender_code: 'GENDER_FEMALE',
    occupation_display: null,
    community_profile_id: null,
    ...extra,
  };
}

function coverage(id: string, extra: Record<string, unknown> = {}) {
  return {
    patient_profile_id: id,
    carrier_id: CARRIER,
    carrier_name: 'Seguro de prueba',
    status_concept_id: INS.COVERAGE_ACTIVE,
    plan_status_concept_id: INS.PLAN_ACTIVE,
    effective_from: '2026-01-01',
    effective_to: '2026-12-31',
    plan_effective_from: null,
    plan_effective_to: null,
    ...extra,
  };
}

function build(responses: unknown[][]) {
  const execute = mockFn();
  for (const response of responses) execute.mockResolvedValueOnce(response);
  const dbExecute = mockFn((sql: string, params: unknown[]) => {
    if (sql.includes('directory.tenant_memberships'))
      return Promise.resolve([{ id: 'membership' }]);
    if (sql.startsWith('select count(*)'))
      return Promise.resolve([{ total: responses[0]?.length ?? 0 }]);
    return execute(sql, params);
  });
  const flush = mockFn().mockResolvedValue(undefined);
  const em = {
    fork: () => ({ getConnection: () => ({ execute: dbExecute }), flush }),
  };
  const messaging = {
    createConversation: mockFn().mockResolvedValue({ id: 'conversation' }),
  };
  const dataAccess = { record: mockFn() };
  const insurerContext = {
    resolve: mockFn().mockResolvedValue({
      carrierId: CARRIER,
      tenantId: 'tenant-1',
    }),
  };
  const service = new InsurerPatientsService(
    em as never,
    insurerContext as never,
    messaging as never,
    dataAccess as never,
  );
  return {
    service,
    execute,
    insurerContext,
    messaging,
    dataAccess,
    dbExecute,
    flush,
  };
}

describe('InsurerPatientsService', () => {
  it('no consulta nada si la sesión no puede operar la aseguradora', async () => {
    const d = build([]);
    d.insurerContext.resolve.mockRejectedValue(new ForbiddenException('no'));

    await expect(d.service.list({}, actor, AHORA)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(d.insurerContext.resolve).toHaveBeenCalledWith(
      expect.anything(),
      actor,
      'No hay acceso al directorio de pacientes',
    );
    expect(d.execute).not.toHaveBeenCalled();
  });

  it('pagina de a 25 por omisión y acota la página por la aseguradora del tenant', async () => {
    const d = build([[]]);

    const page = await d.service.list({}, actor, AHORA);

    expect(page).toEqual({ items: [], total: 0, limit: 25, nextCursor: null });
    const [, params] = d.execute.mock.calls[0];
    expect(params.slice(0, 2)).toEqual([CARRIER, INS.CARRIER_ACTIVE]);
    expect(params.at(-1)).toBe(26);
    // Página vacía: no se piden detalles.
    expect(d.execute).toHaveBeenCalledTimes(1);
  });

  it('normaliza filtros compuestos sólo por espacios a sus valores por omisión', async () => {
    const d = build([[]]);

    await d.service.list({ search: '   ', occupation: '   ' }, actor, AHORA);

    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).not.toContain('common.contact_points cp');
    expect(sql).not.toContain('p.occupation_free_text');
    expect(params.at(-1)).toBe(26);
  });

  it('arma la fila con la cobertura vigente de ESTA aseguradora y la edad a la fecha de La Paz', async () => {
    const d = build([
      [{ patient_profile_id: 'p1', sort_value: 'paciente p1' }],
      [persona('p1', { community_profile_id: 'ana-perez' })],
      [coverage('p1')],
    ]);

    const page = await d.service.list({}, actor, AHORA);

    expect(page.items).toEqual([
      {
        patientProfileId: 'p1',
        fullName: 'Paciente p1',
        birthDate: '1990-10-05',
        age: 35,
        phone: '+591 70000001',
        genderCode: 'GENDER_FEMALE',
        insurers: [{ id: CARRIER, name: 'Seguro de prueba' }],
        messaging: { channel: 'internal', available: true },
      },
    ]);
    const [coverageSql, coverageParams] = d.execute.mock.calls[2];
    expect(coverageSql).toContain('and pr.insurance_carrier_id = ?');
    expect(coverageParams[1]).toBe(CARRIER);
  });

  it('administración ve «Ninguno» para coberturas vencidas o ausentes', async () => {
    const d = build([
      [
        { patient_profile_id: 'vencida', sort_value: 'a' },
        { patient_profile_id: 'reclamo', sort_value: 'b' },
      ],
      [persona('vencida'), persona('reclamo')],
      [coverage('vencida', { effective_to: '2026-06-30' })],
    ]);

    const page = await d.service.list(
      {},
      { id: 'admin', roles: ['SUPERADMIN'] },
      AHORA,
    );

    expect(page.items.map((item) => item.insurers)).toEqual([[], []]);
  });

  it('omite el slug cuando el paciente no tiene un perfil al que se le pueda escribir', async () => {
    const d = build([
      [{ patient_profile_id: 'p1', sort_value: 'a' }],
      [persona('p1')],
      [],
    ]);

    const [item] = (await d.service.list({}, actor, AHORA)).items;

    expect(item.messaging).toEqual({ channel: 'internal', available: false });
    expect(item).not.toHaveProperty('communityProfileSlug');
    expect(item).not.toHaveProperty('email');
  });

  it('omite nacimiento y edad cuando la persona no declaró fecha de nacimiento', async () => {
    const d = build([
      [{ patient_profile_id: 'p1', sort_value: 'a' }],
      [persona('p1', { birth_date: null })],
      [],
    ]);

    const [item] = (await d.service.list({}, actor, AHORA)).items;

    expect(item).not.toHaveProperty('birthDate');
    expect(item).not.toHaveProperty('age');
    expect(item.patientProfileId).toBe('p1');
  });

  it('descarta una fila de página cuyo detalle de persona ya no existe', async () => {
    const d = build([
      [{ patient_profile_id: 'deleted', sort_value: 'a' }],
      [],
      [],
    ]);

    const page = await d.service.list({}, actor, AHORA);

    expect(page).toEqual({ items: [], total: 1, limit: 25, nextCursor: null });
    expect(d.dataAccess.record).not.toHaveBeenCalled();
    expect(d.flush).toHaveBeenCalled();
  });

  it('resuelve mensajería sólo para cuentas y vínculos activos con perfil público', async () => {
    const d = build([
      [{ patient_profile_id: 'p1', sort_value: 'a' }],
      [persona('p1')],
      [],
    ]);

    await d.service.list({}, actor, AHORA);

    const [peopleSql] = d.execute.mock.calls[1];
    expect(peopleSql).toContain('pub.target_type_concept_id = ?');
    expect(peopleSql).toContain('pub.visibility_concept_id = ?');
    expect(peopleSql).toContain('pal.status_concept_id = ?');
    expect(peopleSql).toContain('account.status_concept_id = ?');
    expect(peopleSql).not.toContain('identifiers');
  });

  it('devuelve cursor sólo cuando hay una fila de más', async () => {
    const rows = Array.from({ length: 11 }, (_, i) => ({
      patient_profile_id: `p${i}`,
      sort_value: `paciente ${String(i).padStart(2, '0')}`,
    }));
    const d = build([
      rows,
      rows.slice(0, 10).map((f) => persona(f.patient_profile_id)),
      [],
    ]);

    const page = await d.service.list({ limit: 10 }, actor, AHORA);

    expect(page.items).toHaveLength(10);
    expect(page.nextCursor).toEqual(expect.any(String));
  });
});

describe('ageAt', () => {
  it('cuenta los años cumplidos, no los del calendario', () => {
    expect(ageAt('1990-10-05', '2026-10-04')).toBe(35);
    expect(ageAt('1990-10-04', '2026-10-04')).toBe(36);
    expect(ageAt('2000-02-29', '2026-02-28')).toBe(25);
  });
});

describe('directory authorization, options and conversations', () => {
  it('keeps personal search parameters out of ORM debug query logs and SQL spans', async () => {
    const withContext = jest.spyOn(context, 'with');
    const d = build([[]]);
    await d.service.list(
      { search: 'Persona sintetica', occupation: 'Docente' },
      actor,
      AHORA,
    );
    const queries = d.dbExecute.mock.calls.filter(([sql]: [string]) =>
      sql.includes('from profiles.patient_profiles'),
    );
    expect(queries).toHaveLength(2);
    for (const query of queries)
      expect(query[4]).toEqual({ debugMode: ['query'] });
    expect(withContext).toHaveBeenCalledTimes(2);
    for (const call of withContext.mock.calls)
      expect(isTracingSuppressed(call[0])).toBe(true);
    withContext.mockRestore();
  });
  it('denies revoked membership before reading patient data', async () => {
    const d = build([]);
    d.dbExecute.mockResolvedValueOnce([]);
    await expect(d.service.list({}, actor, AHORA)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(d.execute).not.toHaveBeenCalled();
  });
  it('lets platform administrators read the roster without an insurer tenant', async () => {
    const d = build([[]]);
    await d.service.list({}, { id: 'admin', roles: ['SECURITY_ADMIN'] }, AHORA);
    expect(d.insurerContext.resolve).not.toHaveBeenCalled();
    expect(d.execute.mock.calls[0][0]).not.toContain('patient_coverages');
  });
  it('does not treat a tenant-scoped administrator as a platform administrator', async () => {
    const d = build([[]]);
    await d.service.list(
      {},
      {
        id: 'admin',
        roles: ['SECURITY_ADMIN'],
        scopedRoles: { 'tenant-1': ['SECURITY_ADMIN'] },
      },
      AHORA,
    );
    expect(d.insurerContext.resolve).toHaveBeenCalled();
    expect(d.execute.mock.calls[0][1]).toContain(CARRIER);
  });
  it('lists only carrier options from the active scope', async () => {
    const d = build([[{ id: CARRIER, name: 'Seguro de prueba' }]]);
    expect(await d.service.options(actor)).toEqual({
      insurers: [{ id: CARRIER, name: 'Seguro de prueba' }],
    });
    expect(d.execute.mock.calls[0][1]).toEqual([INS.CARRIER_ACTIVE, CARRIER]);
  });
  it('lists every active carrier option for a platform security administrator', async () => {
    const d = build([
      [
        { id: CARRIER, name: 'Seguro de prueba' },
        { id: 'carrier-2', name: 'Segundo seguro' },
      ],
    ]);

    expect(
      await d.service.options({ id: 'admin', roles: ['SECURITY_ADMIN'] }),
    ).toEqual({
      insurers: [
        { id: CARRIER, name: 'Seguro de prueba' },
        { id: 'carrier-2', name: 'Segundo seguro' },
      ],
    });
    expect(d.insurerContext.resolve).not.toHaveBeenCalled();
    expect(d.execute.mock.calls[0][0]).not.toContain('and id = ?');
    expect(d.execute.mock.calls[0][1]).toEqual([INS.CARRIER_ACTIVE]);
  });
  it('deduplicates current insurers and audits only opaque identifiers', async () => {
    const d = build([
      [{ patient_profile_id: 'p1', sort_value: 'a' }],
      [persona('p1')],
      [coverage('p1'), coverage('p1')],
    ]);
    const result = await d.service.list({}, actor, AHORA);
    expect(result.items[0].insurers).toEqual([
      { id: CARRIER, name: 'Seguro de prueba' },
    ]);
    expect(Object.keys(result.items[0]).sort()).toEqual(
      [
        'patientProfileId',
        'fullName',
        'birthDate',
        'age',
        'phone',
        'genderCode',
        'insurers',
        'messaging',
      ].sort(),
    );
    expect(d.dataAccess.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: actor.id, patientProfileId: 'p1' }),
    );
    expect(JSON.stringify(d.dataAccess.record.mock.calls)).not.toContain(
      '+591',
    );
    expect(d.flush).toHaveBeenCalled();
  });
  it('rejects a foreign or no-longer-covered patient before resolving chat profiles', async () => {
    const d = build([[]]);
    await expect(
      d.service.openConversation(
        { patientProfileId: 'foreign', channel: 'internal' },
        actor,
        AHORA,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(d.execute).toHaveBeenCalledTimes(1);
    expect(d.messaging.createConversation).not.toHaveBeenCalled();
  });
  it('resolves real community identifiers and reuses the chat service', async () => {
    const responses = [
      [{ patient_profile_id: 'p1', sort_value: 'a' }],
      [persona('p1', { community_profile_id: 'recipient' })],
      [{ id: 'initiator' }],
    ];
    const d = build([...responses, ...responses]);
    const dto = { patientProfileId: 'p1', channel: 'internal' as const };
    expect(await d.service.openConversation(dto, actor, AHORA)).toEqual({
      conversationId: 'conversation',
    });
    expect(await d.service.openConversation(dto, actor, AHORA)).toEqual({
      conversationId: 'conversation',
    });
    expect(d.messaging.createConversation).toHaveBeenCalledWith(
      { participantProfileIds: ['initiator', 'recipient'] },
      actor,
    );
    expect(d.insurerContext.resolve).toHaveBeenCalledTimes(2);
  });
  it('preserves messaging restrictions and missing-profile failures', async () => {
    const d = build([
      [{ patient_profile_id: 'p1' }],
      [persona('p1')],
      [{ id: 'initiator' }],
    ]);
    await expect(
      d.service.openConversation(
        { patientProfileId: 'p1', channel: 'internal' },
        actor,
        AHORA,
      ),
    ).rejects.toThrow('mensajería');
    expect(d.messaging.createConversation).not.toHaveBeenCalled();
    const blocked = build([
      [{ patient_profile_id: 'p1' }],
      [persona('p1', { community_profile_id: 'recipient' })],
      [{ id: 'initiator' }],
    ]);
    blocked.messaging.createConversation.mockRejectedValue(
      new ForbiddenException('blocked'),
    );
    await expect(
      blocked.service.openConversation(
        { patientProfileId: 'p1', channel: 'internal' },
        actor,
        AHORA,
      ),
    ).rejects.toThrow('blocked');
  });
});
