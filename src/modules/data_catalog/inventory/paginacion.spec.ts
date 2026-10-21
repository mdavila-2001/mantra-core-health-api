import { BadRequestException } from '@nestjs/common';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import { coincide, normalizar, paginar } from './paginacion';

describe('normalizar y coincide', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(normalizar('  Catálogo De DATOS ')).toBe('catalogo de datos');
    expect(coincide('CATALOGO', 'Catálogo de datos')).toBe(true);
  });

  it('una búsqueda vacía no filtra y un campo nulo no rompe', () => {
    expect(coincide(undefined, 'x')).toBe(true);
    expect(coincide('   ', null)).toBe(true);
    expect(coincide('zzz', null, undefined, 'abc')).toBe(false);
  });
});

describe('paginar', () => {
  const filas = Array.from({ length: 25 }, (_, i) => ({
    k: `f${String(i).padStart(3, '0')}`,
  }));

  it('devuelve la primera página con su cursor y el total filtrado', () => {
    const p = paginar(filas, (f) => f.k, { limit: 10 });
    expect(p.items).toHaveLength(10);
    expect(p.total).toBe(25);
    expect(p.nextCursor).not.toBeNull();
  });

  it('recorre todas las filas sin repetir ni saltar ninguna', () => {
    const vistas: string[] = [];
    let cursor: string | undefined;
    do {
      const p = paginar(filas, (f) => f.k, { limit: 7, cursor });
      vistas.push(...p.items.map((f) => f.k));
      cursor = p.nextCursor ?? undefined;
    } while (cursor);
    expect(vistas).toEqual(filas.map((f) => f.k));
  });

  it('la última página no trae cursor', () => {
    const p = paginar(filas, (f) => f.k, { limit: 25 });
    expect(p.nextCursor).toBeNull();
  });

  it('el cursor sigue valiendo si aparecen filas nuevas antes de él (es por clave, no por posición)', () => {
    const primera = paginar(filas, (f) => f.k, { limit: 5 });
    const conNuevas = [{ k: 'f000a' }, ...filas].sort((a, b) =>
      a.k.localeCompare(b.k),
    );
    const segunda = paginar(conNuevas, (f) => f.k, {
      limit: 5,
      cursor: primera.nextCursor!,
    });
    expect(segunda.items[0].k).toBe('f005');
  });

  it('acota el límite a 1..200 y usa 50 por defecto', () => {
    const grande = Array.from({ length: 500 }, (_, i) => ({
      k: String(i).padStart(4, '0'),
    }));
    expect(paginar(grande, (f) => f.k, { limit: 9999 }).limit).toBe(200);
    expect(paginar(grande, (f) => f.k, { limit: 0 }).limit).toBe(1);
    expect(paginar(grande, (f) => f.k, {}).limit).toBe(50);
  });

  it('un cursor corrupto o con otra forma es un 400, no un 500', () => {
    expect(() =>
      paginar(filas, (f) => f.k, { cursor: '%%%no-es-base64' }),
    ).toThrow(BadRequestException);
    expect(() =>
      paginar(filas, (f) => f.k, {
        cursor: encodeKeysetCursor({ otra: 'cosa' }),
      }),
    ).toThrow(BadRequestException);
  });

  it('un cursor más allá de la última clave devuelve una página vacía', () => {
    const p = paginar(filas, (f) => f.k, {
      cursor: encodeKeysetCursor({ k: 'zzz' }),
    });
    expect(p.items).toEqual([]);
    expect(p.nextCursor).toBeNull();
  });
});
