import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { SchedulingAgendaService } from './scheduling-agenda.service';

const TENANT = '11111111-1111-1111-1111-111111111111';

/** Una sede ya proyectada, como la devuelve `practice`. */
const SEDE = {
  id: 'site-1',
  name: 'Consultorio Central',
  code: 'CC',
  addressText: 'Av. Brasil 1234, La Paz',
  timeZone: 'America/La_Paz',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const fork = { id: 'fork' };
  const em = { fork: mockFn(() => fork) };
  const agendaRepo = {
    findResources: mockFn().mockResolvedValue([]),
    findSlots: mockFn().mockResolvedValue([]),
  };
  const sitesService = {
    resolveSitesForResources: mockFn().mockResolvedValue(new Map()),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SchedulingAgendaService(
    em as any,
    agendaRepo as any,
    sitesService as any,
    logger as any,
  );
  return { service, em, agendaRepo, sitesService, logger };
}

/** Un recurso agendable de profesional, con lo mínimo del contrato. */
const recurso = (over: Record<string, unknown> = {}): any => ({
  id: 'res-1',
  name: 'Dra. Quispe',
  resourceTypeConceptId: 'concept-practitioner',
  resourceRefType: 'health_practitioner_profiles',
  resourceRefId: 'prac-1',
  stateConceptId: 'concept-active',
  ...over,
});

describe('SchedulingAgendaService', () => {
  describe('listResources · nombre del profesional', () => {
    it('resuelve el nombre de la persona detrás del recurso, en lote', async () => {
      const d = build();
      const fork = d.em.fork() as any;
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);
      // Los tres saltos de findPractitionerNames: perfil profesional →
      // person_profiles → persons.
      // Los dos saltos de findPractitionerNames: el perfil confirma que el id
      // es de un profesional, y persons (mismo id, por FK directa de
      // profile_id) trae el nombre.
      fork.find = mockFn()
        .mockResolvedValueOnce([{ profileId: 'prac-1' }])
        .mockResolvedValueOnce([
          { id: 'prac-1', name: 'Rosa', lastName: 'Quispe' },
        ]);

      const res = await d.service.listResources({ tenantId: TENANT } as any);

      expect(res.items[0].practitionerName).toBe('Rosa Quispe');
    });

    it('si la resolución falla, la lista sigue con null y el nombre del recurso', async () => {
      // El selector caía en cascada si la sede no resolvía; el nombre sigue el
      // mismo criterio: quedarse sin etiqueta linda no puede tirar la agenda.
      const d = build();
      const fork = d.em.fork() as any;
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);
      fork.find = mockFn().mockRejectedValue(new Error('se cayó profiles'));

      const res = await d.service.listResources({ tenantId: TENANT } as any);

      expect(res.items[0].practitionerName).toBeNull();
      expect(res.items[0].name).toBe('Dra. Quispe');
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('una sala no consulta profiles y va con null', async () => {
      const d = build();
      const fork = d.em.fork() as any;
      fork.find = mockFn();
      d.agendaRepo.findResources.mockResolvedValue([
        recurso({ resourceRefType: 'care_spaces', name: 'Consultorio 3' }),
      ]);

      const res = await d.service.listResources({ tenantId: TENANT } as any);

      expect(res.items[0].practitionerName).toBeNull();
      // Con cero perfiles profesionales en la lista, ni siquiera se consulta.
      expect(fork.find).not.toHaveBeenCalled();
    });
  });

  describe('listResources · dónde atiende cada recurso', () => {
    it('attaches the resolved site to each resource', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);
      d.sitesService.resolveSitesForResources.mockResolvedValue(
        new Map([['prac-1', SEDE]]),
      );

      const res = await d.service.listResources({ tenantId: TENANT } as any);

      expect(d.sitesService.resolveSitesForResources).toHaveBeenCalledWith(
        [{ refType: 'health_practitioner_profiles', refId: 'prac-1' }],
        TENANT,
      );
      expect(res.items[0].site).toEqual(SEDE);
    });

    it('leaves the site as null when the resource has none', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);

      const res = await d.service.listResources({ tenantId: TENANT } as any);

      // Un recurso sin asignación vigente con sede es un caso corriente: la
      // agenda tiene que seguir sirviendo para elegir horario.
      expect(res.items[0].site).toBeNull();
      expect(res.count).toBe(1);
    });

    it('still lists the agenda when the site lookup fails', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([recurso()]);
      d.sitesService.resolveSitesForResources.mockRejectedValue(
        new Error('practice caído'),
      );

      const res = await d.service.listResources({ tenantId: TENANT } as any);

      // Quedarse sin horarios porque no se pudo averiguar una dirección sería
      // cambiar una carencia por una caída.
      expect(res.items).toHaveLength(1);
      expect(res.items[0].site).toBeNull();
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('resolves the sites of every resource in a single call', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([
        recurso(),
        recurso({
          id: 'res-2',
          resourceRefType: 'care_spaces',
          resourceRefId: 'space-9',
        }),
      ]);

      await d.service.listResources({ tenantId: TENANT } as any);

      expect(d.sitesService.resolveSitesForResources).toHaveBeenCalledTimes(1);
    });
  });
});
