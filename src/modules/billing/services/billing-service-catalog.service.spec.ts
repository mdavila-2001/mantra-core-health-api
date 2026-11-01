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
  PreconditionFailedException,
  ResourceNotFoundException,
  encodeKeysetCursor,
  runWithTenant,
} from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
/** Quien atiende: sin rol administrativo, con perfil profesional. */
const doctor = {
  id: 'user-med',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  // Sin vinculaciones activas por defecto: el alta ya no consulta las del
  // profesional (se retiró la encuesta automática FT-31).
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
    // Por omisión la práctica NO es el consultorio propio de nadie: el alta de un
    // profesional tiene que pedirlo a propósito.
    isOwnOffice: mockFn().mockResolvedValue(false),
  };
  const attachableFiles = {
    assertUsableForAuthorizedContext: mockFn().mockResolvedValue({
      file: {
        sensitivityConceptId: CONCEPTS.SENSITIVITY_NORMAL,
        tenantId: 't1',
      },
    }),
    assertUsableBy: mockFn().mockResolvedValue({
      file: {
        sensitivityConceptId: CONCEPTS.SENSITIVITY_NORMAL,
        tenantId: 't1',
      },
    }),
  };
  const fileUpload = {
    downloadForAuthorizedContext: mockFn().mockResolvedValue({
      buffer: Buffer.from('png'),
      mimeType: 'image/png',
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new BillingServiceCatalogService(
    em as any,
    serviceCatalogRepo as any,
    practiceTenantLookup as any,
    attachableFiles as any,
    fileUpload as any,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    serviceCatalogRepo,
    practiceTenantLookup,
    attachableFiles,
    fileUpload,
    logger,
  };
}

/** Una fila editable del catálogo, con los campos que el servicio toca. */
function catalogRow(overrides: Record<string, unknown> = {}) {
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

    describe('quién puede dar de alta (v4.2.40)', () => {
      const dto = {
        practiceId: 'pr1',
        code: 'NEBU-01',
        name: 'Nebulización',
        defaultPrice: '80.00',
      };

      it('un profesional da de alta un servicio en su consultorio propio', async () => {
        const d = build();
        d.practiceTenantLookup.isOwnOffice.mockResolvedValue(true);
        d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
        d.serviceCatalogRepo.create.mockReturnValue(item);

        await runWithTenant('tenant-1', () => d.service.create(dto, doctor));

        expect(d.practiceTenantLookup.isOwnOffice).toHaveBeenCalledWith(
          'pr1',
          'user-med',
        );
        expect(d.serviceCatalogRepo.create).toHaveBeenCalled();
      });

      it('en una organización ajena responde 404 y no crea nada', async () => {
        const d = build();
        d.practiceTenantLookup.isOwnOffice.mockResolvedValue(false);

        await expect(d.service.create(dto, doctor)).rejects.toThrow(
          /Práctica no encontrada/,
        );
        expect(d.serviceCatalogRepo.create).not.toHaveBeenCalled();
      });

      it('la administración no pasa por esa comprobación', async () => {
        const d = build();
        d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
        d.serviceCatalogRepo.create.mockReturnValue(item);

        await d.service.create(dto, actor);

        expect(d.practiceTenantLookup.isOwnOffice).not.toHaveBeenCalled();
      });
    });

    /**
     * FT-31 creaba una «Satisfacción — <servicio>» con cada alta. Se retiró: la
     * encuesta base del sistema (módulo `surveys`) la reemplaza y se emite sola
     * al completarse cada atención, así que el alta de un servicio ya no toca
     * `surveys`. Las encuestas que FT-31 ya creó no se borran.
     */
    describe('sin encuesta automática por servicio', () => {
      it('un profesional que da de alta su propio servicio no crea ninguna encuesta', async () => {
        const d = build();
        d.practiceTenantLookup.isOwnOffice.mockResolvedValue(true);
        d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
        d.serviceCatalogRepo.create.mockReturnValue(item);

        const res = await runWithTenant('tenant-1', () =>
          d.service.create(
            {
              practiceId: 'pr1',
              code: 'CONS-01',
              name: 'Consulta general',
              defaultPrice: '100.00',
            },
            doctor,
          ),
        );

        expect(res).toEqual(item);
        // Ni siquiera busca a quién atribuirle una plantilla.
        expect(d.tx.find).not.toHaveBeenCalled();
      });

      it('un admin sin perfil crea el servicio sin consultar las vinculaciones de la práctica', async () => {
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
        expect(d.tx.find).not.toHaveBeenCalled();
        expect(d.logger.warn).not.toHaveBeenCalled();
      });
    });

    it.each(['0', '0.00', '0.0'])(
      'un precio %s responde 422 «El precio tiene que ser mayor que 0» y no crea nada (FAC-06)',
      async (price) => {
        const d = build();
        d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
        const error = await d.service
          .create(
            {
              practiceId: 'pr1',
              code: 'CONS-01',
              name: 'Consulta general',
              defaultPrice: price,
            },
            actor,
          )
          .then(
            () => null,
            (e: unknown) => e,
          );
        expect(error).toBeInstanceOf(PreconditionFailedException);
        const failed = error as PreconditionFailedException;
        expect(failed.getStatus()).toBe(422);
        expect(failed.message).toBe('El precio tiene que ser mayor que 0');
        expect(failed.reason).toBe(
          BillingErrorReason.SERVICE_CATALOG_PRICE_NOT_POSITIVE,
        );
        expect(d.serviceCatalogRepo.create).not.toHaveBeenCalled();
      },
    );

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
    it('términos propios: se guardan, y null o vacío vuelven a los de por defecto', async () => {
      const d = build();
      const row = catalogRow();
      d.serviceCatalogRepo.findById.mockResolvedValue(row);
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['pr1'],
      );

      const propios = await d.service.update(
        's1',
        { termsText: '  La consulta incluye un control a los 15 días.  ' },
        doctor,
      );
      expect(propios.termsText).toBe(
        'La consulta incluye un control a los 15 días.',
      );

      // Sin la clave, los términos no se tocan.
      const precio = await d.service.update(
        's1',
        { defaultPrice: '120.00' },
        doctor,
      );
      expect(precio.termsText).toBe(
        'La consulta incluye un control a los 15 días.',
      );

      expect(
        (await d.service.update('s1', { termsText: null }, doctor)).termsText,
      ).toBeUndefined();
      await d.service.update('s1', { termsText: 'Otro' }, doctor);
      expect(
        (await d.service.update('s1', { termsText: '   ' }, doctor)).termsText,
      ).toBeUndefined();
    });

    it('quien atiende en esa práctica corrige el precio y su moneda', async () => {
      const d = build();
      const row = catalogRow();
      d.serviceCatalogRepo.findById.mockResolvedValue(row);
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['otra', 'pr1'],
      );

      const res = await d.service.update(
        's1',
        { defaultPrice: '150.00' },
        doctor,
      );

      expect(res.defaultPrice).toBe('150.00');
      // Una fila sin moneda la gana en su primera edición: un importe sin
      // unidad no es un precio.
      expect(res.currencyConceptId).toBe(CONCEPTS.CURRENCY_BOB);
      expect(res.currencyCode).toBe('BOB');
      expect(row.updatedByUserId).toBe(doctor.id);
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('corregir el precio a 0.00 responde 422 y la fila queda como estaba (FAC-06)', async () => {
      const d = build();
      const row = catalogRow({ defaultPrice: '80.00' });
      d.serviceCatalogRepo.findById.mockResolvedValue(row);
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['pr1'],
      );

      await expect(
        d.service.update('s1', { defaultPrice: '0.00' }, doctor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(row.defaultPrice).toBe('80.00');
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('corregir solo el nombre de un servicio que vale 0.00 no choca con la regla', async () => {
      const d = build();
      const row = catalogRow({ defaultPrice: '0.00' });
      d.serviceCatalogRepo.findById.mockResolvedValue(row);
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['pr1'],
      );

      const res = await d.service.update('s1', { name: 'Otra' }, doctor);
      expect(res.name).toBe('Otra');
    });

    it('conserva la moneda que la fila ya tenía', async () => {
      const d = build();
      const row = catalogRow({ currencyConceptId: CONCEPTS.CURRENCY_USD });
      d.serviceCatalogRepo.findById.mockResolvedValue(row);
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['pr1'],
      );

      const res = await d.service.update(
        's1',
        { defaultPrice: '20.00' },
        doctor,
      );

      expect(res.currencyConceptId).toBe(CONCEPTS.CURRENCY_USD);
      expect(res.currencyCode).toBe('USD');
    });

    it('deja intacto lo que el cuerpo no menciona', async () => {
      const d = build();
      const row = catalogRow({ defaultPrice: '80.00' });
      d.serviceCatalogRepo.findById.mockResolvedValue(row);
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['pr1'],
      );

      const res = await d.service.update('s1', { isActive: false }, doctor);

      expect(res.isActive).toBe(false);
      expect(res.defaultPrice).toBe('80.00');
      expect(res.name).toBe('Cita médica');
    });

    it('un servicio inexistente es 404', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.update('s1', { defaultPrice: '10.00' }, doctor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('un servicio de una práctica ajena es el MISMO 404, no un 403', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(catalogRow());
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['otra-practica'],
      );

      await expect(
        d.service.update('s1', { defaultPrice: '10.00' }, doctor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('la cuenta administradora corrige lo que su organización dio de alta', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(catalogRow());
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
      d.serviceCatalogRepo.findById.mockResolvedValue(catalogRow());
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
      d.serviceCatalogRepo.findById.mockResolvedValue(catalogRow());

      await expect(
        d.service.update('s1', { defaultPrice: '10.00' }, {
          id: 'u9',
          roles: ['PATIENT'],
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
  describe('getImageContent (P-22-8, opción 1)', () => {
    const row = () =>
      catalogRow({ id: 's1', practiceId: 'pr1', imageFileId: 'file-1' });

    /** Servicio visible: activo, con imagen y de una práctica del tenant activo. */
    function visible() {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(row());
      d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue('t1');
      return d;
    }

    it('sirve la imagen a cualquier sesión del tenant de la práctica, sin ser quien la subió', async () => {
      const d = visible();

      const res = await runWithTenant('t1', () =>
        d.service.getImageContent('s1'),
      );

      expect(res.mimeType).toBe('image/png');
      expect(
        d.attachableFiles.assertUsableForAuthorizedContext,
      ).toHaveBeenCalledWith(
        expect.anything(),
        'file-1',
        expect.objectContaining({
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          allowedCategoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
        }),
      );
      expect(d.fileUpload.downloadForAuthorizedContext).toHaveBeenCalledWith(
        'file-1',
        'billing.service-catalog.image',
      );
    });

    it('un servicio de una práctica de otro tenant responde 404 y no toca el archivo', async () => {
      const d = visible();
      d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue('otro');

      await expect(
        runWithTenant('t1', () => d.service.getImageContent('s1')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
    });

    it('un servicio inexistente responde el mismo 404 que uno ajeno', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(null);
      const ajeno = visible();
      ajeno.practiceTenantLookup.findTenantOfPractice.mockResolvedValue('otro');

      const a = await runWithTenant('t1', () =>
        d.service.getImageContent('x'),
      ).catch((e) => e);
      const b = await runWithTenant('t1', () =>
        ajeno.service.getImageContent('s1'),
      ).catch((e) => e);

      expect(a).toBeInstanceOf(ResourceNotFoundException);
      expect(b).toBeInstanceOf(ResourceNotFoundException);
      expect(a.message).toBe(b.message);
      expect(a.getResponse?.() ?? a.reason).toEqual(
        b.getResponse?.() ?? b.reason,
      );
    });

    it('un servicio inactivo responde 404', async () => {
      const d = visible();
      d.serviceCatalogRepo.findById.mockResolvedValue({
        ...row(),
        isActive: false,
      });

      await expect(
        runWithTenant('t1', () => d.service.getImageContent('s1')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
    });

    it('un servicio sin imagen responde 404', async () => {
      const d = visible();
      d.serviceCatalogRepo.findById.mockResolvedValue({
        ...row(),
        imageFileId: undefined,
      });

      await expect(
        runWithTenant('t1', () => d.service.getImageContent('s1')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('un archivo que no es de sensibilidad normal responde 404 aunque el servicio apunte a él', async () => {
      const d = visible();
      d.attachableFiles.assertUsableForAuthorizedContext.mockResolvedValue({
        file: { sensitivityConceptId: 'phi' },
      });

      await expect(
        runWithTenant('t1', () => d.service.getImageContent('s1')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
    });

    it('un archivo no utilizable (otro tipo, borrado o infectado) responde 404 sin filtrar el uuid', async () => {
      const d = visible();
      d.attachableFiles.assertUsableForAuthorizedContext.mockRejectedValue(
        new Error('File type not allowed file-1'),
      );

      const err = await runWithTenant('t1', () =>
        d.service.getImageContent('s1'),
      ).catch((e) => e);

      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(JSON.stringify(err.getResponse?.() ?? err.message)).not.toContain(
        'file-1',
      );
      expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
    });

    it('sin tenant verificado en el contexto no sirve nada', async () => {
      const d = visible();

      await expect(d.service.getImageContent('s1')).rejects.toBeDefined();
      expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
    });

    it('un archivo de otro tenant no se sirve aunque el servicio ya lo tuviera guardado', async () => {
      const d = visible();
      d.attachableFiles.assertUsableForAuthorizedContext.mockResolvedValue({
        file: {
          sensitivityConceptId: CONCEPTS.SENSITIVITY_NORMAL,
          tenantId: 'otro-tenant',
        },
      });

      await expect(
        runWithTenant('t1', () => d.service.getImageContent('s1')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
    });

    it('si la versión descargada no es una imagen de la lista, responde 404 y no envía los bytes', async () => {
      const d = visible();
      d.fileUpload.downloadForAuthorizedContext.mockResolvedValue({
        buffer: Buffer.from('<html>'),
        mimeType: 'text/html',
      });

      await expect(
        runWithTenant('t1', () => d.service.getImageContent('s1')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('imageFileId en el alta (P-22-8)', () => {
    const dto = {
      practiceId: 'pr1',
      code: 'CONS-01',
      name: 'Consulta general',
      defaultPrice: '100.00',
      imageFileId: 'file-1',
    } as any;

    /** Alta de la administración sobre un código libre. */
    function alta() {
      const d = build();
      d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
      d.serviceCatalogRepo.create.mockReturnValue(
        catalogRow({ id: 'nuevo', imageFileId: 'file-1' }),
      );
      return d;
    }

    it('acepta una imagen propia, de su organización y de sensibilidad normal', async () => {
      const d = alta();

      await runWithTenant('t1', () => d.service.create(dto, actor));

      expect(d.attachableFiles.assertUsableBy).toHaveBeenCalledWith(
        expect.anything(),
        'file-1',
        actor,
        expect.objectContaining({
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        }),
      );
      expect(d.serviceCatalogRepo.create).toHaveBeenCalled();
    });

    it('rechaza con 404 un archivo de otro usuario y no crea nada', async () => {
      const d = alta();
      d.attachableFiles.assertUsableBy.mockRejectedValue(
        new Error('El archivo no le pertenece'),
      );

      const err = await runWithTenant('t1', () =>
        d.service.create(dto, actor),
      ).catch((e) => e);

      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(d.serviceCatalogRepo.create).not.toHaveBeenCalled();
    });

    it('rechaza con 404 un archivo de otro tenant', async () => {
      const d = alta();
      d.attachableFiles.assertUsableBy.mockResolvedValue({
        file: {
          sensitivityConceptId: CONCEPTS.SENSITIVITY_NORMAL,
          tenantId: 'otro-tenant',
        },
      });

      await expect(
        runWithTenant('t1', () => d.service.create(dto, actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.serviceCatalogRepo.create).not.toHaveBeenCalled();
    });

    it('rechaza con 404 un archivo que no es de sensibilidad normal', async () => {
      const d = alta();
      d.attachableFiles.assertUsableBy.mockResolvedValue({
        file: { sensitivityConceptId: 'phi', tenantId: 't1' },
      });

      await expect(
        runWithTenant('t1', () => d.service.create(dto, actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('el rechazo es el mismo 404 para inexistente, ajeno y de otro tenant', async () => {
      const mensajes = new Set<string>();
      for (const falla of [
        () => Promise.reject(new Error('no existe')),
        () => Promise.reject(new Error('no le pertenece')),
        () =>
          Promise.resolve({
            file: {
              sensitivityConceptId: CONCEPTS.SENSITIVITY_NORMAL,
              tenantId: 'otro-tenant',
            },
          }),
      ]) {
        const d = alta();
        d.attachableFiles.assertUsableBy.mockImplementation(falla);
        const err = await runWithTenant('t1', () =>
          d.service.create(dto, actor),
        ).catch((e) => e);
        mensajes.add(`${err.constructor.name}:${err.message}`);
      }
      expect(mensajes.size).toBe(1);
    });

    it('sin imageFileId no consulta archivos', async () => {
      const d = alta();

      await runWithTenant('t1', () =>
        d.service.create({ ...dto, imageFileId: undefined }, actor),
      );

      expect(d.attachableFiles.assertUsableBy).not.toHaveBeenCalled();
    });
  });
});

/**
 * Rol administrativo acotado a un tenant (`scopedRoles`, MCH-001): figura en
 * `roles`, pero sólo opera el catálogo de las prácticas de su tenant (#1241).
 */
describe('BillingServiceCatalogService · administración acotada a un tenant', () => {
  const scopedTo = (role: string) =>
    ({
      id: 'admin-a',
      roles: [role],
      scopedRoles: { 'tenant-a': [role] },
    }) as any;
  const dto = {
    practiceId: 'pr1',
    code: 'NEBU-01',
    name: 'Nebulización',
    defaultPrice: '80.00',
  };

  /** Da de alta en `pr1`, práctica del tenant indicado. */
  const createAs = (
    actorUser: unknown,
    practiceTenant: string | null,
    contextTenant?: string,
  ) => {
    const d = build();
    d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue(
      practiceTenant,
    );
    d.serviceCatalogRepo.findByCode.mockResolvedValue(null);
    d.serviceCatalogRepo.create.mockReturnValue(item);
    const run = () => d.service.create(dto, actorUser as any);
    return {
      d,
      result:
        contextTenant === undefined ? run() : runWithTenant(contextTenant, run),
    };
  };

  it('acotado a A no da de alta en una práctica de B, con B en contexto ni sin tenant', async () => {
    for (const role of ['SECURITY_ADMIN', 'SUPERADMIN']) {
      for (const context of ['tenant-b', undefined]) {
        const { d, result } = createAs(scopedTo(role), 'tenant-b', context);
        await expect(result).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.serviceCatalogRepo.create).not.toHaveBeenCalled();
      }
      // Una práctica inexistente tampoco se le abre.
      const { result } = createAs(scopedTo(role), null, 'tenant-a');
      await expect(result).rejects.toBeInstanceOf(ResourceNotFoundException);
    }
  });

  it('acotado a A da de alta en su tenant; el global, en cualquiera sin consultar el tenant', async () => {
    for (const role of ['SECURITY_ADMIN', 'SUPERADMIN']) {
      const own = createAs(scopedTo(role), 'tenant-a', 'tenant-a');
      await expect(own.result).resolves.toEqual(item);

      const global = createAs(
        { id: 'admin-g', roles: [role] },
        'tenant-b',
        'tenant-b',
      );
      await expect(global.result).resolves.toEqual(item);
      expect(
        global.d.practiceTenantLookup.findTenantOfPractice,
      ).not.toHaveBeenCalled();
    }
  });

  /** Corrige `s1`, servicio de `pr1`, práctica del tenant indicado. */
  const updateAs = (
    actorUser: unknown,
    practiceTenant: string,
    contextTenant?: string,
  ) => {
    const d = build();
    d.serviceCatalogRepo.findById.mockResolvedValue(catalogRow());
    d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue(
      practiceTenant,
    );
    const run = () =>
      d.service.update('s1', { defaultPrice: '90.00' }, actorUser as any);
    return contextTenant === undefined
      ? run()
      : runWithTenant(contextTenant, run);
  };

  it('SECURITY_ADMIN acotado a A no corrige un servicio de B, con B en contexto ni sin tenant', async () => {
    const scoped = scopedTo('SECURITY_ADMIN');
    await expect(
      updateAs(scoped, 'tenant-b', 'tenant-b'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(updateAs(scoped, 'tenant-b')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('SECURITY_ADMIN acotado a A corrige los de A; el global, los de cualquiera', async () => {
    const scoped = scopedTo('SECURITY_ADMIN');
    await expect(
      updateAs(scoped, 'tenant-a', 'tenant-a'),
    ).resolves.toMatchObject({ defaultPrice: '90.00' });
    await expect(updateAs(scoped, 'tenant-a')).resolves.toMatchObject({
      defaultPrice: '90.00',
    });
    await expect(
      updateAs(actor, 'tenant-b', 'tenant-b'),
    ).resolves.toMatchObject({ defaultPrice: '90.00' });
    await expect(updateAs(actor, 'tenant-b')).resolves.toMatchObject({
      defaultPrice: '90.00',
    });
  });
});
