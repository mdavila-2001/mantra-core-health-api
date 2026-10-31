import { DEFAULT_FIT_CHECKS } from './checks';
import { FitCheckRegistry } from './fit-check.registry';
import { toResult } from './fit-evaluator';
import { SCAN_STALE_AFTER_MS } from './fit.constants';
import {
  NOW,
  baseInputs,
  liveObject,
  operation,
  route,
  staticTable,
} from './fit.fixtures';
import {
  available,
  unavailable,
  type FitCheckResult,
  type FitInputs,
} from './fit.types';

function run(id: string, inputs: FitInputs): FitCheckResult {
  const check = DEFAULT_FIT_CHECKS.find((c) => c.id === id);
  if (!check) throw new Error(`No existe ${id}`);
  return toResult(check, inputs);
}

const subjects = (r: FitCheckResult): string[] =>
  r.findings.map((f) => f.subject);

describe('registro de comprobaciones', () => {
  it('los ids son únicos, estables en forma y cubren las seis dimensiones', () => {
    const ids = DEFAULT_FIT_CHECKS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^FIT-[A-Z]{3}-\d{3}$/);
    expect(new Set(DEFAULT_FIT_CHECKS.map((c) => c.dimension))).toEqual(
      new Set([
        'ROUTES',
        'MODEL',
        'COMPLETENESS',
        'FRESHNESS',
        'MUTABILITY',
        'SENSITIVITY',
      ]),
    );
    for (const c of DEFAULT_FIT_CHECKS) {
      expect(c.remediation.length).toBeGreaterThan(20);
      expect(c.title.length).toBeGreaterThan(10);
    }
  });

  it('registrar un id repetido o mal formado falla al arrancar, no se pisa en silencio', () => {
    const registro = new FitCheckRegistry();
    const existente = DEFAULT_FIT_CHECKS[0];
    expect(() => registro.register(existente)).toThrow(/ya está registrada/);
    expect(() => registro.register({ ...existente, id: 'mala' })).toThrow(
      /inválido/,
    );
    registro.register({ ...existente, id: 'FIT-EXT-001' });
    expect(registro.all()).toHaveLength(DEFAULT_FIT_CHECKS.length + 1);
  });
});

describe('FIT-RUT — rutas del código contra el inventario', () => {
  it('correcto: `{id}` del inventario y `:id` del código son la misma ruta', () => {
    expect(run('FIT-RUT-001', baseInputs()).status).toBe('OK');
    expect(run('FIT-RUT-002', baseInputs()).status).toBe('OK');
    expect(run('FIT-RUT-003', baseInputs()).status).toBe('OK');
    expect(run('FIT-RUT-004', baseInputs()).status).toBe('OK');
  });

  it('una ruta del código que el inventario no tiene es un hallazgo con su controlador', () => {
    const r = run(
      'FIT-RUT-001',
      baseInputs({
        routes: available([
          route('GET', '/things'),
          route('POST', '/things/:id/do'),
          route('DELETE', '/things/:id', 'ThingsController', 'remove'),
        ]),
      }),
    );
    expect(r.status).toBe('FALLA');
    expect(r.severity).toBe('ALTA');
    expect([r.covered, r.denominator]).toEqual([2, 3]);
    expect(subjects(r)).toEqual(['DELETE /things/:p']);
    expect(r.findings[0].detail).toContain('ThingsController.remove');
  });

  it('una operación sin ruta (huérfana) es un hallazgo; el nombre del parámetro no importa', () => {
    const r = run(
      'FIT-RUT-002',
      baseInputs({
        routes: available([
          route('GET', '/things'),
          route('POST', '/things/:thingId/do'),
        ]),
        operations: available([
          operation('GET', '/things'),
          operation('POST', '/things/{id}/do'),
          operation('GET', '/gone'),
        ]),
      }),
    );
    expect([r.covered, r.denominator]).toEqual([2, 3]);
    expect(subjects(r)).toEqual(['GET /gone']);
  });

  it('límite: rutas `ALL` y un verbo desconocido no cuentan como rutas', () => {
    const inputs = baseInputs({
      routes: available([
        route('GET', '/things'),
        route('POST', '/things/:id/do'),
        route('ALL', '/wild'),
      ]),
      operations: available([
        operation('GET', '/things'),
        operation('POST', '/things/{id}/do'),
        operation('DESCONOCIDO', '/', {
          origin: 'CONTRATO_AUSENTE',
          id: 'C_helper',
        }),
      ]),
    });
    expect(run('FIT-RUT-001', inputs).status).toBe('OK');
    expect(run('FIT-RUT-002', inputs).status).toBe('OK');
    const r = run('FIT-RUT-003', inputs);
    expect(r.status).toBe('FALLA');
    expect(subjects(r)).toEqual(['C_helper']);
  });

  it('una ruta del código que el inventario conoce SIN contrato OpenAPI cuenta como conocida, y FIT-RUT-004 la señala', () => {
    const inputs = baseInputs({
      routes: available([
        route('GET', '/things'),
        route('POST', '/things/:id/do'),
        route('GET', '/draft'),
      ]),
      operations: available([
        operation('GET', '/things'),
        operation('POST', '/things/{id}/do'),
        operation('GET', '/draft', {
          origin: 'CONTRATO_AUSENTE',
          id: 'C_draft',
        }),
      ]),
    });
    expect(run('FIT-RUT-001', inputs).status).toBe('OK');
    expect(run('FIT-RUT-002', inputs).status).toBe('OK');
    expect(run('FIT-RUT-003', inputs).status).toBe('OK');
    const r = run('FIT-RUT-004', inputs);
    expect(r.status).toBe('FALLA');
    expect([r.covered, r.denominator]).toEqual([2, 3]);
    expect(subjects(r)).toEqual(['GET /draft']);
    expect(run('FIT-RUT-004', baseInputs()).status).toBe('OK');
    expect(
      run('FIT-RUT-004', baseInputs({ operations: unavailable('x') })).status,
    ).toBe('SIN_DATO');
  });

  it('límite: una barra final y mayúsculas del verbo no crean una ruta nueva', () => {
    const inputs = baseInputs({
      routes: available([
        route('get', '/things/'),
        route('POST', '/things/:id/do'),
      ]),
    });
    expect(run('FIT-RUT-001', inputs).status).toBe('OK');
  });

  it('inválido: sin las rutas del código la comprobación queda SIN_DATO, no OK ni 0', () => {
    const r = run(
      'FIT-RUT-001',
      baseInputs({ routes: unavailable('falló la lectura (Error)') }),
    );
    expect(r.status).toBe('SIN_DATO');
    expect(r.covered).toBeNull();
    expect(r.denominator).toBeNull();
    expect(r.reason).toContain('rutas del código');
  });
});

describe('FIT-MOD — modelo, catálogo vivo y deriva', () => {
  it('correcto: todo coincide', () => {
    for (const id of [
      'FIT-MOD-001',
      'FIT-MOD-002',
      'FIT-MOD-003',
      'FIT-MOD-004',
      'FIT-MOD-005',
      'FIT-MOD-006',
    ])
      expect(run(id, baseInputs()).status).toBe('OK');
  });

  it('tabla del modelo no observada y tabla observada que el modelo no declara', () => {
    const inputs = baseInputs({
      staticTables: available([
        staticTable('app', 'things'),
        staticTable('app', 'lost'),
      ]),
      liveObjects: available([
        liveObject('app', 'things'),
        liveObject('app', 'extra'),
      ]),
    });
    expect(subjects(run('FIT-MOD-001', inputs))).toEqual(['app.lost']);
    expect(subjects(run('FIT-MOD-002', inputs))).toEqual(['app.extra']);
  });

  it('las vistas observadas no se comparan contra el modelo de tablas', () => {
    const inputs = baseInputs({
      liveObjects: available([
        liveObject('app', 'things'),
        liveObject('app', 'v_things', ['id'], { kind: 'VIEW' }),
      ]),
    });
    expect(run('FIT-MOD-002', inputs).status).toBe('OK');
  });

  it('columnas: sólo se comparan en las tablas que existen en las dos fuentes (sin contar dos veces)', () => {
    const inputs = baseInputs({
      staticTables: available([
        staticTable('app', 'things', ['id', 'name', 'removed']),
        staticTable('app', 'lost', ['id']),
      ]),
      liveObjects: available([
        liveObject('app', 'things', ['id', 'name', 'added']),
      ]),
    });
    const faltaEnVivo = run('FIT-MOD-003', inputs);
    expect(subjects(faltaEnVivo)).toEqual(['app.things.removed']);
    expect([faltaEnVivo.covered, faltaEnVivo.denominator]).toEqual([2, 3]);
    const faltaEnModelo = run('FIT-MOD-004', inputs);
    expect(subjects(faltaEnModelo)).toEqual(['app.things.added']);
    expect(faltaEnModelo.severity).toBe('MEDIA');
  });

  it('deriva modelo/ORM: cada categoría con deriva es un hallazgo con su conteo y muestra', () => {
    const r = run(
      'FIT-MOD-005',
      baseInputs({
        ormDrift: available({
          counts: {
            entidadesSinTabla: 53,
            tablasSinEntidad: 0,
            columnasAusentesEnOrm: 1,
            columnasDeMasEnOrm: 89,
            nulabilidad: 26,
            tipos: 0,
          },
          samples: { entidadesSinTabla: ['a.b', 'c.d'] },
        }),
      }),
    );
    expect(r.status).toBe('FALLA');
    expect([r.covered, r.denominator]).toEqual([2, 6]);
    expect(r.evidence).toMatchObject({
      entidadesSinTabla: 53,
      columnasDeMasEnOrm: 89,
    });
    expect(
      r.findings.find((f) => f.subject === 'entidadesSinTabla')?.detail,
    ).toContain('53 elemento(s) (a.b, c.d)');
  });

  it('límite: una categoría que la fuente no trae no se cuenta (ni como cumplida ni como fallada)', () => {
    const r = run(
      'FIT-MOD-006',
      baseInputs({
        deployedDbDrift: available({
          counts: { tablasAusentes: 0, columnasAusentes: 0 },
          samples: {},
        }),
      }),
    );
    expect([r.covered, r.denominator]).toEqual([2, 2]);
  });

  it('inválido: sin catálogo vivo, las comprobaciones que lo usan quedan SIN_DATO', () => {
    const inputs = baseInputs({
      liveObjects: unavailable('falló la lectura (Error)'),
    });
    for (const id of [
      'FIT-MOD-001',
      'FIT-MOD-002',
      'FIT-MOD-003',
      'FIT-MOD-004',
    ])
      expect(run(id, inputs).status).toBe('SIN_DATO');
    expect(run('FIT-MOD-005', inputs).status).toBe('OK');
  });
});

describe('FIT-COM — completitud de operaciones y tablas', () => {
  it('correcto', () => {
    for (const id of [
      'FIT-COM-001',
      'FIT-COM-002',
      'FIT-COM-003',
      'FIT-COM-004',
      'FIT-COM-005',
      'FIT-COM-006',
    ])
      expect(run(id, baseInputs()).status).toBe('OK');
  });

  it('operación sin tablas: falla salvo que declare por qué no toca ninguna', () => {
    const inputs = baseInputs({
      operations: available([
        operation('GET', '/a', { tables: 0 }),
        operation('GET', '/b', { tables: 0, noTablesDeclared: true }),
        operation('GET', '/c'),
      ]),
    });
    const r = run('FIT-COM-001', inputs);
    expect(subjects(r)).toEqual(['GET /a']);
    expect(r.severity).toBe('ALTA');
  });

  it('DTO de entrada: sólo se exige a las operaciones con cuerpo', () => {
    const inputs = baseInputs({
      operations: available([
        operation('GET', '/a'),
        operation('POST', '/b', { hasBody: true, bodyDto: null }),
        operation('POST', '/c', { hasBody: true, bodyDto: 'CDto' }),
      ]),
    });
    const r = run('FIT-COM-002', inputs);
    expect([r.covered, r.denominator]).toEqual([1, 2]);
    expect(subjects(r)).toEqual(['POST /b']);
  });

  it('límite: DTO de salida no se exige a las respuestas 204', () => {
    const inputs = baseInputs({
      operations: available([
        operation('DELETE', '/a', {
          responseDto: null,
          httpCode: 'HttpStatus.NO_CONTENT',
        }),
        operation('DELETE', '/b', { responseDto: null, httpCode: '204' }),
        operation('GET', '/c', { responseDto: null }),
      ]),
    });
    const r = run('FIT-COM-003', inputs);
    expect([r.covered, r.denominator]).toEqual([0, 1]);
    expect(subjects(r)).toEqual(['GET /c']);
  });

  it('roles: las públicas no los necesitan; una no pública sin roles es un hallazgo', () => {
    const inputs = baseInputs({
      operations: available([
        operation('GET', '/pub', { isPublic: true, roles: [] }),
        operation('GET', '/sesion', { roles: [] }),
        operation('GET', '/rol'),
      ]),
    });
    expect(subjects(run('FIT-COM-004', inputs))).toEqual(['GET /sesion']);
  });

  it('descripción de sistema: vale la del modelo o el comentario de la base', () => {
    const inputs = baseInputs({
      staticTables: available([
        staticTable('app', 'a', ['id'], null),
        staticTable('app', 'b', ['id'], '  '),
        staticTable('app', 'c', ['id'], 'Describe c.'),
      ]),
      liveObjects: available([
        liveObject('app', 'a', ['id'], {
          tableComment: 'Comentario en la base',
        }),
        liveObject('app', 'b'),
      ]),
    });
    expect(subjects(run('FIT-COM-005', inputs))).toEqual(['app.b']);
  });

  it('descripción de sistema: con una sola fuente disponible se mide con esa y lo dice', () => {
    const r = run('FIT-COM-005', baseInputs({ liveObjects: unavailable('x') }));
    expect(r.status).toBe('OK');
    expect(r.evidence).toMatchObject({
      liveSourceAvailable: false,
      staticSourceAvailable: true,
    });
    expect(
      run(
        'FIT-COM-005',
        baseInputs({
          liveObjects: unavailable('x'),
          staticTables: unavailable('y'),
        }),
      ).status,
    ).toBe('SIN_DATO');
  });

  it('ficha curada: sin ficha, o con ficha sin propósito ni definición, no cuenta', () => {
    const inputs = baseInputs({
      liveObjects: available([
        liveObject('app', 'sin_ficha', ['id'], { card: null }),
        liveObject('app', 'ficha_vacia', ['id'], {
          card: {
            purpose: ' ',
            definition: null,
            sensitivity: 'UNKNOWN',
            reviewStatus: 'AUTO_DETECTED',
          },
        }),
        liveObject('app', 'con_definicion', ['id'], {
          card: {
            purpose: null,
            definition: 'Define algo',
            sensitivity: 'UNKNOWN',
            reviewStatus: 'DRAFT',
          },
        }),
      ]),
    });
    const r = run('FIT-COM-006', inputs);
    expect(subjects(r)).toEqual(['app.sin_ficha', 'app.ficha_vacia']);
    expect(r.findings[0].detail).toBe('Sin ficha curada');
  });
});

describe('FIT-FRE — frescura y huellas', () => {
  const minutos = (n: number) => new Date(NOW.getTime() - n * 60_000);

  it('escaneo fresco: dentro del umbral explícito', () => {
    const r = run('FIT-FRE-001', baseInputs());
    expect(r.status).toBe('OK');
    expect(r.evidence).toMatchObject({
      thresholdMs: SCAN_STALE_AFTER_MS,
      lastStatus: 'SUCCEEDED',
    });
  });

  it('límite: justo en el umbral cumple y un instante después vence', () => {
    const enUmbral = baseInputs({
      scan: available({
        lastSucceededAt: new Date(NOW.getTime() - SCAN_STALE_AFTER_MS),
        lastFinishedAt: null,
        lastStatus: 'SUCCEEDED',
      }),
    });
    expect(run('FIT-FRE-001', enUmbral).status).toBe('OK');
    const pasado = baseInputs({
      scan: available({
        lastSucceededAt: new Date(NOW.getTime() - SCAN_STALE_AFTER_MS - 1),
        lastFinishedAt: null,
        lastStatus: 'SUCCEEDED',
      }),
    });
    const r = run('FIT-FRE-001', pasado);
    expect(r.status).toBe('FALLA');
    expect(r.findings[0].detail).toContain('umbral');
  });

  it('nunca hubo un escaneo exitoso: falla (no es «sin dato»: un catálogo sin observar no está fresco)', () => {
    const r = run(
      'FIT-FRE-001',
      baseInputs({
        scan: available({
          lastSucceededAt: null,
          lastFinishedAt: null,
          lastStatus: null,
        }),
      }),
    );
    expect(r.status).toBe('FALLA');
    expect(r.findings[0].detail).toContain('Nunca');
  });

  it('el escaneo más reciente falló aunque el anterior sea reciente', () => {
    const r = run(
      'FIT-FRE-001',
      baseInputs({
        scan: available({
          lastSucceededAt: minutos(20),
          lastFinishedAt: minutos(5),
          lastStatus: 'FAILED',
        }),
      }),
    );
    expect(r.status).toBe('FALLA');
    expect(r.findings[0].detail).toContain('falló');
  });

  it('inválido: sin poder leer los escaneos queda SIN_DATO', () => {
    expect(
      run('FIT-FRE-001', baseInputs({ scan: unavailable('x') })).status,
    ).toBe('SIN_DATO');
  });

  it('la importación corresponde al código cuando las huellas coinciden, sea cual sea el orden', () => {
    const inputs = baseInputs({
      importedOperations: available([
        {
          key: 'b',
          method: 'post',
          route: '/things/{id}/do',
          origin: 'CONTRATO',
        },
        { key: 'a', method: 'GET', route: '/things', origin: 'CONTRATO' },
      ]),
    });
    const r = run('FIT-FRE-002', inputs);
    expect(r.status).toBe('OK');
    expect(r.evidence.codeFingerprint).toBe(r.evidence.comparedFingerprint);
    expect(r.evidence.deployedCommit).toBe('abc1234');
  });

  it('una importación vieja (le falta una ruta del código y sobra una) difiere y lo dice', () => {
    const r = run(
      'FIT-FRE-002',
      baseInputs({
        importedOperations: available([
          { key: 'a', method: 'GET', route: '/things', origin: 'CONTRATO' },
          { key: 'z', method: 'GET', route: '/old', origin: 'CONTRATO' },
        ]),
      }),
    );
    expect(r.status).toBe('FALLA');
    expect(r.evidence.codeFingerprint).not.toBe(r.evidence.comparedFingerprint);
    expect(r.evidence).toMatchObject({ onlyInCode: 1, onlyInCompared: 1 });
    expect(subjects(r)).toEqual(
      expect.arrayContaining(['huella', 'POST /things/:p/do', 'GET /old']),
    );
  });

  it('inventario sin importar (vacío) no coincide con un código que tiene rutas', () => {
    expect(
      run('FIT-FRE-002', baseInputs({ importedOperations: available([]) }))
        .status,
    ).toBe('FALLA');
  });

  it('el inventario generado contra el código: coincide / difiere / sin dato', () => {
    expect(run('FIT-FRE-003', baseInputs()).status).toBe('OK');
    expect(
      run(
        'FIT-FRE-003',
        baseInputs({ operations: available([operation('GET', '/things')]) }),
      ).status,
    ).toBe('FALLA');
    expect(
      run('FIT-FRE-003', baseInputs({ operations: unavailable('x') })).status,
    ).toBe('SIN_DATO');
  });
});

describe('FIT-MUT — mutabilidad (punto de extensión)', () => {
  it('hoy: sin fuente registrada informa NO_DECLARADO, con puntaje nulo y sin fallar', () => {
    const r = run('FIT-MUT-001', baseInputs());
    expect(r.status).toBe('NO_DECLARADO');
    expect(r.covered).toBeNull();
    expect(r.denominator).toBeNull();
    expect(r.reason).toContain('FIT_MUTABILITY_SOURCE');
  });

  it('con una fuente registrada mide: declaradas con clase válida / sin declarar / fuera de la taxonomía', () => {
    const inputs = baseInputs({
      liveObjects: available([
        liveObject('app', 'a'),
        liveObject('app', 'b'),
        liveObject('app', 'c'),
      ]),
      mutability: available(
        new Map([
          ['app.a', 'APPEND_ONLY'],
          ['app.b', 'CLASE_INVENTADA'],
        ]),
      ),
    });
    const r = run('FIT-MUT-001', inputs);
    expect(r.status).toBe('FALLA');
    expect([r.covered, r.denominator]).toEqual([1, 3]);
    expect(r.findings.map((f) => f.detail)).toEqual([
      expect.stringContaining('fuera de la taxonomía'),
      'Sin clasificación de mutabilidad declarada',
    ]);
  });

  it('inválido: si la fuente registrada falla queda SIN_DATO, no NO_DECLARADO', () => {
    expect(
      run(
        'FIT-MUT-001',
        baseInputs({ mutability: unavailable('falló la lectura') }),
      ).status,
    ).toBe('SIN_DATO');
  });
});

describe('FIT-SEN — PII y sensibilidad sin clasificar', () => {
  const columna = (
    name: string,
    sensitivity: string | null,
    nativeType = 'text',
  ) => ({ name, nativeType, sensitivity });

  it('correcto: todo clasificado; sin columnas que parezcan datos personales no hay candidatas (NO_APLICA, no un 100 %)', () => {
    expect(run('FIT-SEN-001', baseInputs()).status).toBe('OK');
    expect(run('FIT-SEN-002', baseInputs()).status).toBe('OK');
    const candidatas = run('FIT-SEN-003', baseInputs());
    expect(candidatas.status).toBe('NO_APLICA');
    expect(candidatas.covered).toBeNull();
  });

  it('correcto: una columna personal bien clasificada cumple', () => {
    const obj = liveObject('iam', 'users');
    const r = run(
      'FIT-SEN-003',
      baseInputs({
        liveObjects: available([
          { ...obj, columns: [columna('email', 'PHI_IDENTIFIER')] },
        ]),
      }),
    );
    expect(r.status).toBe('OK');
    expect([r.covered, r.denominator]).toEqual([1, 1]);
  });

  it('tablas sin ficha o con UNKNOWN no están clasificadas', () => {
    const inputs = baseInputs({
      liveObjects: available([
        liveObject('app', 'ok'),
        liveObject('app', 'sin', ['id'], { card: null }),
        liveObject('app', 'unk', ['id'], {
          card: {
            purpose: 'x',
            definition: null,
            sensitivity: 'UNKNOWN',
            reviewStatus: 'DRAFT',
          },
        }),
      ]),
    });
    expect(subjects(run('FIT-SEN-001', inputs))).toEqual([
      'app.sin',
      'app.unk',
    ]);
  });

  it('columnas: sin ficha (null) y UNKNOWN fallan; el denominador son TODAS las columnas observadas', () => {
    const obj = liveObject('app', 't');
    const inputs = baseInputs({
      liveObjects: available([
        {
          ...obj,
          columns: [
            columna('a', 'INTERNAL'),
            columna('b', null),
            columna('c', 'UNKNOWN'),
          ],
        },
      ]),
    });
    const r = run('FIT-SEN-002', inputs);
    expect([r.covered, r.denominator]).toEqual([1, 3]);
    expect(subjects(r)).toEqual(['app.t.b', 'app.t.c']);
  });

  it('una columna que parece dato personal y está sin clasificar es ALTA', () => {
    const obj = liveObject('iam', 'users');
    const inputs = baseInputs({
      liveObjects: available([
        {
          ...obj,
          columns: [
            columna('email', null),
            columna('document_number', 'UNKNOWN'),
            columna('id', null, 'uuid'),
          ],
        },
      ]),
    });
    const r = run('FIT-SEN-003', inputs);
    expect(r.severity).toBe('ALTA');
    expect(r.status).toBe('FALLA');
    expect(subjects(r)).toEqual(expect.arrayContaining(['iam.users.email']));
    expect(subjects(r)).not.toContain('iam.users.id');
  });

  it('límite: clasificada por debajo de lo detectado falla; en el nivel detectado o por encima cumple', () => {
    const obj = liveObject('iam', 'users');
    const por = (nivel: string) =>
      run(
        'FIT-SEN-003',
        baseInputs({
          liveObjects: available([
            { ...obj, columns: [columna('password_hash', nivel)] },
          ]),
        }),
      );
    expect(por('PUBLIC').status).toBe('FALLA');
    expect(por('CREDENTIAL').status).toBe('OK');
  });

  it('inválido: sin el catálogo vivo, SIN_DATO en las tres', () => {
    const inputs = baseInputs({ liveObjects: unavailable('x') });
    for (const id of ['FIT-SEN-001', 'FIT-SEN-002', 'FIT-SEN-003'])
      expect(run(id, inputs).status).toBe('SIN_DATO');
  });
});
