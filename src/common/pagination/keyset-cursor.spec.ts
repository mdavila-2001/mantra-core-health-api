import { describe, it, expect } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { decodeKeysetCursor, encodeKeysetCursor } from './keyset-cursor';

describe('keyset-cursor', () => {
  it('decodifica lo que codifica', () => {
    const key = { ordinal: 7, conceptId: 'c-1' };

    expect(decodeKeysetCursor(encodeKeysetCursor(key))).toEqual(key);
  });

  it('conserva el null, que es un valor de ordenación y no una ausencia', () => {
    const key = { ordinal: null, conceptId: 'c-1' };

    expect(decodeKeysetCursor(encodeKeysetCursor(key))).toEqual(key);
  });

  it('viaja por la URL sin escaparse: base64url no trae +, / ni =', () => {
    const cursor = encodeKeysetCursor({
      conceptId: '~~~???>>>???~~~',
      ordinal: 65_535,
    });

    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rechaza un cursor que no es base64 de JSON', () => {
    expect(() => decodeKeysetCursor('no-es-un-cursor')).toThrow(
      BadRequestException,
    );
  });

  it('rechaza un cursor que decodifica a algo que no es objeto', () => {
    const array = Buffer.from(JSON.stringify([1, 2]), 'utf8').toString(
      'base64url',
    );

    expect(() => decodeKeysetCursor(array)).toThrow(BadRequestException);
  });

  it('rechaza valores no escalares: no hay comparación SQL para un objeto', () => {
    const anidado = Buffer.from(
      JSON.stringify({ ordinal: { $gt: 1 } }),
      'utf8',
    ).toString('base64url');

    expect(() => decodeKeysetCursor(anidado)).toThrow(BadRequestException);
  });
});
