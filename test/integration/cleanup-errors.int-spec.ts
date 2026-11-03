import { qualifiedViolationTable } from './cleanup-errors';

describe('qualifiedViolationTable', () => {
  it('califica la tabla con su esquema, como la guarda el grafo de FK', () => {
    expect(
      qualifiedViolationTable({ schema: 'audit', table: 'audit_log' }),
    ).toBe('audit.audit_log');
  });

  it('devuelve la tabla sola si el servidor no informó esquema', () => {
    expect(qualifiedViolationTable({ table: 'audit_log' })).toBe('audit_log');
    expect(qualifiedViolationTable({ schema: '', table: 'audit_log' })).toBe(
      'audit_log',
    );
  });

  it('marca como desconocida la violación sin tabla', () => {
    expect(qualifiedViolationTable({})).toBe('(desconocida)');
    expect(qualifiedViolationTable({ schema: 'audit' })).toBe('(desconocida)');
  });
});
