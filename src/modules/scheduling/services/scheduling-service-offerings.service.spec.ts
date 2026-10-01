import { jest } from '@jest/globals';
import { CLIN } from '../../clinical/clinical.concepts';
import { SCHED } from '../scheduling.concepts';
import { SchedulingServiceOfferingsService } from './scheduling-service-offerings.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const MEDICO = '22222222-2222-4222-8222-222222222222';
const OTRO_MEDICO = '99999999-9999-4999-8999-999999999999';
const CATALOGO = '11111111-1111-4111-8111-111111111111';
const PRACTICA = '77777777-7777-4777-8777-777777777777';

const medico = {
  id: 'u-med',
  roles: ['PRACTITIONER'],
  practitionerProfileId: MEDICO,
} as any;
const paciente = { id: 'u-pac', roles: ['PATIENT'] } as any;
const admin = { id: 'u-adm', roles: ['SCHEDULING_ADMIN'] } as any;

const servicio = (over: Record<string, unknown> = {}) => ({
  id: CATALOGO,
  practiceId: PRACTICA,
  code: 'NEBU',
  name: 'Nebulización',
  defaultPrice: '80.00',
  currencyConceptId: 'bob',
  isActive: true,
  ...over,
});

const dto = {
  serviceCatalogId: CATALOGO,
  minDurationMinutes: 30,
  maxDurationMinutes: 45,
};

function build() {
  const tx = { flush: mockFn(async () => undefined) };
  const em = { transactional: mockFn(async (fn: any) => fn(tx)) };
  const repo = {
    findCatalogItem: mockFn(async () => servicio()),
    findCatalogItems: mockFn(async () => [servicio()]),
    findOfferingOf: mockFn(async () => null),
    findOfferingById: mockFn(),
    listOfferings: mockFn(async () => []),
    createOffering: mockFn((_tx: unknown, data: any) => ({
      id: 'oferta-1',
      ...data,
    })),
  };
  const practiceLookup = {
    findActivePracticeIdsForPractitioner: mockFn(async () => [PRACTICA]),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new SchedulingServiceOfferingsService(
    em as any,
    repo as any,
    practiceLookup as any,
    logger as any,
  );
  return { service, repo, practiceLookup, tx };
}

describe('SchedulingServiceOfferingsService', () => {
  describe('create', () => {
    it('crea la oferta del propio profesional, activa y con los valores por defecto', async () => {
      const d = build();

      const res = await d.service.create(dto, medico);

      const guardado = d.repo.createOffering.mock.calls[0][1];
      expect(guardado).toMatchObject({
        practitionerProfileId: MEDICO,
        serviceCatalogId: CATALOGO,
        minDurationMinutes: 30,
        maxDurationMinutes: 45,
        isPatientBookable: true,
        requiresApproval: false,
        statusConceptId: SCHED.OFFERING_ACTIVE,
      });
      expect(res).toMatchObject({
        serviceName: 'Nebulización',
        price: '80.00',
        isActive: true,
      });
    });

    it('guarda la modalidad como concepto y la devuelve como el cliente la entiende', async () => {
      const d = build();

      const res = await d.service.create(
        { ...dto, channel: 'TELECONSULTA' },
        medico,
      );

      expect(d.repo.createOffering.mock.calls[0][1].channelConceptId).toBe(
        CLIN.APPOINTMENT_CHANNEL_TELEHEALTH,
      );
      expect(res.channel).toBe('TELECONSULTA');
    });

    it('422 si el mínimo supera al máximo', async () => {
      const d = build();
      await expect(
        d.service.create(
          { ...dto, minDurationMinutes: 60, maxDurationMinutes: 45 },
          medico,
        ),
      ).rejects.toThrow(/mínima no puede ser mayor/);
      expect(d.repo.createOffering).not.toHaveBeenCalled();
    });

    it('un servicio de una práctica donde no atiende responde 404, como uno inventado', async () => {
      const d = build();
      d.practiceLookup.findActivePracticeIdsForPractitioner.mockResolvedValue([
        'otra-practica',
      ]);

      await expect(d.service.create(dto, medico)).rejects.toThrow(
        /Servicio no encontrado/,
      );
    });

    it('409 si ya ofrece ese servicio', async () => {
      const d = build();
      d.repo.findOfferingOf.mockResolvedValue({ id: 'ya-existe' });

      await expect(d.service.create(dto, medico)).rejects.toThrow(
        /Ya ofrecés ese servicio/,
      );
    });

    it('un servicio apagado en el catálogo no se puede ofrecer', async () => {
      const d = build();
      d.repo.findCatalogItem.mockResolvedValue(servicio({ isActive: false }));

      await expect(d.service.create(dto, medico)).rejects.toThrow(/inactivo/);
    });

    it('un paciente no ofrece servicios', async () => {
      const d = build();
      await expect(d.service.create(dto, paciente)).rejects.toThrow(
        /Sólo un profesional/,
      );
    });

    it('un profesional no crea ofertas para otro', async () => {
      const d = build();
      await expect(
        d.service.create(
          { ...dto, practitionerProfileId: OTRO_MEDICO },
          medico,
        ),
      ).rejects.toThrow(/para vos/);
    });

    it('quien atiende Y administra agendas crea la suya sin repetir su propio id', async () => {
      const d = build();
      const ambas = { ...medico, roles: ['PRACTITIONER', 'SCHEDULING_ADMIN'] };

      await d.service.create(dto, ambas);

      expect(d.repo.createOffering.mock.calls[0][1].practitionerProfileId).toBe(
        MEDICO,
      );
    });

    it('quien administra agendas debe decir de qué profesional es la oferta', async () => {
      const d = build();
      await expect(d.service.create(dto, admin)).rejects.toThrow(
        /de qué profesional/,
      );

      await d.service.create(
        { ...dto, practitionerProfileId: OTRO_MEDICO },
        admin,
      );
      expect(d.repo.createOffering.mock.calls[0][1].practitionerProfileId).toBe(
        OTRO_MEDICO,
      );
    });
  });

  describe('update', () => {
    const existente = () => ({
      id: 'oferta-1',
      practitionerProfileId: MEDICO,
      serviceCatalogId: CATALOGO,
      minDurationMinutes: 30,
      maxDurationMinutes: 45,
      isPatientBookable: true,
      requiresApproval: false,
      statusConceptId: SCHED.OFFERING_ACTIVE,
    });

    it('cambia las duraciones validando contra el valor que ya tenía', async () => {
      const d = build();
      d.repo.findOfferingById.mockResolvedValue(existente());

      // Sólo sube el mínimo por encima del máximo guardado: tiene que fallar.
      await expect(
        d.service.update('oferta-1', { minDurationMinutes: 50 }, medico),
      ).rejects.toThrow(/mínima no puede ser mayor/);
    });

    it('apagarla la deja inactiva sin borrarla', async () => {
      const d = build();
      const oferta = existente();
      d.repo.findOfferingById.mockResolvedValue(oferta);

      const res = await d.service.update(
        'oferta-1',
        { isActive: false },
        medico,
      );

      expect(oferta.statusConceptId).toBe(SCHED.OFFERING_INACTIVE);
      expect(res.isActive).toBe(false);
    });

    it('la oferta de otro profesional responde 404, no 403', async () => {
      const d = build();
      d.repo.findOfferingById.mockResolvedValue({
        ...existente(),
        practitionerProfileId: OTRO_MEDICO,
      });

      await expect(
        d.service.update('oferta-1', { requiresApproval: true }, medico),
      ).rejects.toThrow(/Oferta no encontrada/);
    });

    it('quien administra agendas sí puede editar la de otro', async () => {
      const d = build();
      d.repo.findOfferingById.mockResolvedValue({
        ...existente(),
        practitionerProfileId: OTRO_MEDICO,
      });

      const res = await d.service.update(
        'oferta-1',
        { requiresApproval: true },
        admin,
      );

      expect(res.requiresApproval).toBe(true);
    });
  });

  describe('list', () => {
    it('un paciente pide sólo lo activo y reservable', async () => {
      const d = build();

      await d.service.list(MEDICO, paciente);

      expect(d.repo.listOfferings).toHaveBeenCalledWith(d.tx, MEDICO, {
        statusConceptId: SCHED.OFFERING_ACTIVE,
        soloReservables: true,
      });
    });

    it('el dueño ve todo lo suyo, apagado incluido', async () => {
      const d = build();

      await d.service.list(undefined, medico);

      expect(d.repo.listOfferings).toHaveBeenCalledWith(d.tx, MEDICO, {});
    });

    it('un servicio que el catálogo apagó no se muestra a un paciente aunque la oferta siga viva', async () => {
      const d = build();
      d.repo.listOfferings.mockResolvedValue([
        {
          id: 'oferta-1',
          practitionerProfileId: MEDICO,
          serviceCatalogId: CATALOGO,
          minDurationMinutes: 30,
          maxDurationMinutes: 45,
          isPatientBookable: true,
          requiresApproval: false,
          statusConceptId: SCHED.OFFERING_ACTIVE,
        },
      ]);
      d.repo.findCatalogItems.mockResolvedValue([
        servicio({ isActive: false }),
      ]);

      const res = await d.service.list(MEDICO, paciente);

      expect(res.items).toEqual([]);
    });

    it('un paciente que no dice de qué profesional recibe 422', async () => {
      const d = build();
      await expect(d.service.list(undefined, paciente)).rejects.toThrow(
        /de qué profesional/,
      );
    });
  });
});
