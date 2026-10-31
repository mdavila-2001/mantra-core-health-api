import { grantChangeDetails, grantChangeSummary } from './grant-change.details';

const names = {
  doctors: new Map([['pra-1', 'Dr. Pérez']]),
  services: new Map([['svc-eco', 'Ecografía']]),
  locations: new Map([['sp-103', 'Sala 103']]),
};
const NONE = {
  doctors: new Map<string, string>(),
  services: new Map<string, string>(),
  locations: new Map<string, string>(),
};
const add = (over: Record<string, unknown> = {}): any => ({
  op: 'ADD',
  engagementId: 'eng-1',
  assignmentRowVersion: 0,
  reasons: ['SCOPE_WIDENED'],
  criticalAtoms: ['billing.payment.refund', 'billing.receipt.void'],
  grant: {
    targetKind: 'PRACTITIONER_SERVICE',
    practitionerRoleAssignmentId: 'pra-1',
    healthcareServiceId: 'svc-eco',
    actions: ['agenda.appointment.view', 'billing.receipt.void'],
    effect: 'ALLOW',
    expansionMode: 'DYNAMIC',
    validTo: '2026-12-01T00:00:00.000Z',
    ...over,
  },
});

describe('N-1 · grantChangeDetails: lo que ve quien aprueba un GRANT_CHANGE', () => {
  it('muestra TODOS los átomos con su nombre y los críticos marcados (no solo el primero)', () => {
    const d = grantChangeDetails(
      add({
        actions: [
          'billing.payment.refund',
          'billing.receipt.void',
          'agenda.appointment.view',
        ],
      }),
      undefined,
      names,
    );
    expect(d.atoms.map((a) => a.code)).toEqual([
      'agenda.appointment.view',
      'billing.payment.refund',
      'billing.receipt.void',
    ]);
    expect(d.criticalAtoms).toEqual([
      {
        code: 'billing.payment.refund',
        name: 'Devolver pagos',
        critical: true,
      },
      {
        code: 'billing.receipt.void',
        name: 'Anular comprobantes',
        critical: true,
      },
    ]);
    expect(
      d.atoms.find((a) => a.code === 'agenda.appointment.view'),
    ).toMatchObject({
      critical: false,
    });
  });

  it('expande los alias heredados a sus átomos', () => {
    const d = grantChangeDetails(
      add({ actions: ['schedule.view'] }),
      undefined,
      names,
    );
    expect(d.atoms.length).toBeGreaterThan(0);
    expect(d.atoms.every((a) => !a.code.startsWith('schedule.'))).toBe(true);
  });

  it('muestra el objetivo por nombre (doctor, servicio, espacio), la vigencia y el modo de expansión', () => {
    const d = grantChangeDetails(
      add({ careSpaceId: 'sp-103' }),
      undefined,
      names,
    );
    expect(d.target).toEqual({
      kind: 'PRACTITIONER_SERVICE',
      expansionMode: 'DYNAMIC',
      practitionerName: 'Dr. Pérez',
      serviceName: 'Ecografía',
      locationName: 'Sala 103',
    });
    expect(d.validTo).toBe('2026-12-01T00:00:00.000Z');
    expect(d.reasons).toEqual(['SCOPE_WIDENED']);
  });

  it('un objetivo «toda la organización» no inventa nombres', () => {
    const d = grantChangeDetails(
      add({
        targetKind: 'ALL',
        practitionerRoleAssignmentId: undefined,
        healthcareServiceId: undefined,
      }),
      undefined,
      NONE,
    );
    expect(d.target).toEqual({ kind: 'ALL', expansionMode: 'DYNAMIC' });
  });

  it('las condiciones salen en lenguaje simple (la del permiso y la de cada átomo); sin condiciones, lista vacía', () => {
    const d = grantChangeDetails(
      add({
        condition: {
          schemaVersion: 1,
          time: {
            windows: [{ days: [1, 2, 3, 4, 5], from: '08:00', to: '18:00' }],
          },
        },
        actionConditions: {
          'billing.receipt.void': {
            schemaVersion: 1,
            amount: { currency: 'BOB', perTransactionMax: 500 },
          },
        },
      }),
      undefined,
      names,
    );
    expect(d.conditions).toHaveLength(2);
    expect(d.conditions[0]).toMatch(/^Puede /);
    expect(d.conditions[1]).toMatch(/^Anular comprobantes: /);
    expect(grantChangeDetails(add(), undefined, names).conditions).toEqual([]);
  });

  it('una condición ilegible se dice como ilegible, no se oculta', () => {
    const d = grantChangeDetails(
      add({ condition: 'basura' }),
      undefined,
      names,
    );
    expect(d.conditions).toEqual([
      'Tiene una condición que el sistema no puede leer.',
    ]);
  });

  it('UPDATE: muestra el permiso resultante (actual + cambio) y qué campos cambian', () => {
    const d = grantChangeDetails(
      {
        op: 'UPDATE',
        engagementId: 'eng-1',
        grantId: 'g-1',
        assignmentRowVersion: 0,
        reasons: ['SCOPE_WIDENED', 'VALIDITY_EXTENDED'],
        criticalAtoms: ['billing.receipt.void'],
        change: {
          expansionMode: 'DYNAMIC',
          validTo: '2026-12-20T00:00:00.000Z',
        },
      } as any,
      {
        targetKind: 'PRACTITIONER',
        practitionerRoleAssignmentId: 'pra-1',
        expansionMode: 'FIXED',
        actions: ['billing.receipt.void'],
        validTo: new Date('2026-11-10T00:00:00Z'),
      },
      names,
    );
    expect(d.op).toBe('UPDATE');
    expect(d.target).toMatchObject({
      kind: 'PRACTITIONER',
      expansionMode: 'DYNAMIC',
      practitionerName: 'Dr. Pérez',
    });
    expect(d.validTo).toBe('2026-12-20T00:00:00.000Z');
    expect(d.criticalAtoms.map((a) => a.code)).toEqual([
      'billing.receipt.void',
    ]);
    expect(d.changes).toEqual(['expansionMode', 'validTo']);
  });

  it('el resumen nombra todos los átomos críticos; sin ellos usa el texto general', () => {
    expect(
      grantChangeSummary({
        criticalAtoms: ['billing.payment.refund', 'billing.receipt.void'],
      }),
    ).toBe(
      'Cambio de permisos con permisos críticos: Devolver pagos, Anular comprobantes.',
    );
    expect(grantChangeSummary({})).toBe(
      'Cambio de permisos por encima del techo o con permisos críticos.',
    );
  });
});
