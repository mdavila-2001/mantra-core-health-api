import {
  syntheticNationalId,
  syntheticMobilePhone,
  syntheticBirthDate,
  syntheticEmail,
} from './synthetic-person';

describe('synthetic-person', () => {
  it('es determinista: la misma key da siempre el mismo valor', () => {
    expect(syntheticNationalId('USUARIO_MEDICOS_1.md#3')).toBe(
      syntheticNationalId('USUARIO_MEDICOS_1.md#3'),
    );
    expect(syntheticMobilePhone('USUARIO_MEDICOS_1.md#3')).toBe(
      syntheticMobilePhone('USUARIO_MEDICOS_1.md#3'),
    );
    expect(syntheticBirthDate('USUARIO_MEDICOS_1.md#3')).toBe(
      syntheticBirthDate('USUARIO_MEDICOS_1.md#3'),
    );
  });

  it('dos keys distintas no chocan (al menos entre estas dos filas de prueba)', () => {
    expect(syntheticNationalId('fila-1')).not.toBe(syntheticNationalId('fila-2'));
  });

  it('la cédula sintética tiene 7 dígitos, sin cero a la izquierda', () => {
    const ci = syntheticNationalId('cualquier-fila');
    expect(ci).toMatch(/^[1-9][0-9]{6}$/);
  });

  it('el celular sintético tiene 8 dígitos y empieza con 6 o 7', () => {
    const tel = syntheticMobilePhone('cualquier-fila');
    expect(tel).toMatch(/^[67][0-9]{7}$/);
  });

  it('la fecha de nacimiento sintética cae entre 1955 y 2004', () => {
    const fecha = syntheticBirthDate('cualquier-fila');
    expect(fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const anio = Number(fecha.slice(0, 4));
    expect(anio).toBeGreaterThanOrEqual(1955);
    expect(anio).toBeLessThanOrEqual(2004);
  });

  it('el correo sigue el patrón congelado <nombre>.<apellido>@alovida.test', () => {
    expect(syntheticEmail('Xiomara', 'Cuellar')).toBe(
      'xiomara.cuellar@alovida.test',
    );
  });

  it('el desambiguador separa a dos personas con el mismo nombre y apellido', () => {
    expect(syntheticEmail('Ana', 'Rojas', '7')).toBe('ana.rojas.7@alovida.test');
    expect(syntheticEmail('Ana', 'Rojas', '12')).not.toBe(
      syntheticEmail('Ana', 'Rojas', '7'),
    );
  });

  it('nombre con tildes se normaliza sin ellas', () => {
    expect(syntheticEmail('José', 'Núñez')).toBe('jose.nunez@alovida.test');
  });
});
