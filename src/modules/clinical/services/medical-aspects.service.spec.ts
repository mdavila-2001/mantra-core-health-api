import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { MedicalAspectsService } from './medical-aspects.service';

/** El titular: cuenta `user-1` → persona `per-1` → perfil de paciente `per-1`. */
const titular = { id: 'user-1', roles: ['PATIENT'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx: any = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    fork: mockFn(() => tx),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  /** Declaraciones por titular, como la tabla real. */
  const filas = new Map<string, any>();
  const statementsRepo = {
    findByPatient: mockFn((_em: unknown, patientProfileId: string) =>
      Promise.resolve(filas.get(patientProfileId) ?? null),
    ),
    create: mockFn((_em: unknown, data: { patientProfileId: string }) => {
      const fila = {
        id: `st-${data.patientProfileId}`,
        patientProfileId: data.patientProfileId,
        updatedAt: new Date(0),
      };
      filas.set(data.patientProfileId, fila);
      return fila;
    }),
  };
  /** Cuenta → persona, como `person_account_links`. */
  const vinculos = new Map<string, { personId: string }>([
    ['user-1', { personId: 'per-1' }],
  ]);
  const accountLinksRepo = {
    findActiveByUser: mockFn((_em: unknown, userId: string) =>
      Promise.resolve(vinculos.get(userId) ?? null),
    ),
  };
  /** Persona → perfil de paciente, indexado por `profile_id`. */
  const perfiles = new Map<string, { profileId: string }>([
    ['per-1', { profileId: 'per-1' }],
  ]);
  const patientProfilesRepo = {
    findById: mockFn((_em: unknown, profileId: string) =>
      Promise.resolve(perfiles.get(profileId) ?? null),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new MedicalAspectsService(
    em as any,
    statementsRepo as any,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    logger as any,
  );
  return { service, tx, filas, vinculos, perfiles, statementsRepo, logger };
}

describe('MedicalAspectsService (FT-22 / D-B)', () => {
  describe('getOwn', () => {
    it('la primera vez responde el objeto vacío, no un 404', async () => {
      const d = build();
      expect(await d.service.getOwn(titular)).toEqual({});
    });

    it('devuelve lo declarado con la fecha de actualización', async () => {
      const d = build();
      d.filas.set('per-1', {
        patientProfileId: 'per-1',
        bloodTypeText: 'O+',
        habitsText: 'no fuma',
        updatedAt: new Date('2026-09-26T10:00:00Z'),
      });
      expect(await d.service.getOwn(titular)).toEqual({
        bloodType: 'O+',
        habitsText: 'no fuma',
        updatedAt: new Date('2026-09-26T10:00:00Z'),
      });
    });

    it('una sesión sin perfil de paciente recibe 403', async () => {
      const d = build();
      await expect(
        d.service.getOwn({ id: 'user-sin-perfil', roles: [] } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('una cuenta vinculada a una persona sin perfil de paciente recibe 403', async () => {
      const d = build();
      d.vinculos.set('user-2', { personId: 'per-2' });
      await expect(
        d.service.getOwn({ id: 'user-2', roles: ['PATIENT'] } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('updateOwn', () => {
    it('crea la fila del titular la primera vez y la guarda en una transacción', async () => {
      const d = build();
      const res = await d.service.updateOwn(
        { habitsText: 'camina 30 min' },
        titular,
      );
      expect(d.statementsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: 'per-1',
          actorUserId: 'user-1',
        }),
      );
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(res.habitsText).toBe('camina 30 min');
      expect(res.updatedAt).toBeInstanceOf(Date);
    });

    it('guardar una sección no pisa las otras (campo ausente = no tocar)', async () => {
      const d = build();
      d.filas.set('per-1', {
        patientProfileId: 'per-1',
        allergiesText: 'penicilina',
        currentMedicationsText: 'losartán',
        updatedAt: new Date(0),
      });
      const res = await d.service.updateOwn({ habitsText: 'no fuma' }, titular);
      expect(res).toEqual({
        allergiesText: 'penicilina',
        currentMedicationsText: 'losartán',
        habitsText: 'no fuma',
        updatedAt: expect.any(Date),
      });
      expect(res.updatedAt!.getTime()).toBeGreaterThan(0);
    });

    it("'' borra el campo y deja los demás intactos", async () => {
      const d = build();
      d.filas.set('per-1', {
        patientProfileId: 'per-1',
        surgeriesText: 'apendicectomía',
        habitsText: 'no fuma',
        updatedAt: new Date(0),
      });
      const res = await d.service.updateOwn({ surgeriesText: '' }, titular);
      expect(res.surgeriesText).toBeUndefined();
      expect(res.habitsText).toBe('no fuma');
      expect(d.filas.get('per-1').surgeriesText).toBeUndefined();
    });

    it('recorta espacios y trata un texto en blanco como borrado', async () => {
      const d = build();
      const res = await d.service.updateOwn(
        { bloodType: '  O+  ', familyHistoryText: '   ' },
        titular,
      );
      expect(res.bloodType).toBe('O+');
      expect(res.familyHistoryText).toBeUndefined();
    });

    it('una sesión sin perfil de paciente no escribe nada (403)', async () => {
      const d = build();
      await expect(
        d.service.updateOwn({ habitsText: 'x' }, {
          id: 'user-sin-perfil',
          roles: [],
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.statementsRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('no loguea el contenido declarado, sólo las claves tocadas (PHI)', async () => {
      const d = build();
      await d.service.updateOwn({ chronicConditionsText: 'diabetes' }, titular);
      const logueado = JSON.stringify(d.logger.info.mock.calls);
      expect(logueado).not.toContain('diabetes');
      expect(logueado).toContain('chronicConditionsText');
    });
  });
});
