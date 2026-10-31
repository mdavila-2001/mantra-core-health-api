import { describe, expect, it, jest } from '@jest/globals';
import {
  StudyCatalogService,
  buildComponentTree,
} from './study-catalog.service';
import { decodeCatalogCursor } from '../study-catalog.logic';
import { STUDY } from '../study_catalog.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const em = { fork: () => ({}) } as any;

const row = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  code: `k:${id}`,
  display: `Display ${id}`,
  name: `Nombre ${id}`,
  family: 'LAB',
  sort_key: `nombre ${id}`,
  props: {
    study_catalog_code: `COD_${id}`,
    catalog_version: '2026-10-31',
    source_file: 'laboratorio.json',
    source_ids: ['loinc-2.83'],
    specimen: {
      codigo: 'SUERO',
      nombre: 'Suero',
      hl7_0487: 'SER',
      snomed: '119364003',
    },
  },
  ...over,
});

function build(rows: any[]) {
  const repo = {
    findPage: mockFn(() => Promise.resolve(rows)),
    countComponents: mockFn(() => Promise.resolve(new Map([['a', 3]]))),
    findTargets: mockFn((_em: unknown, type: string) =>
      Promise.resolve(
        type === STUDY.REL_HAS_MODALITY ? new Map([['b', 'mod-1']]) : new Map(),
      ),
    ),
  };
  return { service: new StudyCatalogService(em, repo as any), repo };
}

describe('StudyCatalogService.list', () => {
  it('devuelve el cursor de la última fila leída y recorta la fila de más', async () => {
    const { service, repo } = build([row('a'), row('b'), row('c')]);
    const page = await service.list({ tokens: [], limit: 2 });
    expect(repo.findPage.mock.calls[0][1].limit).toBe(3);
    expect(page.count).toBe(2);
    expect(page.items.map((i) => i.conceptId)).toEqual(['a', 'b']);
    expect(decodeCatalogCursor(page.nextCursor as string)).toEqual({
      key: 'nombre b',
      id: 'b',
    });
  });

  it('última página: sin cursor', async () => {
    const { service } = build([row('a')]);
    expect(
      (await service.list({ tokens: [], limit: 5 })).nextCursor,
    ).toBeNull();
  });

  it('arma el renglón: código del catálogo, componentes, muestra sugerida y procedencia', async () => {
    const { service } = build([row('a')]);
    const [item] = (await service.list({ tokens: [], limit: 5 })).items;
    expect(item).toMatchObject({
      code: 'COD_a',
      display: 'Nombre a',
      codeSystem: 'mantra-core-internal',
      family: 'LAB',
      componentsSelectable: true,
      componentCount: 3,
      specimenHint: {
        text: 'Suero',
        code: 'SUERO',
        hl7Code: 'SER',
        snomedCode: '119364003',
      },
      provenance: {
        source: 'laboratorio.json',
        version: '2026-10-31',
        sourceIds: ['loinc-2.83'],
      },
    });
  });

  it('un estudio de imagen trae su modalidad; uno sin componentes no es desglosable', async () => {
    const { service } = build([row('b', { family: 'IMAGING', props: {} })]);
    const [item] = (await service.list({ tokens: [], limit: 5 })).items;
    expect(item.modalityConceptId).toBe('mod-1');
    expect(item.componentsSelectable).toBe(false);
    expect(item.specimenHint).toBeNull();
  });

  it('omite un concepto del value set que no sabe clasificar, en vez de inventarle familia', async () => {
    const { service } = build([row('z', { family: null })]);
    expect((await service.list({ tokens: [], limit: 5 })).items).toEqual([]);
  });
});

describe('buildComponentTree', () => {
  const comp = (
    id: string,
    parent: string,
    ordinal: number,
    props: Record<string, unknown> = {},
  ) => ({
    id,
    parent_id: parent,
    ordinal,
    depth: 1,
    code: `P.${id}`,
    name: `N ${id}`,
    props,
  });

  it('respeta el orden, anida paneles y toma unidad y marca por defecto', () => {
    const tree = buildComponentTree('root', [
      comp('c1', 'root', 1, {
        unit_ucum: 'g/dL',
        selected_by_default: false,
        loinc_code: '718-7',
      }),
      comp('c2', 'root', 2),
      comp('c3', 'c2', 1),
    ]);
    expect(tree.map((n) => n.conceptId)).toEqual(['c1', 'c2']);
    expect(tree[0]).toMatchObject({
      exampleUnits: ['g/dL'],
      selectedByDefault: false,
      isPanel: false,
      loincCode: '718-7',
    });
    expect(tree[1].isPanel).toBe(true);
    expect(tree[1].children.map((n) => n.conceptId)).toEqual(['c3']);
  });
});
