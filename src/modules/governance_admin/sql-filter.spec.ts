import { SqlFilter, clampLimit, escapeLike } from './sql-filter';

describe('SqlFilter', () => {
  it('numera los parámetros en el orden en que se añaden', () => {
    const w = new SqlFilter();
    w.add('a = ?', 'x').add('b = ?', 'y');
    const marcador = w.param('z');
    expect(w.where).toBe('where a = $1 and b = $2');
    expect(marcador).toBe('$3');
    expect(w.params).toEqual(['x', 'y', 'z']);
  });

  it('sin filtros no emite WHERE', () => {
    expect(new SqlFilter().where).toBe('');
  });

  it('nunca concatena el valor en el SQL', () => {
    const w = new SqlFilter().add('a = ?', "'; drop table x; --");
    expect(w.where).not.toContain('drop');
  });
});

describe('escapeLike y clampLimit', () => {
  it('escapa los comodines de LIKE', () => {
    expect(escapeLike('50%_\\')).toBe('50\\%\\_\\\\');
  });

  it('acota el límite entre 1 y el máximo', () => {
    expect(clampLimit(undefined, 25, 100)).toBe(25);
    expect(clampLimit(0, 25, 100)).toBe(1);
    expect(clampLimit(500, 25, 100)).toBe(100);
  });
});
