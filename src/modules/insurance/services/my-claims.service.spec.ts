import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { QueryOrder } from '@mikro-orm/postgresql';
import { getCurrentTenantId } from '../../../common';
import { Encounters } from '../../clinical/entities';
import { DiagnosticUnits } from '../../diagnostic_units/entities';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { InsuranceClaims, PatientCoverages } from '../entities';
import { INS } from '../insurance.concepts';
import { MyClaimsService } from './my-claims.service';
import { InsurerReceivedClaimsService } from './insurer-received-claims.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = '11111111-1111-4111-8111-111111111111';
const OTHER_TENANT = '22222222-2222-4222-8222-222222222222';
const actor = { id: 'u-1', roles: ['PATIENT'], patientProfileId: 'p-1' };
const previousRls = process.env.RLS_ENFORCE;

afterEach(() => {
  if (previousRls === undefined) delete process.env.RLS_ENFORCE;
  else process.env.RLS_ENFORCE = previousRls;
});

function build(
  options: {
    units?: any[];
    encounters?: any[];
    coverages?: any[];
    claims?: any[];
  } = {},
) {
  process.env.RLS_ENFORCE = 'false';
  const em: any = {
    find: mockFn((entity: unknown) => {
      if (entity === Encounters)
        return Promise.resolve(options.encounters ?? [{ id: 'e-own' }]);
      if (entity === PatientCoverages)
        return Promise.resolve(options.coverages ?? [{ id: 'coverage-own' }]);
      if (entity === DiagnosticUnits)
        return Promise.resolve(options.units ?? []);
      if (entity === InsuranceClaims)
        return Promise.resolve(options.claims ?? [{ id: 'c-own' }]);
      throw new Error('Consulta inesperada');
    }),
    execute: mockFn().mockResolvedValue([]),
  };
  em.fork = mockFn(() => em);
  em.transactional = mockFn((callback: any) => callback(em));
  const received = {
    buildMyItems: mockFn((_em: unknown, claims: any[]) =>
      Promise.resolve(claims.map((claim) => ({ id: claim.id }))),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  return {
    em,
    received,
    logger,
    service: new MyClaimsService(em, received as never, logger as never),
  };
}

describe('MyClaimsService', () => {
  describe('correcto', () => {
    it('el paciente sólo consulta las coberturas del perfil firmado, incluso sin tenant', async () => {
      const d = build();
      const result = await d.service.list(actor);
      expect(result).toEqual({
        view: 'PATIENT',
        items: [{ id: 'c-own' }],
        truncated: false,
      });
      expect(d.em.find).toHaveBeenCalledWith(PatientCoverages, {
        patientProfileId: 'p-1',
      });
      expect(d.em.find).toHaveBeenCalledWith(
        InsuranceClaims,
        {
          patientCoverageId: { $in: ['coverage-own'] },
        },
        {
          orderBy: [
            { submittedAt: QueryOrder.DESC_NULLS_LAST },
            { id: QueryOrder.DESC },
          ],
          limit: 501,
        },
      );
    });

    it('el profesional precede al paciente y sólo lee sus encuentros', async () => {
      const d = build();
      expect(
        (await d.service.list({ ...actor, practitionerProfileId: 'hp-own' }))
          .view,
      ).toBe('PRACTITIONER');
      expect(d.em.find).toHaveBeenCalledWith(Encounters, {
        primaryPractitionerId: 'hp-own',
      });
      expect(d.em.find).toHaveBeenCalledWith(
        InsuranceClaims,
        { encounterId: { $in: ['e-own'] } },
        expect.any(Object),
      );
      expect(
        d.em.find.mock.calls.some(
          ([entity]: any[]) => entity === PatientCoverages,
        ),
      ).toBe(false);
    });

    it.each([
      ['LABORATORY', DUNIT.UNIT_TYPE_LABORATORY],
      ['IMAGING', DUNIT.UNIT_TYPE_IMAGING],
    ])(
      'el centro %s consulta sólo unidades activas propias y el tipo facturador correcto',
      async (view, type) => {
        const d = build({
          units: [{ id: 'unit-own', diagnosticUnitTypeConceptId: type }],
        });
        const session = { ...actor, tenantIds: [TENANT] };
        expect((await d.service.list(session, TENANT)).view).toBe(view);
        expect(d.em.find).toHaveBeenCalledWith(DiagnosticUnits, {
          tenantId: TENANT,
          statusConceptId: DUNIT.UNIT_ACTIVE,
          diagnosticUnitTypeConceptId: {
            $in: [DUNIT.UNIT_TYPE_LABORATORY, DUNIT.UNIT_TYPE_IMAGING],
          },
        });
        expect(d.em.find).toHaveBeenCalledWith(
          InsuranceClaims,
          {
            billingProviderTypeConceptId:
              INS.BILLING_PROVIDER_TYPE_DIAGNOSTIC_UNIT,
            billingProviderEntityId: { $in: ['unit-own'] },
          },
          expect.any(Object),
        );
      },
    );

    it('un tenant mixto usa laboratorio aunque imagen venga primero', async () => {
      const d = build({
        units: [
          { id: 'image', diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_IMAGING },
          {
            id: 'lab',
            diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
          },
        ],
      });
      expect(
        (
          await d.service.list({
            id: 'staff',
            roles: ['USER'],
            tenantIds: [TENANT],
          })
        ).view,
      ).toBe('LABORATORY');
      expect(d.em.find).toHaveBeenCalledWith(
        InsuranceClaims,
        {
          billingProviderTypeConceptId:
            INS.BILLING_PROVIDER_TYPE_DIAGNOSTIC_UNIT,
          billingProviderEntityId: { $in: ['lab'] },
        },
        expect.any(Object),
      );
    });

    it('restaura contexto y variables RLS dentro de una transacción para el centro', async () => {
      const d = build({
        units: [
          {
            id: 'lab',
            diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
          },
        ],
      });
      process.env.RLS_ENFORCE = 'true';
      d.received.buildMyItems.mockImplementation(() => {
        expect(getCurrentTenantId()).toBe(TENANT);
        return Promise.resolve([]);
      });
      await d.service.list({
        id: 'staff',
        roles: ['USER'],
        tenantIds: [TENANT],
      });
      expect(d.em.transactional).toHaveBeenCalledTimes(1);
      expect(d.em.execute).toHaveBeenCalledWith(
        "select set_config('app.system_context', 'false', true)",
      );
      expect(d.em.execute).toHaveBeenCalledWith(
        "select set_config('app.current_tenant_id', ?, true)",
        [TENANT],
      );
      expect(getCurrentTenantId()).toBeUndefined();
    });

    it('una cuenta sin alcance obtiene NONE sin consultar solicitudes', async () => {
      const d = build();
      expect(await d.service.list({ id: 'other', roles: ['USER'] })).toEqual({
        view: 'NONE',
        items: [],
        truncated: false,
      });
      expect(d.em.find).not.toHaveBeenCalled();
    });

    it('registra actor e ids leídos sin contenidos personales', async () => {
      const d = build();
      await d.service.list(actor);
      expect(d.logger.info).toHaveBeenCalledWith(
        {
          operation: 'insurance.my-claims.read',
          actorUserId: 'u-1',
          view: 'PATIENT',
          claimIds: ['c-own'],
        },
        'Reading own insurance claims',
      );
    });
  });

  describe('límite', () => {
    it.each([500, 501])(
      '%s filas tienen límite explícito de 500 y aviso correcto',
      async (count) => {
        const d = build({
          claims: Array.from({ length: count }, (_, i) => ({ id: `c-${i}` })),
        });
        const result = await d.service.list(actor);
        expect(result.items).toHaveLength(500);
        expect(result.truncated).toBe(count > 500);
        expect(d.received.buildMyItems.mock.calls[0][1]).toHaveLength(500);
      },
    );

    it('perfil profesional sin encuentros mantiene su vista sin caer a paciente', async () => {
      const d = build({ encounters: [], claims: [] });
      expect(
        await d.service.list({ ...actor, practitionerProfileId: 'hp-own' }),
      ).toEqual({ view: 'PRACTITIONER', items: [], truncated: false });
      expect(d.em.find).toHaveBeenCalledWith(
        InsuranceClaims,
        { encounterId: { $in: [] } },
        expect.any(Object),
      );
    });

    it('sin unidades diagnósticas el paciente conserva el alcance personal', async () => {
      const d = build();
      expect(
        (await d.service.list({ ...actor, tenantIds: [TENANT] })).view,
      ).toBe('PATIENT');
    });
  });

  describe('inválido / no autorizado', () => {
    it.each(['USER', 'SUPERADMIN'])(
      'el rol %s no puede abrir un tenant sin membresía',
      async (role) => {
        const d = build();
        await expect(
          d.service.list(
            { id: 'u', roles: [role], tenantIds: [TENANT] },
            OTHER_TENANT,
          ),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(d.em.find).not.toHaveBeenCalled();
      },
    );

    it('rechaza cabecera inválida antes de leer datos', async () => {
      const d = build();
      await expect(d.service.list(actor, 'no-uuid')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(d.em.find).not.toHaveBeenCalled();
    });

    it('un perfil paciente sin rol PATIENT no concede lectura', async () => {
      const d = build();
      expect((await d.service.list({ ...actor, roles: ['USER'] })).view).toBe(
        'NONE',
      );
      expect(d.em.find).not.toHaveBeenCalled();
    });

    it('fallos de persistencia se propagan, nunca se convierten en vacío', async () => {
      const d = build();
      d.em.find.mockRejectedValue(new Error('storage unavailable'));
      await expect(d.service.list(actor)).rejects.toThrow(
        'storage unavailable',
      );
      expect(d.received.buildMyItems).not.toHaveBeenCalled();
    });
  });
});

describe('InsurerReceivedClaimsService.buildMyItems', () => {
  it('sin dictamen mantiene null, profesional ausente y fecha ausente', async () => {
    const repository = { findCarriersByIds: mockFn().mockResolvedValue([]) };
    const service = new InsurerReceivedClaimsService(
      {} as never,
      {} as never,
      repository as never,
      {} as never,
      {} as never,
      {} as never,
      { setContext: mockFn() } as never,
    );
    jest.spyOn(service as any, 'buildItems').mockResolvedValue([
      {
        id: 'claim',
        claimIdentifier: 'CLM-SYNTHETIC',
        patient: { displayName: null },
        practitioner: null,
        providerName: '',
        service: null,
        additionalServiceCount: 0,
        billedTotal: { amount: '10.00', currency: null },
        approvedTotal: null,
        submittedAt: null,
        serviceDate: null,
        planName: null,
        status: { code: 'SUBMITTED', display: 'Enviada' },
        decision: null,
      },
    ] as never);
    const [result] = await service.buildMyItems(
      {} as never,
      [{ id: 'claim', insuranceCarrierId: 'carrier' }] as never,
      'PATIENT',
    );
    expect(result).toMatchObject({
      decision: null,
      approvedTotal: null,
      practitioner: null,
      serviceDate: null,
    });
  });

  it.each(['PATIENT', 'PRACTITIONER'] as const)(
    'proyecta %s sin afiliación, póliza, líneas ni firmante',
    async (view) => {
      const repository = {
        findCarriersByIds: mockFn().mockResolvedValue([
          { id: 'carrier', legalName: 'Aseguradora sintética' },
        ]),
      };
      const service = new InsurerReceivedClaimsService(
        {} as never,
        {} as never,
        repository as never,
        {} as never,
        {} as never,
        {} as never,
        { setContext: mockFn() } as never,
      );
      const row = {
        id: 'claim',
        claimIdentifier: 'CLM-SYNTHETIC',
        patient: {
          id: 'patient',
          displayName: 'Paciente sintético',
          memberIdentifier: 'sensitive-member',
          patientCode: 'sensitive-code',
        },
        practitioner: {
          id: 'practitioner',
          displayName: 'Profesional sintético',
          specialty: null,
        },
        providerName: 'Centro sintético',
        service: null,
        additionalServiceCount: 0,
        billedTotal: { amount: '100.00', currency: null },
        approvedTotal: { amount: '0.00', currency: null },
        submittedAt: null,
        serviceDate: null,
        planName: 'Plan sintético',
        policyIdentifier: 'sensitive-policy',
        status: { code: 'REJECTED', display: 'Rechazada' },
        decision: {
          outcome: 'REJECTED',
          decidedAt: '2026-10-03T00:00:00Z',
          reason: 'No cubierto',
          decidedBy: 'sensitive-operator',
        },
        lines: [{ id: 'sensitive-line' }],
        invoice: null,
      };
      jest
        .spyOn(service as any, 'buildItems')
        .mockResolvedValue([row] as never);
      const [result] = await service.buildMyItems(
        {} as never,
        [{ id: 'claim', insuranceCarrierId: 'carrier' }] as never,
        view,
      );
      expect(result.patientName).toBe(
        view === 'PATIENT' ? null : 'Paciente sintético',
      );
      expect(result.insurerName).toBe('Aseguradora sintética');
      expect(result.approvedTotal?.amount).toBe('0.00');
      expect(result.practitioner).toEqual({
        displayName: 'Profesional sintético',
        specialty: null,
      });
      expect(result.decision).toEqual({
        outcome: 'REJECTED',
        decidedAt: '2026-10-03T00:00:00Z',
        reason: 'No cubierto',
      });
      expect(JSON.stringify(result)).not.toMatch(
        /sensitive|policyIdentifier|memberIdentifier|patientCode|decidedBy|"lines"|"invoice"/,
      );
    },
  );

  it('lista vacía no resuelve aseguradoras ni proyección adicional', async () => {
    const repository = { findCarriersByIds: mockFn() };
    const service = new InsurerReceivedClaimsService(
      {} as never,
      {} as never,
      repository as never,
      {} as never,
      {} as never,
      {} as never,
      { setContext: mockFn() } as never,
    );
    expect(await service.buildMyItems({} as never, [], 'PATIENT')).toEqual([]);
    expect(repository.findCarriersByIds).not.toHaveBeenCalled();
  });
});
