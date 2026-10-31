import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ResourceNotFoundException } from '../../../common';
import {
  GovernanceReadService,
  REDACTED,
  redactConfiguration,
} from './governance-read.service';

const policy = (type: string, code: string, id: string, extra: any = {}) => ({
  id,
  type,
  code,
  name: extra.name ?? null,
  stateCode: 'ACTIVE',
  stateDisplay: 'Activo',
  updatedAt: new Date('2026-10-01T10:00:00.000Z'),
  attributes: extra.attributes ?? {},
});

const field = (
  table: string,
  column: string,
  extra: Partial<Record<string, unknown>> = {},
) => ({
  schema_name: 'iam',
  table_name: table,
  column_name: column,
  sensitivity: 'PERSONAL',
  review_status: 'AUTO_DETECTED',
  in_registry: false,
  registry_is_pii: null,
  registry_is_phi: null,
  registry_classification: null,
  registry_masking: null,
  registry_anonymization_rule: null,
  ...extra,
});

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => ({})) };
  const repo = {
    listPolicies: mockFn(),
    findPolicy: mockFn(),
    policyConfiguration: mockFn(),
    appliesTo: mockFn(),
    history: mockFn(),
    piiFields: mockFn(),
    piiSources: mockFn(),
  };
  const service = new GovernanceReadService(em as any, repo as any);
  return { service, repo };
}

describe('GovernanceReadService.listPolicies', () => {
  const rows = [
    policy('RETENTION', 'RET-10Y', 'a', { name: 'Diez años' }),
    policy('WRITE', 'W-APPEND', 'b', { name: 'Sólo agregar' }),
    policy('WRITE', 'W-REASON', 'c', { name: 'Con motivo' }),
    policy('ANONYMIZATION', 'ANON-HASH', 'd'),
  ];

  it('ordena por tipo y código, y cuenta por tipo sobre la búsqueda', async () => {
    const d = build();
    d.repo.listPolicies.mockResolvedValue([...rows].reverse());
    const page = await d.service.listPolicies({});
    expect(page.items.map((i) => i.code)).toEqual([
      'ANON-HASH',
      'RET-10Y',
      'W-APPEND',
      'W-REASON',
    ]);
    expect(page.total).toBe(4);
    expect(page.byType.find((t) => t.type === 'WRITE')!.total).toBe(2);
    expect(page.byType.find((t) => t.type === 'RESIDENCY')!.total).toBe(0);
  });

  it('el filtro de tipo no cambia los conteos por tipo', async () => {
    const d = build();
    d.repo.listPolicies.mockResolvedValue(rows);
    const page = await d.service.listPolicies({ type: 'WRITE' });
    expect(page.total).toBe(2);
    expect(page.byType.find((t) => t.type === 'RETENTION')!.total).toBe(1);
  });

  it('busca sin tildes ni mayúsculas en código y nombre', async () => {
    const d = build();
    d.repo.listPolicies.mockResolvedValue(rows);
    const page = await d.service.listPolicies({ q: 'SOLO agregar' });
    expect(page.items.map((i) => i.code)).toEqual(['W-APPEND']);
  });

  it('pagina por cursor sin repetir ni saltar filas', async () => {
    const d = build();
    d.repo.listPolicies.mockResolvedValue(rows);
    const first = await d.service.listPolicies({ limit: 3 });
    expect(first.items).toHaveLength(3);
    expect(first.nextCursor).not.toBeNull();
    const second = await d.service.listPolicies({
      limit: 3,
      cursor: first.nextCursor!,
    });
    expect(second.items.map((i) => i.code)).toEqual(['W-REASON']);
    expect(second.nextCursor).toBeNull();
  });

  it('un catálogo vacío devuelve una página vacía, no un error', async () => {
    const d = build();
    d.repo.listPolicies.mockResolvedValue([]);
    const page = await d.service.listPolicies({});
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.nextCursor).toBeNull();
  });

  it('descarta atributos que no son escalares y conserva null', async () => {
    const d = build();
    d.repo.listPolicies.mockResolvedValue([
      policy('WRITE', 'W', 'a', {
        attributes: { dualControl: true, maxBatchSize: null, raro: { x: 1 } },
      }),
    ]);
    const [item] = (await d.service.listPolicies({})).items;
    expect(item!.attributes).toEqual({ dualControl: true, maxBatchSize: null });
  });
});

describe('GovernanceReadService.getPolicy', () => {
  it('rechaza una política que no existe con 404', async () => {
    const d = build();
    d.repo.findPolicy.mockResolvedValue(null);
    await expect(d.service.getPolicy('x')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('une atributos, configuración, destinos e historial; marca el recorte', async () => {
    const d = build();
    d.repo.findPolicy.mockResolvedValue(policy('ANONYMIZATION', 'ANON', 'p1'));
    d.repo.policyConfiguration.mockResolvedValue({ salt: 'x', keepLast: 4 });
    d.repo.appliesTo.mockResolvedValue([
      {
        kind: 'FIELD',
        total: 120,
        items: Array.from({ length: 50 }, (_, i) => `a.b.c${i}`),
      },
    ]);
    d.repo.history.mockResolvedValue([
      {
        id: 'h1',
        action_code: 'CREATED',
        action_display: 'Alta',
        changed_by_user_id: 'u1',
        reason: null,
        recorded_at: '2026-10-02T00:00:00.000Z',
      },
    ]);
    const detail = await d.service.getPolicy('p1');
    expect(detail.configuration).toEqual({ salt: REDACTED, keepLast: 4 });
    expect(detail.appliesTo[0]!.truncated).toBe(true);
    expect(detail.history[0]).toMatchObject({ action: 'Alta', reason: null });
    expect(detail.history[0]!.recordedAt).toBe('2026-10-02T00:00:00.000Z');
  });

  it('un destino sin recorte no se marca como truncado, y el vínculo de residencia no lista items', async () => {
    const d = build();
    d.repo.findPolicy.mockResolvedValue(policy('RESIDENCY', 'R', 'p2'));
    d.repo.policyConfiguration.mockResolvedValue(null);
    d.repo.appliesTo.mockResolvedValue([
      { kind: 'TENANT_BINDING', total: 3, items: [] },
    ]);
    d.repo.history.mockResolvedValue([]);
    const detail = await d.service.getPolicy('p2');
    expect(detail.appliesTo[0]).toMatchObject({ total: 3, items: [] });
    expect(detail.history).toEqual([]);
  });
});

describe('GovernanceReadService.listPiiFields', () => {
  const rows = [
    field('users', 'email'),
    field('users', 'document_number', {
      sensitivity: 'PHI_IDENTIFIER',
      review_status: 'APPROVED',
      in_registry: true,
      registry_is_pii: true,
      registry_masking: 'MASK_LAST4',
    }),
    field('patients', 'birth_date', {
      sensitivity: null,
      review_status: null,
      in_registry: true,
      registry_is_pii: true,
    }),
  ];

  it('etiqueta la fuente de cada fila y resume sobre el filtro entero', async () => {
    const d = build();
    d.repo.piiFields.mockResolvedValue(rows);
    d.repo.piiSources.mockResolvedValue({
      catalogColumns: 900,
      registryFields: 2,
    });
    const page = await d.service.listPiiFields({});
    const bySource = Object.fromEntries(
      page.items.map((i) => [i.columnName, i.source]),
    );
    expect(bySource).toEqual({
      birth_date: 'REGISTRY',
      document_number: 'BOTH',
      email: 'CATALOG',
    });
    expect(page.summary).toMatchObject({
      fields: 3,
      tables: 2,
      approved: 1,
      // sólo `document_number` tiene enmascarado/anonimización declarados
      withoutProtection: 2,
    });
    expect(page.summary.bySensitivity).toEqual({
      PERSONAL: 1,
      PHI_IDENTIFIER: 1,
      SIN_NIVEL_EN_CATALOGO: 1,
    });
    expect(page.sources).toEqual({ catalogColumns: 900, registryFields: 2 });
  });

  it('filtra por nivel, esquema, fuente y texto; el resumen sigue el filtro', async () => {
    const d = build();
    d.repo.piiFields.mockResolvedValue(rows);
    d.repo.piiSources.mockResolvedValue({
      catalogColumns: 0,
      registryFields: 0,
    });
    const byLevel = await d.service.listPiiFields({
      sensitivity: 'PHI_IDENTIFIER',
    });
    expect(byLevel.items.map((i) => i.columnName)).toEqual(['document_number']);
    expect(byLevel.summary.fields).toBe(1);
    const byText = await d.service.listPiiFields({ q: 'PATIENTS' });
    expect(byText.items.map((i) => i.columnName)).toEqual(['birth_date']);
    const bySource = await d.service.listPiiFields({ source: 'BOTH' });
    expect(bySource.total).toBe(1);
    const otherSchema = await d.service.listPiiFields({ schema: 'billing' });
    expect(otherSchema.total).toBe(0);
  });

  it('sin catálogo escaneado ni registro devuelve vacío con las fuentes en cero', async () => {
    const d = build();
    d.repo.piiFields.mockResolvedValue([]);
    d.repo.piiSources.mockResolvedValue({
      catalogColumns: 0,
      registryFields: 0,
    });
    const page = await d.service.listPiiFields({});
    expect(page.items).toEqual([]);
    expect(page.summary.fields).toBe(0);
    expect(page.sources).toEqual({ catalogColumns: 0, registryFields: 0 });
  });

  it('pagina por cursor', async () => {
    const d = build();
    d.repo.piiFields.mockResolvedValue(rows);
    d.repo.piiSources.mockResolvedValue({
      catalogColumns: 0,
      registryFields: 0,
    });
    const first = await d.service.listPiiFields({ limit: 2 });
    expect(first.items).toHaveLength(2);
    const second = await d.service.listPiiFields({
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });
});

describe('redactConfiguration', () => {
  it('oculta valores cuya clave parece un secreto, a cualquier profundidad', () => {
    expect(
      redactConfiguration({
        technique: 'HASH',
        hmacKey: 'abc',
        nested: { pepper: 'p', list: [{ apiKey: 'k', width: 3 }] },
        api_key: 'x',
        password: null,
      }),
    ).toEqual({
      technique: 'HASH',
      hmacKey: REDACTED,
      nested: { pepper: REDACTED, list: [{ apiKey: REDACTED, width: 3 }] },
      api_key: REDACTED,
      password: null,
    });
  });

  it('no toca los escalares ni confunde claves como "monkey" o "keepLast"', () => {
    expect(redactConfiguration('x')).toBe('x');
    expect(redactConfiguration(null)).toBeNull();
    expect(redactConfiguration({ monkey: 1, keepLast: 4 })).toEqual({
      monkey: 1,
      keepLast: 4,
    });
  });
});
