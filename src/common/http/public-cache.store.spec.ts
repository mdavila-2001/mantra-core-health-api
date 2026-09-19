import { jest } from '@jest/globals';
import { PublicCacheStore } from './public-cache.store';

describe('PublicCacheStore', () => {
  it('devuelve undefined para una clave que nunca se guardó', () => {
    const store = new PublicCacheStore();
    expect(store.get('nunca-existió')).toBeUndefined();
  });

  it('devuelve lo guardado mientras no venza', () => {
    const store = new PublicCacheStore();
    const valor = {
      etag: 'W/"a"',
      body: { x: 1 },
      cacheControl: 'public, max-age=60',
    };

    store.set('clave', valor, 60_000);

    expect(store.get('clave')).toEqual(expect.objectContaining(valor));
    expect(store.size).toBe(1);
  });

  it('una entrada vencida no se sirve, y se borra al pedirla', () => {
    const store = new PublicCacheStore();
    const ahora = jest.spyOn(Date, 'now');
    ahora.mockReturnValue(1_000);
    store.set(
      'clave',
      { etag: 'W/"a"', body: {}, cacheControl: 'public' },
      1_000,
    );

    ahora.mockReturnValue(1_000 + 1_000 + 1); // un milisegundo después del vencimiento
    expect(store.get('clave')).toBeUndefined();
    expect(store.size).toBe(0); // limpiar en el propio get evita que crezca sin límite

    ahora.mockRestore();
  });

  it('clear() vacía todo, no sólo una clave', () => {
    const store = new PublicCacheStore();
    store.set('a', { etag: 'W/"a"', body: {}, cacheControl: 'public' }, 60_000);
    store.set('b', { etag: 'W/"b"', body: {}, cacheControl: 'public' }, 60_000);

    store.clear();

    expect(store.size).toBe(0);
    expect(store.get('a')).toBeUndefined();
    expect(store.get('b')).toBeUndefined();
  });

  it('bota la entrada más vieja cuando se llena, en vez de crecer sin límite', () => {
    const store = new PublicCacheStore();
    const TOPE = 500;
    for (let i = 0; i < TOPE; i += 1) {
      store.set(
        `clave-${i}`,
        { etag: `W/"${i}"`, body: {}, cacheControl: 'public' },
        60_000,
      );
    }
    expect(store.size).toBe(TOPE);

    store.set(
      'clave-nueva',
      { etag: 'W/"nueva"', body: {}, cacheControl: 'public' },
      60_000,
    );

    expect(store.size).toBe(TOPE); // no creció
    expect(store.get('clave-0')).toBeUndefined(); // la más vieja se fue
    expect(store.get('clave-nueva')).toBeDefined(); // la nueva entró
  });
});
