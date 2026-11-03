import { describeSchema } from './schema-description';
import { SCHEMA_DESCRIPTIONS } from './schema-descriptions.generated';

describe('describeSchema', () => {
  it('devuelve lo que la bóveda dice del módulo dueño del schema', () => {
    expect(describeSchema('iam')).toMatchObject({
      moduleNumber: 1,
      moduleCode: 'iam',
      domain: 'Identidad y Seguridad',
      source: 'SALUD/Módulos/M01 iam.md',
    });
    expect(describeSchema('iam')?.business).toMatch(/login accounts/i);
  });

  it('un schema que ningún módulo declara es null, no una descripción inventada', () => {
    expect(describeSchema('no_existe')).toBeNull();
    expect(describeSchema('')).toBeNull();
  });

  it('un módulo sin «Propósito de negocio» deja business en null', () => {
    expect(describeSchema('accounting')?.business).toBeNull();
    expect(describeSchema('accounting')?.system).toMatch(
      /^Módulo 16 del modelo:/,
    );
  });

  it('los módulos 67 y 68 que este portal agregó están descritos', () => {
    expect(describeSchema('data_catalog')?.moduleNumber).toBe(67);
    expect(describeSchema('qa_execution')?.moduleNumber).toBe(68);
    expect(describeSchema('data_catalog')?.business).toMatch(
      /ficha de justificación/,
    );
  });

  it('cada descripción cita su nota de origen y un número de módulo único', () => {
    const entradas = Object.values(SCHEMA_DESCRIPTIONS);
    expect(entradas.length).toBeGreaterThan(60);
    expect(entradas.every((e) => e.source.startsWith('SALUD/Módulos/M'))).toBe(
      true,
    );
    expect(new Set(entradas.map((e) => e.moduleNumber)).size).toBe(
      entradas.length,
    );
  });

  it('lo inexistente en el objeto no se hereda del prototipo', () => {
    expect(describeSchema('constructor')).toBeNull();
    expect(describeSchema('__proto__')).toBeNull();
  });
});
