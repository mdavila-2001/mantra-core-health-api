import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { SchedulingTenantAgendaService } from './scheduling-tenant-agenda.service';
import { PreconditionFailedException } from '../../../common';

const TENANT = '11111111-1111-1111-1111-111111111111';
const OTRO_TENANT = '22222222-2222-2222-2222-222222222222';

/** Alguien que trabaja en la organización de arriba. */
const recepcion = {
  id: 'user-recep',
  roles: ['USER'],
  tenantIds: [TENANT],
} as any;

/** Una ventana válida de una semana. */
const SEMANA = {
  from: '2026-08-17T00:00:00.000Z',
  to: '2026-08-24T00:00:00.000Z',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em: any = { find: mockFn().mockResolvedValue([]) };
  em.fork = mockFn(() => em);

  const bookingsRepo = {
    findTenantAgenda: mockFn().mockResolvedValue([]),
  };
  const agendaRepo = {
    findResources: mockFn().mockResolvedValue([]),
  };
  // Quién pertenece a la organización se prueba en su propio spec; acá el doble
  // deja pasar salvo cuando la prueba habla justamente del permiso.
  const tenantAdmin = { assertCanRead: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SchedulingTenantAgendaService(
    em,
    bookingsRepo as any,
    agendaRepo as any,
    tenantAdmin as any,
    logger as any,
  );
  return { service, em, bookingsRepo, agendaRepo, tenantAdmin };
}

/** Un recurso agendable de la organización. */
function recurso(overrides: Record<string, unknown> = {}) {
  return {
    id: 'res-1',
    name: 'Consultorio Centro',
    resourceRefType: 'health_practitioner_profiles',
    resourceRefId: 'hp-1',
    tenantId: TENANT,
    ...overrides,
  };
}

/** Una cita con su cupo resuelto. */
function cita(overrides: Record<string, unknown> = {}) {
  return {
    booking: {
      id: 'bk-1',
      resourceId: 'res-1',
      patientProfileId: 'pac-1',
      statusConceptId: 'st-confirmada',
      // El motivo existe en la fila: lo que se prueba es que no salga.
      reasonText: 'Dolor de pecho desde hace tres días',
      ...overrides,
    },
    slot: {
      startAt: new Date('2026-08-19T14:00:00.000Z'),
      endAt: new Date('2026-08-19T14:30:00.000Z'),
    },
  };
}

describe('SchedulingTenantAgendaService (TP-5)', () => {
  describe('el perímetro', () => {
    it('exige pertenecer a la organización', async () => {
      const d = build();
      d.tenantAdmin.assertCanRead.mockRejectedValue(
        new ForbiddenException('no'),
      );

      await expect(
        d.service.listar(TENANT, SEMANA as any, recepcion),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    /**
     * La lección del #156: el tenant va **en la consulta**, no comprobado
     * después sobre las filas devueltas. Filtrando en la consulta, las filas
     * ajenas nunca se leyeron.
     */
    it('el tenant viaja dentro de la consulta, no comprobado después', async () => {
      const d = build();

      await d.service.listar(TENANT, SEMANA as any, recepcion);

      const [, filtros] = d.bookingsRepo.findTenantAgenda.mock.calls[0] as [
        unknown,
        any,
      ];
      expect(filtros.tenantId).toBe(TENANT);
    });

    /**
     * El criterio e2e del prompt: pedir la agenda de un médico de otra
     * organización no devuelve sus citas allá.
     */
    it('el médico de otra organización devuelve vacío, no sus citas ajenas', async () => {
      const d = build();
      // Los recursos de ESTA organización no incluyen ninguno de ese médico.
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);

      const salida = await d.service.listar(
        TENANT,
        { ...SEMANA, practitionerProfileId: 'hp-de-otra-clinica' } as any,
        recepcion,
      );

      expect(salida.items).toEqual([]);
      // Y la consulta se hizo con una lista de recursos vacía, que el
      // repositorio interpreta como «ninguno» y no como «todos».
      const [, filtros] = d.bookingsRepo.findTenantAgenda.mock.calls[0] as [
        unknown,
        any,
      ];
      expect(filtros.resourceIds).toEqual([]);
    });

    it('los recursos se buscan siempre acotados a la organización', async () => {
      const d = build();

      await d.service.listar(TENANT, SEMANA as any, recepcion);

      expect(d.agendaRepo.findResources).toHaveBeenCalledWith(d.em, {
        tenantId: TENANT,
      });
    });

    it('filtrar por un médico propio acota a sus recursos de acá', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([
        recurso(),
        recurso({ id: 'res-2', resourceRefId: 'hp-1' }),
        recurso({ id: 'res-ajeno', resourceRefId: 'hp-otro' }),
      ]);

      await d.service.listar(
        TENANT,
        { ...SEMANA, practitionerProfileId: 'hp-1' } as any,
        recepcion,
      );

      const [, filtros] = d.bookingsRepo.findTenantAgenda.mock.calls[0] as [
        unknown,
        any,
      ];
      expect(filtros.resourceIds).toEqual(['res-1', 'res-2']);
    });
  });

  describe('la ventana', () => {
    it('rechaza una ventana que termina antes de empezar', async () => {
      const d = build();

      await expect(
        d.service.listar(
          TENANT,
          { from: SEMANA.to, to: SEMANA.from } as any,
          recepcion,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /**
     * El tope no es técnico sino de lectura: una recepción mira su día o su
     * semana, y quien pide un año no está mirando una agenda.
     */
    it('rechaza un rango mayor a 31 días', async () => {
      const d = build();

      await expect(
        d.service.listar(
          TENANT,
          {
            from: '2026-01-01T00:00:00.000Z',
            to: '2026-06-01T00:00:00.000Z',
          } as any,
          recepcion,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('acepta exactamente 31 días', async () => {
      const d = build();

      await expect(
        d.service.listar(
          TENANT,
          {
            from: '2026-01-01T00:00:00.000Z',
            to: '2026-02-01T00:00:00.000Z',
          } as any,
          recepcion,
        ),
      ).resolves.toBeDefined();
    });

    it('rechaza una fecha que no es una fecha', async () => {
      const d = build();

      await expect(
        d.service.listar(
          TENANT,
          { from: 'ayer', to: 'mañana' } as any,
          recepcion,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('lo que la organización ve, y lo que no', () => {
    /**
     * El criterio de privacidad del prompt, y la razón de ser del DTO: el
     * motivo de consulta es del paciente y de su médico.
     */
    it('el motivo de consulta NO viaja en el payload', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);
      d.bookingsRepo.findTenantAgenda.mockResolvedValue([cita()]);

      const salida = await d.service.listar(TENANT, SEMANA as any, recepcion);

      const serializado = JSON.stringify(salida);
      expect(serializado).not.toContain('Dolor de pecho');
      expect(serializado).not.toContain('reasonText');
    });

    it('trae lo que hace falta para recibir a alguien', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);
      d.bookingsRepo.findTenantAgenda.mockResolvedValue([cita()]);
      d.em.find.mockResolvedValue([
        { id: 'pac-1', displayName: 'Marisol Quispe' },
      ]);

      const salida = await d.service.listar(TENANT, SEMANA as any, recepcion);

      expect(salida.items).toHaveLength(1);
      expect(salida.items[0]).toMatchObject({
        bookingId: 'bk-1',
        resourceName: 'Consultorio Centro',
        practitionerProfileId: 'hp-1',
        patientName: 'Marisol Quispe',
        statusConceptId: 'st-confirmada',
      });
    });

    /**
     * Un paciente sin nombre resuelto no rompe la agenda: la fila sale con
     * `null` y la pantalla decide qué decir.
     */
    it('un paciente sin nombre no rompe la agenda', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);
      d.bookingsRepo.findTenantAgenda.mockResolvedValue([cita()]);
      d.em.find.mockResolvedValue([]);

      const salida = await d.service.listar(TENANT, SEMANA as any, recepcion);

      expect(salida.items[0].patientName).toBeNull();
    });

    /**
     * Una agenda a la que le faltan citas sin avisar se lee como una agenda más
     * vacía de lo que está — la lectura contraria a la que una recepción
     * necesita.
     */
    it('declara el recorte cuando la ventana llenó el tope', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);
      d.bookingsRepo.findTenantAgenda.mockResolvedValue([
        cita({ id: 'bk-1' }),
        cita({ id: 'bk-2' }),
      ]);

      const salida = await d.service.listar(
        TENANT,
        { ...SEMANA, limit: 2 } as any,
        recepcion,
      );

      expect(salida.truncated).toBe(true);
    });

    it('una agenda vacía no se declara recortada', async () => {
      const d = build();

      const salida = await d.service.listar(TENANT, SEMANA as any, recepcion);

      expect(salida.items).toEqual([]);
      expect(salida.truncated).toBe(false);
    });

    /** Una sala no es un profesional: no hay perfil que informar. */
    it('una cita en una sala no inventa un profesional', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([
        recurso({ resourceRefType: 'care_spaces', resourceRefId: 'sala-1' }),
      ]);
      d.bookingsRepo.findTenantAgenda.mockResolvedValue([cita()]);

      const salida = await d.service.listar(TENANT, SEMANA as any, recepcion);

      expect(salida.items[0].practitionerProfileId).toBeNull();
    });

    it('la organización que se consulta es la de la ruta', async () => {
      const d = build();

      await d.service.listar(OTRO_TENANT, SEMANA as any, recepcion);

      expect(d.tenantAdmin.assertCanRead).toHaveBeenCalledWith(
        d.em,
        OTRO_TENANT,
        recepcion,
      );
    });
  });
});
