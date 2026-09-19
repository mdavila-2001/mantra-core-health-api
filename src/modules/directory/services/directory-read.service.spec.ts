import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ForbiddenException } from '@nestjs/common';
import { DirectoryReadService } from './directory-read.service';
import { DIR, TENANT_TYPE_CONCEPT_BY_CODE } from '../directory.concepts';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';

const actor = { id: 'u1', roles: ['STAFF'] } as any;
const TENANT = 't1';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  const tenantsRepo = {
    findById: mockFn(() => Promise.resolve({ id: TENANT })),
    searchPage: mockFn(() => Promise.resolve([])),
  };
  const membershipsRepo = {
    findPageByTenant: mockFn(() => Promise.resolve([])),
    findByIdInTenant: mockFn(() => Promise.resolve({ id: 'm1' })),
    // TP-1: por defecto el actor no pertenece a ninguna organización, que es el
    // estado de un paciente o de un médico con consultorio propio.
    findActiveByUser: mockFn(() => Promise.resolve([])),
  };
  const branchesRepo = { findByTenant: mockFn(() => Promise.resolve([])) };
  const branchMembershipsRepo = {
    findByMembership: mockFn(() => Promise.resolve([])),
  };
  const tenantAdmin = { assertCanRead: mockFn(() => Promise.resolve()) };
  // Por defecto no hay carrier que leer; los tests PAYER lo sobrescriben.
  const catalogRepo = {
    findCarrierByTenantId: mockFn(() => Promise.resolve(null)),
  };
  // Por defecto no hay casa matriz georreferenciada (subtarea 1.3).
  const addressesRepo = {
    findVigenteByOwnerAndUse: mockFn(() => Promise.resolve(null)),
  };
  // Por defecto la organización no declaró representante ni gerencias
  // (subtarea 1.4); los tests que las ejercen sobrescriben estos dobles.
  const legalRepo = {
    listLegalRepsByTenant: mockFn(() => Promise.resolve([])),
    findPersonsByIds: mockFn(() => Promise.resolve(new Map())),
  };
  const identifiersRepo = {
    findByIds: mockFn(() => Promise.resolve(new Map())),
  };
  const contactPointsRepo = {
    findVigentesByOwners: mockFn(() => Promise.resolve([])),
  };
  // El mapa va al revés que en el servicio (código -> concepto), como el real.
  const concepts = {
    resolve: mockFn(() =>
      Promise.resolve({
        documentType: new Map(),
        issuingAuthority: new Map(),
        verificationStatus: new Map(),
        representativeRole: new Map([
          ['REPRESENTANTE_LEGAL', 'ct-representante'],
          ['GERENTE_GENERAL', 'ct-general'],
          ['GERENTE_COMERCIAL', 'ct-comercial'],
          ['GERENTE_MARKETING', 'ct-marketing'],
        ]),
      }),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DirectoryReadService(
    em,
    tenantsRepo as any,
    membershipsRepo as any,
    branchesRepo as any,
    branchMembershipsRepo as any,
    tenantAdmin as any,
    catalogRepo as any,
    addressesRepo as any,
    legalRepo as any,
    identifiersRepo as any,
    contactPointsRepo as any,
    concepts as any,
    logger as any,
  );
  return {
    service,
    tenantsRepo,
    membershipsRepo,
    branchesRepo,
    branchMembershipsRepo,
    tenantAdmin,
    catalogRepo,
    addressesRepo,
    legalRepo,
    identifiersRepo,
    contactPointsRepo,
    concepts,
  };
}

/** Fila de organización con los campos que el listado publica. */
const tenantRow = (id: string, code: string) => ({
  id,
  code,
  legalName: `Razón ${code}`,
  tradeName: undefined,
  tenantTypeConceptId: 'tipo',
  statusConceptId: 'activo',
  verificationStatusConceptId: 'verificado',
  legalEntityTypeConceptId: 'forma',
  parentTenantId: undefined,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
});

describe('DirectoryReadService — alcance por organización', () => {
  it.each([
    ['listBranches', (s: any) => s.listBranches(TENANT, actor)],
    [
      'listMemberships',
      (s: any) => s.listMemberships(TENANT, { limit: 50 }, actor),
    ],
    [
      'listChildTenants',
      (s: any) => s.listChildTenants(TENANT, { limit: 50 }, actor),
    ],
    [
      'listBranchAssignments',
      (s: any) => s.listBranchAssignments(TENANT, 'm1', actor),
    ],
    ['getTenantById', (s: any) => s.getTenantById(TENANT, actor)],
  ])('%s exige poder leer la organización', async (_nombre, invocar) => {
    // Un listado es justo la forma en que un fallo de alcance se vuelve una fuga
    // masiva entre organizaciones.
    const d = build();
    d.tenantAdmin.assertCanRead.mockRejectedValue(new ForbiddenException());

    await expect(invocar(d.service)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el listado global de organizaciones no pasa por el alcance de tenant', async () => {
    // Se publica en `/admin/tenants`, que ya exige rol de plataforma.
    const d = build();

    await d.service.searchTenants({ limit: 50 });

    expect(d.tenantAdmin.assertCanRead).not.toHaveBeenCalled();
  });

  it('una organización inexistente es 404 y no 403', async () => {
    // Lo contrario permitiría sondear qué identificadores existen midiendo el
    // código de error.
    const d = build();
    d.tenantsRepo.findById.mockResolvedValue(null);

    await expect(d.service.getTenantById(TENANT, actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.tenantAdmin.assertCanRead).not.toHaveBeenCalled();
  });

  it('busca la membresía dentro de su organización, no por id suelto', async () => {
    const d = build();

    await d.service.listBranchAssignments(TENANT, 'm1', actor);

    expect(d.membershipsRepo.findByIdInTenant).toHaveBeenCalledWith(
      expect.anything(),
      'm1',
      TENANT,
    );
  });

  it('falla cuando la membresía no pertenece a esa organización', async () => {
    const d = build();
    d.membershipsRepo.findByIdInTenant.mockResolvedValue(null);

    await expect(
      d.service.listBranchAssignments(TENANT, 'm1', actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('DirectoryReadService.searchTenants', () => {
  it('pide una fila de más y la recorta para saber si hay página siguiente', async () => {
    const d = build();
    d.tenantsRepo.searchPage.mockResolvedValue([
      tenantRow('t1', 'AAA'),
      tenantRow('t2', 'BBB'),
      tenantRow('t3', 'CCC'),
    ]);

    const result = await d.service.searchTenants({ limit: 2 });

    expect(result.count).toBe(2);
    expect(result.items.map((item: any) => item.code)).toEqual(['AAA', 'BBB']);
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('continúa desde el cursor de la página anterior', async () => {
    const d = build();
    d.tenantsRepo.searchPage.mockResolvedValue([
      tenantRow('t1', 'AAA'),
      tenantRow('t2', 'BBB'),
    ]);
    const primera = await d.service.searchTenants({ limit: 1 });

    d.tenantsRepo.searchPage.mockClear();
    d.tenantsRepo.searchPage.mockResolvedValue([]);
    await d.service.searchTenants({ cursor: primera.nextCursor!, limit: 1 });

    expect(d.tenantsRepo.searchPage).toHaveBeenCalledWith(
      expect.anything(),
      {
        query: undefined,
        statusConceptId: undefined,
        parentTenantId: undefined,
        afterCode: 'AAA',
      },
      2,
    );
  });

  it('acota las hijas a su organización madre', async () => {
    const d = build();

    await d.service.listChildTenants(TENANT, { limit: 50 }, actor);

    expect(d.tenantsRepo.searchPage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parentTenantId: TENANT }),
      51,
    );
  });
});

describe('DirectoryReadService.listMemberships', () => {
  const membershipRow = (id: string, createdAt: string) => ({
    id,
    userId: 'u9',
    tenantRoleConceptId: 'rol',
    statusConceptId: 'activa',
    accessScopeConceptId: 'ambito',
    primaryBranchId: undefined,
    startDate: undefined,
    endDate: undefined,
    createdAt: new Date(createdAt),
  });

  it('desempata el cursor por identificador, no sólo por fecha', async () => {
    // Varias membresías se crean en la misma transacción y comparten `created_at`.
    const d = build();
    d.membershipsRepo.findPageByTenant.mockResolvedValue([
      membershipRow('m1', '2026-01-01T00:00:00Z'),
      membershipRow('m2', '2026-01-01T00:00:00Z'),
    ]);
    const primera = await d.service.listMemberships(
      TENANT,
      { limit: 1 },
      actor,
    );

    d.membershipsRepo.findPageByTenant.mockClear();
    d.membershipsRepo.findPageByTenant.mockResolvedValue([]);
    await d.service.listMemberships(
      TENANT,
      { cursor: primera.nextCursor!, limit: 1 },
      actor,
    );

    expect(d.membershipsRepo.findPageByTenant).toHaveBeenCalledWith(
      expect.anything(),
      TENANT,
      {
        statusConceptId: undefined,
        after: { createdAt: new Date('2026-01-01T00:00:00Z'), id: 'm1' },
      },
      2,
    );
  });

  it('normaliza a `null` las fechas ausentes', async () => {
    const d = build();
    d.membershipsRepo.findPageByTenant.mockResolvedValue([
      membershipRow('m1', '2026-01-01T00:00:00Z'),
    ]);

    const result = await d.service.listMemberships(
      TENANT,
      { limit: 50 },
      actor,
    );

    expect(result.items[0].startDate).toBeNull();
    expect(result.items[0].endDate).toBeNull();
    expect(result.items[0].primaryBranchId).toBeNull();
  });

  /**
   * TP-1: la organización como actor.
   *
   * Todas las lecturas del directorio empiezan por un `tenantId` que hay que
   * traer de algún lado, y para quien administra su propia organización eso era
   * un callejón: la pantalla necesitaba el id para pedir la ficha y el único
   * lugar de donde sacarlo era la ficha.
   */
  describe('listMyTenants (TP-1)', () => {
    const actor = { id: 'user-1', roles: ['USER'] } as any;

    it('quien no pertenece a ninguna organización recibe una lista vacía, no un 403', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([]);

      await expect(d.service.listMyTenants(actor)).resolves.toEqual({
        items: [],
      });
    });

    it('devuelve cada organización con el rol del actor en ella', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        {
          tenantId: 'ten-1',
          tenantRoleConceptId: DIR.ROLE_ADMIN,
        },
      ]);
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-1',
        code: 'CLIN-1',
        legalName: 'Clínica del Centro SRL',
        tradeName: 'Clínica del Centro',
        tenantTypeConceptId: 'tt-1',
        statusConceptId: 'st-1',
        verificationStatusConceptId: 'vr-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const salida = await d.service.listMyTenants(actor);

      expect(salida.items).toHaveLength(1);
      expect(salida.items[0].id).toBe('ten-1');
      expect(salida.items[0].myRoleConceptId).toBe(DIR.ROLE_ADMIN);
      expect(salida.items[0].canAdminister).toBe(true);
    });

    /**
     * El `staff` ve su organización y no la administra: es la distinción que
     * decide si la pantalla dibuja los botones de editar e invitar.
     */
    it('el staff ve la organización pero no la administra', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        { tenantId: 'ten-1', tenantRoleConceptId: DIR.ROLE_STAFF },
      ]);
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-1',
        code: 'CLIN-1',
        legalName: 'Clínica del Centro SRL',
        tenantTypeConceptId: 'tt-1',
        statusConceptId: 'st-1',
        verificationStatusConceptId: 'vr-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const salida = await d.service.listMyTenants(actor);

      expect(salida.items[0].canAdminister).toBe(false);
    });

    /**
     * TP-1 + sigla/dirección: el panel propio de la aseguradora necesita ver
     * sus datos mínimos (código, NIT, sigla, dirección) sin pedirle el id del
     * carrier al actor.
     */
    it('para un tenant PAYER, incluye los datos de su aseguradora', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        { tenantId: 'ten-payer', tenantRoleConceptId: DIR.ROLE_OWNER },
      ]);
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-payer',
        code: 'ASE-1',
        legalName: 'Aseguradora X',
        tenantTypeConceptId: TENANT_TYPE_CONCEPT_BY_CODE.PAYER,
        statusConceptId: 'st-1',
        verificationStatusConceptId: 'vr-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      d.catalogRepo.findCarrierByTenantId.mockResolvedValue({
        carrierCode: 'CAR-1',
        regulatorIdentifier: 'APS-4821',
        sigla: 'ASX',
        address: 'Av. Siempre Viva 742',
      });

      const salida = await d.service.listMyTenants(actor);

      expect(salida.items[0].payer).toEqual({
        carrierCode: 'CAR-1',
        regulatorIdentifier: 'APS-4821',
        sigla: 'ASX',
        address: 'Av. Siempre Viva 742',
      });
    });

    /** Subtarea 1.3: la casa matriz georreferenciada vive en `common.addresses`, no en el carrier. */
    it('para un tenant PAYER con casa matriz georreferenciada, incluye latitude y longitude', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        { tenantId: 'ten-payer', tenantRoleConceptId: DIR.ROLE_OWNER },
      ]);
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-payer',
        code: 'ASE-1',
        legalName: 'Aseguradora X',
        tenantTypeConceptId: TENANT_TYPE_CONCEPT_BY_CODE.PAYER,
        statusConceptId: 'st-1',
        verificationStatusConceptId: 'vr-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      d.catalogRepo.findCarrierByTenantId.mockResolvedValue({
        carrierCode: 'CAR-1',
        regulatorIdentifier: 'APS-4821',
        sigla: 'ASX',
        address: 'Av. Siempre Viva 742',
      });
      // Tal como vuelve MikroORM: `numeric` como string, `null` (no
      // `undefined`) para lo que no aplicara — acá sí aplica.
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({
        latitude: '-17.7833',
        longitude: '-63.1821',
      });

      const salida = await d.service.listMyTenants(actor);

      expect(salida.items[0].payer).toEqual({
        carrierCode: 'CAR-1',
        regulatorIdentifier: 'APS-4821',
        sigla: 'ASX',
        address: 'Av. Siempre Viva 742',
        latitude: -17.7833,
        longitude: -63.1821,
      });
    });

    it('para un tenant que no es PAYER, no incluye el bloque `payer`', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        { tenantId: 'ten-1', tenantRoleConceptId: DIR.ROLE_OWNER },
      ]);
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-1',
        code: 'CLIN-1',
        legalName: 'Clínica del Centro SRL',
        tenantTypeConceptId: 'tt-provider',
        statusConceptId: 'st-1',
        verificationStatusConceptId: 'vr-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const salida = await d.service.listMyTenants(actor);

      expect(salida.items[0]).not.toHaveProperty('payer');
      expect(d.catalogRepo.findCarrierByTenantId).not.toHaveBeenCalled();
    });

    it('sólo pide las membresías ACTIVAS del actor', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([]);

      await d.service.listMyTenants(actor);

      expect(d.membershipsRepo.findActiveByUser).toHaveBeenCalledWith(
        expect.anything(),
        'user-1',
        DIR.MEMBERSHIP_ACTIVE,
      );
    });

    /**
     * Una membresía viva contra una organización que ya no está no es culpa de
     * quien pregunta: se omite en vez de romperle el panel.
     */
    it('una organización que ya no existe se omite en vez de fallar', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        { tenantId: 'ten-fantasma', tenantRoleConceptId: DIR.ROLE_ADMIN },
      ]);
      d.tenantsRepo.findById.mockResolvedValue(null);

      await expect(d.service.listMyTenants(actor)).resolves.toEqual({
        items: [],
      });
    });

    /**
     * Subtarea 1.4: el representante se identifica por su rol —no por el
     * orden en que Postgres devuelva las filas— y las gerencias salen en el
     * orden canónico de `EXECUTIVE_DTO_KEYS`, no en el que se hayan creado.
     */
    it('con representante legal y las tres gerencias, arma legalRepresentative y executives en orden canónico', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        { tenantId: 'ten-1', tenantRoleConceptId: DIR.ROLE_OWNER },
      ]);
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-1',
        code: 'ASE-1',
        legalName: 'Aseguradora X',
        tenantTypeConceptId: TENANT_TYPE_CONCEPT_BY_CODE.PAYER,
        statusConceptId: 'st-1',
        verificationStatusConceptId: 'vr-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // Deliberadamente fuera de orden canónico: comercial antes que general.
      d.legalRepo.listLegalRepsByTenant.mockResolvedValue([
        {
          personId: 'person-cm',
          representativeRoleConceptId: 'ct-comercial',
          isPrimary: null,
        },
        {
          personId: 'person-rep',
          representativeRoleConceptId: 'ct-representante',
          ciIdentifierId: 'ci-1',
          isPrimary: true,
        },
        {
          personId: 'person-mm',
          representativeRoleConceptId: 'ct-marketing',
          isPrimary: null,
        },
        {
          personId: 'person-gm',
          representativeRoleConceptId: 'ct-general',
          isPrimary: null,
        },
      ]);
      d.legalRepo.findPersonsByIds.mockResolvedValue(
        new Map([
          // `name`/`middleName`/`lastName`/`motherLastName` explícitos en
          // `null`, no omitidos: así hidrata MikroORM una columna nullable
          // sin valor (memoria del proyecto), y es lo que reprodujo el bug
          // real —`fichaDe` comparaba contra `undefined` y dejaba pasar un
          // `name: null` al JSON de respuesta.
          [
            'person-rep',
            {
              id: 'person-rep',
              displayName: 'Mariana Siles',
              name: null,
              middleName: null,
              lastName: null,
              motherLastName: null,
            },
          ],
          [
            'person-gm',
            {
              id: 'person-gm',
              displayName: 'Carlos Mendoza',
              name: null,
              middleName: null,
              lastName: null,
              motherLastName: null,
            },
          ],
          ['person-cm', { id: 'person-cm', displayName: 'Ana Paz' }],
          ['person-mm', { id: 'person-mm', displayName: 'Luis Rojas' }],
        ]),
      );
      d.identifiersRepo.findByIds.mockResolvedValue(
        new Map([['ci-1', { id: 'ci-1', value: '4872190 SC' }]]),
      );
      d.contactPointsRepo.findVigentesByOwners.mockResolvedValue([
        {
          ownerId: 'person-rep',
          systemConceptId: CONCEPTS.CONTACT_EMAIL,
          value: 'legal@aseguradora.com',
        },
        {
          ownerId: 'person-rep',
          systemConceptId: CONCEPTS.CONTACT_PHONE,
          value: '+591 70012345',
        },
        {
          ownerId: 'person-gm',
          systemConceptId: CONCEPTS.CONTACT_EMAIL,
          value: 'gm@aseguradora.com',
        },
        {
          ownerId: 'person-gm',
          systemConceptId: CONCEPTS.CONTACT_MOBILE,
          value: '+591 70000001',
        },
        {
          ownerId: 'person-cm',
          systemConceptId: CONCEPTS.CONTACT_EMAIL,
          value: 'cm@aseguradora.com',
        },
        {
          ownerId: 'person-cm',
          systemConceptId: CONCEPTS.CONTACT_MOBILE,
          value: '+591 70000002',
        },
        {
          ownerId: 'person-mm',
          systemConceptId: CONCEPTS.CONTACT_EMAIL,
          value: 'mm@aseguradora.com',
        },
        {
          ownerId: 'person-mm',
          systemConceptId: CONCEPTS.CONTACT_MOBILE,
          value: '+591 70000003',
        },
      ]);

      const salida = await d.service.listMyTenants(actor);

      expect(salida.items[0].legalRepresentative).toEqual({
        role: 'LEGAL_REPRESENTATIVE',
        fullName: 'Mariana Siles',
        email: 'legal@aseguradora.com',
        phone: '+591 70012345',
        idNumber: '4872190 SC',
      });
      expect(salida.items[0].executives).toEqual([
        {
          role: 'GENERAL_MANAGER',
          fullName: 'Carlos Mendoza',
          email: 'gm@aseguradora.com',
          phone: '+591 70000001',
          idNumber: undefined,
        },
        {
          role: 'COMMERCIAL_MANAGER',
          fullName: 'Ana Paz',
          email: 'cm@aseguradora.com',
          phone: '+591 70000002',
          idNumber: undefined,
        },
        {
          role: 'MARKETING_MANAGER',
          fullName: 'Luis Rojas',
          email: 'mm@aseguradora.com',
          phone: '+591 70000003',
          idNumber: undefined,
        },
      ]);
    });

    it('cuando la persona tiene las partes del nombre, la ficha las lleva junto a fullName', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        { tenantId: 'ten-1', tenantRoleConceptId: DIR.ROLE_OWNER },
      ]);
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-1',
        code: 'ASE-2',
        legalName: 'Aseguradora Y',
        tenantTypeConceptId: TENANT_TYPE_CONCEPT_BY_CODE.PAYER,
        statusConceptId: 'st-1',
        verificationStatusConceptId: 'vr-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      d.legalRepo.listLegalRepsByTenant.mockResolvedValue([
        {
          personId: 'person-rep2',
          representativeRoleConceptId: 'ct-representante',
          ciIdentifierId: undefined,
          isPrimary: true,
        },
      ]);
      d.legalRepo.findPersonsByIds.mockResolvedValue(
        new Map([
          [
            'person-rep2',
            {
              id: 'person-rep2',
              displayName: 'Mariana Elena Sofía Siles Justiniano',
              name: 'Mariana',
              middleName: 'Elena Sofía',
              lastName: 'Siles',
              motherLastName: 'Justiniano',
            },
          ],
        ]),
      );
      d.identifiersRepo.findByIds.mockResolvedValue(new Map());
      d.contactPointsRepo.findVigentesByOwners.mockResolvedValue([
        {
          ownerId: 'person-rep2',
          systemConceptId: CONCEPTS.CONTACT_EMAIL,
          value: 'legal@aseguradora.com',
        },
      ]);

      const salida = await d.service.listMyTenants(actor);

      expect(salida.items[0].legalRepresentative).toEqual({
        role: 'LEGAL_REPRESENTATIVE',
        fullName: 'Mariana Elena Sofía Siles Justiniano',
        name: 'Mariana',
        middleName: 'Elena Sofía',
        lastName: 'Siles',
        motherLastName: 'Justiniano',
        email: 'legal@aseguradora.com',
        phone: undefined,
        idNumber: undefined,
      });
    });

    it('sin representante legal ni gerencias, la ficha no lleva esas claves', async () => {
      const d = build();
      d.membershipsRepo.findActiveByUser.mockResolvedValue([
        { tenantId: 'ten-1', tenantRoleConceptId: DIR.ROLE_OWNER },
      ]);
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-1',
        code: 'CLIN-1',
        legalName: 'Clínica del Centro SRL',
        tenantTypeConceptId: 'tt-provider',
        statusConceptId: 'st-1',
        verificationStatusConceptId: 'vr-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const salida = await d.service.listMyTenants(actor);

      expect(salida.items[0]).not.toHaveProperty('legalRepresentative');
      expect(salida.items[0]).not.toHaveProperty('executives');
      expect(d.legalRepo.findPersonsByIds).not.toHaveBeenCalled();
    });
  });
});
