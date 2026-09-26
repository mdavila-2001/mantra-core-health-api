import { filasDeTabla, columna, opcional } from './markdown-table';

const EJEMPLO = `# USUARIO MEDICOS 1

### BASE DE DATOS DE MEDICOS

| NUMERO | NOMBRE | NOMBRE 2 | APELLIDO PATERNO | MATRICULA MINISTERIO DE SALUD Y DEPORTES |
| --- | --- | --- | --- | --- |
| 1 | XIOMARA |  | CUELLAR | C-1894 |
| 2 | WALTER | MAURICIO | ROSSELL | R-283 |
| 3 |  |  |  |  |
`;

describe('markdown-table', () => {
  it('lee sólo las filas de datos, no la cabecera ni el separador', () => {
    const filas = filasDeTabla(EJEMPLO);
    expect(filas).toHaveLength(3);
  });

  it('resuelve una columna por su título, sin importar mayúsculas ni tildes', () => {
    const [fila] = filasDeTabla(EJEMPLO);
    expect(columna(fila!, 'nombre')).toBe('XIOMARA');
    expect(columna(fila!, 'Matrícula Ministerio de Salud y Deportes')).toBe(
      'C-1894',
    );
  });

  it('prueba varios alias de columna en orden hasta encontrar uno', () => {
    const [fila] = filasDeTabla(EJEMPLO);
    expect(columna(fila!, 'no existe', 'nombre 2', 'nombre')).toBe('');
    expect(columna(fila!, 'apellido paterno')).toBe('CUELLAR');
  });

  it('una fila vacía da celdas vacías, no undefined', () => {
    const filas = filasDeTabla(EJEMPLO);
    const vacia = filas[2]!;
    expect(columna(vacia, 'nombre')).toBe('');
  });

  it('opcional distingue vacío de con contenido', () => {
    expect(opcional('  ')).toBeUndefined();
    expect(opcional(' XIOMARA ')).toBe('XIOMARA');
  });
});
