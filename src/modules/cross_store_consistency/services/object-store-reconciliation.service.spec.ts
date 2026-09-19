import { jest } from '@jest/globals';
import { ObjectStoreReconciliationService } from './object-store-reconciliation.service';
import { ObjectContentUnavailableError } from '../../object_storage/ports';
import type { InventarioDeObjetos } from '../ports/object-store-inventory.port';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ALCANCE = { backendCode: 'minio', bucket: 'adjuntos', limit: 100 };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param opciones - Referencias del canónico, objetos presentes e inventario.
 * @returns El servicio y sus dobles.
 */
function build(opciones: {
  /** Filas que devuelve Postgres. */
  referencias?: {
    file_version_id: string;
    object_key: string;
    object_version: string | null;
  }[];
  /** Claves que el proveedor confirma que existen. */
  presentes?: string[];
  /** Claves cuya consulta falla. */
  incomprobables?: string[];
  /** Qué devuelve el inventario del bucket. */
  inventario?: InventarioDeObjetos;
}) {
  const {
    referencias = [],
    presentes = [],
    incomprobables = [],
    inventario = { estado: 'COMPLETO', objetos: [] },
  } = opciones;

  const em = {
    fork: () => ({
      getConnection: () => ({
        execute: mockFn().mockResolvedValue(referencias),
      }),
    }),
  };
  const reader = {
    stat: mockFn(async ({ key }: { key: string }) => {
      if (incomprobables.includes(key)) {
        throw new ObjectContentUnavailableError('PROVIDER_ERROR');
      }
      return presentes.includes(key) ? { sizeBytes: 1n } : null;
    }),
    digest: mockFn(),
    open: mockFn(),
  };
  const inventoryPort = { listar: mockFn().mockResolvedValue(inventario) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ObjectStoreReconciliationService(
    em as any,
    reader as any,
    inventoryPort as any,
    logger as any,
  );
  return { service, reader, inventoryPort, logger };
}

/**
 * Arma una fila de `common.file_versions`.
 *
 * @param id - Identificador de la versión.
 * @param key - Clave del objeto.
 * @returns La fila.
 */
const ref = (id: string, key: string) => ({
  file_version_id: id,
  object_key: key,
  object_version: null,
});

describe('ObjectStoreReconciliationService · F09', () => {
  it('marca MATCH cuando el objeto que el canónico declara está', async () => {
    const d = build({
      referencias: [ref('fv1', 'a/1.pdf')],
      presentes: ['a/1.pdf'],
      inventario: {
        estado: 'COMPLETO',
        objetos: [{ key: 'a/1.pdf', sizeBytes: 10n }],
      },
    });
    const res = await d.service.escanear(ALCANCE);
    expect(res.items).toEqual([
      {
        canonicalEntityId: 'fv1',
        targetDocumentId: 'a/1.pdf',
        result: 'MATCH',
      },
    ]);
    expect(res.noVerificadas).toBe(0);
    expect(res.inventarioIncompleto).toBe(false);
  });

  it('marca MISSING cuando el canónico lo declara y el objeto no está', async () => {
    const d = build({
      referencias: [ref('fv1', 'a/1.pdf')],
      presentes: [],
      inventario: { estado: 'COMPLETO', objetos: [] },
    });
    const res = await d.service.escanear(ALCANCE);
    expect(res.items).toEqual([
      {
        canonicalEntityId: 'fv1',
        targetDocumentId: 'a/1.pdf',
        result: 'MISSING',
      },
    ]);
  });

  it('marca EXTRA el objeto que el canónico no conoce', async () => {
    const d = build({
      referencias: [],
      inventario: {
        estado: 'COMPLETO',
        objetos: [{ key: 'huerfano.bin', sizeBytes: 4n }],
      },
    });
    const res = await d.service.escanear(ALCANCE);
    expect(res.items).toEqual([
      {
        canonicalEntityId: 'orphan:huerfano.bin',
        targetDocumentId: 'huerfano.bin',
        result: 'EXTRA',
      },
    ]);
  });

  it('un objeto de un archivo borrado queda como huérfano, no como conocido', async () => {
    // La consulta del canónico filtra `deleted_at is null`, así que esa clave
    // no llega como referencia: el objeto que sobrevive al borrado se ve.
    const d = build({
      referencias: [],
      inventario: {
        estado: 'COMPLETO',
        objetos: [{ key: 'borrado/1.pdf', sizeBytes: 9n }],
      },
    });
    const res = await d.service.escanear(ALCANCE);
    expect(res.items[0]).toMatchObject({ result: 'EXTRA' });
  });

  // El corazón de la ficha: lo que no se pudo mirar no se declara.
  it('una referencia que no se pudo consultar no se denuncia como perdida', async () => {
    const d = build({
      referencias: [ref('fv1', 'a/1.pdf'), ref('fv2', 'b/2.pdf')],
      presentes: ['a/1.pdf'],
      incomprobables: ['b/2.pdf'],
      inventario: {
        estado: 'COMPLETO',
        objetos: [{ key: 'a/1.pdf', sizeBytes: 1n }],
      },
    });
    const res = await d.service.escanear(ALCANCE);

    expect(res.noVerificadas).toBe(1);
    expect(res.items.map((i) => i.canonicalEntityId)).not.toContain('fv2');
    expect(res.items.some((i) => i.result === 'MISSING')).toBe(false);
  });

  it.each([
    [
      'el inventario no está disponible',
      { estado: 'NO_DISPONIBLE', motivo: 'PROVIDER_ERROR:TimeoutError' },
    ],
    [
      'el inventario quedó truncado',
      { estado: 'TRUNCADO', objetos: [{ key: 'x.bin', sizeBytes: 1n }] },
    ],
  ])('no emite ningún EXTRA cuando %s', async (_caso, inventario) => {
    const d = build({
      referencias: [ref('fv1', 'a/1.pdf')],
      presentes: ['a/1.pdf'],
      inventario: inventario as InventarioDeObjetos,
    });
    const res = await d.service.escanear(ALCANCE);

    expect(res.inventarioIncompleto).toBe(true);
    expect(res.motivoInventario).toBeDefined();
    // Lo de la dirección 1 sigue valiendo: se miró objeto por objeto.
    expect(res.items).toEqual([
      {
        canonicalEntityId: 'fv1',
        targetDocumentId: 'a/1.pdf',
        result: 'MATCH',
      },
    ]);
    // Pero no se propone borrar nada que quizá sólo no se llegó a listar.
    expect(res.items.some((i) => i.result === 'EXTRA')).toBe(false);
  });

  it('no escribe nada: sólo lee, compara e informa', async () => {
    const d = build({
      referencias: [ref('fv1', 'a/1.pdf')],
      inventario: {
        estado: 'COMPLETO',
        objetos: [{ key: 'huerfano.bin', sizeBytes: 1n }],
      },
    });
    await d.service.escanear(ALCANCE);
    // El lector sólo se usa para `stat`; nunca para abrir ni borrar.
    expect(d.reader.digest).not.toHaveBeenCalled();
    expect(d.reader.open).not.toHaveBeenCalled();
  });
});
