import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import type {
  OperacionRecord,
  ProcesoRecord,
  TablaDeOperacion,
} from '../inventory/inventory.types';
import {
  NOT_OBSERVED,
  OBSERVED,
  planImport,
  type ImportPlan,
  type KnownInventory,
  type KnownOperation,
  type KnownProcess,
} from './import-plan';

/** Ids predecibles: `id-1`, `id-2`… en el orden en que el plan los pide. */
function contador(): () => string {
  let n = 0;
  return () => `id-${++n}`;
}

const tabla = (extra: Partial<TablaDeOperacion> = {}): TablaDeOperacion => ({
  schema: 'iam',
  tabla: 'users',
  catalogada: true,
  operacion: 'LEE',
  detalle: 'lee el usuario',
  confianza: 'DIRECTA',
  via: ['Svc.find'],
  fuente: 'src/a.ts:10',
  ...extra,
});

const operacion = (
  id: string,
  extra: Partial<OperacionRecord> = {},
): OperacionRecord =>
  ({
    id,
    origen: 'CONTRATO',
    metodo: 'GET',
    ruta: `/${id}`,
    modulo: 'iam',
    codigo: { controlador: 'C', handler: 'h', fuente: 'src/c.ts:1' },
    autenticacion: {
      publica: false,
      roles: ['ADMIN'],
      identidadVerificada: true,
    },
    riesgo: { nivel: 'BAJO', razones: [] },
    tablas: [tabla()],
    ...extra,
  }) as OperacionRecord;

const proceso = (
  codigo: string,
  etapas: { codigo: string; nombre: string; ops: string[] }[],
  extra: Partial<ProcesoRecord> = {},
): ProcesoRecord =>
  ({
    codigo,
    tipo: 'MODULO',
    nombre: `Proceso ${codigo}`,
    modulo: 'iam',
    paraQueSirve: { texto: 'sirve para algo', fuente: null },
    etapas: etapas.map((e) => ({
      codigo: e.codigo,
      nombre: e.nombre,
      fuente: null,
      operaciones: e.ops.map((operacionId) => ({ operacionId })),
    })),
    ...extra,
  }) as ProcesoRecord;

const vacio = (): KnownInventory => ({
  operations: new Map(),
  objects: new Map([['iam.users', 'obj-users']]),
  processes: new Map(),
});

/** Lo que la base tendría tras escribir `plan`: sirve para correr el plan por segunda vez. */
function aplicar(
  previo: KnownInventory,
  plan: ImportPlan,
  objects = previo.objects,
): KnownInventory {
  const operations = new Map<string, KnownOperation>(previo.operations);
  for (const o of [...plan.operationsToInsert, ...plan.operationsToUpdate])
    operations.set(o.operationKey, {
      id: o.id,
      observationStatus: OBSERVED,
      technicalHash: o.technicalHash,
    });
  for (const [clave, op] of operations)
    if (plan.operationsToRetire.includes(op.id))
      operations.set(clave, { ...op, observationStatus: NOT_OBSERVED });
  const processes = new Map<string, KnownProcess>(previo.processes);
  for (const p of [...plan.processesToInsert, ...plan.processesToUpdate]) {
    const antes = processes.get(p.processCode);
    processes.set(p.processCode, {
      id: p.id,
      kind: p.kind,
      name: p.name,
      moduleCode: p.moduleCode,
      purpose: p.purpose,
      steps: antes?.steps ?? [],
    });
  }
  // etapas: las que el plan reescribe reemplazan a las que había
  const reescritos = new Set([
    ...plan.processesToRebuildSteps,
    ...plan.processesToInsert.map((p) => p.id),
  ]);
  for (const [codigo, p] of processes) {
    if (!reescritos.has(p.id)) continue;
    const etapas = plan.stepsToInsert
      .filter((s) => s.processId === p.id)
      .map((s) => ({
        ordinal: s.ordinal,
        stepCode: s.stepCode,
        name: s.name,
        operationIds: plan.stepOperationsToInsert
          .filter((x) => x.stepId === s.id)
          .sort((a, b) => a.ordinal - b.ordinal)
          .map((x) => x.operationId),
      }));
    processes.set(codigo, { ...p, steps: etapas });
  }
  return { operations, objects, processes };
}

const sinEscrituras = (plan: ImportPlan): boolean =>
  plan.operationsToInsert.length === 0 &&
  plan.operationsToUpdate.length === 0 &&
  plan.operationsToRetire.length === 0 &&
  plan.impactsToDeleteOf.length === 0 &&
  plan.impactsToInsert.length === 0 &&
  plan.processesToInsert.length === 0 &&
  plan.processesToUpdate.length === 0 &&
  plan.processesToRebuildSteps.length === 0 &&
  plan.stepsToInsert.length === 0 &&
  plan.stepOperationsToInsert.length === 0;

describe('planImport — la primera corrida', () => {
  it('mapea cada campo de la operación y de sus impactos', () => {
    const plan = planImport(
      [
        operacion('A_x', {
          tablas: [
            tabla({
              operacion: 'ESCRIBE',
              detalle: 'inserta',
              confianza: 'POR_SQL',
              via: ['a', 'b'],
              fuente: 'src/z.ts:3',
            }),
          ],
          autenticacion: {
            publica: true,
            roles: [],
            identidadVerificada: false,
          },
          riesgo: { nivel: 'ALTO', razones: [] },
        }),
      ],
      [],
      vacio(),
      contador(),
    );
    expect(plan.operationsToInsert).toEqual([
      expect.objectContaining({
        id: 'id-1',
        sourceCode: 'CONTRATO',
        operationKey: 'A_x',
        httpMethod: 'GET',
        routeTemplate: '/A_x',
        moduleCode: 'iam',
        controllerName: 'C',
        handlerName: 'h',
        sourceRef: 'src/c.ts:1',
        isPublic: true,
        requiredRoles: [],
        riskLevel: 'ALTO',
      }),
    ]);
    expect(plan.impactsToInsert).toEqual([
      {
        operationId: 'id-1',
        objectId: 'obj-users',
        accessKind: 'ESCRIBE',
        accessDetail: 'inserta',
        confidence: 'POR_SQL',
        callPath: ['a', 'b'],
        sourceRef: 'src/z.ts:3',
      },
    ]);
    expect(plan.counters.operations.added).toBe(1);
    expect(plan.impactsToDeleteOf).toEqual([]);
  });

  it('una operación sin código (CONTRATO_AUSENTE) deja nulos los campos del controlador', () => {
    const plan = planImport(
      [operacion('B_y', { origen: 'CONTRATO_AUSENTE', codigo: null })],
      [],
      vacio(),
      contador(),
    );
    expect(plan.operationsToInsert[0]).toEqual(
      expect.objectContaining({
        sourceCode: 'CONTRATO_AUSENTE',
        controllerName: null,
        handlerName: null,
        sourceRef: null,
      }),
    );
  });

  it('cuenta aparte la tabla no catalogada y la que la sonda aún no observó, sin fallar', () => {
    const plan = planImport(
      [
        operacion('A_x', {
          tablas: [
            tabla(),
            tabla({ tabla: 'fantasma', catalogada: false }),
            tabla({ tabla: 'recien_creada', catalogada: true }),
          ],
        }),
      ],
      [],
      vacio(),
      contador(),
    );
    expect(plan.counters.impacts).toEqual({
      written: 1,
      skippedNotCataloged: 1,
      skippedUnresolved: 1,
    });
  });

  it('con un catálogo vacío (antes del primer escaneo) salta todos los impactos y no falla', () => {
    const plan = planImport(
      [operacion('A_x'), operacion('B_y')],
      [],
      { ...vacio(), objects: new Map() },
      contador(),
    );
    expect(plan.counters.operations.added).toBe(2);
    expect(plan.counters.impacts).toEqual({
      written: 0,
      skippedNotCataloged: 0,
      skippedUnresolved: 2,
    });
  });

  it('el ordinal de etapas y de operaciones es la posición, desde 1, y el puente no repite operaciones', () => {
    const plan = planImport(
      [operacion('A_x'), operacion('B_y')],
      [
        proceso('p1', [
          { codigo: 'e1', nombre: 'Primera', ops: ['B_y', 'A_x', 'B_y'] },
          { codigo: 'e2', nombre: 'Segunda', ops: ['A_x'] },
        ]),
      ],
      vacio(),
      contador(),
    );
    expect(plan.stepsToInsert.map((s) => [s.stepCode, s.ordinal])).toEqual([
      ['e1', 1],
      ['e2', 2],
    ]);
    const primera = plan.stepsToInsert[0].id;
    expect(
      plan.stepOperationsToInsert
        .filter((x) => x.stepId === primera)
        .map((x) => [x.operationId, x.ordinal]),
    ).toEqual([
      ['id-2', 1],
      ['id-1', 2],
    ]);
    expect(plan.counters.stepOperations.written).toBe(3);
  });

  it('un enlace a una operación que el inventario no tiene se salta y se cuenta', () => {
    const plan = planImport(
      [operacion('A_x')],
      [
        proceso('p1', [
          { codigo: 'e1', nombre: 'E', ops: ['A_x', 'NO_EXISTE'] },
        ]),
      ],
      vacio(),
      contador(),
    );
    expect(plan.counters.stepOperations).toEqual({
      written: 1,
      skippedUnresolved: 1,
    });
  });

  it('el propósito del proceso sale de paraQueSirve.texto y puede ser nulo', () => {
    const plan = planImport(
      [],
      [
        proceso('p1', []),
        proceso('p2', [], { paraQueSirve: { texto: null, fuente: null } }),
      ],
      vacio(),
      contador(),
    );
    expect(plan.processesToInsert.map((p) => p.purpose)).toEqual([
      'sirve para algo',
      null,
    ]);
  });
});

describe('planImport — idempotencia', () => {
  const ops = [
    operacion('A_x'),
    operacion('B_y', { tablas: [tabla(), tabla({ operacion: 'ESCRIBE' })] }),
  ];
  const procs = [
    proceso('p1', [
      { codigo: 'e1', nombre: 'Primera', ops: ['A_x', 'B_y'] },
      { codigo: 'e2', nombre: 'Segunda', ops: ['B_y'] },
    ]),
  ];

  it('una segunda corrida con el mismo inventario no escribe nada', () => {
    const primera = planImport(ops, procs, vacio(), contador());
    const base = aplicar(vacio(), primera);
    const segunda = planImport(ops, procs, base, contador());
    expect(sinEscrituras(segunda)).toBe(true);
    expect(segunda.counters.operations).toEqual({
      added: 0,
      changed: 0,
      reappeared: 0,
      unchanged: 2,
      notObserved: 0,
    });
    expect(segunda.counters.processes).toEqual({
      added: 0,
      changed: 0,
      unchanged: 1,
    });
    expect(segunda.counters.steps.written).toBe(0);
  });

  it('un cambio que no se guarda (el ejemplo, la explicación) no cambia la huella', () => {
    const primera = planImport(ops, procs, vacio(), contador());
    const base = aplicar(vacio(), primera);
    const retocada = [
      { ...ops[0], explicacion: { sistema: { texto: 'otra', estado: 'x' } } },
      ops[1],
    ] as OperacionRecord[];
    expect(sinEscrituras(planImport(retocada, procs, base, contador()))).toBe(
      true,
    );
  });

  it('una operación cambiada se actualiza y le reemplaza los impactos', () => {
    const base = aplicar(vacio(), planImport(ops, procs, vacio(), contador()));
    const cambiada = [
      ops[0],
      { ...ops[1], riesgo: { nivel: 'ALTO', razones: [] } },
    ] as OperacionRecord[];
    const plan = planImport(cambiada, procs, base, contador());
    expect(plan.operationsToUpdate.map((o) => o.operationKey)).toEqual(['B_y']);
    expect(plan.operationsToInsert).toEqual([]);
    expect(plan.impactsToDeleteOf).toEqual([base.operations.get('B_y')?.id]);
    expect(plan.impactsToInsert).toHaveLength(2);
    expect(plan.counters.operations).toEqual(
      expect.objectContaining({ changed: 1, unchanged: 1 }),
    );
  });

  it('una operación que deja de aparecer queda NOT_OBSERVED y no se vuelve a retirar', () => {
    const base = aplicar(vacio(), planImport(ops, procs, vacio(), contador()));
    const sinB = planImport([ops[0]], [], base, contador());
    expect(sinB.operationsToRetire).toEqual([base.operations.get('B_y')?.id]);
    expect(sinB.counters.operations.notObserved).toBe(1);

    const despues = aplicar(base, sinB);
    expect(despues.operations.get('B_y')?.observationStatus).toBe(NOT_OBSERVED);
    const otra = planImport([ops[0]], [], despues, contador());
    expect(otra.operationsToRetire).toEqual([]);
    expect(otra.counters.operations.notObserved).toBe(0);
  });

  it('una operación NOT_OBSERVED que reaparece se reescribe y vuelve a OBSERVED', () => {
    const base = aplicar(vacio(), planImport(ops, procs, vacio(), contador()));
    const retirada = aplicar(base, planImport([ops[0]], [], base, contador()));
    const plan = planImport(ops, procs, retirada, contador());
    expect(plan.operationsToUpdate.map((o) => o.operationKey)).toEqual(['B_y']);
    expect(plan.counters.operations.reappeared).toBe(1);
    expect(plan.counters.operations.changed).toBe(0);
  });

  it('el impacto que se saltó por falta de escaneo se recupera cuando la sonda observa la tabla', () => {
    const sinCatalogo = { ...vacio(), objects: new Map<string, string>() };
    const primera = planImport(ops, [], sinCatalogo, contador());
    expect(primera.counters.impacts.written).toBe(0);
    const base = aplicar(sinCatalogo, primera);

    const conCatalogo = new Map([['iam.users', 'obj-users']]);
    const segunda = planImport(
      ops,
      [],
      { ...base, objects: conCatalogo },
      contador(),
    );
    expect(segunda.counters.operations.changed).toBe(2);
    expect(segunda.counters.impacts.written).toBe(3);
    // y a la tercera ya no hay nada que hacer
    const tercera = planImport(
      ops,
      [],
      aplicar({ ...base, objects: conCatalogo }, segunda),
      contador(),
    );
    expect(sinEscrituras(tercera)).toBe(true);
  });

  it('un proceso con el nombre cambiado se actualiza sin rehacer sus etapas', () => {
    const base = aplicar(vacio(), planImport(ops, procs, vacio(), contador()));
    const renombrado = [{ ...procs[0], nombre: 'Otro nombre' }];
    const plan = planImport(ops, renombrado, base, contador());
    expect(plan.processesToUpdate).toHaveLength(1);
    expect(plan.processesToRebuildSteps).toEqual([]);
    expect(plan.stepsToInsert).toEqual([]);
  });

  it('una etapa con otra operación rehace las etapas de ese proceso, sólo de ese', () => {
    const otros = [
      proceso('p2', [{ codigo: 'e1', nombre: 'Única', ops: ['A_x'] }]),
    ];
    const base = aplicar(
      vacio(),
      planImport(ops, [...procs, ...otros], vacio(), contador()),
    );
    const cambiado = [
      proceso('p1', [
        { codigo: 'e1', nombre: 'Primera', ops: ['A_x'] },
        { codigo: 'e2', nombre: 'Segunda', ops: ['B_y'] },
      ]),
      ...otros,
    ];
    const plan = planImport(ops, cambiado, base, contador());
    expect(plan.processesToRebuildSteps).toEqual([
      base.processes.get('p1')?.id,
    ]);
    expect(plan.stepsToInsert).toHaveLength(2);
    expect(plan.processesToUpdate).toEqual([]);
  });
});

describe('planImport — el inventario real', () => {
  // Los CHECK no existen en el modelo (decisión del parche v4.2.48): el importador escribe sólo
  // estos valores, y este spec los fija contra los archivos que viajan con la versión.
  const repo = new InventoryRepository();
  const plan = planImport(repo.operaciones(), repo.procesos(), vacio());

  it('risk_level, access_kind y kind son de los conjuntos acordados', () => {
    expect(new Set(plan.operationsToInsert.map((o) => o.riskLevel))).toEqual(
      new Set(['ALTO', 'MEDIO', 'BAJO']),
    );
    const accesos = new Set(
      repo.operaciones().flatMap((o) => o.tablas.map((t) => t.operacion)),
    );
    expect(
      [...accesos].every((a) => ['LEE', 'ESCRIBE', 'BORRA'].includes(a)),
    ).toBe(true);
    expect(
      plan.processesToInsert.every((p) =>
        ['MODULO', 'CRITICO'].includes(p.kind),
      ),
    ).toBe(true);
    expect(
      plan.operationsToInsert.every((o) =>
        ['CONTRATO', 'CONTRATO_AUSENTE'].includes(o.sourceCode),
      ),
    ).toBe(true);
  });

  it('importa todas las operaciones y procesos y no pierde ningún enlace de etapa', () => {
    expect(plan.operationsToInsert).toHaveLength(repo.operaciones().length);
    expect(plan.processesToInsert).toHaveLength(repo.procesos().length);
    expect(plan.counters.stepOperations.skippedUnresolved).toBe(0);
  });

  it('las claves únicas del modelo no chocan: operation_key, process_code, ordinal y par etapa-operación', () => {
    const unico = (valores: string[]): boolean =>
      new Set(valores).size === valores.length;
    expect(unico(plan.operationsToInsert.map((o) => o.operationKey))).toBe(
      true,
    );
    expect(unico(plan.processesToInsert.map((p) => p.processCode))).toBe(true);
    expect(
      unico(plan.stepsToInsert.map((s) => `${s.processId}#${s.ordinal}`)),
    ).toBe(true);
    expect(
      unico(
        plan.stepOperationsToInsert.map((x) => `${x.stepId}#${x.operationId}`),
      ),
    ).toBe(true);
  });
});
