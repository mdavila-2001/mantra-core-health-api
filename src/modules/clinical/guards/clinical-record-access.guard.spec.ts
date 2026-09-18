import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ClinicalRecordAccessGuard } from './clinical-record-access.guard';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const AJENO = 'patient-ajeno';

function buildContext(
  user: any,
  patientProfileId = 'patient-1',
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, params: { patientProfileId }, method: 'GET' }),
    }),
  } as any;
}

/**
 * Petición mutante: el paciente puede venir en la ruta, en el cuerpo, en las dos
 * o en ninguna.
 *
 * Builder aparte y no un parámetro más de {@link buildContext} justamente por la
 * trampa que documenta el primer test: con un valor por defecto, pasar
 * `undefined` para «esta ruta no trae paciente» activaría el default y probaría
 * lo contrario de lo que se quiere. Acá la ausencia se expresa no poniendo la
 * clave en `params`, que es lo que hace Express de verdad.
 */
function buildWriteContext(
  user: any,
  opciones: {
    body?: unknown;
    paramPatientId?: string;
    method?: string;
  } = {},
): ExecutionContext {
  const params =
    opciones.paramPatientId === undefined
      ? {}
      : { patientProfileId: opciones.paramPatientId };
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        params,
        method: opciones.method ?? 'POST',
        body: opciones.body,
      }),
    }),
  } as any;
}

/** Actor con rol de quien atiende; la política decide, no el rol. */
const actorQueAtiende = { id: 'u1', roles: ['PRACTITIONER'] };

describe('ClinicalRecordAccessGuard (FT-07-R08)', () => {
  it('deja pasar sin evaluar cuando no hay sujeto o no hay paciente en la ruta', async () => {
    const readService = { assertPuedeLeerHistoria: mockFn() };
    const guard = new ClinicalRecordAccessGuard(readService as any);

    await expect(
      guard.canActivate(buildContext(undefined, 'patient-1')),
    ).resolves.toBe(true);
    // '' y no `undefined`: un parámetro con valor por defecto trata el
    // `undefined` explícito como "usar el default" (`'patient-1'`), lo que
    // haría que este caso pruebe justo lo que NO queremos — string vacío es
    // igual de falsy para el guard y no dispara el default.
    await expect(
      guard.canActivate(
        buildContext({ id: 'u1', roles: ['PATIENT'] }, '' as any),
      ),
    ).resolves.toBe(true);
    expect(readService.assertPuedeLeerHistoria).not.toHaveBeenCalled();
  });

  it('permite cuando assertPuedeLeerHistoria resuelve sin lanzar', async () => {
    const readService = {
      assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
    };
    const guard = new ClinicalRecordAccessGuard(readService as any);
    const actor = { id: 'u1', roles: ['PRACTITIONER'] };

    await expect(
      guard.canActivate(buildContext(actor, 'patient-1')),
    ).resolves.toBe(true);
    expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledWith(
      'patient-1',
      actor,
    );
  });

  it('propaga el 403 de assertPuedeLeerHistoria sin envolverlo', async () => {
    const readService = {
      assertPuedeLeerHistoria: mockFn().mockRejectedValue(
        new ForbiddenException('no autorizado'),
      ),
    };
    const guard = new ClinicalRecordAccessGuard(readService as any);
    const actor = { id: 'u1', roles: ['PRACTITIONER'] };

    await expect(
      guard.canActivate(buildContext(actor, 'patient-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  /**
   * SEC-01. Hasta acá el guard sólo miraba `request.params`, y las escrituras
   * del expediente no llevan al paciente en la ruta sino en el cuerpo: montado
   * o no, las dejaba pasar sin preguntar nada. Estos casos fijan las dos
   * mitades del arreglo — que el cuerpo se mire en las escrituras, y que la
   * lectura no cambie ni un milímetro.
   */
  describe('SEC-01 · el paciente que viaja en el cuerpo', () => {
    it('evalúa el paciente del cuerpo cuando la ruta no lo trae y deja pasar al autorizado', async () => {
      const readService = {
        assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
      };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      await expect(
        guard.canActivate(
          buildWriteContext(actorQueAtiende, {
            body: { patientProfileId: 'patient-1', noteText: 'evolución' },
          }),
        ),
      ).resolves.toBe(true);
      // La firma real es `(patientProfileId, actor)`. La fuente de SEC-01 la
      // escribía invertida; copiarla habría roto el guard en silencio.
      expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledWith(
        'patient-1',
        actorQueAtiende,
      );
    });

    it('deniega la escritura cuando el paciente del cuerpo es ajeno al actor', async () => {
      // El agujero de SEC-01, en una línea: un `PRACTITIONER` autenticado
      // escribiendo en la historia de cualquiera con sólo mandar su id.
      const readService = {
        assertPuedeLeerHistoria: mockFn().mockRejectedValue(
          new ForbiddenException('no autorizado'),
        ),
      };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      await expect(
        guard.canActivate(
          buildWriteContext(actorQueAtiende, {
            body: { patientProfileId: AJENO },
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledWith(
        AJENO,
        actorQueAtiende,
      );
    });

    it('mira el cuerpo en POST, PUT y PATCH', async () => {
      for (const method of ['POST', 'PUT', 'PATCH']) {
        const readService = {
          assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
        };
        const guard = new ClinicalRecordAccessGuard(readService as any);

        await guard.canActivate(
          buildWriteContext(actorQueAtiende, {
            method,
            body: { patientProfileId: 'patient-1' },
          }),
        );
        expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledWith(
          'patient-1',
          actorQueAtiende,
        );
      }
    });

    it('pregunta una sola vez cuando la ruta y el cuerpo traen el mismo paciente', async () => {
      const readService = {
        assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
      };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      await expect(
        guard.canActivate(
          buildWriteContext(actorQueAtiende, {
            paramPatientId: 'patient-1',
            body: { patientProfileId: 'patient-1' },
          }),
        ),
      ).resolves.toBe(true);
      // Repetir la pregunta duplicaría la consulta de autorización sin cambiar
      // la respuesta.
      expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledTimes(1);
    });

    it('evalúa los dos pacientes cuando la ruta y el cuerpo no coinciden', async () => {
      const readService = {
        assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
      };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      await expect(
        guard.canActivate(
          buildWriteContext(actorQueAtiende, {
            paramPatientId: 'patient-1',
            body: { patientProfileId: AJENO },
          }),
        ),
      ).resolves.toBe(true);
      // La petición toca dos historias: el permiso sobre una no es permiso
      // sobre la otra. No se inventa un error de «discrepancia» — se pregunta
      // por las dos y decide la política de siempre.
      expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledTimes(2);
      expect(readService.assertPuedeLeerHistoria).toHaveBeenNthCalledWith(
        1,
        'patient-1',
        actorQueAtiende,
      );
      expect(readService.assertPuedeLeerHistoria).toHaveBeenNthCalledWith(
        2,
        AJENO,
        actorQueAtiende,
      );
    });

    it('deniega si el segundo paciente no está autorizado, aunque el primero sí', async () => {
      // El caso que hace peligroso un guard que se conforme con el primer id:
      // la ruta es la historia que el profesional sí atiende, y el cuerpo mete
      // de contrabando la que no.
      const readService = {
        assertPuedeLeerHistoria: mockFn(async (patientProfileId: string) => {
          if (patientProfileId === AJENO) {
            throw new ForbiddenException('no autorizado');
          }
        }),
      };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      await expect(
        guard.canActivate(
          buildWriteContext(actorQueAtiende, {
            paramPatientId: 'patient-1',
            body: { patientProfileId: AJENO },
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledTimes(2);
    });

    it('no inventa un paciente cuando el cuerpo no lo trae', async () => {
      const readService = { assertPuedeLeerHistoria: mockFn() };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      for (const body of [
        { noteText: 'sin paciente' },
        {},
        undefined,
        null,
        'texto plano',
      ]) {
        await expect(
          guard.canActivate(buildWriteContext(actorQueAtiende, { body })),
        ).resolves.toBe(true);
      }
      expect(readService.assertPuedeLeerHistoria).not.toHaveBeenCalled();
    });

    it('no coerciona un patientProfileId que no sea string', async () => {
      const readService = { assertPuedeLeerHistoria: mockFn() };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      // Un array colado en el cuerpo NO puede convertirse en una autorización
      // válida, ni eligiendo su primer elemento ni pasándolo por `String()`.
      // Descartarlo no abre un hueco: el `ValidationPipe` global rechaza con
      // 400 cualquiera de estos valores contra el `@IsUUID()` del DTO, así que
      // ninguno llega al handler.
      for (const patientProfileId of [
        [AJENO],
        [AJENO, 'patient-1'],
        { id: AJENO },
        12345,
        true,
        null,
        '',
      ]) {
        await expect(
          guard.canActivate(
            buildWriteContext(actorQueAtiende, { body: { patientProfileId } }),
          ),
        ).resolves.toBe(true);
      }
      expect(readService.assertPuedeLeerHistoria).not.toHaveBeenCalled();
    });

    it('sigue evaluando el paciente de la ruta aunque el cuerpo venga malformado', async () => {
      // Que el cuerpo sea basura no puede desactivar la puerta que ya existía.
      const readService = {
        assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
      };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      await expect(
        guard.canActivate(
          buildWriteContext(actorQueAtiende, {
            paramPatientId: 'patient-1',
            body: { patientProfileId: [AJENO] },
          }),
        ),
      ).resolves.toBe(true);
      expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledTimes(1);
      expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledWith(
        'patient-1',
        actorQueAtiende,
      );
    });

    it('no evalúa al actor sin sujeto aunque el cuerpo traiga paciente', async () => {
      const readService = { assertPuedeLeerHistoria: mockFn() };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      await expect(
        guard.canActivate(
          buildWriteContext(undefined, {
            body: { patientProfileId: 'patient-1' },
          }),
        ),
      ).resolves.toBe(true);
      // `JwtAuthGuard` es quien responde a una petición sin sesión; este guard
      // no se mete en esa decisión.
      expect(readService.assertPuedeLeerHistoria).not.toHaveBeenCalled();
    });
  });

  describe('SEC-01 · la lectura no cambia', () => {
    it('no interpreta el cuerpo en un GET', async () => {
      // La regresión que más caro saldría: que un cambio pensado para las
      // escrituras empiece a evaluar cuerpos en las dos rutas de lectura que
      // ya cuelgan de este guard.
      const readService = {
        assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
      };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      await expect(
        guard.canActivate(
          buildWriteContext(actorQueAtiende, {
            method: 'GET',
            paramPatientId: 'patient-1',
            body: { patientProfileId: AJENO },
          }),
        ),
      ).resolves.toBe(true);
      expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledTimes(1);
      expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledWith(
        'patient-1',
        actorQueAtiende,
      );
    });

    it('sigue dejando pasar un GET sin paciente en la ruta, mire lo que mire el cuerpo', async () => {
      const readService = { assertPuedeLeerHistoria: mockFn() };
      const guard = new ClinicalRecordAccessGuard(readService as any);

      await expect(
        guard.canActivate(
          buildWriteContext(actorQueAtiende, {
            method: 'GET',
            body: { patientProfileId: AJENO },
          }),
        ),
      ).resolves.toBe(true);
      expect(readService.assertPuedeLeerHistoria).not.toHaveBeenCalled();
    });
  });
});
