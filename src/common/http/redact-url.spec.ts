import {
  pathWithoutQuery,
  redactQueryObject,
  redactUrlQuery,
  REDACTED_QUERY_VALUE,
} from './redact-url';

describe('pathWithoutQuery', () => {
  it('correcto — corta la query y deja la ruta', () => {
    expect(
      pathWithoutQuery('/profiles/patients?q=Ana%20Quispe&nationalId=4455667'),
    ).toBe('/profiles/patients');
  });

  it('límite — sin query, con `?` final o sin URL', () => {
    expect(pathWithoutQuery('/iam/users')).toBe('/iam/users');
    expect(pathWithoutQuery('/iam/users?')).toBe('/iam/users');
    expect(pathWithoutQuery(undefined)).toBe('');
    expect(pathWithoutQuery('')).toBe('');
  });

  it('inválido — un segundo `?` dentro de un valor no reaparece', () => {
    expect(pathWithoutQuery('/p?q=a?b=c')).toBe('/p');
  });
});

describe('redactUrlQuery', () => {
  it('correcto — conserva los nombres y reemplaza todos los valores', () => {
    const url = redactUrlQuery(
      '/profiles/patients?q=Ana%20Quispe&nationalId=4455667&limit=5',
    );

    expect(url).toBe(
      `/profiles/patients?q=${REDACTED_QUERY_VALUE}&nationalId=${REDACTED_QUERY_VALUE}&limit=${REDACTED_QUERY_VALUE}`,
    );
    expect(url).not.toContain('Ana');
    expect(url).not.toContain('4455667');
  });

  it('límite — sin query queda igual; `?` vacío y `&&` no dejan basura', () => {
    expect(redactUrlQuery('/iam/users')).toBe('/iam/users');
    expect(redactUrlQuery('/iam/users?')).toBe('/iam/users');
    expect(redactUrlQuery('/iam/users?&q=ana&&')).toBe(
      `/iam/users?q=${REDACTED_QUERY_VALUE}`,
    );
    expect(redactUrlQuery(undefined)).toBeUndefined();
  });

  it('inválido — un parámetro sin `=` o con `=` en el valor no filtra nada', () => {
    expect(redactUrlQuery('/p?flag')).toBe('/p?flag');
    // El valor completo, `=` incluidos, se va: sólo sobrevive el nombre.
    expect(redactUrlQuery('/p?q=a=b=secreto')).toBe(
      `/p?q=${REDACTED_QUERY_VALUE}`,
    );
    // Un parámetro repetido se redacta cada vez.
    expect(redactUrlQuery('/p?q=uno&q=dos')).toBe(
      `/p?q=${REDACTED_QUERY_VALUE}&q=${REDACTED_QUERY_VALUE}`,
    );
  });
});

describe('redactQueryObject', () => {
  it('correcto — mismas claves, valores redactados', () => {
    expect(redactQueryObject({ q: 'Ana', nationalId: '4455667' })).toEqual({
      q: REDACTED_QUERY_VALUE,
      nationalId: REDACTED_QUERY_VALUE,
    });
  });

  it('límite — objeto vacío y valores anidados o repetidos', () => {
    expect(redactQueryObject({})).toEqual({});
    expect(
      redactQueryObject({ filtro: { nombre: 'Ana' }, q: ['uno', 'dos'] }),
    ).toEqual({ filtro: REDACTED_QUERY_VALUE, q: REDACTED_QUERY_VALUE });
  });

  it('inválido — lo que no es objeto pasa tal cual', () => {
    expect(redactQueryObject(undefined)).toBeUndefined();
    expect(redactQueryObject(null)).toBeNull();
    expect(redactQueryObject('')).toBe('');
  });
});
