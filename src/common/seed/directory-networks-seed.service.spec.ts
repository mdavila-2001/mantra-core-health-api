import { jest } from '@jest/globals';
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

import { DirectoryNetworksSeedService } from './directory-networks-seed.service';
import networksDataset from './data/bolivia/provider-networks.dataset.json';

function build() {
  const em = {
    findOne: fn().mockResolvedValue(null),
    find: fn().mockResolvedValue([]),
  };
  const orm = { em: { fork: fn(() => em) } };
  const registration = {
    registerPractitioner: fn().mockResolvedValue({
      userId: 'u-1',
      practitionerProfileId: 'p-1',
      ownPracticeId: 'pr-1',
    }),
  };
  const sites = {
    listSitesOfPractitioner: fn().mockResolvedValue([]),
    createOwnSite: fn().mockResolvedValue({ practiceId: 'pr-1' }),
  };
  const insurance = {
    addMembership: fn().mockResolvedValue({ id: 'm-1' }),
    createProviderNetwork: fn().mockResolvedValue({ id: 'net-1' }),
  };
  const valueSets = {
    findByInternalCode: fn().mockResolvedValue(null),
    findIncludedConceptIdsByValueSet: fn().mockResolvedValue([]),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };
  const service = new DirectoryNetworksSeedService(
    orm as never,
    registration as never,
    sites as never,
    {} as never,
    insurance as never,
    valueSets as never,
    logger as never,
  );
  return { service, em, registration, sites, insurance };
}

describe('DirectoryNetworksSeedService', () => {
  it('sin SEED_DIRECTORY_NETWORKS_ENABLED no hace nada', async () => {
    const { service, registration } = build();
    const r = await service.run(false, '12345678');
    expect(r.reason).toBe('not-configured');
    expect(registration.registerPractitioner).not.toHaveBeenCalled();
  });

  it('sin el actor de arranque no siembra redes ni membresías', async () => {
    const { service, registration } = build();
    const r = await service.run(true, '12345678');
    expect(r.reason).toBe('seed-actor-missing');
    expect(registration.registerPractitioner).not.toHaveBeenCalled();
  });

  it('pliega las filas repetidas: una persona por nombre, no una por fila', () => {
    const { service } = build();
    const fichas = (service as any).fichas() as {
      key: string;
      sedes: unknown[];
    }[];
    const filas = networksDataset.datos.redes.reduce(
      (n, r) => n + r.profesionales.length,
      0,
    );
    expect(fichas.length).toBeLessThan(filas);
    expect(new Set(fichas.map((f) => f.key)).size).toBe(fichas.length);
  });

  it('un médico habilitado por las dos redes queda con las dos y con todas sus sedes', () => {
    const { service } = build();
    const fichas = (service as any).fichas() as {
      carriers: string[];
      sedes: { direccion: string }[];
    }[];
    const enLasDos = fichas.filter((f) => f.carriers.length === 2);
    expect(enLasDos.length).toBeGreaterThan(0);
    for (const f of fichas) {
      expect(new Set(f.sedes.map((s) => s.direccion)).size).toBe(
        f.sedes.length,
      );
    }
  });

  it('el correo sintético es determinista y con el dominio reservado', () => {
    const { service } = build();
    const ficha = {
      key: 'abasto vega rosemary',
      nombre: 'Abasto Vega Rosemary',
    };
    const a = (service as any).emailDe(ficha);
    expect(a).toBe((service as any).emailDe(ficha));
    expect(a).toMatch(/@alovida\.test$/);
  });

  it('los teléfonos de la sede viajan en la dirección', () => {
    const { service } = build();
    const s = (service as any).sitioDe({
      direccion: 'AV. X 123',
      telefonos: ['76322931', '800101055'],
      source_file: 'a.md',
      source_row: 1,
    });
    expect(s.address.lines).toEqual(['AV. X 123', 'Tel: 76322931 / 800101055']);
  });
});
