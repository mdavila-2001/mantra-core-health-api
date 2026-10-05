import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
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
    document_number: '4567890',
    phone: '+591 70000001',
    email: null,
    gender_concept_id: 'g-f',
    gender_code: 'GENDER_FEMALE',
    occupation_display: null,
    community_profile_slug: null,
    ...extra,
  };
}

function cobertura(id: string, extra: Record<string, unknown> = {}) {
  return {
    patient_profile_id: id,
    plan_name: 'Plan Salud Vital',
    policy_identifier: 'POL-1',
    member_identifier: 'AF-1',
    status_concept_id: INS.COVERAGE_ACTIVE,
    plan_status_concept_id: INS.PLAN_ACTIVE,
    effective_from: '2026-01-01',
    effective_to: '2026-12-31',
    plan_effective_from: null,
    plan_effective_to: null,
    ...extra,
  };
}

function build(respuestas: unknown[][]) {
  const execute = mockFn();
  for (const respuesta of respuestas) execute.mockResolvedValueOnce(respuesta);
  const em = { fork: () => ({ getConnection: () => ({ execute }) }) };
  const insurerContext = {
    resolve: mockFn().mockResolvedValue({
      carrierId: CARRIER,
      tenantId: 'tenant-1',
    }),
  };
  const service = new InsurerPatientsService(
    em as never,
    insurerContext as never,
  );
  return { service, execute, insurerContext };
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

  it('pagina de a 10 por omisión y acota la página por la aseguradora del tenant', async () => {
    const d = build([[]]);

    const page = await d.service.list({}, actor, AHORA);

    expect(page).toEqual({ items: [], limit: 10, nextCursor: null });
    const [, params] = d.execute.mock.calls[0];
    expect(params.slice(0, 2)).toEqual([CARRIER, CARRIER]);
    expect(params.at(-1)).toBe(11);
    // Página vacía: no se piden detalles.
    expect(d.execute).toHaveBeenCalledTimes(1);
  });

  it('arma la fila con la cobertura vigente de ESTA aseguradora y la edad a la fecha de La Paz', async () => {
    const d = build([
      [{ patient_profile_id: 'p1', sort_value: 'paciente p1' }],
      [persona('p1', { community_profile_slug: 'ana-perez' })],
      [cobertura('p1')],
    ]);

    const page = await d.service.list({}, actor, AHORA);

    expect(page.items).toEqual([
      {
        patientProfileId: 'p1',
        fullName: 'Paciente p1',
        documentNumber: '4567890',
        birthDate: '1990-10-05',
        age: 35,
        phone: '+591 70000001',
        genderConceptId: 'g-f',
        genderCode: 'GENDER_FEMALE',
        coverage: {
          hasActiveCoverage: true,
          planName: 'Plan Salud Vital',
          policyIdentifier: 'POL-1',
          memberIdentifier: 'AF-1',
          validityStatus: 'CURRENT',
        },
        communityProfileSlug: 'ana-perez',
      },
    ]);
    const [coverageSql, coverageParams] = d.execute.mock.calls[2];
    expect(coverageSql).toContain('where pr.insurance_carrier_id = ?');
    expect(coverageParams[0]).toBe(CARRIER);
  });

  it('dice «Ninguno» (sin cobertura vigente) para la vencida o el que sólo llegó por reclamo', async () => {
    const d = build([
      [
        { patient_profile_id: 'vencida', sort_value: 'a' },
        { patient_profile_id: 'reclamo', sort_value: 'b' },
      ],
      [persona('vencida'), persona('reclamo')],
      [cobertura('vencida', { effective_to: '2026-06-30' })],
    ]);

    const page = await d.service.list({}, actor, AHORA);

    expect(page.items.map((item) => item.coverage)).toEqual([
      { hasActiveCoverage: false },
      { hasActiveCoverage: false },
    ]);
  });

  it('omite el slug cuando el paciente no tiene un perfil al que se le pueda escribir', async () => {
    const d = build([
      [{ patient_profile_id: 'p1', sort_value: 'a' }],
      [persona('p1')],
      [],
    ]);

    const [item] = (await d.service.list({}, actor, AHORA)).items;

    expect(item).not.toHaveProperty('communityProfileSlug');
    expect(item).not.toHaveProperty('email');
  });

  it('pide el slug sólo de perfiles activos, públicos y de usuario', async () => {
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
  });

  it('devuelve cursor sólo cuando hay una fila de más', async () => {
    const filas = Array.from({ length: 11 }, (_, i) => ({
      patient_profile_id: `p${i}`,
      sort_value: `paciente ${String(i).padStart(2, '0')}`,
    }));
    const d = build([
      filas,
      filas.slice(0, 10).map((f) => persona(f.patient_profile_id)),
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
