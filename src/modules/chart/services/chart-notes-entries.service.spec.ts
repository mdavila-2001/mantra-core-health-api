import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import { ChartNotesService } from './chart-notes.service';
import {
  readNoteEntries,
  toChartNoteItem,
  toEntriesJson,
} from './chart-note-item.mapper';
import { CHART } from '../chart.concepts';
import { runWithTenant } from '../../../common';

/**
 * P39 — filas campo/valor de la nota médica (`entries_json`).
 *
 * Las filas son parte de la VERSIÓN: se escriben al crear la nota, al
 * agregar una versión y al enmendar, entran al sello de la firma y se leen
 * de la versión vigente. Datos sintéticos.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const actor = { id: 'clin-1', roles: [], practitionerProfileId: 's1' } as any;
const ROWS = [
  { label: 'Campo sintético A', value: 'Valor A' },
  { label: 'Campo sintético B', value: 'Valor B' },
];

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const notesRepo: any = {
    findHeaderById: mockFn(),
    findVersionById: mockFn(),
    maxVersionNumber: mockFn().mockResolvedValue(1),
    findSignatures: mockFn().mockResolvedValue([]),
    createHeader: mockFn(() => ({
      id: 'h1',
      lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
    })),
    createVersion: mockFn(() => ({
      id: 'v2',
      versionNumber: 2,
      statusConceptId: CHART.VERSION_DRAFT,
    })),
    createSignature: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const clinicalRead = {
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  const encounterScope = {
    assertEncounterBelongsToPatientAndWritable: mockFn(),
  };
  const raw = new ChartNotesService(
    em as any,
    notesRepo,
    logger as any,
    clinicalRead as any,
    encounterScope as any,
  );
  const service = new Proxy(raw, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(TENANT, () => value.apply(target, args));
    },
  });
  return { service, notesRepo, clinicalRead };
}

const draftHeader = () => ({
  id: 'h1',
  patientProfileId: 'p1',
  currentVersionId: 'v1',
  lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
});

describe('ChartNotesService · filas campo/valor (P39)', () => {
  it('createNote guarda las filas en la versión 1', async () => {
    const d = build();
    await d.service.createNote(
      { patientProfileId: 'p1', entries: ROWS, subjectiveText: 'libre' },
      actor,
    );
    expect(d.notesRepo.createVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ versionNumber: 1, entriesJson: ROWS }),
    );
  });

  it('createNote sin filas (o con []) deja entries_json en null', async () => {
    const d = build();
    await d.service.createNote({ patientProfileId: 'p1' }, actor);
    await d.service.createNote({ patientProfileId: 'p1', entries: [] }, actor);
    for (const [, data] of d.notesRepo.createVersion.mock.calls) {
      expect(data.entriesJson).toBeNull();
    }
  });

  it('addVersion crea una versión NUEVA con sus filas y no toca la anterior', async () => {
    const d = build();
    d.notesRepo.findHeaderById.mockResolvedValue(draftHeader());
    await d.service.addVersion('h1', { entries: [ROWS[0]] }, actor);
    expect(d.notesRepo.createVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        versionNumber: 2,
        supersedesVersionId: 'v1',
        entriesJson: [ROWS[0]],
      }),
    );
  });

  it('addVersion valida la escritura sobre la historia del paciente de la cabecera', async () => {
    const d = build();
    d.notesRepo.findHeaderById.mockResolvedValue(draftHeader());
    d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
      new Error('forbidden'),
    );
    await expect(
      d.service.addVersion('h1', { entries: ROWS }, actor),
    ).rejects.toThrow('forbidden');
    expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
      'p1',
      actor,
    );
    expect(d.notesRepo.createVersion).not.toHaveBeenCalled();
  });

  it('amendNote lleva las filas a la versión de la enmienda', async () => {
    const d = build();
    d.notesRepo.findHeaderById.mockResolvedValue({
      ...draftHeader(),
      lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_SIGNED,
    });
    await d.service.amendNote(
      'h1',
      { amendmentReasonText: 'Corrección sintética', entries: ROWS },
      actor,
    );
    expect(d.notesRepo.createVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ entriesJson: ROWS }),
    );
  });

  describe('sello de la firma', () => {
    const sign = async (content: any): Promise<string> => {
      const d = build();
      const version: any = {
        id: 'v1',
        clinicalNoteId: 'h1',
        statusConceptId: CHART.VERSION_DRAFT,
        ...content,
      };
      d.notesRepo.findVersionById.mockResolvedValue(version);
      d.notesRepo.findHeaderById.mockResolvedValue(draftHeader());
      await d.service.signVersion('h1', 'v1', {}, actor);
      return version.contentHash;
    };

    it('una versión SOAP pura conserva el mismo hash que antes de P39', async () => {
      const hash = await sign({ subjectiveText: 's' });
      const before = createHash('sha256')
        .update(JSON.stringify({ c: null, s: 's', o: null, a: null, p: null }))
        .digest('hex');
      expect(hash).toBe(before);
    });

    it('las filas entran al sello: cambiar una fila cambia el hash', async () => {
      const a = await sign({ subjectiveText: 's', entriesJson: ROWS });
      const b = await sign({
        subjectiveText: 's',
        entriesJson: [ROWS[0], { label: 'Campo sintético B', value: 'otro' }],
      });
      const soap = await sign({ subjectiveText: 's' });
      expect(a).not.toBe(b);
      expect(a).not.toBe(soap);
    });
  });
});

describe('mapeo de filas (P39)', () => {
  it('toEntriesJson: null sin filas, copia limpia con filas', () => {
    expect(toEntriesJson(undefined)).toBeNull();
    expect(toEntriesJson([])).toBeNull();
    const extra = [{ label: 'L', value: 'V', otra: 1 } as any];
    expect(toEntriesJson(extra)).toEqual([{ label: 'L', value: 'V' }]);
  });

  it('readNoteEntries: undefined si la columna es null o no es arreglo', () => {
    expect(readNoteEntries(null)).toBeUndefined();
    expect(readNoteEntries(undefined)).toBeUndefined();
    expect(readNoteEntries({ label: 'L' })).toBeUndefined();
    expect(readNoteEntries([])).toBeUndefined();
  });

  it('readNoteEntries: descarta filas mal formadas y respeta el orden', () => {
    expect(
      readNoteEntries([
        ROWS[1],
        null,
        { label: 1, value: 'x' },
        { label: 'sin valor' },
        ROWS[0],
      ]),
    ).toEqual([ROWS[1], ROWS[0]]);
  });

  it('toChartNoteItem expone las filas de la versión vigente', () => {
    const header: any = {
      id: 'h1',
      lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
      createdAt: new Date(0),
    };
    expect(
      toChartNoteItem(header, { entriesJson: ROWS } as any).entries,
    ).toEqual(ROWS);
    expect(toChartNoteItem(header, undefined).entries).toBeUndefined();
  });
});
