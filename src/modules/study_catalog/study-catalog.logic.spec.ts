import { describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import {
  LEGACY_FAMILY_BY_KEY,
  MAX_QUERY_LENGTH,
  decodeCatalogCursor,
  encodeCatalogCursor,
  parseFamily,
  parseSearchTokens,
} from './study-catalog.logic';

describe('study-catalog.logic', () => {
  it('parseFamily: ausente = todas; admite minúsculas; rechaza lo desconocido', () => {
    expect(parseFamily(undefined)).toBeUndefined();
    expect(parseFamily('')).toBeUndefined();
    expect(parseFamily('imaging')).toBe('IMAGING');
    expect(() => parseFamily('RADIOLOGIA')).toThrow(BadRequestException);
  });

  it('parseSearchTokens: sin tildes ni mayúsculas, por palabras, con tope', () => {
    expect(parseSearchTokens(undefined)).toEqual([]);
    expect(parseSearchTokens('  Hemoglobina   GLICOSILADA ')).toEqual([
      'hemoglobina',
      'glicosilada',
    ]);
    expect(parseSearchTokens('Biometría hemática')).toEqual([
      'biometria',
      'hematica',
    ]);
    expect(parseSearchTokens('a b c d e f g h')).toHaveLength(6);
    expect(() => parseSearchTokens('x'.repeat(MAX_QUERY_LENGTH + 1))).toThrow(
      BadRequestException,
    );
  });

  it('el cursor ida y vuelta, y uno corrupto es 400', () => {
    const c = {
      key: 'hemograma completo',
      id: '11111111-1111-1111-1111-111111111111',
    };
    expect(decodeCatalogCursor(encodeCatalogCursor(c))).toEqual(c);
    expect(() => decodeCatalogCursor('no-es-un-cursor')).toThrow(
      BadRequestException,
    );
    const sinId = Buffer.from(JSON.stringify({ k: 'a' })).toString('base64url');
    expect(() => decodeCatalogCursor(sinId)).toThrow(BadRequestException);
  });

  it('las 88 claves locales tienen familia', () => {
    const values = Object.values(LEGACY_FAMILY_BY_KEY);
    expect(values).toHaveLength(88);
    expect(values.filter((f) => f === 'LAB')).toHaveLength(47);
    expect(values.filter((f) => f === 'IMAGING')).toHaveLength(27);
    expect(values.filter((f) => f === 'CARDIO')).toHaveLength(5);
    expect(values.filter((f) => f === 'PATHOLOGY')).toHaveLength(3);
    expect(values.filter((f) => f === 'PROCEDURE')).toHaveLength(6);
  });
});
