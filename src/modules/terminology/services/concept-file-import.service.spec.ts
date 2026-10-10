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

import { READER_IMPORT } from './import-parsers.provider';

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
function build(options?: { version?: unknown; existentes?: Set<string> }) {
  const version =
    options?.version === undefined
      ? { id: 'v-1', codeSystemId: 'cs-1', stateConceptId: CONCEPTS.TERM_DRAFT }
      : options.version;

  const created: { code: string; stateConceptId: string }[] = [];
  const batches: Record<string, unknown>[] = [];

  const tx = {
    create: jest.fn((_e: unknown, data: Record<string, unknown>) => {
      batches.push(data);
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
      .mockResolvedValue(options?.existentes ?? new Set<string>()),
    create: jest.fn(
      (_t: unknown, data: { code: string; stateConceptId: string }) => {
        created.push(data);
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
    READER_IMPORT,
    logger as never,
  );

  /** El contenido del archivo, como llega del interceptor de multipart. */
  const file = (text: string) => Buffer.from(text, 'utf8');

  return {
    service,
    archivo: file,
    creados: created,
    lotes: batches,
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
function spreadsheet(): Buffer {
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
 * @param rows - Cada fila como `[code, display]`.
 * @returns El libro serializado, tal como llegaría subido.
 */
function realSpreadsheet(rows: readonly (readonly string[])[]): Buffer {
  const book = XLSX.utils.book_new();
  // `aoa_to_sheet` pide filas mutables: se copian acá en vez de aflojar el tipo
  // del parámetro, que es lo que deja claro que esta función no las toca.
  const cells = [['code', 'display'], ...rows.map((row) => [...row])];
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet(cells),
    'conceptos',
  );

  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('ConceptFileImportService', () => {
  describe('el archivo entra entero', () => {
    it('importa las filas y deja el lote registrado', async () => {
      const { service, archivo: file, creados: created, lotes: batches, tx } = build();
      const content = file(
        '{"code":"A00","display":"Cólera"}\n' +
          '{"code":"A01","display":"Fiebre tifoidea","definition":"Por salmonella"}\n',
      );

      const result = await service.importFromFile('v-1', content, actor);

      expect(result).toMatchObject({
        format: 'ndjson',
        profile: 'conceptos',
        dryRun: false,
        aborted: false,
        totalRead: 2,
        inserted: 2,
        errors: 0,
      });
      expect(created.map((c) => c.code)).toEqual(['A00', 'A01']);
      // En borrador: publicar la versión es lo que después los hace visibles.
      expect(
        created.every((c) => c.stateConceptId === CONCEPTS.TERM_DRAFT),
      ).toBe(true);
      // El lote guarda la huella del archivo y a quién se lo pidió.
      expect(batches[0]).toMatchObject({
        sourceId: 'src-1',
        codeSystemVersionId: 'v-1',
        recordedByUserId: 'actor-1',
      });
      // Sin `fileId`: el contenido no se almacena, así que no hay archivo al
      // que apuntar. Lo que identifica qué entró es la huella.
      expect(batches[0].fileId).toBeUndefined();
      expect(String(batches[0].checksum)).toHaveLength(64);
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
      const { service, creados: created } = build();

      const result = await service.importFromFile(
        'v-1',
        realSpreadsheet([
          ['B00', 'Herpes'],
          ['B01', 'Varicela'],
        ]),
        actor,
      );

      expect(result).toMatchObject({
        format: 'xlsx',
        profile: 'conceptos',
        aborted: false,
        totalRead: 2,
        inserted: 2,
        errors: 0,
      });
      expect(created.map((c) => c.code)).toEqual(['B00', 'B01']);
    });

    it('lee un CSV sin que nadie le diga que es un CSV', async () => {
      const { service, archivo: file, creados: created } = build();

      const result = await service.importFromFile(
        'v-1',
        file('code,display\nZZ-001,Uno\nZZ-002,Dos\n'),
        actor,
      );

      expect(result.format).toBe('csv');
      expect(result.totalRead).toBe(2);
      expect(created.map((c) => c.code)).toEqual(['ZZ-001', 'ZZ-002']);
    });

    it('las líneas vacías no cuentan como leídas', async () => {
      // Separan bloques y terminan el archivo: contarlas como error
      // convertiría todo archivo bien formado en uno con un error al final.
      const { service, archivo: file } = build();

      const result = await service.importFromFile(
        'v-1',
        file('\n{"code":"A00","display":"Cólera"}\n\n\n'),
        actor,
      );

      expect(result.totalRead).toBe(1);
      expect(result.errors).toBe(0);
    });

    it('una definición vacía se guarda como ausente, no como texto en blanco', async () => {
      const { service, archivo: file, creados: created } = build();

      await service.importFromFile(
        'v-1',
        file('code,display,definition\nZZ-001,Uno,\n'),
        actor,
      );

      expect(created[0]).toMatchObject({ definition: undefined });
    });

    it('un código que ya está en la versión se saltea, no se cuenta como error', async () => {
      const { service, archivo: file, creados: created } = build({
        existentes: new Set(['A00']),
      });

      const result = await service.importFromFile(
        'v-1',
        file(
          '{"code":"A00","display":"Cólera"}\n{"code":"A01","display":"Tifoidea"}\n',
        ),
        actor,
      );

      expect(result).toMatchObject({
        skipped: 1,
        inserted: 1,
        errors: 0,
        aborted: false,
      });
      expect(created.map((c) => c.code)).toEqual(['A01']);
    });
  });

  describe('todo o nada: un problema y no entra nada', () => {
    // **Cambio de comportamiento declarado.** Antes se insertaban las filas
    // buenas y las malas se contaban: eso dejaba la versión a medio cargar, y
    // deshacerlo era borrar concepto por concepto sin saber cuáles habían
    // entrado. Ahora el archivo se corrige entero y se vuelve a subir.
    it('una línea rota deja el archivo entero afuera', async () => {
      const { service, archivo: file, creados: created, lotes: batches } = build();

      const result = await service.importFromFile(
        'v-1',
        file(
          '{"code":"A00","display":"Cólera"}\n' +
            'esto no es json\n' +
            '{"code":"A02","display":"Salmonelosis"}\n',
        ),
        actor,
      );

      expect(result).toMatchObject({
        aborted: true,
        inserted: 0,
        skipped: 0,
        errors: 1,
        totalRead: 3,
        batchId: null,
      });
      expect(result.errorSamples[0]).toEqual({
        line: 2,
        message: 'la línea no es un JSON válido',
      });
      // Ni conceptos ni lote: la versión queda exactamente como estaba.
      expect(created).toHaveLength(0);
      expect(batches).toHaveLength(0);
    });

    it('señala cada fila mala con su columna', async () => {
      const { service, archivo: file } = build();

      const result = await service.importFromFile(
        'v-1',
        file(
          '{"display":"Sin código"}\n' +
            '{"code":"A03"}\n' +
            '{"code":"","display":"Vacío"}\n' +
            '{"code":"A04","display":"Buena"}\n',
        ),
        actor,
      );

      expect(result.aborted).toBe(true);
      expect(result.errors).toBe(3);
      expect(
        result.errorSamples.map((problem) => [problem.line, problem.column]),
      ).toEqual([
        [1, 'code'],
        [2, 'display'],
        [3, 'code'],
      ]);
    });

    it('una fila con NUL corta el archivo, no la tanda', async () => {
      // El NUL es JSON válido y Postgres no lo admite en un `text`. Rechazarlo
      // recién al escribir se llevaba puesta la tanda de 500 conceptos buenos.
      const { service, archivo: file, creados: created } = build();
      const content = file(
        '{"code":"A00","display":"Cólera"}' +
          String.fromCharCode(10) +
          '{"code":"A01","display":"Ti' +
          String.fromCharCode(92) +
          'u0000fus"}' +
          String.fromCharCode(10),
      );

      const result = await service.importFromFile('v-1', content, actor);

      expect(result.aborted).toBe(true);
      expect(result.errors).toBe(1);
      expect(created).toHaveLength(0);
    });

    it('un código repetido dentro del archivo es un error del archivo', async () => {
      // Distinto de «ya existía en la versión»: conviene que quien lo armó se
      // entere, porque una de las dos filas iba a perderse en silencio.
      const { service, archivo: file } = build();

      const result = await service.importFromFile(
        'v-1',
        file(
          '{"code":"A00","display":"Cólera"}\n{"code":"A00","display":"Otra vez"}\n',
        ),
        actor,
      );

      expect(result.aborted).toBe(true);
      expect(result.errorSamples[0].message).toContain('repetido');
    });

    it('la muestra de errores se acota, aunque el archivo venga todo malo', async () => {
      // Un archivo mal formado puede tener cien mil filas rotas; devolverlas
      // todas convertiría la respuesta en otro problema. El archivo sí es un
      // CSV: un archivo que no es de ningún formato se rechaza antes, y ahí no
      // hay filas que contar.
      const { service, archivo: file } = build();
      const rows = Array.from({ length: 50 }, () => ',Sin código');

      const result = await service.importFromFile(
        'v-1',
        file(['code,display', ...rows].join('\n') + '\n'),
        actor,
      );

      expect(result.errors).toBe(50);
      expect(result.errorSamples).toHaveLength(20);
    });
  });

  describe('validar sin escribir', () => {
    it('devuelve la vista previa y no toca ni la base ni el lote', async () => {
      const { service, archivo: file, creados: created, lotes: batches } = build();

      const result = await service.importFromFile(
        'v-1',
        file('code,display\nZZ-001,Uno\nZZ-002,Dos\n'),
        actor,
        { dryRun: true },
      );

      expect(result).toMatchObject({
        dryRun: true,
        aborted: false,
        totalRead: 2,
        inserted: 0,
        batchId: null,
      });
      expect(result.preview).toEqual([
        { line: 2, code: 'ZZ-001', display: 'Uno' },
        { line: 3, code: 'ZZ-002', display: 'Dos' },
      ]);
      expect(created).toHaveLength(0);
      expect(batches).toHaveLength(0);
    });

    it('la vista previa se acota a las primeras veinte filas', async () => {
      const { service, archivo: file } = build();
      const rows = Array.from(
        { length: 30 },
        (_, index) => `ZZ-${String(index).padStart(3, '0')},Ejemplo`,
      );

      const result = await service.importFromFile(
        'v-1',
        file(['code,display', ...rows].join('\n') + '\n'),
        actor,
        { dryRun: true },
      );

      expect(result.totalRead).toBe(30);
      expect(result.preview).toHaveLength(20);
    });

    it('con errores no hay vista previa que mirar', async () => {
      const { service, archivo: file } = build();

      const result = await service.importFromFile(
        'v-1',
        file('code,display\nZZ-001,\n'),
        actor,
        { dryRun: true },
      );

      expect(result.aborted).toBe(true);
      expect(result.preview).toBeUndefined();
    });
  });

  describe('lo que el archivo no puede ser', () => {
    it('un archivo de cero bytes tiene su propio código', async () => {
      const { service, archivo: file } = build();

      await expect(
        service.importFromFile('v-1', file(''), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_EMPTY_FILE });
    });

    it('un archivo de puros saltos de línea no deja un lote fantasma', async () => {
      // Pesa más de cero bytes, así que esquivaba el corte por archivo vacío, y
      // no produce ni un error: respondía con todo en cero y escribía un lote
      // que no importó nada.
      const { service, archivo: file, lotes: batches } = build();

      await expect(
        service.importFromFile('v-1', file('\n\n\n'), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_EMPTY_FILE });
      expect(batches).toHaveLength(0);
    });

    it('un CSV con sólo el encabezado está vacío, aunque pese', async () => {
      const { service, archivo: file } = build();

      await expect(
        service.importFromFile('v-1', file('code,display\n'), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_EMPTY_FILE });
    });

    it('lo que no es ninguno de los formatos se rechaza con su motivo', async () => {
      const { service, archivo: file } = build();

      await expect(
        service.importFromFile('v-1', file('texto suelto sin nada'), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_FORMAT_UNSUPPORTED });
    });

    it('una planilla ilegible se rechaza como archivo que no sirve, no como error interno', async () => {
      // Tiene la firma del contenedor, así que el detector la reconoce; abrirla
      // es otra cosa. Una planilla cifrada, truncada o corrupta hace reventar a
      // la biblioteca que la lee, y ese fallo no puede salir como error del
      // servidor: desde el lado de quien la subió el resultado es el mismo que
      // si el formato no se hubiera reconocido, y merece el mismo 422.
      const { service } = build();

      await expect(
        service.importFromFile('v-1', spreadsheet(), actor),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_FORMAT_UNSUPPORTED });
    });

    it('un perfil que no existe se rechaza antes de mirar la versión', async () => {
      const { service, archivo: file, versionsRepo } = build();

      await expect(
        service.importFromFile(
          'v-1',
          file('code,display\nZZ-001,Uno\n'),
          actor,
          { profile: 'inventado' },
        ),
      ).rejects.toMatchObject({ code: ErrorCode.IMPORT_PROFILE_UNKNOWN });
      expect(versionsRepo.findById).not.toHaveBeenCalled();
    });

    it('ningún camino de archivo termina en un error sin clasificar', async () => {
      // Un 500 obliga a mirar los registros del servidor para entender qué
      // pasó con un archivo que alguien subió mal.
      const { service } = build();
      const garbage = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);

      await expect(
        service.importFromFile('v-1', garbage, actor),
      ).rejects.toBeInstanceOf(ImportFileRejectedException);
    });
  });

  describe('la versión manda', () => {
    it('no importa a una versión ya publicada', async () => {
      const { service, archivo: file, conceptsRepo } = build({
        version: {
          id: 'v-1',
          codeSystemId: 'cs-1',
          stateConceptId: CONCEPTS.TERM_ACTIVE,
        },
      });

      await expect(
        service.importFromFile(
          'v-1',
          file('{"code":"A00","display":"Cólera"}\n'),
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      // Y no escribe nada: la precondición se comprueba antes de tocar la base.
      expect(conceptsRepo.create).not.toHaveBeenCalled();
    });

    it('acepta una versión sin estado, como las que dejan los ETL', async () => {
      const { service, archivo: file } = build({
        version: { id: 'v-1', codeSystemId: 'cs-1', stateConceptId: null },
      });

      const result = await service.importFromFile(
        'v-1',
        file('{"code":"A00","display":"Cólera"}\n'),
        actor,
      );

      expect(result.inserted).toBe(1);
    });

    it('una versión inexistente es 404', async () => {
      const { service, archivo: file, versionsRepo } = build();
      versionsRepo.findById.mockResolvedValue(null);

      await expect(
        service.importFromFile(
          'v-x',
          file('{"code":"A","display":"A"}'),
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  it('el registro lleva cifras, nunca el contenido del archivo', async () => {
    // Dentro de la respuesta viajan las muestras de error y la vista previa,
    // que son filas del archivo. Registrar la respuesta entera las mandaría a
    // los logs del servidor.
    const { service, archivo: file, logger } = build();

    await service.importFromFile(
      'v-1',
      file('code,display\nZZ-001,Uno\nZZ-002,\n'),
      actor,
      { dryRun: true },
    );

    const registered = logger.info.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(registered).toMatchObject({ format: 'csv', errors: 1 });
    expect(registered.errorSamples).toBeUndefined();
    expect(registered.preview).toBeUndefined();
    expect(JSON.stringify(registered)).not.toContain('ZZ-001');
  });
});
