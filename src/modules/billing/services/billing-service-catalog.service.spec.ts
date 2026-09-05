import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BillingServiceCatalogService } from './billing-service-catalog.service';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
  encodeKeysetCursor,
  runWithTenant,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
/** Quien atiende: sin rol administrativo, con perfil profesional. */
const medico = {
  id: 'user-med',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  // Sin vinculaciones activas por defecto: sin `runWithTenant` de por medio,
  // `attachDefaultSatisfactionSurvey` corta antes de pedir el tenant.
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    find: mockFn().mockResolvedValue([]),
  };
  const em = {
    fork: mockFn().mockReturnValue({}),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const serviceCatalogRepo = {
    findByCode: mockFn(),
    findById: mockFn(),
    create: mockFn(),
    searchPage: mockFn(),
  };
  const practiceTenantLookup = {
    findActivePracticeIdsForPractitioner: mockFn().mockResolvedValue([]),
    findTenantOfPractice: mockFn().mockResolvedValue(null),
  };
  const templatesRepo = {
    createTemplate: mockFn(),
    createVersion: mockFn(),
    createQuestion: mockFn(),
  };
  const assignmentsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new BillingServiceCatalogService(
    em as any,
    serviceCatalogRepo as any,
    practiceTenantLookup as any,
    templatesRepo as any,
    assignmentsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    serviceCatalogRepo,
    practiceTenantLookup,
    templatesRepo,
    assignmentsRepo,
    logger,
  };
}

/** Una fila editable del catálogo, con los campos que el servicio toca. */
function fila(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    practiceId: 'pr1',
    code: 'CITA_MEDICA',
    name: 'Cita médica',
    defaultPrice: '0.00',
    currencyConceptId: undefined as string | undefined,
    isActive: true,
    updatedAt: new Date(0),
    updatedByUserId: undefined as string | undefined,
    ...overrides,
  };
}

const item = {
  id: 's1',
  practiceId: 'pr1',
  code: 'CONS-01',
  name: 'Consulta general',
  defaultPrice: '100.00',
  isActive: true,
};

describe('BillingServiceCatalogService', () => {
  describe('search', () => {
    it('returns a page with nextCursor null when there is no extra row', async () => {
      const d = build();
      d.serviceCatalogRepo.searchPage.mockResolvedValue([item]);

      const res = await d.service.search({ practiceId: 'pr1', limit: 50 });

      expect(res).toEqual({
        items: [item],
        count: 1,
        limit: 50,
        nextCursor: null,
      });
      expect(d.serviceCatalogRepo.searchPage).toHaveBeenCalledWith(
        expect.anything(),
        {
          practiceId: 'pr1',
          query: undefined,
          isActive: undefined,
          afterCode: undefined,
        },
        51,
      );
    });

    it('returns an encoded nextCursor when there is an extra row', async () => {
      const d = build();
      const second = { ...item, id: 's2', code: 'CONS-02' };
      d.serviceCatalogRepo.searchPage.mockResolvedValue([item, second]);

      const res = await d.service.search({ practiceId: 'pr1', limit: 1 });

      expect(res.items).toEqual([item]);
      expect(res.nextCursor).toBe(encodeKeysetCursor({ code: item.code }));
    });

    it('decodes the cursor into afterCode', async () => {
      const d = build();
      d.serviceCatalogRepo.searchPage.mockResolvedValue([]);
      const cursor = encodeKeysetCursor({ code: 'CONS-01' });

      await d.service.search({ practiceId: 'pr1', cursor, limit: 50 });

      expect(d.serviceCatalogRepo.searchPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ afterCode: 'CONS-01' }),
        51,
      );
    });
  });

  describe('create', () => {
    it('creates the item when the code is free', async () => {
      const d = build();
      d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
      d.serviceCatalogRepo.create.mockReturnValue(item);

      const res = await d.service.create(
        {
          practiceId: 'pr1',
          code: 'CONS-01',
          name: 'Consulta general',
          defaultPrice: '100.00',
        },
        actor,
      );

      expect(res).toEqual(item);
      expect(d.serviceCatalogRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceId: 'pr1',
          code: 'CONS-01',
          isActive: true,
          actorUserId: actor.id,
        }),
      );
      expect(d.tx.flush).toHaveBeenCalled();
    });

    /**
     * FT-31: ningún servicio médico nuevo debería quedar sin forma de medir
     * la atención. Estos tres casos son la regla completa: quien da de alta
     * es un profesional, quien da de alta es un admin puro con alguien a
     * quien atribuirle la plantilla, y quien da de alta es un admin puro sin
     * nadie —el único caso donde de verdad no hay encuesta.
     */
    describe('encuesta de satisfacción por defecto', () => {
      it('un profesional que da de alta su propio servicio queda como dueño de la encuesta', async () => {
        const d = build();
        d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
        d.serviceCatalogRepo.create.mockReturnValue(item);
        d.templatesRepo.createTemplate.mockReturnValue({
          id: 'tpl-1',
          statusConceptId: 'draft',
        });
        d.templatesRepo.createVersion.mockReturnValue({
          id: 'ver-1',
          publicationStatusConceptId: 'draft',
        });

        await runWithTenant('tenant-1', () =>
          d.service.create(
            {
              practiceId: 'pr1',
              code: 'CONS-01',
              name: 'Consulta general',
              defaultPrice: '100.00',
            },
            medico,
          ),
        );

        expect(d.templatesRepo.createTemplate).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({
            ownerPractitionerId: medico.practitionerProfileId,
            title: expect.stringContaining('Consulta general'),
          }),
        );
        expect(d.templatesRepo.createQuestion).toHaveBeenCalled();
        expect(d.assignmentsRepo.create).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({
            surveyVersionId: 'ver-1',
            targetTypeConceptId: expect.any(String),
            targetId: item.id,
            active: true,
          }),
        );
        // Con perfil profesional propio, ni hace falta buscar a quién
        // atribuírsela: no consulta las vinculaciones de la práctica.
        expect(d.tx.find).not.toHaveBeenCalled();
      });

      it('un admin sin perfil se la atribuye al profesional activo más antiguo de la práctica', async () => {
        const d = build();
        d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
        d.serviceCatalogRepo.create.mockReturnValue(item);
        d.tx.find.mockResolvedValue([
          { practitionerProfileId: 'hp-nueva', isPrimary: false, createdAt: new Date('2026-02-01') },
          { practitionerProfileId: 'hp-vieja', isPrimary: false, createdAt: new Date('2026-01-01') },
        ]);
        d.templatesRepo.createTemplate.mockReturnValue({ id: 'tpl-1' });
        d.templatesRepo.createVersion.mockReturnValue({ id: 'ver-1' });

        await runWithTenant('tenant-1', () =>
          d.service.create(
            {
              practiceId: 'pr1',
              code: 'CONS-01',
              name: 'Consulta general',
              defaultPrice: '100.00',
            },
            actor,
          ),
        );

        expect(d.templatesRepo.createTemplate).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ ownerPractitionerId: 'hp-vieja' }),
        );
      });

      it('sin nadie a quien atribuirle la plantilla, el servicio se crea igual, sin encuesta', async () => {
        const d = build();
        d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
        d.serviceCatalogRepo.create.mockReturnValue(item);
        d.tx.find.mockResolvedValue([]);

        const res = await d.service.create(
          {
            practiceId: 'pr1',
            code: 'CONS-01',
            name: 'Consulta general',
            defaultPrice: '100.00',
          },
          actor,
        );

        expect(res).toEqual(item);
        expect(d.templatesRepo.createTemplate).not.toHaveBeenCalled();
        expect(d.logger.warn).toHaveBeenCalled();
      });
    });

    it('rejects a duplicate code within the same practice', async () => {
      const d = build();
      d.serviceCatalogRepo.findByCode.mockResolvedValue(item);

      await expect(
        d.service.create(
          {
            practiceId: 'pr1',
            code: 'CONS-01',
            name: 'Consulta general',
            defaultPrice: '100.00',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.serviceCatalogRepo.create).not.toHaveBeenCalled();
    });
  });

  /**
   * FT-22-R05. Lo que se comprueba acá no es «guarda el número», sino **quién
   * puede guardarlo** y que un servicio ajeno responda lo mismo que uno que no
   * existe: si el rechazo del ajeno fuera distinto, probar uuids revelaría qué
   * servicios tiene la organización de al lado.
   */
  describe('update', () => {
    it('quien atiende en esa práctica corrige el precio y su moneda', async () => {
      const d = build();
      const row = fila();
      d.serviceCatalogRepo.findById.mockResolvedValue(row);
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['otra', 'pr1'],
      );

      const res = await d.service.update(
        's1',
        { defaultPrice: '150.00' },
        medico,
      );

      expect(res.defaultPrice).toBe('150.00');
      // Una fila sin moneda la gana en su primera edición: un importe sin
      // unidad no es un precio.
      expect(res.currencyConceptId).toBe(CONCEPTS.CURRENCY_BOB);
      expect(res.currencyCode).toBe('BOB');
      expect(row.updatedByUserId).toBe(medico.id);
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('conserva la moneda que la fila ya tenía', async () => {
      const d = build();
      const row = fila({ currencyConceptId: CONCEPTS.CURRENCY_USD });
      d.serviceCatalogRepo.findById.mockResolvedValue(row);
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['pr1'],
      );

      const res = await d.service.update(
        's1',
        { defaultPrice: '20.00' },
        medico,
      );

      expect(res.currencyConceptId).toBe(CONCEPTS.CURRENCY_USD);
      expect(res.currencyCode).toBe('USD');
    });

    it('deja intacto lo que el cuerpo no menciona', async () => {
      const d = build();
      const row = fila({ defaultPrice: '80.00' });
      d.serviceCatalogRepo.findById.mockResolvedValue(row);
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['pr1'],
      );

      const res = await d.service.update('s1', { isActive: false }, medico);

      expect(res.isActive).toBe(false);
      expect(res.defaultPrice).toBe('80.00');
      expect(res.name).toBe('Cita médica');
    });

    it('un servicio inexistente es 404', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.update('s1', { defaultPrice: '10.00' }, medico),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('un servicio de una práctica ajena es el MISMO 404, no un 403', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(fila());
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['otra-practica'],
      );

      await expect(
        d.service.update('s1', { defaultPrice: '10.00' }, medico),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('la cuenta administradora corrige lo que su organización dio de alta', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(fila());
      d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue(
        'mi-tenant',
      );

      const res = await runWithTenant('mi-tenant', () =>
        d.service.update('s1', { defaultPrice: '90.00' }, actor),
      );

      expect(res.defaultPrice).toBe('90.00');
    });

    it('la cuenta administradora de otra organización recibe 404', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(fila());
      d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue(
        'otro-tenant',
      );

      await expect(
        runWithTenant('mi-tenant', () =>
          d.service.update('s1', { defaultPrice: '90.00' }, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('una cuenta sin perfil profesional ni rol administrativo recibe 404', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(fila());

      await expect(
        d.service.update('s1', { defaultPrice: '10.00' }, {
          id: 'u9',
          roles: ['PATIENT'],
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
