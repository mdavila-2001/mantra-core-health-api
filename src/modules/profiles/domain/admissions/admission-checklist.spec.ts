import { describe, expect, it } from '@jest/globals';
import {
  applicableRequirements,
  evaluateChecklist,
  evaluateRequirement,
  type ChecklistRequirement,
  type ReviewState,
} from './admission-checklist';
import { PRACTITIONER_ONBOARDING_REQUIREMENTS } from './admission-requirements.catalog';

const req = (
  code: string,
  overrides: Partial<ChecklistRequirement> = {},
): ChecklistRequirement => ({
  id: `id-${code}`,
  code,
  label: code,
  itemType: 'CREDENTIAL',
  evidence: 'DOCUMENT',
  required: true,
  requiresSourceUri: true,
  sortOrder: 1,
  ...overrides,
});

const items = (...states: ReviewState[]) => states.map((state) => ({ state }));

describe('evaluateRequirement', () => {
  it('obligatorio sin ítems: FALTANTE y bloquea', () => {
    expect(evaluateRequirement(req('A'), [])).toMatchObject({
      state: 'MISSING',
      satisfied: false,
      blockedBy: 'MISSING',
    });
  });

  it('opcional sin ítems: no declarado, no bloquea', () => {
    expect(evaluateRequirement(req('A', { required: false }), [])).toMatchObject({
      state: 'NOT_PROVIDED',
      satisfied: true,
      blockedBy: null,
    });
  });

  it('un ítem pendiente bloquea, sea obligatorio u opcional', () => {
    expect(evaluateRequirement(req('A'), items('PENDING')).blockedBy).toBe('PENDING');
    expect(
      evaluateRequirement(req('A', { required: false }), items('PENDING')).blockedBy,
    ).toBe('PENDING');
  });

  it('información requerida pesa más que pendiente', () => {
    expect(evaluateRequirement(req('A'), items('PENDING', 'INFO_REQUIRED'))).toMatchObject(
      { state: 'INFO_REQUIRED', blockedBy: 'INFO_REQUIRED' },
    );
  });

  it('obligatorio verificado: cumplido', () => {
    expect(evaluateRequirement(req('A'), items('VERIFIED'))).toMatchObject({
      state: 'VERIFIED',
      satisfied: true,
      blockedBy: null,
    });
  });

  it('obligatorio con todos los ítems rechazados: RECHAZADO y bloquea', () => {
    expect(evaluateRequirement(req('A'), items('REJECTED', 'REJECTED'))).toMatchObject({
      state: 'REJECTED',
      satisfied: false,
      blockedBy: 'REJECTED',
    });
  });

  it('opcional rechazado NO bloquea', () => {
    expect(
      evaluateRequirement(req('A', { required: false }), items('REJECTED')),
    ).toMatchObject({ state: 'REJECTED', satisfied: true, blockedBy: null });
  });

  it('un título extra rechazado no tumba al que sí se verificó', () => {
    expect(evaluateRequirement(req('A'), items('VERIFIED', 'REJECTED'))).toMatchObject({
      state: 'VERIFIED',
      satisfied: true,
    });
  });

  it('exige los ítems mínimos verificados', () => {
    const dos = req('A', { minItems: 2 });
    expect(evaluateRequirement(dos, items('VERIFIED'))).toMatchObject({
      satisfied: false,
      blockedBy: 'BELOW_MINIMUM',
    });
    expect(evaluateRequirement(dos, items('VERIFIED', 'VERIFIED')).satisfied).toBe(true);
  });
});

describe('evaluateChecklist', () => {
  it('sólo se puede verificar sin bloqueos', () => {
    const ok = evaluateChecklist([
      { requirement: req('A'), items: items('VERIFIED') },
      { requirement: req('B', { required: false }), items: [] },
    ]);
    expect(ok.canVerify).toBe(true);
    expect(ok.blockers).toEqual([]);
    expect(ok.summary).toEqual({ total: 1, verified: 1, rejected: 0, pending: 0 });
  });

  it('el resumen cuenta requisitos en juego, no ítems', () => {
    const result = evaluateChecklist([
      { requirement: req('A'), items: items('VERIFIED', 'VERIFIED') },
      { requirement: req('B'), items: items('REJECTED') },
      { requirement: req('C'), items: items('PENDING') },
      { requirement: req('D'), items: [] },
      { requirement: req('E', { required: false }), items: [] },
    ]);
    expect(result.summary).toEqual({ total: 4, verified: 1, rejected: 1, pending: 2 });
    expect(result.canVerify).toBe(false);
    expect(result.blockers.map((b) => `${b.requirementCode}:${b.reason}`)).toEqual([
      'B:REJECTED',
      'C:PENDING',
      'D:MISSING',
    ]);
  });

  it('una lista vacía no puede verificar (falla cerrado)', () => {
    expect(evaluateChecklist([]).canVerify).toBe(false); // falla cerrado: catálogo vacío
  });

  it('200 ítems en un requisito se evalúan sin problema', () => {
    const muchos = items(...Array.from({ length: 200 }, () => 'VERIFIED' as const));
    expect(evaluateRequirement(req('A'), muchos).satisfied).toBe(true);
    const unoPendiente = [...muchos, ...items('PENDING')];
    expect(evaluateRequirement(req('A'), unoPendiente).blockedBy).toBe('PENDING');
  });
});

describe('aplicabilidad por profesión (proceso 2.1)', () => {
  const catalogo = PRACTITIONER_ONBOARDING_REQUIREMENTS.map((seed, i) =>
    req(seed.code, {
      professionGroup: seed.professionGroup,
      sortOrder: i,
      required: seed.required,
    }),
  );

  it('un médico ve el registro del Colegio Médico y no el de Odontólogos', () => {
    const codes = applicableRequirements(catalogo, 'MEDICO').map((r) => r.code);
    expect(codes).toContain('REGISTRO_COLEGIO_MEDICO');
    expect(codes).not.toContain('REGISTRO_COLEGIO_ODONTOLOGOS');
  });

  it('un odontólogo ve el del Colegio de Odontólogos y no el Médico', () => {
    const codes = applicableRequirements(catalogo, 'ODONTOLOGO').map((r) => r.code);
    expect(codes).toContain('REGISTRO_COLEGIO_ODONTOLOGOS');
    expect(codes).not.toContain('REGISTRO_COLEGIO_MEDICO');
  });

  it('lo no acotado aplica a todos, en el orden del catálogo', () => {
    const medico = applicableRequirements(catalogo, 'MEDICO').map((r) => r.code);
    const odonto = applicableRequirements(catalogo, 'ODONTOLOGO').map((r) => r.code);
    for (const comun of ['CI', 'MATRICULA_MSALUD', 'TITULO_UNIVERSITARIO']) {
      expect(medico).toContain(comun);
      expect(odonto).toContain(comun);
    }
    expect(medico.indexOf('CI')).toBeLessThan(medico.indexOf('MATRICULA_MSALUD'));
  });

  it('el requisito del colegio que no aplica no bloquea al otro grupo', () => {
    const odontologo = applicableRequirements(catalogo, 'ODONTOLOGO');
    const evaluacion = evaluateChecklist(
      odontologo.map((requirement) => ({
        requirement,
        items:
          requirement.required && requirement.code !== 'REGISTRO_COLEGIO_MEDICO'
            ? items('VERIFIED')
            : [],
      })),
    );
    expect(evaluacion.canVerify).toBe(true);
  });
});
