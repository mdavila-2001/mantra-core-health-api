import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { jest } from '@jest/globals';
import { DEFAULT_FIT_CHECKS } from './checks';
import { evaluateFit } from './fit-evaluator';
import { FitInputsCollector, summarizeDrift } from './fit-inputs.collector';
import { routeKey } from './fit-routes';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import type { FitLiveObject } from './fit.types';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del colector, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * La sonda contra el inventario REAL del repositorio (`inventario/`), con dobles declarados para lo
 * que necesita una base o un proceso Nest en marcha:
 *
 *   - rutas del código: DOBLE derivado de `openapi/openapi.json` (el contrato generado del mismo
 *     código), porque `RouteMetadataService` necesita la aplicación arrancada. NO es la prueba de
 *     que las rutas registradas coinciden: esa sólo la da la API corriendo.
 *   - catálogo vivo e importación: DOBLES construidos desde el propio inventario (no hay
 *     PostgreSQL). Sirven para probar el mapeo de formas reales, no el SQL.
 */
describe('sonda de ajuste sobre el inventario real (dobles declarados para rutas y base)', () => {
  const inventory = new InventoryRepository();
  const openapi = JSON.parse(
    readFileSync(join(process.cwd(), 'openapi', 'openapi.json'), 'utf8'),
  ) as { paths: Record<string, Record<string, unknown>> };
  const metodos = ['get', 'post', 'put', 'patch', 'delete'];

  // contrato publicado + las rutas que el inventario ya ubica en el código pero el contrato aún no publica
  const routes = {
    all: () => [
      ...Object.entries(openapi.paths).flatMap(([ruta, ops]) =>
        Object.keys(ops)
          .filter((m) => metodos.includes(m))
          .map((m) => ({
            method: m.toUpperCase(),
            template: ruta,
            controller: 'Doble',
            handler: m,
          })),
      ),
      ...inventory
        .operaciones()
        .filter((o) => o.origen !== 'CONTRATO' && o.metodo !== 'DESCONOCIDO')
        .map((o) => ({
          method: o.metodo,
          template: o.ruta,
          controller: o.codigo?.controlador ?? 'Doble',
          handler: o.codigo?.handler ?? 'h',
        })),
    ],
  };

  let report: ReturnType<typeof evaluateFit>;

  beforeAll(async () => {
    const vivos: FitLiveObject[] = inventory
      .catalogoIndice()
      .tablas.map((t) => t.schema)
      .filter((s, i, todos) => todos.indexOf(s) === i)
      .flatMap((schema) =>
        inventory.tablasDeSchema(schema).map((t) => ({
          schema: t.schema,
          name: t.tabla,
          kind: 'TABLE',
          tableComment: null,
          columns: t.columnas.map((c) => ({
            name: String((c as { nombre: string }).nombre),
            nativeType: String((c as { tipo: string }).tipo),
            sensitivity: null,
          })),
          card: null,
        })),
      );
    const live = {
      liveObjects: mockFn(async () => vivos),
      scanState: mockFn(async () => ({
        lastSucceededAt: new Date(),
        lastFinishedAt: new Date(),
        lastStatus: 'SUCCEEDED',
      })),
      importedOperations: mockFn(async () =>
        inventory.operaciones().map((o) => ({
          key: o.id,
          method: o.metodo,
          route: o.ruta,
          origin: o.origen,
        })),
      ),
    };
    const em = { fork: () => em };
    const collector = new FitInputsCollector(
      em as never,
      routes as never,
      inventory,
      live as never,
    );
    report = evaluateFit(await collector.collect(), DEFAULT_FIT_CHECKS);
  }, 120_000);

  it('lee las seis fuentes reales del inventario: nada queda SIN_DATO salvo la mutabilidad', () => {
    expect(
      report.checks.filter((c) => c.status === 'SIN_DATO').map((c) => c.id),
    ).toEqual([]);
    expect(report.blindSpots).toEqual(['FIT-MUT-001']);
  });

  it('separa lo que no es una ruta (verbo desconocido) de lo que es ruta y el contrato no publica', () => {
    const ops = inventory.operaciones();
    const noRutas = ops.filter((o) => o.metodo === 'DESCONOCIDO');
    const sinContrato = ops.filter(
      (o) => o.origen !== 'CONTRATO' && o.metodo !== 'DESCONOCIDO',
    );
    const rut3 = report.checks.find((c) => c.id === 'FIT-RUT-003')!;
    expect([rut3.findingsTotal, rut3.denominator]).toEqual([
      noRutas.length,
      ops.length,
    ]);
    const rut4 = report.checks.find((c) => c.id === 'FIT-RUT-004')!;
    expect(rut4.findingsTotal).toBe(sinContrato.length);
  });

  it('la forma `{id}` del inventario casa con `{id}` del contrato: el denominador de rutas es el real', () => {
    const rut1 = report.checks.find((c) => c.id === 'FIT-RUT-001')!;
    const claves = new Set(
      routes.all().map((r) => routeKey(r.method, r.template)),
    );
    expect(rut1.denominator).toBe(claves.size);
    // el doble sale del mismo código que el inventario: si las formas casaran mal, esto caería a la mitad
    expect(rut1.covered! / rut1.denominator!).toBeGreaterThan(0.98);
    const rut2 = report.checks.find((c) => c.id === 'FIT-RUT-002')!;
    expect(rut2.covered! / rut2.denominator!).toBeGreaterThan(0.98);
    expect(report.fingerprints.routesInInventory).toBe(
      report.fingerprints.routesImported,
    );
  });

  it('el catálogo estático se lee completo: 1 ítem por columna del modelo, sin inventar cero', () => {
    const indice = inventory.catalogoIndice();
    const mod3 = report.checks.find((c) => c.id === 'FIT-MOD-003')!;
    expect(mod3.status).toBe('OK');
    expect(mod3.denominator).toBe(indice.resumen.columnas);
    expect(report.checks.find((c) => c.id === 'FIT-MOD-001')!.denominator).toBe(
      indice.resumen.tablas,
    );
  });

  it('la deriva modelo/ORM sale del inventario con sus conteos reales (no se esconde)', () => {
    const deriva = summarizeDrift(inventory.catalogoIndice().deriva);
    const r = report.checks.find((c) => c.id === 'FIT-MOD-005')!;
    for (const [categoria, cuenta] of Object.entries(deriva.counts)) {
      if (r.evidence[categoria] !== undefined)
        expect(r.evidence[categoria]).toBe(cuenta);
    }
    expect(r.denominator).toBe(6);
  });

  it('el puntaje de cada dimensión trae numerador y denominador, y el ratio sale de ellos', () => {
    for (const d of report.dimensions) {
      if (d.status === 'MEDIDA') {
        expect(d.denominator).toBeGreaterThan(0);
        expect(d.ratio).toBe(
          Math.round((d.covered! / d.denominator!) * 10_000) / 10_000,
        );
      } else {
        expect([d.covered, d.denominator, d.ratio]).toEqual([null, null, null]);
      }
    }
  });
});
