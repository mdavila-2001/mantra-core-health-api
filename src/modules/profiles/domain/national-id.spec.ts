import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONCEPTS } from '../../../common/constants/concepts';
import {
  NATIONAL_ID_UNIQUE_INDEX,
  isNationalIdUniqueViolation,
  nationalIdIndexPredicateSql,
  normalizeNationalId,
  normalizedNationalIdSql,
} from './national-id';

describe('normalizeNationalId', () => {
  it.each([
    ['1234567', '1234567'],
    ['01234567', '1234567'],
    ['0001234567', '1234567'],
    [' 1234567 ', '1234567'],
    ['1.234.567', '1234567'],
    ['1-234-567', '1234567'],
    ['1 234 567', '1234567'],
    ['1234567-1a', '12345671A'],
    ['1234567 lp', '1234567LP'],
    ['  00.123-456 ab ', '123456AB'],
  ])('«%s» se guarda y se compara como «%s»', (raw, expected) => {
    expect(normalizeNationalId(raw)).toBe(expected);
  });

  it('las variantes de un mismo documento convergen en una sola forma', () => {
    const forms = [
      '1234567',
      '01234567',
      '1.234.567 ',
      '1-234-567',
      '  1234567',
    ].map(normalizeNationalId);
    expect(new Set(forms).size).toBe(1);
  });

  it('un documento solo de ceros o de separadores queda en «0»: no hay forma vacía', () => {
    expect(normalizeNationalId('0000')).toBe('0');
    expect(normalizeNationalId('----')).toBe('0');
    expect(normalizeNationalId('')).toBe('0');
  });

  it('es idempotente', () => {
    const once = normalizeNationalId('00.123-456 ab');
    expect(normalizeNationalId(once)).toBe(once);
  });

  it('no mezcla documentos distintos (el cero interior se conserva)', () => {
    expect(normalizeNationalId('1020304')).toBe('1020304');
    expect(normalizeNationalId('1234567')).not.toBe(
      normalizeNationalId('1234568'),
    );
  });
});

/**
 * El índice único del modelo (v4.2.71) fija la expresión y los cuatro
 * predicados: una consulta de duplicado solo lo usa si los repite igual. Estas
 * pruebas leen el DDL que la API trae del modelo (`database/SQL`) y comparan
 * carácter por carácter.
 */
describe('índice único del documento normalizado (N3)', () => {
  const ddl = readFileSync(
    join(process.cwd(), 'database', 'SQL', '02_common', '04_indexes.sql'),
    'utf8',
  );
  const statement = ddl
    .split('\n')
    .find((line) => line.includes(`"${NATIONAL_ID_UNIQUE_INDEX}"`));

  it('el DDL del modelo declara el índice', () => {
    expect(statement).toBeDefined();
  });

  it('la expresión SQL es idéntica a la del índice', () => {
    expect(statement).toContain(`(${normalizedNationalIdSql('value')})`);
  });

  it('los tres ids de los predicados son los del modelo (y siguen siendo los de CONCEPTS)', () => {
    expect(CONCEPTS.ID_TYPE_NATIONAL).toBe(
      '595e7a3d-ba37-5014-9a72-635363b94864',
    );
    expect(CONCEPTS.STATE_ACTIVE).toBe('38a1d301-f40d-5b17-a695-5e6d605f8b19');
    expect(CONCEPTS.OWNER_PATIENT).toBe('350a0150-c27c-5241-b5d8-78daa13bed34');
    expect(statement).toContain(
      `type_concept_id = '${CONCEPTS.ID_TYPE_NATIONAL}'`,
    );
    expect(statement).toContain(
      `state_concept_id = '${CONCEPTS.STATE_ACTIVE}'`,
    );
    expect(statement).toContain(
      `owner_type_concept_id = '${CONCEPTS.OWNER_PATIENT}'`,
    );
    expect(statement).toMatch(/valid_to IS NULL;$/);
  });

  it('los cuatro predicados de una consulta de duplicado son los del índice, con alias', () => {
    const predicate = nationalIdIndexPredicateSql('i');
    expect(predicate).toContain(
      `i.type_concept_id = '${CONCEPTS.ID_TYPE_NATIONAL}'`,
    );
    expect(predicate).toContain(
      `i.state_concept_id = '${CONCEPTS.STATE_ACTIVE}'`,
    );
    expect(predicate).toContain(
      `i.owner_type_concept_id = '${CONCEPTS.OWNER_PATIENT}'`,
    );
    expect(predicate).toContain('i.valid_to is null');
    // Sin marcadores: con un plan genérico `$n` no prueba el predicado.
    expect(predicate).not.toContain('?');
  });

  it('reconoce el 23505 del índice, también envuelto, y ningún otro', () => {
    const base = { code: '23505', constraint: NATIONAL_ID_UNIQUE_INDEX };
    expect(isNationalIdUniqueViolation(base)).toBe(true);
    expect(
      isNationalIdUniqueViolation(
        Object.assign(new Error('x'), { cause: base }),
      ),
    ).toBe(true);
    expect(
      isNationalIdUniqueViolation({ code: '23505', constraint: 'uq_otro' }),
    ).toBe(false);
    expect(
      isNationalIdUniqueViolation({
        code: '23503',
        constraint: NATIONAL_ID_UNIQUE_INDEX,
      }),
    ).toBe(false);
    expect(isNationalIdUniqueViolation(undefined)).toBe(false);
    expect(isNationalIdUniqueViolation(new Error('boom'))).toBe(false);
  });
});
