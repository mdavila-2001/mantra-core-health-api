import { tableRows, column, optional } from './markdown-table';

const EXAMPLE = `# USUARIO MEDICOS 1

### BASE DE DATOS DE MEDICOS

| NUMERO | NOMBRE | NOMBRE 2 | APELLIDO PATERNO | MATRICULA MINISTERIO DE SALUD Y DEPORTES |
| --- | --- | --- | --- | --- |
| 1 | XIOMARA |  | CUELLAR | C-1894 |
| 2 | WALTER | MAURICIO | ROSSELL | R-283 |
| 3 |  |  |  |  |
`;

describe('markdown-table', () => {
  it('lee sólo las filas de datos, no la cabecera ni el separador', () => {
    const rows = tableRows(EXAMPLE);
    expect(rows).toHaveLength(3);
  });

  it('resuelve una columna por su título, sin importar mayúsculas ni tildes', () => {
    const [fila] = tableRows(EXAMPLE);
    expect(column(fila!, 'nombre')).toBe('XIOMARA');
    expect(column(fila!, 'Matrícula Ministerio de Salud y Deportes')).toBe(
      'C-1894',
    );
  });

  it('prueba varios alias de columna en orden hasta encontrar uno', () => {
    const [fila] = tableRows(EXAMPLE);
    expect(column(fila!, 'no existe', 'nombre 2', 'nombre')).toBe('');
    expect(column(fila!, 'apellido paterno')).toBe('CUELLAR');
  });

  it('una fila vacía da celdas vacías, no undefined', () => {
    const rows = tableRows(EXAMPLE);
    const empty = rows[2]!;
    expect(column(empty, 'nombre')).toBe('');
  });

  it('opcional distingue vacío de con contenido', () => {
    expect(optional('  ')).toBeUndefined();
    expect(optional(' XIOMARA ')).toBe('XIOMARA');
  });
});
