import { jest } from '@jest/globals';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';

import type { PatientPrimaryPractitioners } from '../../entities';
import { ProfilesErrorReason } from '../../profiles.error-reasons';
import { PrimaryPractitionerService } from './primary-practitioner.service';

/**
 * El médico de cabecera contra un DOBLE del repositorio, en memoria.
 *
 * El doble aplica la misma regla que la base: no puede haber dos elecciones
 * vigentes del mismo paciente al hacer `flush`
 * (`uq_patient_primary_practitioners_current`). Así las pruebas fallan si el
 * servicio abre la nueva antes de cerrar la vieja.
 */
type Fila = PatientPrimaryPractitioners;

const YO = 'persona-yo';
const DOC_A = 'doctor-a';
const DOC_B = 'doctor-b';
const actor = { id: 'usuario-yo', roles: ['PATIENT'] } as never;

function crear(
  opciones: {
    practitioners?: Record<string, { acceptsNewPatients?: boolean } | null>;
    personId?: string | null;
    isPatient?: boolean;
  } = {},
) {
  const filas: Fila[] = [];
  let secuencia = 0;
  const practitioners = opciones.practitioners ?? {
    [DOC_A]: { acceptsNewPatients: true },
    [DOC_B]: {},
  };

  const verificarIndice = () => {
    const vigentes = new Map<string, number>();
    for (const f of filas) {
      if (f.validTo) continue;
      vigentes.set(
        f.patientProfileId,
        (vigentes.get(f.patientProfileId) ?? 0) + 1,
      );
      if (vigentes.get(f.patientProfileId)! > 1) {
        throw new UniqueConstraintViolationException(
          new Error('uq_patient_primary_practitioners_current'),
        );
      }
    }
  };

  const tx = {
    flush: jest.fn(() => Promise.resolve(verificarIndice())),
  };
  const em = {
    fork: () => tx,
    transactional: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };

  const primaryRepo = {
    findCurrentByPatient: jest.fn((_em, patientId: string) =>
      Promise.resolve(
        filas.find((f) => f.patientProfileId === patientId && !f.validTo) ??
          null,
      ),
    ),
    open: jest.fn(
      (
        _em,
        d: { patientProfileId: string; practitionerProfileId: string },
        now: Date,
      ) => {
        const fila = {
          id: `eleccion-${++secuencia}`,
          patientProfileId: d.patientProfileId,
          practitionerProfileId: d.practitionerProfileId,
          validFrom: now,
        } as Fila;
        filas.push(fila);
        return fila;
      },
    ),
    close: jest.fn((row: Fila, now: Date) => {
      row.validTo = now;
    }),
    findPractitionerName: jest.fn((_em, id: string) =>
      Promise.resolve(`Dr. ${id}`),
    ),
    listCurrentPatients: jest.fn(() =>
      Promise.resolve({
        rows: [
          {
            patientProfileId: 'paciente-1',
            displayName: 'Ana Pérez',
            patientCode: 'P-1',
            since: new Date('2026-10-01T00:00:00Z'),
          },
        ],
        total: 1,
      }),
    ),
  };

  const accountLinks = {
    findActiveByUser: jest.fn(() =>
      Promise.resolve(
        opciones.personId === null
          ? null
          : { personId: opciones.personId ?? YO },
      ),
    ),
  };
  const patients = {
    findById: jest.fn(() =>
      Promise.resolve(opciones.isPatient === false ? null : { profileId: YO }),
    ),
  };
  const practitionersRepo = {
    findById: jest.fn((_em, id: string) =>
      Promise.resolve(
        practitioners[id] === undefined || practitioners[id] === null
          ? null
          : {
              profileId: id,
              professionalTitle: 'Médico general',
              ...practitioners[id],
            },
      ),
    ),
  };
  const logger = { info: jest.fn() };

  const service = new PrimaryPractitionerService(
    em as never,
    accountLinks as never,
    patients as never,
    practitionersRepo as never,
    primaryRepo as never,
    logger as never,
  );
  return { service, filas, primaryRepo, practitionersRepo };
}

describe('PrimaryPractitionerService', () => {
  it('sin elección responde current null, no un error', async () => {
    const { service } = crear();
    await expect(service.getOwn(actor)).resolves.toEqual({ current: null });
  });

  it('elegir abre una elección vigente y la devuelve', async () => {
    const { service, filas } = crear();

    const resultado = await service.setOwn(DOC_A, actor);

    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      patientProfileId: YO,
      practitionerProfileId: DOC_A,
    });
    expect(resultado.current).toMatchObject({
      practitionerProfileId: DOC_A,
      displayName: `Dr. ${DOC_A}`,
      professionalTitle: 'Médico general',
    });
    expect(resultado.current?.since).toBeInstanceOf(Date);
  });

  it('cambiar de médico cierra la vigente ANTES de abrir la nueva (índice único)', async () => {
    const { service, filas } = crear();
    await service.setOwn(DOC_A, actor);

    const resultado = await service.setOwn(DOC_B, actor);

    expect(filas).toHaveLength(2);
    expect(filas[0].validTo).toBeInstanceOf(Date);
    expect(filas[1].validTo).toBeUndefined();
    expect(resultado.current?.practitionerProfileId).toBe(DOC_B);
  });

  it('elegir al que ya es el vigente no abre otro período', async () => {
    const { service, filas, primaryRepo } = crear();
    await service.setOwn(DOC_A, actor);
    const desde = filas[0].validFrom;

    const resultado = await service.setOwn(DOC_A, actor);

    expect(filas).toHaveLength(1);
    expect(primaryRepo.open).toHaveBeenCalledTimes(1);
    expect(resultado.current?.since).toBe(desde);
  });

  it('un profesional inexistente responde 404 y no escribe', async () => {
    const { service, filas } = crear();

    await expect(service.setOwn('no-existe', actor)).rejects.toMatchObject({
      reason: ProfilesErrorReason.PRACTITIONER_PROFILE_NOT_FOUND,
    });
    expect(filas).toHaveLength(0);
  });

  it('no puede elegirse a sí mismo', async () => {
    const { service, filas } = crear({
      practitioners: { [YO]: {} },
    });

    await expect(service.setOwn(YO, actor)).rejects.toMatchObject({
      reason: ProfilesErrorReason.PRIMARY_PRACTITIONER_SELF,
    });
    expect(filas).toHaveLength(0);
  });

  it('un profesional que no acepta pacientes nuevos no se puede elegir', async () => {
    const { service, filas } = crear({
      practitioners: { [DOC_A]: { acceptsNewPatients: false } },
    });

    await expect(service.setOwn(DOC_A, actor)).rejects.toMatchObject({
      reason: ProfilesErrorReason.PRIMARY_PRACTITIONER_NOT_ACCEPTING_PATIENTS,
    });
    expect(filas).toHaveLength(0);
  });

  it('sin declarar si acepta pacientes, se puede elegir', async () => {
    const { service } = crear({ practitioners: { [DOC_B]: {} } });
    const resultado = await service.setOwn(DOC_B, actor);
    expect(resultado.current?.practitionerProfileId).toBe(DOC_B);
  });

  it('quitar cierra la vigente sin borrarla', async () => {
    const { service, filas } = crear();
    await service.setOwn(DOC_A, actor);

    const resultado = await service.removeOwn(actor);

    expect(resultado).toEqual({ current: null });
    expect(filas).toHaveLength(1);
    expect(filas[0].validTo).toBeInstanceOf(Date);
  });

  it('quitar sin elección vigente no hace nada', async () => {
    const { service, primaryRepo } = crear();
    await expect(service.removeOwn(actor)).resolves.toEqual({ current: null });
    expect(primaryRepo.close).not.toHaveBeenCalled();
  });

  it('dos pestañas eligiendo a la vez: la base deja pasar una y la otra recibe 409', async () => {
    const { service, primaryRepo } = crear();
    // La otra pestaña ya abrió la suya, pero esta transacción no la vio.
    primaryRepo.findCurrentByPatient.mockResolvedValueOnce(null);
    await service.setOwn(DOC_A, actor);
    primaryRepo.findCurrentByPatient.mockResolvedValueOnce(null);

    await expect(service.setOwn(DOC_B, actor)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('una cuenta sin perfil de paciente responde 404', async () => {
    const { service } = crear({ isPatient: false });
    await expect(service.setOwn(DOC_A, actor)).rejects.toMatchObject({
      reason: ProfilesErrorReason.PATIENT_PROFILE_NOT_FOUND,
    });
  });

  it('una cuenta sin persona vinculada responde 422', async () => {
    const { service } = crear({ personId: null });
    await expect(service.getOwn(actor)).rejects.toMatchObject({
      reason: ProfilesErrorReason.ACCOUNT_WITHOUT_LINKED_PERSON,
    });
  });

  describe('la lista del profesional', () => {
    it('pagina con los valores por defecto', async () => {
      const { service, primaryRepo } = crear({
        personId: DOC_A,
        practitioners: { [DOC_A]: {} },
      });

      const pagina = await service.listOwnPatients({}, actor);

      expect(primaryRepo.listCurrentPatients).toHaveBeenCalledWith(
        expect.anything(),
        DOC_A,
        { limit: 50, offset: 0 },
      );
      expect(pagina).toMatchObject({ total: 1, limit: 50, offset: 0 });
      expect(pagina.items[0]).toMatchObject({
        patientProfileId: 'paciente-1',
        displayName: 'Ana Pérez',
      });
    });

    it('una cuenta sin perfil profesional responde 422', async () => {
      const { service } = crear({ practitioners: {} });
      await expect(service.listOwnPatients({}, actor)).rejects.toMatchObject({
        reason: ProfilesErrorReason.ACCOUNT_WITHOUT_PRACTITIONER_PROFILE,
      });
    });
  });
});
