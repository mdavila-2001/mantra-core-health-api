import { jest } from '@jest/globals';
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PeopleSeedService } from './people-seed.service';
import { ConflictException } from '../errors/domain.exception';

const DOCTORS = `# USUARIO MEDICOS 1

| NUMERO | NOMBRE | NOMBRE 2 | APELLIDO PATERNO | APELLIDO MATERNO | MATRICULA MINISTERIO DE SALUD Y DEPORTES | SEDES GOBERNACION SANTA CRUZ | REGISTRO COLEGIO ODONTOLOGOS | OCUPACION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | XIOMARA |  | CUELLAR | JUSTINIANO | C-1894 | T.I. 538/14 |  | CIRUJANO ODONTOLOGO |
| 2 | SIN MATRICULA |  | APELLIDO |  |  |  |  | CIRUJANO ODONTOLOGO |
`;

const PATIENTS = `# USUARIO PACIENTES 1

| NUMERO | NOMBRE | NOMBRE 2 | APELLIDO PATERNO | APELLIDO MATERNO | OCUPACION |
| --- | --- | --- | --- | --- | --- |
| 1 | LICZY | PAOLA | NUÑEZ | CALLEJAS | ABOGADA |
`;

function build() {
  const em = { fork: fn(() => ({ findOne: fn().mockResolvedValue(null) })) };
  const showcases = { ensure: fn().mockResolvedValue(true) };
  const orm = { em };
  const practitionerRegistration = {
    registerPractitioner: fn().mockResolvedValue({
      userId: 'u-1',
      practitionerProfileId: 'p-1',
    }),
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
    showcases as never,
  );
  return {
    service,
    orm,
    em,
    showcases,
    practitionerRegistration,
    patientRegistration,
    logger,
  };
}

describe('PeopleSeedService', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'people-seed-'));
    writeFileSync(join(dir, 'USUARIO_MEDICOS_1.md'), DOCTORS, 'utf-8');
    writeFileSync(join(dir, 'USUARIO_PACIENTES_1.md'), PATIENTS, 'utf-8');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('sin SEED_PEOPLE_ENABLED no hace nada', async () => {
    const { service, practitionerRegistration } = build();
    const result = await service.run(false, '12345678', dir);
    expect(result.reason).toBe('not-configured');
    expect(
      practitionerRegistration.registerPractitioner,
    ).not.toHaveBeenCalled();
  });

  it('sin contraseña no hace nada, aunque esté habilitado', async () => {
    const { service } = build();
    const result = await service.run(true, undefined, dir);
    expect(result.reason).toBe('not-configured');
  });

  it('apagado y sin ruta explícita, no evalúa la ruta por defecto (en ESM no hay __dirname)', async () => {
    const { service } = build();
    const result = await service.run(false, '12345678');
    expect(result.reason).toBe('not-configured');
  });

  it('si no encuentra el padrón, lo dice y no falla', async () => {
    const { service } = build();
    const result = await service.run(true, '12345678', '/no/existe');
    expect(result.reason).toBe('source-not-found');
  });

  it('da de alta al médico con matrícula y salta al que no la tiene', async () => {
    const { service, practitionerRegistration } = build();
    const result = await service.run(true, '12345678', dir);

    expect(result.practitionersCreated).toBe(1);
    expect(result.skipped).toEqual([
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
    });

    const result = await service.run(true, '12345678', dir);

    expect(
      practitionerRegistration.registerPractitioner,
    ).not.toHaveBeenCalled();
    expect(result.practitionersExisting).toBe(1);
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

    const result = await service.run(true, '12345678', dir);

    expect(result.patientsExisting).toBe(1);
    expect(result.patientsCreated).toBe(0);
    expect(result.skipped).not.toContainEqual(
      expect.stringContaining('documento de identidad'),
    );
  });

  it('un fallo real (no de duplicado) se registra en skipped, no se traga', async () => {
    const { service, practitionerRegistration } = build();
    practitionerRegistration.registerPractitioner.mockRejectedValueOnce(
      new Error('boom'),
    );

    const result = await service.run(true, '12345678', dir);

    expect(result.practitionersCreated).toBe(0);
    expect(result.skipped).toContainEqual(expect.stringContaining('boom'));
  });

  it('crea la vitrina pública de cada médico dado de alta', async () => {
    const { service, showcases } = build();

    const result = await service.run(true, '12345678', dir);

    expect(result.showcasesCreated).toBe(1);
    expect(showcases.ensure).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u-1',
        practitionerProfileId: 'p-1',
        displayName: 'XIOMARA CUELLAR JUSTINIANO',
        headline: 'CIRUJANO ODONTOLOGO',
      }),
    );
    // El correo que deriva el enlace público es el sintético, nunca uno real.
    const [input] = showcases.ensure.mock.calls[0] as [{ email: string }];
    expect(input.email).toMatch(/@alovida\.test$/);
  });

  it('una vitrina que ya existía no se cuenta como creada', async () => {
    const { service, showcases } = build();
    showcases.ensure.mockResolvedValue(false);

    const result = await service.run(true, '12345678', dir);

    expect(result.showcasesCreated).toBe(0);
  });

  it('si no resuelve el perfil profesional lo informa y no inventa la vitrina', async () => {
    const { service, showcases, practitionerRegistration } = build();
    practitionerRegistration.registerPractitioner.mockResolvedValue({
      userId: 'u-1',
    });

    const result = await service.run(true, '12345678', dir);

    expect(showcases.ensure).not.toHaveBeenCalled();
    expect(result.skipped).toContainEqual(
      expect.stringContaining('no se creó la vitrina'),
    );
  });

  it('nunca toma del padrón cédula, nacimiento, celular, correo ni domicilio reales', async () => {
    writeFileSync(
      join(dir, 'USUARIO_MEDICOS_1.md'),
      `| NUMERO | NOMBRE | APELLIDO PATERNO | MATRICULA MINISTERIO DE SALUD Y DEPORTES | CEDULA | FECHA NACIMIENTO | CELULAR | CORREO | DOMICILIO | OCUPACION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ANA | PEREZ | C-1 | 9988776 | 1970-02-03 | 71122334 | ana.real@gmail.com | CALLE REAL 12 | MEDICO |
`,
      'utf-8',
    );
    const { service, practitionerRegistration } = build();

    await service.run(true, '12345678', dir);

    const [dto] = practitionerRegistration.registerPractitioner.mock
      .calls[0] as [Record<string, string>];
    const serialized = JSON.stringify({ ...dto, password: undefined });
    for (const real of [
      '9988776',
      '1970-02-03',
      '71122334',
      'gmail.com',
      'CALLE REAL',
    ]) {
      expect(serialized).not.toContain(real);
    }
    expect(dto.email).toMatch(/@alovida\.test$/);
  });

  describe('candado de cuentas de demostración', () => {
    it('en producción sin permiso explícito no crea cuentas', async () => {
      const { service, practitionerRegistration, patientRegistration } =
        build();

      const result = await service.run(
        true,
        '12345678',
        dir,
        'production',
        false,
      );

      expect(result.reason).toBe('production-not-allowed');
      expect(
        practitionerRegistration.registerPractitioner,
      ).not.toHaveBeenCalled();
      expect(patientRegistration.registerPatient).not.toHaveBeenCalled();
    });

    it('en producción con el permiso explícito sí las crea', async () => {
      const { service } = build();

      const result = await service.run(
        true,
        '12345678',
        dir,
        'production',
        true,
      );

      expect(result.practitionersCreated).toBe(1);
    });
  });
});
