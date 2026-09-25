import { describe, expect, it, jest } from '@jest/globals';

import {
  CONCEPTS,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  ConceptFileImportService,
  ImportFileRejectedException,
} from './concept-file-import.service';
import * as XLSX from 'xlsx';

import { LECTOR_DE_IMPORTACION } from './import-parsers.provider';

const actor = { id: 'actor-1', roles: ['SECURITY_ADMIN'] } as never;

/**
 * Importar un archivo es reconocerlo, leerlo, validarlo y —si no hay ni un
 * problema— escribirlo entero.
 *
 * Lo que estas pruebas fijan es lo que se rompe en silencio: que un archivo con
 * errores no deje media importación adentro, que la validación sin escribir no
 * toque la base ni deje lote, que el formato se decida por contenido, y que el
 * registro no se lleve el contenido del archivo.
 *
 * El lector es el **real**: es la lista de formatos y perfiles disponibles, y
 * doblarla probaría el doble en vez del registro.
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
    LECTOR_DE_IMPORTACION,
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
    logger,
  };
}

/**
 * Una planilla que el detector reconoce pero nadie puede abrir: la firma del
 * contenedor y nada más detrás.
 */
function planilla(): Buffer {
  return Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from('xl/workbook.xml', 'utf8'),
  ]);
}

/**
 * Una planilla de verdad, con encabezado y filas.
 *
 * Se arma acá en vez de leerse de un archivo porque lo que se prueba es el
 * servicio, no el disco: el contenido tiene que estar a la vista de quien lee
 * la prueba.
 *
 * @param filas - Cada fila como `[code, display]`.
 * @returns El libro serializado, tal como llegaría subido.
 */
function planillaReal(filas: readonly (readonly string[])[]): Buffer {
  const libro = XLSX.utils.book_new();
  // `aoa_to_sheet` pide filas mutables: se copian acá en vez de aflojar el tipo
  // del parámetro, que es lo que deja claro que esta función no las toca.
  const celdas = [['code', 'display'], ...filas.map((fila) => [...fila])];
  XLSX.utils.book_append_sheet(
    libro,
    XLSX.utils.aoa_to_sheet(celdas),
    'conceptos',
  );

  return XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('ConceptFileImportService', () => {
  describe('el archivo entra entero', () => {
    it('importa las filas y deja el lote registrado', async () => {
      const { service, archivo, creados, lotes, tx } = armar();
      const contenido = archivo(
        '{"code":"A00","display":"Cólera"}\n' +
          '{"code":"A01","display":"Fiebre tifoidea","definition":"Por salmonella"}\n',
      );

      const resultado = await service.importFromFile('v-1', contenido, actor);

      expect(resultado).toMatchObject({
        format: 'ndjson',
        profile: 'conceptos',
        dryRun: false,
        aborted: false,
        totalRead: 2,
        inserted: 2,
        errors: 0,
      });
      expect(creados.map((c) => c.code)).toEqual(['A00', 'A01']);
      // En borrador: publicar la versión es lo que después los hace visibles.
      expect(
        creados.every((c) => c.stateConceptId === CONCEPTS.TERM_DRAFT),
      ).toBe(true);
      // El lote guarda la huella del archivo y a quién se lo pidió.
      expect(lotes[0]).toMatchObject({
        sourceId: 'src-1',
        codeSystemVersionId: 'v-1',
        recordedByUserId: 'actor-1',
      });
      // Sin `fileId`: el contenido no se almacena, así que no hay archivo al
      // que apuntar. Lo que identifica qué entró es la huella.
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

    it('lee una planilla igual que cualquier otro formato', async () => {
      // La planilla llegó por otro carril y se enchufa en la lista de
      // parseadores: el servicio no la nombra en ningún lado. Que entre sin
      // tocar ni el servicio ni el detector es exactamente lo que se buscaba.
      const { service, creados } = armar();

      const resultado = await service.importFromFile(
        'v-1',
        planillaReal([
          ['B00', 'Herpes'],
          ['B01', 'Varicela'],
        ]),
        actor,
      );

      expect(resultado).toMatchObject({
        format: 'xlsx',
        profile: 'conceptos',
        aborted: false,
        totalRead: 2,
        inserted: 2,
        errors: 0,
      });
      expect(creados.map((c) => c.code)).toEqual(['B00', 'B01']);
    });

    it('lee un CSV sin que nadie le diga que es un CSV', async () => {
      const { service, archivo, creados } = armar();

      const resultado = await service.importFromFile(
        'v-1',
        archivo('code,display\nZZ-001,Uno\nZZ-002,Dos\n'),
        actor,
      );

      expect(resultado.format).toBe('csv');
      expect(resultado.totalRead).toBe(2);
      expect(creados.map((c) => c.code)).toEqual(['ZZ-001', 'ZZ-002']);
    });

    it('las líneas vacías no cuentan como leídas', async () => {
      // Separan bloques y terminan el archivo: contarlas como error
      // convertiría todo archivo bien formado en uno con un error al final.
      const { service, archivo } = armar();

      const resultado = await service.importFromFile(
        'v-1',
        archivo('\n{"code":"A00","display":"Cólera"}\n\n\n'),
        actor,
      );

      expect(resultado.totalRead).toBe(1);
      expect(resultado.errors).toBe(0);
    });

    it('una definición vacía se guarda como ausente, no como texto en blanco', async () => {
      const { service, archivo, creados } = armar();

      await service.importFromFile(
        'v-1',
        archivo('code,display,definition\nZZ-001,Uno,\n'),
        actor,
      );

      expect(creados[0]).toMatchObject({ definition: undefined });
    });

    it('un código que ya está en la versión se saltea, no se cuenta como error', async () => {
      const { service, archivo, creados } = armar({
        existentes: new Set(['A00']),
      });

      const resultado = await service.importFromFile(
        'v-1',
        archivo(
          '{"code":"A00","display":"Cólera"}\n{"code":"A01","display":"Tifoidea"}\n',
        ),
        actor,
      );

      expect(resultado).toMatchObject({
        skipped: 1,
        inserted: 1,
        errors: 0,
        aborted: false,
      });
      expect(creados.map((c) => c.code)).toEqual(['A01']);
    });
  });

  describe('todo o nada: un problema y no entra nada', () => {
    // **Cambio de comportamiento declarado.** Antes se insertaban las filas
    // buenas y las malas se contaban: eso dejaba la versión a medio cargar, y
    // deshacerlo era borrar concepto por concepto sin saber cuáles habían
    // entrado. Ahora el archivo se corrige entero y se vuelve a subir.
    it('una línea rota deja el archivo entero afuera', async () => {
      const { service, archivo, creados, lotes } = armar();

      const resultado = await service.importFromFile(
        'v-1',
        archivo(
          '{"code":"A00","display":"Cólera"}\n' +
            'esto no es json\n' +
            '{"code":"A02","display":"Salmonelosis"}\n',
        ),
        actor,
      );

      expect(resultado).toMatchObject({
        aborted: true,
        inserted: 0,
        skipped: 0,
        errors: 1,
        totalRead: 3,
        batchId: null,
      });
      expect(resultado.errorSamples[0]).toEqual({
        line: 2,
        message: 'la línea no es un JSON válido',
      });
      // Ni conceptos ni lote: la versión queda exactamente como estaba.
      expect(creados).toHaveLength(0);
      expect(lotes).toHaveLength(0);
    });

    it('señala cada fila mala con su columna', async () => {
      const { service, archivo } = armar();

      const resultado = await service.importFromFile(
        'v-1',
        archivo(
          '{"display":"Sin código"}\n' +
            '{"code":"A03"}\n' +
            '{"code":"","display":"Vacío"}\n' +
            '{"code":"A04","display":"Buena"}\n',
        ),
        actor,
      );

      expect(resultado.aborted).toBe(true);
      expect(resultado.errors).toBe(3);
      expect(
        resultado.errorSamples.map((problema) => [
          problema.line,
          problema.column,
        ]),
      ).toEqual([
        [1, 'code'],
        [2, 'display'],
        [3, 'code'],
      ]);
    });

    it('una fila con NUL corta el archivo, no la tanda', async () => {
      // El NUL es JSON válido y Postgres no lo admite en un `text`. Rechazarlo
      // recién al escribir se llevaba puesta la tanda de 500 conceptos buenos.
      const { service, archivo, creados } = armar();
      const contenido = archivo(
        '{"code":"A00","display":"Cólera"}' +
          String.fromCharCode(10) +
          '{"code":"A01","display":"Ti' +
          String.fromCharCode(92) +
          'u0000fus"}' +
          String.fromCharCode(10),
      );

      const resultado = await service.importFromFile('v-1', contenido, actor);

      expect(resultado.aborted).toBe(true);
      expect(resultado.errors).toBe(1);
      expect(creados).toHaveLength(0);
    });

    it('un código repetido dentro del archivo es un error del archivo', async () => {
      // Distinto de «ya existía en la versión»: conviene que quien lo armó se
      // entere, porque una de las dos filas iba a perderse en silencio.
      const { service, archivo } = armar();

      const resultado = await service.importFromFile(
        'v-1',
        archivo(
          '{"code":"A00","display":"Cólera"}\n{"code":"A00","display":"Otra vez"}\n',
        ),
        actor,
      );

      expect(resultado.aborted).toBe(true);
      expect(resultado.errorSamples[0].message).toContain('repetido');
    });

    it('la muestra de errores se acota, aunque el archivo venga todo malo', async () => {
      // Un archivo mal formado puede tener cien mil filas rotas; devolverlas
      // todas convertiría la respuesta en otro problema. El archivo sí es un
      // CSV: un archivo que no es de ningún formato se rechaza antes, y ahí no
      // hay filas que contar.
      const { service, archivo } = armar();
      const filas = Array.from({ length: 50 }, () => ',Sin código');

      const resultado = await service.importFromFile(
        'v-1',
        archivo(['code,display', ...filas].join('\n') + '\n'),
        actor,
      );

      expect(resultado.errors).toBe(50);
      expect(resultado.errorSamples).toHaveLength(20);
    });
  });

  describe('validar sin escribir', () => {
    it('devuelve la vista previa y no toca ni la base ni el lote', async () => {
      const { service, archivo, creados, lotes } = armar();

      const resultado = await service.importFromFile(
        'v-1',
        archivo('code,display\nZZ-001,Uno\nZZ-002,Dos\n'),
        actor,
        { dryRun: true },
      );

      expect(resultado).toMatchObject({
        dryRun: true,
        aborted: false,
        totalRead: 2,
        inserted: 0,
        batchId: null,
      });
      expect(resultado.preview).toEqual([
        { line: 2, code: 'ZZ-001', display: 'Uno' },
        { line: 3, code: 'ZZ-002', display: 'Dos' },
      ]);
      expect(creados).toHaveLength(0);
      expect(lotes).toHaveLength(0);
    });

    it('la vista previa se acota a las primeras veinte filas', async () => {
      const { service, archivo } = armar();
      const filas = Array.from(
        { length: 30 },
        (_, indice) => `ZZ-${String(indice).padStart(3, '0')},Ejemplo`,
      );

      const resultado = await service.importFromFile(
        'v-1',
        archivo(['code,display', ...filas].join('\n') + '\n'),
        actor,
        { dryRun: true },
      );

      expect(resultado.totalRead).toBe(30);
      expect(resultado.preview).toHaveLength(20);
    });

    it('con errores no hay vista previa que mirar', async () => {
      const { service, archivo } = armar();

      const resultado = await service.importFromFile(
        'v-1',
        archivo('code,display\nZZ-001,\n'),
        actor,
        { dryRun: true },
      );

      expect(resultado.aborted).toBe(true);
      expect(resultado.preview).toBeUndefined();
    });
  });

  describe('lo que el archivo no puede ser', () => {
    it('un archivo de cero bytes tiene su propio código', async () => {
      const { service, archivo } = armar();

      await expect(
        service.importFromFile('v-1', archivo(''), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_EMPTY_FILE });
    });

    it('un archivo de puros saltos de línea no deja un lote fantasma', async () => {
      // Pesa más de cero bytes, así que esquivaba el corte por archivo vacío, y
      // no produce ni un error: respondía con todo en cero y escribía un lote
      // que no importó nada.
      const { service, archivo, lotes } = armar();

      await expect(
        service.importFromFile('v-1', archivo('\n\n\n'), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_EMPTY_FILE });
      expect(lotes).toHaveLength(0);
    });

    it('un CSV con sólo el encabezado está vacío, aunque pese', async () => {
      const { service, archivo } = armar();

      await expect(
        service.importFromFile('v-1', archivo('code,display\n'), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_EMPTY_FILE });
    });

    it('lo que no es ninguno de los formatos se rechaza con su motivo', async () => {
      const { service, archivo } = armar();

      await expect(
        service.importFromFile('v-1', archivo('texto suelto sin nada'), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_FORMAT_UNSUPPORTED });
    });

    it('una planilla ilegible se rechaza como archivo que no sirve, no como error interno', async () => {
      // Tiene la firma del contenedor, así que el detector la reconoce; abrirla
      // es otra cosa. Una planilla cifrada, truncada o corrupta hace reventar a
      // la biblioteca que la lee, y ese fallo no puede salir como error del
      // servidor: desde el lado de quien la subió el resultado es el mismo que
      // si el formato no se hubiera reconocido, y merece el mismo 422.
      const { service } = armar();

      await expect(
        service.importFromFile('v-1', planilla(), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_FORMAT_UNSUPPORTED });
    });

    it('un perfil que no existe se rechaza antes de mirar la versión', async () => {
      const { service, archivo, versionsRepo } = armar();

      await expect(
        service.importFromFile(
          'v-1',
          archivo('code,display\nZZ-001,Uno\n'),
          actor,
          { profile: 'inventado' },
        ),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_PROFILE_UNKNOWN });
      expect(versionsRepo.findById).not.toHaveBeenCalled();
    });

    it('ningún camino de archivo termina en un error sin clasificar', async () => {
      // Un 500 obliga a mirar los registros del servidor para entender qué
      // pasó con un archivo que alguien subió mal.
      const { service } = armar();
      const basura = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);

      await expect(
        service.importFromFile('v-1', basura, actor),
      ).rejects.toBeInstanceOf(ImportFileRejectedException);
    });
  });

  describe('la versión manda', () => {
    it('no importa a una versión ya publicada', async () => {
      const { service, archivo, conceptsRepo } = armar({
        version: {
          id: 'v-1',
          codeSystemId: 'cs-1',
          stateConceptId: CONCEPTS.TERM_ACTIVE,
        },
      });

      await expect(
        service.importFromFile(
          'v-1',
          archivo('{"code":"A00","display":"Cólera"}\n'),
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      // Y no escribe nada: la precondición se comprueba antes de tocar la base.
      expect(conceptsRepo.create).not.toHaveBeenCalled();
    });

    it('acepta una versión sin estado, como las que dejan los ETL', async () => {
      const { service, archivo } = armar({
        version: { id: 'v-1', codeSystemId: 'cs-1', stateConceptId: null },
      });

      const resultado = await service.importFromFile(
        'v-1',
        archivo('{"code":"A00","display":"Cólera"}\n'),
        actor,
      );

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

  it('el registro lleva cifras, nunca el contenido del archivo', async () => {
    // Dentro de la respuesta viajan las muestras de error y la vista previa,
    // que son filas del archivo. Registrar la respuesta entera las mandaría a
    // los logs del servidor.
    const { service, archivo, logger } = armar();

    await service.importFromFile(
      'v-1',
      archivo('code,display\nZZ-001,Uno\nZZ-002,\n'),
      actor,
      { dryRun: true },
    );

    const registrado = logger.info.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(registrado).toMatchObject({ format: 'csv', errors: 1 });
    expect(registrado.errorSamples).toBeUndefined();
    expect(registrado.preview).toBeUndefined();
    expect(JSON.stringify(registrado)).not.toContain('ZZ-001');
  });
});
