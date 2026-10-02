import { describe, it, expect } from '@jest/globals';
import {
  containsPattern,
  normalizeSearchText,
  sqlSearchKey,
  sqlSortKey,
} from './glossary-search.sql';

describe('glossary-search.sql', () => {
  it('pliega tildes, diéresis y mayúsculas del texto buscado', () => {
    expect(normalizeSearchText('  Hipertensión  ')).toBe('hipertension');
    expect(normalizeSearchText('PINGÜINO')).toBe('pinguino');
    expect(normalizeSearchText('Niño')).toBe('nino');
  });

  it('escapa los comodines de LIKE que escribió la persona', () => {
    expect(containsPattern('50%')).toBe('%50\\%%');
    expect(containsPattern('a_b')).toBe('%a\\_b%');
    expect(containsPattern('c\\d')).toBe('%c\\\\d%');
  });

  it('las dos listas de `translate` tienen el mismo largo (si no, Postgres borra letras)', () => {
    for (const expr of [sqlSearchKey('x'), sqlSortKey('x')]) {
      const [, from, to] = /translate\(lower\(x\), '([^']*)', '([^']*)'\)/.exec(
        expr,
      ) as RegExpExecArray;
      expect([...from].length).toBe([...to].length);
    }
  });

  it('para ordenar conserva la eñe; para buscar la pliega a «n»', () => {
    expect(sqlSortKey('x')).not.toContain('ñ');
    expect(sqlSearchKey('x')).toContain('ñ');
  });
});
