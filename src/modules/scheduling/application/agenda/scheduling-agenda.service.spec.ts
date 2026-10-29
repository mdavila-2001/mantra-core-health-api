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
import { PracticeProfilesDirectoryAdapter } from '../../infrastructure/adapters/practice-profiles-directory.adapter';

const TENANT = '11111111-1111-1111-1111-111111111111';

/** Una sede ya proyectada, como la devuelve `practice`. */
const SITE = {
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
    findResourcePractices: mockFn().mockResolvedValue(new Map()),
  };
  const billing = {
    findConsultationPrices: mockFn().mockResolvedValue(new Map()),
  };
  const sitesService = {
    resolveSitesForResources: mockFn().mockResolvedValue(new Map()),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SchedulingAgendaService(
    em as any,
    agendaRepo as any,
    new PracticeProfilesDirectoryAdapter(sitesService as any, {} as any),
    billing as any,
    logger as any,
  );
  return { service, em, agendaRepo, sitesService, billing, logger };
}

/** Un recurso agendable de profesional, con lo mínimo del contrato. */
const resource = (over: Record<string, unknown> = {}): any => ({
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
      d.agendaRepo.findResources.mockResolvedValue([resource()]);
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
      d.agendaRepo.findResources.mockResolvedValue([resource()]);
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
        resource({ resourceRefType: 'care_spaces', name: 'Consultorio 3' }),
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
      d.agendaRepo.findResources.mockResolvedValue([resource()]);
      d.sitesService.resolveSitesForResources.mockResolvedValue(
        new Map([['prac-1', SITE]]),
      );

      const res = await d.service.listResources({ tenantId: TENANT } as any);

      expect(d.sitesService.resolveSitesForResources).toHaveBeenCalledWith(
        [{ refType: 'health_practitioner_profiles', refId: 'prac-1' }],
        TENANT,
      );
      expect(res.items[0].site).toEqual(SITE);
    });

    it('leaves the site as null when the resource has none', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([resource()]);

      const res = await d.service.listResources({ tenantId: TENANT } as any);

      // Un recurso sin asignación vigente con sede es un caso corriente: la
      // agenda tiene que seguir sirviendo para elegir horario.
      expect(res.items[0].site).toBeNull();
      expect(res.count).toBe(1);
    });

    it('still lists the agenda when the site lookup fails', async () => {
      const d = build();
      d.agendaRepo.findResources.mockResolvedValue([resource()]);
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
        resource(),
        resource({
          id: 'res-2',
          resourceRefType: 'care_spaces',
          resourceRefId: 'space-9',
        }),
      ]);

      await d.service.listResources({ tenantId: TENANT } as any);

      expect(d.sitesService.resolveSitesForResources).toHaveBeenCalledTimes(1);
    });
  });

  describe('listSlots · el precio de la consulta (FAC-01)', () => {
    const slot = (over: Record<string, unknown> = {}): any => ({
      id: 'slot-1',
      resourceId: 'res-1',
      startAt: new Date('2026-11-02T13:00:00Z'),
      endAt: new Date('2026-11-02T13:30:00Z'),
      capacity: 1,
      remainingCapacity: 1,
      statusConceptId: 'concept-open',
      ...over,
    });
    const query = {
      from: '2026-11-02T00:00:00Z',
      to: '2026-11-03T00:00:00Z',
    } as any;

    it('cada cupo trae el precio de la consulta de la práctica de su recurso, en lote', async () => {
      const d = build();
      d.agendaRepo.findSlots.mockResolvedValue([
        slot(),
        slot({ id: 'slot-2' }),
        slot({ id: 'slot-3', resourceId: 'res-2' }),
      ]);
      d.agendaRepo.findResourcePractices.mockResolvedValue(
        new Map([
          ['res-1', 'practice-1'],
          ['res-2', 'practice-2'],
        ]),
      );
      d.billing.findConsultationPrices.mockResolvedValue(
        new Map([['practice-1', { price: '150.00' }]]),
      );

      const res = await d.service.listSlots(query);

      expect(res.items.map((i) => i.price)).toEqual([
        { amount: 150, currencyCode: 'BOB' },
        { amount: 150, currencyCode: 'BOB' },
        null,
      ]);
      expect(d.billing.findConsultationPrices).toHaveBeenCalledTimes(1);
      expect(d.billing.findConsultationPrices).toHaveBeenCalledWith(
        expect.anything(),
        ['practice-1', 'practice-2'],
      );
    });

    it('un precio de 0 no se publica: va null, nunca 0', async () => {
      const d = build();
      d.agendaRepo.findSlots.mockResolvedValue([slot()]);
      d.agendaRepo.findResourcePractices.mockResolvedValue(
        new Map([['res-1', 'practice-1']]),
      );
      d.billing.findConsultationPrices.mockResolvedValue(
        new Map([['practice-1', { price: '0.00' }]]),
      );

      const res = await d.service.listSlots(query);

      expect(res.items[0].price).toBeNull();
    });

    it('sin práctica no pregunta precios', async () => {
      const d = build();
      d.agendaRepo.findSlots.mockResolvedValue([slot()]);

      const res = await d.service.listSlots(query);

      expect(res.items[0].price).toBeNull();
      expect(d.billing.findConsultationPrices).not.toHaveBeenCalled();
    });
  });
});
