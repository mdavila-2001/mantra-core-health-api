import {
  clientErrorFingerprint,
  safeApiRouteOrNull,
  safeRouteOrNull,
  safeToken,
  sanitizeClientMessage,
  sanitizeErrorType,
} from './client-error-sanitizer';

describe('sanitizeClientMessage (sin PII, sin stack)', () => {
  it('quita correos, tokens, uuid y corridas largas de dígitos', () => {
    const out = sanitizeClientMessage(
      'Falló para maria@clinica.bo con Bearer abc.def.ghi id 8f14e45f-ceea-4672-9f5f-1d2c3b4a5e6f ci 12345678',
    )!;
    expect(out).not.toMatch(/maria|@|abc\.def|8f14e45f|12345678/);
    expect(out).toContain('[correo]');
    expect(out).toContain(':uuid');
    expect(out).toContain(':n');
  });
  it('quita un JWT completo y la query string de una URL', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.firma_larga_aqui';
    const out = sanitizeClientMessage(
      `GET /pacientes?nombre=Ana&token=${jwt} falló`,
    )!;
    expect(out).not.toMatch(/eyJ|nombre=Ana|token=/);
  });
  it('se queda con la primera línea (sin stack) y topa a 500', () => {
    const out = sanitizeClientMessage(
      `TypeError: x\n    at foo (a.js:1:1)\n    at bar`,
    )!;
    expect(out).toBe('TypeError: x');
    expect(
      sanitizeClientMessage('zx '.repeat(400))!.length,
    ).toBeLessThanOrEqual(500);
  });
  it('vacío o nulo → null', () => {
    expect(sanitizeClientMessage(undefined)).toBeNull();
    expect(sanitizeClientMessage('   ')).toBeNull();
  });
});

describe('rutas e identificadores', () => {
  it('la ruta pasa por la lista cerrada de la ruta anónima', () => {
    expect(safeRouteOrNull('/agenda/:citaId')).toBe('/agenda/:citaId');
    expect(safeRouteOrNull('/pacientes/maria-gonzalez-1234')).toBeNull();
    expect(safeRouteOrNull('/p/12345678')).toBeNull();
    expect(safeRouteOrNull('/x/a@b.co')).toBeNull();
    expect(safeRouteOrNull(undefined)).toBeNull();
  });
  it('la ruta de API pierde la query y rechaza ids largos o caracteres raros', () => {
    expect(safeApiRouteOrNull('/admin/analytics/errors?x=1')).toBe(
      '/admin/analytics/errors',
    );
    expect(safeApiRouteOrNull('/pacientes/12345')).toBeNull();
    expect(safeApiRouteOrNull('sin-barra')).toBeNull();
    expect(safeApiRouteOrNull("/a'b")).toBeNull();
  });
  it('safeToken exige caracteres seguros y largo', () => {
    expect(safeToken('req-123_ab.c:d', 80)).toBe('req-123_ab.c:d');
    expect(safeToken('con espacio', 80)).toBeNull();
    expect(safeToken('x'.repeat(81), 80)).toBeNull();
  });
  it('sanitizeErrorType deja sólo un identificador', () => {
    expect(sanitizeErrorType('Type Error<script>')).toBe('TypeErrorscript');
    expect(sanitizeErrorType('<>')).toBe('Error');
  });
});

describe('clientErrorFingerprint', () => {
  const base = {
    errorClass: 'JS',
    errorType: 'TypeError',
    message: 'x',
    route: '/a',
  };
  it('es estable y de 16 hex', () => {
    expect(clientErrorFingerprint(base)).toBe(
      clientErrorFingerprint({ ...base }),
    );
    expect(clientErrorFingerprint(base)).toMatch(/^[0-9a-f]{16}$/);
  });
  it('cambia con clase, tipo, mensaje o ruta', () => {
    const fp = clientErrorFingerprint(base);
    for (const over of [
      { errorClass: 'HTTP' },
      { errorType: 'RangeError' },
      { message: 'y' },
      { route: '/b' },
    ]) {
      expect(clientErrorFingerprint({ ...base, ...over })).not.toBe(fp);
    }
  });
});
