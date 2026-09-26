import { jest } from '@jest/globals';
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PeopleSeedService } from './people-seed.service';
import { ConflictException } from '../errors/domain.exception';

const MEDICOS = `# USUARIO MEDICOS 1

| NUMERO | NOMBRE | NOMBRE 2 | APELLIDO PATERNO | APELLIDO MATERNO | MATRICULA MINISTERIO DE SALUD Y DEPORTES | SEDES GOBERNACION SANTA CRUZ | REGISTRO COLEGIO ODONTOLOGOS | OCUPACION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | XIOMARA |  | CUELLAR | JUSTINIANO | C-1894 | T.I. 538/14 |  | CIRUJANO ODONTOLOGO |
| 2 | SIN MATRICULA |  | APELLIDO |  |  |  |  | CIRUJANO ODONTOLOGO |
`;

const PACIENTES = `# USUARIO PACIENTES 1

| NUMERO | NOMBRE | NOMBRE 2 | APELLIDO PATERNO | APELLIDO MATERNO | OCUPACION |
| --- | --- | --- | --- | --- | --- |
| 1 | LICZY | PAOLA | NUÑEZ | CALLEJAS | ABOGADA |
`;

function build() {
  const em = { fork: fn(() => ({ findOne: fn().mockResolvedValue(null) })) };
  const orm = { em };
  const practitionerRegistration = {
    registerPractitioner: fn().mockResolvedValue({ userId: 'u-1' }),
  };
  const patientRegistration = {
    registerPatient: fn().mockResolvedValue({ userId: 'u-2' }),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };
  const service = new PeopleSeedService(
    orm as never,
    practitionerRegistration as never,
    patientRegistration as never,
    logger as never,
  );
  return {
    service,
    orm,
    em,
    practitionerRegistration,
    patientRegistration,
    logger,
  };
}

describe('PeopleSeedService', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'people-seed-'));
    writeFileSync(join(dir, 'USUARIO_MEDICOS_1.md'), MEDICOS, 'utf-8');
    writeFileSync(join(dir, 'USUARIO_PACIENTES_1.md'), PACIENTES, 'utf-8');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('sin SEED_PEOPLE_ENABLED no hace nada', async () => {
    const { service, practitionerRegistration } = build();
    const resultado = await service.run(false, '12345678', dir);
    expect(resultado.reason).toBe('not-configured');
    expect(
      practitionerRegistration.registerPractitioner,
    ).not.toHaveBeenCalled();
  });

  it('sin contraseña no hace nada, aunque esté habilitado', async () => {
    const { service } = build();
    const resultado = await service.run(true, undefined, dir);
    expect(resultado.reason).toBe('not-configured');
  });

  it('si no encuentra el padrón, lo dice y no falla', async () => {
    const { service } = build();
    const resultado = await service.run(true, '12345678', '/no/existe');
    expect(resultado.reason).toBe('source-not-found');
  });

  it('da de alta al médico con matrícula y salta al que no la tiene', async () => {
    const { service, practitionerRegistration } = build();
    const resultado = await service.run(true, '12345678', dir);

    expect(resultado.practitionersCreated).toBe(1);
    expect(resultado.skipped).toEqual([
      expect.stringContaining('sin matrícula del Ministerio'),
    ]);
    expect(practitionerRegistration.registerPractitioner).toHaveBeenCalledWith(
      expect.objectContaining({
        licenseNumber: 'C-1894',
        credentialNumber: 'T.I. 538/14',
        name: 'XIOMARA',
        lastName: 'CUELLAR',
        password: '12345678',
      }),
    );
  });

  it('da de alta al paciente, con nationalId y birthDate inventados (no del markdown)', async () => {
    const { service, patientRegistration } = build();
    await service.run(true, '12345678', dir);

    expect(patientRegistration.registerPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'LICZY',
        lastName: 'NUÑEZ',
        sexAtBirth: 'UNKNOWN',
        password: '12345678',
      }),
    );
    const [dto] = patientRegistration.registerPatient.mock.calls[0] as [
      { nationalId: string; birthDate: string },
    ];
    // Ninguno de los dos viene del markdown de prueba (que no los declara):
    // si el DTO los trae, salieron del generador determinista.
    expect(dto.nationalId).toMatch(/^[1-9][0-9]{6}$/);
    expect(dto.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('no reintenta un médico cuya credencial ya existe (por email)', async () => {
    const { service, orm, practitionerRegistration } = build();
    (orm.em.fork as jest.Mock).mockReturnValue({
      findOne: fn().mockResolvedValue({ id: 'ya-existe' }),
      create: fn(),
      flush: fn().mockResolvedValue(undefined),
    });

    const resultado = await service.run(true, '12345678', dir);

    expect(
      practitionerRegistration.registerPractitioner,
    ).not.toHaveBeenCalled();
    expect(resultado.practitionersExisting).toBe(1);
  });

  it('un paciente ya existente se cuenta como existente, no como problema', async () => {
    // Regresión del bug real: el paciente entra con `nationalId`, no con
    // `email` — comprobar por email nunca lo encuentra, y sin este camino la
    // segunda pasada reintentaba las 92 altas y las resolvía sólo por la
    // excepción del propio servicio.
    const { service, patientRegistration } = build();
    patientRegistration.registerPatient.mockRejectedValueOnce(
      new ConflictException(
        'Ya existe una cuenta con ese documento de identidad',
      ),
    );

    const resultado = await service.run(true, '12345678', dir);

    expect(resultado.patientsExisting).toBe(1);
    expect(resultado.patientsCreated).toBe(0);
    expect(resultado.skipped).not.toContainEqual(
      expect.stringContaining('documento de identidad'),
    );
  });

  it('un fallo real (no de duplicado) se registra en skipped, no se traga', async () => {
    const { service, practitionerRegistration } = build();
    practitionerRegistration.registerPractitioner.mockRejectedValueOnce(
      new Error('boom'),
    );

    const resultado = await service.run(true, '12345678', dir);

    expect(resultado.practitionersCreated).toBe(0);
    expect(resultado.skipped).toContainEqual(expect.stringContaining('boom'));
  });

  it('deja la procedencia (archivo#fila + marca sintética) de cada persona sembrada', async () => {
    const { service, orm } = build();
    const creadas: any[] = [];
    const em: any = {};
    (orm.em.fork as jest.Mock).mockReturnValue(em);
    em.findOne = fn((entidad: { name: string }) => {
      if (entidad.name === 'AuthenticationCredentials')
        return Promise.resolve({ userId: 'u-1' });
      if (entidad.name === 'PersonAccountLinks')
        return Promise.resolve({ personId: 'p-1' });
      return Promise.resolve(null);
    });
    em.create = fn((_e: unknown, datos: unknown) => creadas.push(datos));
    em.flush = fn().mockResolvedValue(undefined);

    const r = await service.run(true, '12345678', dir);

    expect(r.provenanceWritten).toBeGreaterThan(0);
    const fuentes = creadas.filter(
      (c) => c.system === 'padrón del stakeholder',
    );
    expect(fuentes.map((c) => c.value)).toContain('USUARIO_MEDICOS_1.md#1');
    expect(fuentes.map((c) => c.value)).toContain('USUARIO_PACIENTES_1.md#1');
    expect(creadas.filter((c) => c.value === 'true').length).toBe(
      fuentes.length,
    );
    for (const c of creadas) expect(c.ownerId).toBe('p-1');
  });
});
