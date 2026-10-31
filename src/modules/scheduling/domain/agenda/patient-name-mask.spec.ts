import { maskPatientName } from './patient-name-mask';

describe('maskPatientName', () => {
  it('PARTIAL: primer nombre e inicial del primer apellido', () => {
    expect(maskPatientName('María Pérez Rojas', 'PARTIAL')).toBe('María P.');
    expect(maskPatientName('  carmen  ortuño ', 'PARTIAL')).toBe('carmen O.');
  });

  it('PARTIAL con una sola palabra la deja tal cual y con vacío no muestra nada', () => {
    expect(maskPatientName('Sandra', 'PARTIAL')).toBe('Sandra');
    expect(maskPatientName('   ', 'PARTIAL')).toBeNull();
  });

  it('REDACT deja «Paciente»; HASH y NULLIFY no dejan nombre', () => {
    expect(maskPatientName('María Pérez Rojas', 'REDACT')).toBe('Paciente');
    expect(maskPatientName('María Pérez Rojas', 'HASH')).toBeNull();
    expect(maskPatientName('María Pérez Rojas', 'NULLIFY')).toBeNull();
  });
});
