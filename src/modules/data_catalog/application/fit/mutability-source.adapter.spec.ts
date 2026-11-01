import { MutabilityCatalogService } from '../../../system_ops/mutability/services/mutability-catalog.service';
import { WRITE_MODES } from '../../../system_ops/mutability/mutability.types';
import { mutabilityDeclared } from './checks/mutability-checks';
import { NOW, baseInputs } from './fit.fixtures';
import { MUTABILITY_CLASSES, available } from './fit.types';
import { MutabilityFitSource } from './mutability-source.adapter';

/**
 * `FIT-MUT-001` contra la taxonomía REAL de mutabilidad: el catálogo generado
 * (`system_ops/mutability/data/mutability.catalog.json`), leído por el servicio de ese módulo. Sólo
 * lectura: el lector del registro en base no se usa en `all()`.
 */
describe('MutabilityFitSource (taxonomía real de system_ops/mutability)', () => {
  const catalog = new MutabilityCatalogService({} as never);
  const source = new MutabilityFitSource(catalog);

  it('las clases que acepta la sonda son los modos de escritura de la taxonomía, menos UNKNOWN', () => {
    expect([...MUTABILITY_CLASSES]).toEqual(
      WRITE_MODES.filter((m) => m !== 'UNKNOWN'),
    );
  });

  it('declara cada tabla con writeMode conocido y omite las UNKNOWN', async () => {
    const decl = await source.declarations();
    const todos = catalog.all();
    const conocidas = todos.filter((r) => r.writeMode !== 'UNKNOWN');
    expect(todos.length).toBeGreaterThan(1000);
    expect(decl.size).toBe(conocidas.length);
    for (const r of todos.slice(0, 200)) {
      const k = `${r.schema}.${r.table}`;
      if (r.writeMode === 'UNKNOWN') expect(decl.has(k)).toBe(false);
      else expect(decl.get(k)).toBe(r.writeMode);
    }
    for (const clase of decl.values())
      expect(MUTABILITY_CLASSES as readonly string[]).toContain(clase);
  });

  it('enchufada a FIT-MUT-001: mide (ya no NO_DECLARADO) sobre las tablas del catálogo', async () => {
    const decl = await source.declarations();
    const todos = catalog.all();
    const inputs = {
      ...baseInputs(),
      now: NOW,
      liveObjects: available(
        todos.map((r) => ({
          schema: r.schema,
          name: r.table,
          kind: 'TABLE',
          tableComment: null,
          columns: [],
          card: null,
        })),
      ),
      mutability: available(decl),
    };
    const out = mutabilityDeclared.evaluate(inputs as never);
    expect(out.kind).toBe('measured');
    if (out.kind !== 'measured') return;
    const conocidas = todos.filter((r) => r.writeMode !== 'UNKNOWN').length;
    expect(out.covered).toBe(conocidas);
    expect(out.denominator).toBe(todos.length);
  });
});
