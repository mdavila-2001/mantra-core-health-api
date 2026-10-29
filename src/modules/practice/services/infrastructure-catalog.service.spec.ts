import {
  FUNCTIONS,
  FUNCTION_PROFILES,
  PARENT_RULE_SEEDS,
  ROOT_FORMS,
  TYPOLOGY_RULE_SEEDS,
} from '../infrastructure-catalog';
import { MAX_BATCH_SIZE } from './infrastructure-rules';
import { InfrastructureCatalogService } from './infrastructure-catalog.service';
import { mockFn, ruleSet } from './infrastructure.testing';

function build(rules = ruleSet()) {
  const em = { fork: mockFn(() => ({})) };
  const repo = { loadRuleSet: mockFn().mockResolvedValue(rules) };
  return {
    service: new InfrastructureCatalogService(em as never, repo as never),
    repo,
  };
}

describe('InfrastructureCatalogService.get', () => {
  it('las reglas padre→hijo y de tipología salen de lo que devuelve la base, no de una lista en el código', async () => {
    const vacio = {
      parentChildren: new Map(),
      typologyAllowed: new Map(),
      typologyRequired: new Map(),
    };
    const res = await build(vacio as never).service.get();
    expect(res.parentRules).toEqual([]);
    expect(res.typologyRules).toEqual([]);
    const llena = await build().service.get();
    expect(llena.parentRules).toHaveLength(
      PARENT_RULE_SEEDS.reduce((n, r) => n + r.children.length, 0),
    );
    expect(llena.typologyRules).toHaveLength(TYPOLOGY_RULE_SEEDS.length);
  });

  it('cada regla de tipología trae la norma de origen', async () => {
    const res = await build().service.get();
    expect(res.typologyRules.length).toBeGreaterThan(0);
    for (const rule of res.typologyRules) expect(rule.source).not.toBe('');
  });

  it('las funciones llevan su perfil y las formas con prefijo completo; la raíz es la constante', async () => {
    const res = await build().service.get();
    expect(res.functions).toHaveLength(FUNCTIONS.all().length);
    const quirofano = res.functions.find(
      (f) => f.code === 'SPACE_FN_OPERATING_ROOM',
    )!;
    expect(quirofano.forms).toEqual(
      FUNCTION_PROFILES.SPACE_FN_OPERATING_ROOM.forms.map(
        (f) => `LOC_FORM_${f}`,
      ),
    );
    expect(res.rootForms).toEqual(ROOT_FORMS.map((f) => `LOC_FORM_${f}`));
  });

  it('expone formas con código FHIR, ciclos de vida, atributos, datos regulatorios y el tope de lote', async () => {
    const res = await build().service.get();
    expect(
      res.forms.every((f) => f.code.startsWith('LOC_FORM_') && f.fhirCode),
    ).toBe(true);
    expect(res.lifecycle.length).toBeGreaterThan(0);
    expect(res.unitLifecycle.length).toBeGreaterThan(0);
    expect(res.attributes.bedCategory.length).toBeGreaterThan(0);
    expect(res.regulatory.licenseStatus.map((l) => l.code)).toContain(
      'LIC_VALID',
    );
    expect(res.regulatory.capacityKind.map((l) => l.code)).toContain(
      'CAP_BEDS_CENSABLE',
    );
    expect(res.limits.maxBatchSize).toBe(MAX_BATCH_SIZE);
  });

  it('lee las reglas con un fork propio del EntityManager', async () => {
    const d = build();
    await d.service.get();
    expect(d.repo.loadRuleSet).toHaveBeenCalledTimes(1);
  });
});
