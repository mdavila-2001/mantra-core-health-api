import { describe, expect, it, jest } from '@jest/globals';

import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { ConceptFileImportService } from './concept-file-import.service';

const actor = { id: 'actor-1', roles: ['SECURITY_ADMIN'] } as never;

/**
 * Importar un archivo es leerlo línea por línea, escribir lo que falta y dejar
 * el lote registrado.
 *
 * Lo que estas pruebas fijan es lo que se rompe en silencio: que una línea mala
 * no arrastre a las buenas, que un código repetido dentro del archivo se
 * distinga de uno que ya estaba en la base, y que el lote se abra **antes** de
 * escribir —si no, una importación que se cae a la mitad no deja rastro—.
 */
function armar(opciones?: { version?: unknown; existentes?: Set<string> }) {
  const version =
    opciones?.version === undefined
      ? { id: 'v-1', codeSystemId: 'cs-1', stateConceptId: CONCEPTS.TERM_DRAFT }
      : opciones.version;

  const creados: { code: string; stateConceptId: string }[] = [];
  const lotes: Record<string, unknown>[] = [];

  const tx = {
    create: jest.fn((_e: unknown, data: Record<string, unknown>) => {
      lotes.push(data);
      return { id: 'batch-1', ...data };
    }),
    flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    findOne: jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ id: 'batch-1' }),
    assign: jest.fn(),
  };

  const em = {
    fork: jest.fn(() => tx),
    clear: jest.fn(),
    transactional: jest.fn(async (cb: (t: unknown) => Promise<unknown>) =>
      cb(tx),
    ),
  };

  const versionsRepo = {
    findById: jest.fn<() => Promise<unknown>>().mockResolvedValue(version),
  };
  const codeSystemsRepo = {
    findById: jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ id: 'cs-1', sourceId: 'src-1' }),
  };
  const conceptsRepo = {
    findExistingCodes: jest
      .fn<() => Promise<Set<string>>>()
      .mockResolvedValue(opciones?.existentes ?? new Set<string>()),
    create: jest.fn(
      (_t: unknown, data: { code: string; stateConceptId: string }) => {
        creados.push(data);
        return data;
      },
    ),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const service = new ConceptFileImportService(
    em as never,
    versionsRepo as never,
    codeSystemsRepo as never,
    conceptsRepo as never,
    logger as never,
  );

  /** El contenido del archivo, como llega del interceptor de multipart. */
  const archivo = (texto: string) => Buffer.from(texto, 'utf8');

  return {
    service,
    archivo,
    creados,
    lotes,
    tx,
    em,
    versionsRepo,
    conceptsRepo,
  };
}

describe('ConceptFileImportService', () => {
  it('importa las líneas válidas y deja el lote registrado', async () => {
    const { service, archivo, creados, lotes, tx } = armar();
    const contenido = archivo(
      '{"code":"A00","display":"Cólera"}\n' +
        '{"code":"A01","display":"Fiebre tifoidea","definition":"Por salmonella"}\n',
    );

    const resultado = await service.importFromFile('v-1', contenido, actor);

    expect(resultado.totalRead).toBe(2);
    expect(resultado.inserted).toBe(2);
    expect(resultado.errors).toBe(0);
    expect(creados.map((c) => c.code)).toEqual(['A00', 'A01']);
    // En borrador: publicar la versión es lo que después los hace visibles.
    expect(creados.every((c) => c.stateConceptId === CONCEPTS.TERM_DRAFT)).toBe(
      true,
    );
    // El lote guarda la huella del archivo y a quién se lo pidió.
    expect(lotes[0]).toMatchObject({
      sourceId: 'src-1',
      codeSystemVersionId: 'v-1',
      recordedByUserId: 'actor-1',
    });
    // Sin `fileId`: el contenido no se almacena, así que no hay archivo al que
    // apuntar. Lo que identifica qué entró es la huella.
    expect(lotes[0].fileId).toBeUndefined();
    expect(String(lotes[0].checksum)).toHaveLength(64);
    // Y se cierra con los contadores.
    expect(tx.assign).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        totalRead: '2',
        totalInserted: '2',
        totalErrors: '0',
      }),
    );
  });

  it('las líneas vacías no cuentan como leídas', async () => {
    // Separan bloques y terminan el archivo: contarlas como error convertiría
    // todo archivo bien formado en uno con un error al final.
    const { service, archivo } = armar();
    const contenido = archivo('\n{"code":"A00","display":"Cólera"}\n\n\n');

    const resultado = await service.importFromFile('v-1', contenido, actor);

    expect(resultado.totalRead).toBe(1);
    expect(resultado.errors).toBe(0);
  });

  it('un archivo de puros saltos de línea no deja un lote fantasma', async () => {
    // Pesa más de cero bytes, así que esquivaba el corte por archivo vacío, y
    // no produce ni un error, así que también esquivaba el corte por «ninguna
    // línea válida»: respondía 201 con todo en cero y escribía en
    // `catalog_import_batches` un lote que no importó nada.
    const { service, archivo, lotes } = armar();

    await expect(
      service.importFromFile('v-1', archivo('\n\n\n'), actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(lotes).toHaveLength(0);
  });

  it('una línea rota no arrastra a las buenas', async () => {
    const { service, archivo, creados } = armar();
    const contenido = archivo(
      '{"code":"A00","display":"Cólera"}\n' +
        'esto no es json\n' +
        '{"code":"A02","display":"Salmonelosis"}\n',
    );

    const resultado = await service.importFromFile('v-1', contenido, actor);

    expect(resultado.inserted).toBe(2);
    expect(resultado.errors).toBe(1);
    expect(resultado.errorSamples[0]).toEqual({
      line: 2,
      message: 'La línea no es un JSON válido.',
    });
    expect(creados.map((c) => c.code)).toEqual(['A00', 'A02']);
  });

  it('rechaza las líneas sin código o sin rótulo, con su número', async () => {
    // Con una línea buena al final: un archivo entero de líneas malas se
    // rechaza por otra regla, y acá lo que se prueba es el reporte por línea.
    const { service, archivo } = armar();
    const contenido = archivo(
      '{"display":"Sin código"}\n' +
        '{"code":"A03"}\n' +
        '{"code":"","display":"Vacío"}\n' +
        '{"code":"A04","display":"Buena"}\n',
    );

    const resultado = await service.importFromFile('v-1', contenido, actor);

    expect(resultado.inserted).toBe(1);
    expect(resultado.errors).toBe(3);
    expect(resultado.errorSamples.map((e) => e.line)).toEqual([1, 2, 3]);
  });

  it('un código repetido dentro del archivo es un error del archivo', async () => {
    // Distinto de «ya existía en la base»: conviene que quien lo armó se entere.
    const { service, archivo } = armar();
    const contenido = archivo(
      '{"code":"A00","display":"Cólera"}\n{"code":"A00","display":"Otra vez"}\n',
    );

    const resultado = await service.importFromFile('v-1', contenido, actor);

    expect(resultado.inserted).toBe(1);
    expect(resultado.errors).toBe(1);
    expect(resultado.errorSamples[0].message).toContain('más de una vez');
  });

  it('un código que ya está en la versión se saltea, no se cuenta como error', async () => {
    const { service, archivo, creados } = armar({
      existentes: new Set(['A00']),
    });
    const contenido = archivo(
      '{"code":"A00","display":"Cólera"}\n{"code":"A01","display":"Tifoidea"}\n',
    );

    const resultado = await service.importFromFile('v-1', contenido, actor);

    expect(resultado.skipped).toBe(1);
    expect(resultado.inserted).toBe(1);
    expect(resultado.errors).toBe(0);
    expect(creados.map((c) => c.code)).toEqual(['A01']);
  });

  it('la muestra de errores se acota, aunque el archivo venga casi todo malo', async () => {
    // Un archivo mal formado puede tener cien mil líneas rotas; devolverlas
    // todas convertiría la respuesta en otro problema. Con una buena al final:
    // sin ninguna, el archivo se rechaza entero por otra regla.
    const { service, archivo } = armar();
    const contenido = archivo(
      Array.from({ length: 50 }, () => 'roto').join('\n') +
        '\n{"code":"A00","display":"La única buena"}\n',
    );

    const resultado = await service.importFromFile('v-1', contenido, actor);

    expect(resultado.errors).toBe(50);
    expect(resultado.errorSamples).toHaveLength(20);
  });

  it('no importa a una versión ya publicada', async () => {
    const { service, archivo, conceptsRepo } = armar({
      version: {
        id: 'v-1',
        codeSystemId: 'cs-1',
        stateConceptId: CONCEPTS.TERM_ACTIVE,
      },
    });
    const contenido = archivo('{"code":"A00","display":"Cólera"}\n');

    await expect(
      service.importFromFile('v-1', contenido, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    // Y no escribe nada: la precondición se comprueba antes de tocar la base.
    expect(conceptsRepo.create).not.toHaveBeenCalled();
  });

  it('acepta una versión sin estado, como las que dejan los ETL', async () => {
    const { service, archivo } = armar({
      version: { id: 'v-1', codeSystemId: 'cs-1', stateConceptId: null },
    });
    const contenido = archivo('{"code":"A00","display":"Cólera"}\n');

    const resultado = await service.importFromFile('v-1', contenido, actor);

    expect(resultado.inserted).toBe(1);
  });

  it('una versión inexistente es 404', async () => {
    const { service, archivo, versionsRepo } = armar();
    versionsRepo.findById.mockResolvedValue(null);

    await expect(
      service.importFromFile(
        'v-x',
        archivo('{"code":"A","display":"A"}'),
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
