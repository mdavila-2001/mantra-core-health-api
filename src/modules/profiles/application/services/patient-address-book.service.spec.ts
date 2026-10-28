import { jest } from '@jest/globals';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';

import { CONCEPTS } from '../../../../common';
import type {
  AddressBookRow,
  NewSavedAddress,
  PatientAddressBookPort,
} from '../ports/patient-address-book.port';
import {
  PatientAddressBookService,
  SAVED_ADDRESSES_MAX,
} from './patient-address-book.service';

/**
 * La libreta contra un DOBLE del puerto, en memoria.
 *
 * El doble aplica las mismas dos reglas que la base: «vigente» es `valid_to`
 * nulo, y no puede haber dos preferidas vigentes del mismo dueño al hacer
 * `flush` (el índice único `uq_addresses_owner_preferred`). Así las pruebas
 * fallan si el servicio escribe en el orden equivocado. La prueba contra
 * Postgres real del índice está en el repo del modelo.
 */
type Fila = { -readonly [K in keyof AddressBookRow]: AddressBookRow[K] } & {
  ownerId: string;
  validTo?: Date;
};

const YO = 'persona-yo';
const OTRA = 'persona-otra';
const MUNI = '00000000-0000-0000-0000-00000000aaaa';
const actor = { id: 'usuario-yo', roles: ['PATIENT'] } as never;

function crear() {
  const filas: Fila[] = [];
  let secuencia = 0;
  const nueva = (
    datos: Partial<Fila> & { ownerId: string; useConceptId: string },
  ): Fila => {
    const fila: Fila = {
      id: `dir-${++secuencia}`,
      isPreferred: false,
      ...datos,
    };
    filas.push(fila);
    return fila;
  };

  const verificarIndice = () => {
    const preferidas = new Map<string, number>();
    for (const f of filas) {
      if (!f.isPreferred || f.validTo) continue;
      preferidas.set(f.ownerId, (preferidas.get(f.ownerId) ?? 0) + 1);
      if (preferidas.get(f.ownerId)! > 1) {
        throw new UniqueConstraintViolationException(
          new Error('uq_addresses_owner_preferred'),
        );
      }
    }
  };

  const tx = { flush: jest.fn(() => Promise.resolve(verificarIndice())) };
  const em = {
    fork: () => tx,
    transactional: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };

  const book: PatientAddressBookPort = {
    listCurrent: jest.fn((_em, personId: string) =>
      Promise.resolve(
        filas.filter((f) => f.ownerId === personId && !f.validTo),
      ),
    ),
    createSaved: jest.fn((_em, d: NewSavedAddress) =>
      Promise.resolve(
        nueva({
          ownerId: d.personId,
          useConceptId: CONCEPTS.ADDR_USE_SAVED,
          label: d.label,
          lines: d.lines,
          municipalityConceptId: d.municipalityConceptId,
          isPreferred: d.isPreferred,
        }),
      ),
    ),
    close: jest.fn((row: AddressBookRow, at: Date) => {
      (row as Fila).validTo = at;
    }),
    setPreferred: jest.fn((row: AddressBookRow, preferida: boolean) => {
      (row as Fila).isPreferred = preferida;
    }),
    replaceFixed: jest.fn(
      (_em, d: { personId: string; useConceptId: string; lines?: string }) => {
        const actual = filas.find(
          (f) =>
            f.ownerId === d.personId &&
            f.useConceptId === d.useConceptId &&
            !f.validTo,
        );
        if (actual) actual.validTo = new Date();
        nueva({
          ownerId: d.personId,
          useConceptId: d.useConceptId,
          lines: d.lines,
        });
        return Promise.resolve();
      },
    ),
  };

  const accountLinks = {
    findActiveByUser: jest.fn(() => Promise.resolve({ personId: YO })),
  };
  const patients = {
    findById: jest.fn(() => Promise.resolve({ personId: YO })),
  };
  const logger = { info: jest.fn() };
  const service = new PatientAddressBookService(
    em as never,
    accountLinks as never,
    patients as never,
    book,
    logger as never,
  );

  const casa = nueva({
    ownerId: YO,
    useConceptId: CONCEPTS.ADDR_USE_HOME,
    lines: 'Av. Banzer 3er anillo',
    municipalityConceptId: MUNI,
    latitude: '-17.78',
    longitude: '-63.18',
  });
  const ajena = nueva({
    ownerId: OTRA,
    useConceptId: CONCEPTS.ADDR_USE_SAVED,
    label: 'Ajena',
  });
  return { service, filas, casa, ajena, tx };
}

const guardar = (label: string, isPreferred = false) => ({
  label,
  municipalityConceptId: MUNI,
  lines: ' Calle 1 #2 ',
  isPreferred,
});

describe('PatientAddressBookService', () => {
  it('sin ninguna marcada, la preferida es el domicilio y va primero', async () => {
    const { service } = crear();
    await service.create(guardar('Oficina'), actor);

    const libreta = await service.list(actor);

    expect(libreta.map((d) => [d.kind, d.label, d.isPreferred])).toEqual([
      ['HOME', 'Casa', true],
      ['SAVED', 'Oficina', false],
    ]);
    expect(libreta[0]).toMatchObject({ latitude: -17.78, longitude: -63.18 });
    expect(libreta[1].lines).toBe('Calle 1 #2');
  });

  it('guardar una preferida desmarca la anterior antes de escribir (índice único)', async () => {
    const { service } = crear();
    await service.create(guardar('Mamá', true), actor);

    const libreta = await service.create(guardar('Oficina', true), actor);

    expect(libreta.filter((d) => d.isPreferred).map((d) => d.label)).toEqual([
      'Oficina',
    ]);
    expect(libreta[0].label).toBe('Oficina');
  });

  it('preferir el domicilio desmarca las demás en vez de marcarlo', async () => {
    const { service, casa } = crear();
    await service.create(guardar('Mamá', true), actor);

    const libreta = await service.prefer(casa.id, actor);

    expect(casa.isPreferred).toBe(false);
    expect(libreta[0]).toMatchObject({ kind: 'HOME', isPreferred: true });
    expect(libreta.filter((d) => d.isPreferred)).toHaveLength(1);
  });

  it('corregir una guardada cierra la vigente y abre otra que conserva la marca', async () => {
    const { service, filas } = crear();
    const mama = (await service.create(guardar('Mamá', true), actor)).find(
      (d) => d.label === 'Mamá',
    )!;

    const libreta = await service.update(
      mama.id,
      { lines: 'Calle nueva 5' },
      actor,
    );

    const vieja = filas.find((f) => f.id === mama.id)!;
    expect(vieja.validTo).toBeInstanceOf(Date);
    const corregida = libreta.find((d) => d.label === 'Mamá')!;
    expect(corregida.id).not.toBe(mama.id);
    expect(corregida).toMatchObject({
      lines: 'Calle nueva 5',
      isPreferred: true,
    });
  });

  it('una dirección ajena responde 404, igual que una inexistente', async () => {
    const { service, ajena } = crear();

    await expect(service.prefer(ajena.id, actor)).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.remove(ajena.id, actor)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      service.update(ajena.id, { lines: 'x' }, actor),
    ).rejects.toMatchObject({
      status: 404,
    });
    expect(ajena.validTo).toBeUndefined();
  });

  it('el domicilio no se quita (422) y queda vigente', async () => {
    const { service, casa } = crear();

    await expect(service.remove(casa.id, actor)).rejects.toMatchObject({
      status: 422,
    });
    expect(casa.validTo).toBeUndefined();
  });

  it('quitar una guardada la cierra: no se borra, queda la historia', async () => {
    const { service, filas } = crear();
    const libreta = await service.create(guardar('Oficina'), actor);
    const oficina = libreta.find((d) => d.label === 'Oficina')!;

    const despues = await service.remove(oficina.id, actor);

    expect(despues.map((d) => d.label)).toEqual(['Casa']);
    expect(filas.find((f) => f.id === oficina.id)?.validTo).toBeInstanceOf(
      Date,
    );
  });

  it(`no guarda más de ${SAVED_ADDRESSES_MAX} direcciones además del domicilio`, async () => {
    const { service } = crear();
    for (let i = 0; i < SAVED_ADDRESSES_MAX; i += 1) {
      await service.create(guardar(`Lugar ${i}`), actor);
    }

    await expect(
      service.create(guardar('Una más'), actor),
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('el domicilio y el trabajo no cambian de nombre', async () => {
    const { service, casa } = crear();

    await expect(
      service.update(casa.id, { label: 'Mi depto' }, actor),
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('corregir el domicilio pasa por la regla de siempre (cierra y abre)', async () => {
    const { service, casa } = crear();

    const libreta = await service.update(
      casa.id,
      { lines: 'Av. Nueva 10' },
      actor,
    );

    expect(casa.validTo).toBeInstanceOf(Date);
    expect(libreta[0]).toMatchObject({ kind: 'HOME', lines: 'Av. Nueva 10' });
  });

  it('una carrera contra el índice único responde 409, no 500', async () => {
    const { service, filas } = crear();
    await service.create(guardar('Mamá', true), actor);
    // Otra pestaña dejó una segunda preferida vigente que esta escritura no vio.
    filas.push({
      id: 'carrera',
      ownerId: YO,
      useConceptId: CONCEPTS.ADDR_USE_SAVED,
      isPreferred: true,
    });

    await expect(
      service.create(guardar('Oficina'), actor),
    ).rejects.toMatchObject({
      status: 409,
    });
  });
});
