import { criticalApprovalNeed } from './support-critical-approval';
import type { GrantTargetFacts } from './support-grant-targets';

const NOW = new Date('2026-11-03T10:30:00Z');
const day = (n: number): Date => new Date(NOW.getTime() + n * 86_400_000);
const ALL: GrantTargetFacts = { targetKind: 'ALL', expansionMode: 'DYNAMIC' };
const doctor = (id: string): GrantTargetFacts => ({
  targetKind: 'PRACTITIONER',
  expansionMode: 'DYNAMIC',
  practitionerRoleAssignmentId: id,
});
const VOID = 'billing.receipt.void';
const REFUND = 'billing.payment.refund';

describe('criticalApprovalNeed · cuatro ojos por (átomo, objetivo, vigencia)', () => {
  it('un átomo crítico que la persona no tiene por ninguna vía es NUEVO', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: ALL,
        validTo: day(30),
        held: [],
      }),
    ).toEqual({ atoms: [VOID], reasons: ['NEW_CRITICAL_ATOMS'] });
  });

  it('el mismo átomo sobre el mismo objetivo y con vigencia igual o menor no pide nada', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: doctor('pra-1'),
        validTo: day(30),
        held: [{ atoms: [VOID], target: doctor('pra-1'), validTo: day(30) }],
      }),
    ).toBeUndefined();
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: doctor('pra-1'),
        validTo: day(10),
        held: [{ atoms: [VOID], target: doctor('pra-1'), validTo: day(30) }],
      }),
    ).toBeUndefined();
  });

  it('V-3: pasar de una agenda a TODA la organización amplía el alcance', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: ALL,
        validTo: day(30),
        held: [{ atoms: [VOID], target: doctor('pra-1'), validTo: day(30) }],
      }),
    ).toEqual({ atoms: [VOID], reasons: ['SCOPE_WIDENED'] });
  });

  it('V-3: otra agenda distinta de la que ya tenía también es alcance nuevo', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: doctor('pra-2'),
        validTo: day(30),
        held: [{ atoms: [VOID], target: doctor('pra-1'), validTo: day(30) }],
      })?.reasons,
    ).toEqual(['SCOPE_WIDENED']);
  });

  it('V-3: reducir el alcance (de toda la organización a una agenda) no pide nada', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: doctor('pra-1'),
        validTo: day(30),
        held: [{ atoms: [VOID], target: ALL, validTo: day(30) }],
      }),
    ).toBeUndefined();
  });

  it('V-3: prorrogar la vigencia más allá de lo ya aprobado pide aprobación', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: ALL,
        validTo: day(80),
        held: [{ atoms: [VOID], target: ALL, validTo: day(5) }],
      }),
    ).toEqual({ atoms: [VOID], reasons: ['VALIDITY_EXTENDED'] });
  });

  it('V-3: quitar el fin de vigencia (indefinido) frente a uno con fin es una prórroga; frente a otro indefinido no', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: ALL,
        held: [{ atoms: [VOID], target: ALL, validTo: day(5) }],
      })?.reasons,
    ).toEqual(['VALIDITY_EXTENDED']);
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: ALL,
        held: [{ atoms: [VOID], target: ALL }],
      }),
    ).toBeUndefined();
  });

  it('la cobertura y la vigencia deben venir del MISMO permiso: no se combinan el alcance de uno con la vigencia de otro', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: ALL,
        validTo: day(60),
        held: [
          // amplio pero corto
          { atoms: [VOID], target: ALL, validTo: day(5) },
          // largo pero angosto
          { atoms: [VOID], target: doctor('pra-1'), validTo: day(80) },
        ],
      })?.reasons,
    ).toEqual(['VALIDITY_EXTENDED']);
  });

  it('un permiso que no da el átomo no cuenta aunque cubra el objetivo', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: ALL,
        validTo: day(30),
        held: [{ atoms: [REFUND], target: ALL, validTo: day(30) }],
      })?.reasons,
    ).toEqual(['NEW_CRITICAL_ATOMS']);
  });

  it('con varios átomos pide solo por los que amplían y junta los motivos', () => {
    expect(
      criticalApprovalNeed({
        atoms: [REFUND, VOID],
        target: ALL,
        validTo: day(30),
        held: [{ atoms: [VOID], target: doctor('pra-1'), validTo: day(30) }],
      }),
    ).toEqual({
      atoms: [REFUND, VOID],
      reasons: ['NEW_CRITICAL_ATOMS', 'SCOPE_WIDENED'],
    });
  });

  it('un objetivo sin celdas (FIXED sin foto) nunca queda «dentro»: falla cerrado', () => {
    expect(
      criticalApprovalNeed({
        atoms: [VOID],
        target: doctor('pra-1'),
        validTo: day(30),
        held: [
          {
            atoms: [VOID],
            target: {
              targetKind: 'PRACTITIONER',
              expansionMode: 'FIXED',
              practitionerRoleAssignmentId: 'pra-1',
            },
            validTo: day(30),
          },
        ],
      })?.reasons,
    ).toEqual(['SCOPE_WIDENED']);
  });

  it('sin átomos críticos propuestos no hay nada que aprobar', () => {
    expect(
      criticalApprovalNeed({ atoms: [], target: ALL, held: [] }),
    ).toBeUndefined();
  });
});
