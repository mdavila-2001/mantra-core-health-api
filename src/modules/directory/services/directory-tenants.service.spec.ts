import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DirectoryTenantsService } from './directory-tenants.service';
import { DIR } from '../directory.concepts';
import { PHARM } from '../../pharmacy/pharmacy.concepts';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SUPERADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const tenantsRepo = {
    findById: mockFn(),
    searchPage: mockFn(() => Promise.resolve([])),
    findByCode: mockFn(),
    create: mockFn(),
  };
  const membershipsRepo = {
    create: mockFn(),
    findByTenantAndStatus: mockFn().mockResolvedValue([]),
  };
  const branchesRepo = {
    findByTenantAndStatus: mockFn().mockResolvedValue([]),
  };
  const typeProfile = {
    assertProfileMatchesType: mockFn(),
    declaredConcepts: mockFn(() => ({})),
    assertConceptsExist: mockFn().mockResolvedValue(undefined),
    materializeProfile: mockFn(() => undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  // Quién administra la organización se prueba en
  // `tenant-administration.service.spec.ts`; acá el doble deja pasar para no
  // mezclar el permiso con la lógica del servicio.
  const tenantAdmin = {
    assertCanAdminister: mockFn().mockResolvedValue(undefined),
    assertCanRead: mockFn().mockResolvedValue(undefined),
    assertCanChangeOwnership: mockFn().mockResolvedValue(undefined),
  };
  // La vitrina pública: acá sólo interesa que la verificación la pida; lo que
  // la proyección hace por dentro se prueba en su propio spec.
  const publicProfiles = {
    projectOrganization: mockFn().mockResolvedValue('pub-1'),
  };
  // Por defecto no hay carrier que editar; los tests PAYER lo sobrescriben.
  const catalogRepo = {
    findCarrierByTenantId: mockFn(() => Promise.resolve(null)),
  };
  // P50: por defecto la farmacia cumple; los tests de farmacia lo sobrescriben.
  const pharmacyRequirements = {
    evaluate: mockFn().mockResolvedValue({
      ready: true,
      missing: [],
      documentIds: ['doc-1'],
    }),
    markDocumentsVerified: mockFn().mockResolvedValue(undefined),
    // P51: misma clasificación que el servicio real, sin la lectura de la
    // unidad: un DIAGNOSTIC_CENTER cuenta acá como laboratorio.
    evaluateForTenant: mockFn(
      async (
        tx: unknown,
        t: { tenantTypeConceptId?: string },
      ): Promise<unknown> => {
        const kind =
          t.tenantTypeConceptId === CONCEPTS.TENANT_TYPE_PHARMACY
            ? 'PHARMACY'
            : t.tenantTypeConceptId === CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER
              ? 'LABORATORY'
              : undefined;
        if (kind === undefined) return undefined;
        return {
          kind,
          readiness: await pharmacyRequirements.evaluate(tx, t, kind),
        };
      },
    ),
  };
  const service = new DirectoryTenantsService(
    em as any,
    tenantsRepo,
    membershipsRepo as any,
    branchesRepo as any,
    typeProfile as any,
    tenantAdmin as any,
    publicProfiles as any,
    catalogRepo as any,
    logger as any,
    pharmacyRequirements as any,
  );
  return {
    pharmacyRequirements,
    service,
    tx,
    tenantsRepo,
    membershipsRepo,
    branchesRepo,
    tenantAdmin,
    publicProfiles,
    catalogRepo,
  };
}

describe('DirectoryTenantsService', () => {
  describe('provision (UC-04-01)', () => {
    it('creates tenant, flushes parent before the owner membership', async () => {
      const d = build();
      d.tenantsRepo.findByCode.mockResolvedValue(null);
      const tenant = {
        id: 't1',
        code: 'ACME',
        legalName: 'Acme',
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        createdAt: new Date('2026-01-01'),
      };
      d.tenantsRepo.create.mockReturnValue(tenant);

      const res = await d.service.provision(
        {
          tenantType: 'PROVIDER' as const,
          countryConceptId: 'c1',
          jurisdictionConceptId: 'j1',
          code: 'ACME',
          legalName: 'Acme',
          ownerUserId: 'u1',
        },
        actor,
      );

      expect(res.id).toBe('t1');
      expect(res.status).toBe(DIR.TENANT_PENDING);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.membershipsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: 't1',
          tenantRoleConceptId: DIR.ROLE_OWNER,
        }),
      );
    });

    it('un proceso interno puede fijar el id del tenant y de su membresía owner', async () => {
      const d = build();
      d.tenantsRepo.findByCode.mockResolvedValue(null);
      d.tenantsRepo.create.mockReturnValue({
        id: 'fijo-1',
        code: 'ACME',
        legalName: 'Acme',
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        createdAt: new Date('2026-01-01'),
      });

      await d.service.provision(
        {
          tenantType: 'PROVIDER' as const,
          countryConceptId: 'c1',
          jurisdictionConceptId: 'j1',
          code: 'ACME',
          legalName: 'Acme',
          ownerUserId: 'u1',
        },
        actor,
        { tenantId: 'fijo-1', ownerMembershipId: 'fijo-m1' },
      );

      expect(d.tenantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ id: 'fijo-1' }),
      );
      expect(d.membershipsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ id: 'fijo-m1', tenantId: 'fijo-1' }),
      );
    });

    it('sin ids fijos deja que la entidad genere los suyos', async () => {
      const d = build();
      d.tenantsRepo.findByCode.mockResolvedValue(null);
      d.tenantsRepo.create.mockReturnValue({
        id: 't1',
        code: 'ACME',
        legalName: 'Acme',
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        createdAt: new Date('2026-01-01'),
      });

      await d.service.provision(
        {
          tenantType: 'PROVIDER' as const,
          countryConceptId: 'c1',
          jurisdictionConceptId: 'j1',
          code: 'ACME',
          legalName: 'Acme',
          ownerUserId: 'u1',
        },
        actor,
      );

      const [, data] = d.tenantsRepo.create.mock.calls[0] as unknown as [
        unknown,
        { id?: string },
      ];
      expect(data.id).toBeUndefined();
    });

    it('rejects when the code already exists (conflict)', async () => {
      const d = build();
      d.tenantsRepo.findByCode.mockResolvedValue({ id: 'x' });
      await expect(
        d.service.provision(
          {
            tenantType: 'PROVIDER' as const,
            countryConceptId: 'c1',
            jurisdictionConceptId: 'j1',
            code: 'ACME',
            legalName: 'Acme',
            ownerUserId: 'u1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.tenantsRepo.create).not.toHaveBeenCalled();
    });

    it('resuelve legalEntityType por código (subtarea 1.1)', async () => {
      const d = build();
      d.tenantsRepo.findByCode.mockResolvedValue(null);
      d.tenantsRepo.create.mockReturnValue({
        id: 't1',
        code: 'ACME',
        legalName: 'Acme',
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        createdAt: new Date('2026-01-01'),
      });

      await d.service.provision(
        {
          tenantType: 'PROVIDER' as const,
          legalEntityType: 'SRL',
          countryConceptId: 'c1',
          jurisdictionConceptId: 'j1',
          code: 'ACME',
          legalName: 'Acme',
          ownerUserId: 'u1',
        } as any,
        actor,
      );

      expect(d.tenantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          legalEntityTypeConceptId: CONCEPTS.LEGAL_ENTITY_SRL,
        }),
      );
    });
  });

  describe('verify (UC-04-02)', () => {
    it('throws when tenant is missing', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue(null);
      await expect(d.service.verify('t1', {}, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rejects when the tenant is not pending (precondition)', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
      });
      await expect(d.service.verify('t1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('activates and verifies a pending tenant', async () => {
      const d = build();
      const tenant = {
        id: 't1',
        code: 'ACME',
        legalName: 'Acme',
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      d.tenantsRepo.findById.mockResolvedValue(tenant);

      const res = await d.service.verify('t1', {}, actor);

      expect(tenant.statusConceptId).toBe(CONCEPTS.TENANT_ACTIVE);
      expect(tenant.verificationStatusConceptId).toBe(CONCEPTS.TENANT_VERIFIED);
      expect(res.status).toBe(CONCEPTS.TENANT_ACTIVE);
    });
  });

  describe('createChild (UC-04-03)', () => {
    it('rejects when the parent is not active', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: DIR.TENANT_PENDING,
      });
      await expect(
        d.service.createChild(
          'p1',
          {
            tenantType: 'PROVIDER' as const,
            countryConceptId: 'c1',
            jurisdictionConceptId: 'j1',
            code: 'C',
            legalName: 'C',
            adminUserId: 'u1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates a child tenant linked to the parent with an admin membership', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
        tenantTypeConceptId: 'tt',
        legalEntityTypeConceptId: 'le',
        dataResidencyRegionConceptId: 'dr',
      });
      d.tenantsRepo.findByCode.mockResolvedValue(null);
      const child = {
        id: 'c1',
        code: 'C',
        legalName: 'C',
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        parentTenantId: 'p1',
        createdAt: new Date(),
      };
      d.tenantsRepo.create.mockReturnValue(child);

      const res = await d.service.createChild(
        'p1',
        {
          tenantType: 'PROVIDER' as const,
          countryConceptId: 'c1',
          jurisdictionConceptId: 'j1',
          code: 'C',
          legalName: 'C',
          adminUserId: 'u1',
        },
        actor,
      );

      expect(res.parentTenantId).toBe('p1');
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.membershipsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantRoleConceptId: DIR.ROLE_ADMIN }),
      );
    });
  });

  describe('suspend (UC-04-10)', () => {
    it('rejects when tenant is not active', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: DIR.TENANT_SUSPENDED,
      });
      await expect(
        d.service.suspend('t1', { reason: 'x' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('suspends the tenant and cascades to active branches and memberships', async () => {
      const d = build();
      const tenant = {
        id: 't1',
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
        updatedAt: new Date(),
      };
      d.tenantsRepo.findById.mockResolvedValue(tenant);
      const branch = {
        statusConceptId: DIR.BRANCH_ACTIVE,
        updatedAt: new Date(),
      };
      const membership = {
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        updatedAt: new Date(),
      };
      d.branchesRepo.findByTenantAndStatus.mockResolvedValue([branch]);
      d.membershipsRepo.findByTenantAndStatus.mockResolvedValue([membership]);

      const res = await d.service.suspend('t1', { reason: 'fraud' }, actor);

      expect(res).toEqual({ ok: true });
      expect(tenant.statusConceptId).toBe(DIR.TENANT_SUSPENDED);
      expect(branch.statusConceptId).toBe(DIR.BRANCH_SUSPENDED);
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_SUSPENDED);
    });
  });

  /**
   * TP-1: una organización se aprovisionaba y después no había forma de
   * tocarla. Corregir la razón social mal tipeada, poner el nombre comercial
   * con el que la conocen los pacientes o declarar su zona horaria —que decide
   * cómo se leen los horarios de sus agendas— exigía escribir en la base.
   */
  describe('updateTenant (TP-1)', () => {
    const actor = { id: 'user-org', roles: ['USER'] } as any;

    /** La organización que existe, para no repetirla en cada prueba. */
    function withOrganization(d: ReturnType<typeof build>): any {
      const tenant = {
        id: 'ten-1',
        code: 'CLIN-1',
        legalName: 'Clinica del Centro SRL',
        tradeName: undefined as string | undefined,
        timeZone: undefined as string | undefined,
        tenantTypeConceptId: 'tt-1',
        statusConceptId: 'st-1',
        verificationStatusConceptId: 'vr-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
      };
      d.tenantsRepo.findById.mockResolvedValue(tenant);
      return tenant;
    }

    it('cambia sólo los campos que vienen', async () => {
      const d = build();
      const tenant = withOrganization(d);

      await d.service.updateTenant(
        'ten-1',
        { tradeName: 'Clínica del Centro', timeZone: 'America/La_Paz' } as any,
        actor,
      );

      expect(tenant.tradeName).toBe('Clínica del Centro');
      expect(tenant.timeZone).toBe('America/La_Paz');
      // No vino en el cuerpo: no se toca.
      expect(tenant.legalName).toBe('Clinica del Centro SRL');
    });

    it('exige poder administrar ESA organización', async () => {
      const d = build();
      withOrganization(d);

      await d.service.updateTenant('ten-1', { tradeName: 'X' } as any, actor);

      expect(d.tenantAdmin.assertCanAdminister).toHaveBeenCalledWith(
        expect.anything(),
        'ten-1',
        actor,
      );
    });

    /**
     * 404 antes que 403: lo contrario permitiría sondear qué identificadores
     * existen midiendo qué código de error devuelve cada uno.
     */
    it('una organización inexistente responde no encontrada, sin consultar permisos', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.updateTenant('ten-x', { tradeName: 'X' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tenantAdmin.assertCanAdminister).not.toHaveBeenCalled();
    });

    /**
     * TP-1 + sigla/dirección: el panel propio de una aseguradora edita su
     * sigla, dirección y NIT (`regulatorIdentifier`) desde acá.
     */
    it('con bloque `payer` y carrier existente, actualiza sólo lo que viene', async () => {
      const d = build();
      withOrganization(d);
      const carrier = {
        sigla: 'OLD',
        address: 'Dirección vieja',
        regulatorIdentifier: 'OLD-NIT',
      };
      d.catalogRepo.findCarrierByTenantId.mockResolvedValue(carrier);

      await d.service.updateTenant(
        'ten-1',
        { payer: { sigla: 'BUPA', address: 'Av. Siempre Viva 742' } } as any,
        actor,
      );

      expect(carrier.sigla).toBe('BUPA');
      expect(carrier.address).toBe('Av. Siempre Viva 742');
      // No vino en el cuerpo: no se toca.
      expect(carrier.regulatorIdentifier).toBe('OLD-NIT');
    });

    it('con bloque `payer` pero sin carrier asociado, no rompe el resto del update', async () => {
      const d = build();
      const tenant = withOrganization(d);
      d.catalogRepo.findCarrierByTenantId.mockResolvedValue(null);

      await expect(
        d.service.updateTenant(
          'ten-1',
          {
            tradeName: 'Clínica del Centro',
            payer: { sigla: 'BUPA' },
          } as any,
          actor,
        ),
      ).resolves.toBeDefined();
      expect(tenant.tradeName).toBe('Clínica del Centro');
    });

    it('sin bloque `payer`, no consulta el catálogo de aseguradoras', async () => {
      const d = build();
      withOrganization(d);

      await d.service.updateTenant('ten-1', { tradeName: 'X' } as any, actor);

      expect(d.catalogRepo.findCarrierByTenantId).not.toHaveBeenCalled();
    });
  });

  /**
   * TP-1: antes de esto una organización jamás llegaba al directorio público
   * —nadie proyectaba su vitrina—, así que «la no verificada es invisible» se
   * cumplía por la peor de las razones: lo eran todas.
   */
  describe('verify · publica la organización (TP-1)', () => {
    const actor = { id: 'user-plat', roles: ['SECURITY_ADMIN'] } as any;

    it('verificar proyecta la vitrina pública con el nombre comercial', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-1',
        code: 'CLIN-1',
        legalName: 'Clinica del Centro SRL',
        tradeName: 'Clínica del Centro',
        statusConceptId: DIR.TENANT_PENDING,
        tenantTypeConceptId: 'tt-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
      });

      await d.service.verify('ten-1', {} as any, actor);

      expect(d.publicProfiles.projectOrganization).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          targetId: 'ten-1',
          displayName: 'Clínica del Centro',
        }),
      );
    });

    it('sin nombre comercial se publica con la razón social', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-2',
        code: 'CLIN-2',
        legalName: 'Centro Médico Norte SRL',
        statusConceptId: DIR.TENANT_PENDING,
        tenantTypeConceptId: 'tt-1',
        legalEntityTypeConceptId: 'le-1',
        createdAt: new Date(),
      });

      await d.service.verify('ten-2', {} as any, actor);

      expect(d.publicProfiles.projectOrganization).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ displayName: 'Centro Médico Norte SRL' }),
      );
    });

    it('no evalúa requisitos de farmacia para otro tipo de organización', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-1',
        legalName: 'Clinica',
        statusConceptId: DIR.TENANT_PENDING,
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PROVIDER,
        createdAt: new Date(),
      });

      await d.service.verify('ten-1', {} as any, actor);

      expect(d.pharmacyRequirements.evaluate).not.toHaveBeenCalled();
    });

    /** Sin aprobar no aparece: la vitrina se crea al verificar, no antes. */
    it('una organización que no está pendiente no se publica', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-3',
        statusConceptId: 'otro-estado',
        legalName: 'X',
        createdAt: new Date(),
      });

      await expect(
        d.service.verify('ten-3', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.publicProfiles.projectOrganization).not.toHaveBeenCalled();
    });
  });

  describe('verify · farmacia sin papeles no opera (P50)', () => {
    const actor = { id: 'user-plat', roles: ['SECURITY_ADMIN'] } as any;
    const pharmacyTenant = () => ({
      id: 'ten-ph',
      code: 'FARM-1',
      legalName: 'Farmacia Central SRL',
      statusConceptId: DIR.TENANT_PENDING,
      tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PHARMACY,
      legalEntityTypeConceptId: 'le-1',
      createdAt: new Date(),
    });

    it('rechaza con 422 nombrando lo que falta, sin activar ni publicar', async () => {
      const d = build();
      const tenant = pharmacyTenant();
      d.tenantsRepo.findById.mockResolvedValue(tenant);
      d.pharmacyRequirements.evaluate.mockResolvedValue({
        ready: false,
        missing: ['HEALTH_AUTHORITY_CERT_DOC', 'HEADQUARTERS_LOCATION'],
        documentIds: [],
      });

      const error = await d.service
        .verify('ten-ph', {} as any, actor)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as PreconditionFailedException).getResponse()).toEqual(
        expect.objectContaining({
          details: expect.objectContaining({
            missing: ['HEALTH_AUTHORITY_CERT_DOC', 'HEADQUARTERS_LOCATION'],
          }),
        }),
      );
      expect(tenant.statusConceptId).toBe(DIR.TENANT_PENDING);
      expect(d.publicProfiles.projectOrganization).not.toHaveBeenCalled();
      expect(
        d.pharmacyRequirements.markDocumentsVerified,
      ).not.toHaveBeenCalled();
    });

    it('con todo presentado, activa la farmacia y marca verificados sus papeles', async () => {
      const d = build();
      const pharmacy = {
        statusConceptId: 'draft',
        verificationStatusConceptId: 'pending',
      } as any;
      (d.tx as any).find = mockFn().mockResolvedValue([pharmacy]);
      d.tenantsRepo.findById.mockResolvedValue(pharmacyTenant());

      await d.service.verify('ten-ph', {} as any, actor);

      expect(d.pharmacyRequirements.markDocumentsVerified).toHaveBeenCalledWith(
        d.tx,
        ['doc-1'],
        'user-plat',
      );
      expect(pharmacy.publicProfileId).toBe('pub-1');
    });

    it('también enlaza a la vitrina la farmacia que ya opera sin ella, sin tocar su estado', async () => {
      const d = build();
      const operating = {
        statusConceptId: PHARM.PHARMACY_ACTIVE,
        verificationStatusConceptId: PHARM.VERIFICATION_VERIFIED,
      } as any;
      const find = mockFn().mockResolvedValue([operating]);
      (d.tx as any).find = find;
      d.tenantsRepo.findById.mockResolvedValue(pharmacyTenant());

      await d.service.verify('ten-ph', {} as any, actor);

      // Se buscan los borradores y las activas sin vitrina del tenant.
      expect(find).toHaveBeenCalledWith(expect.anything(), {
        tenantId: 'ten-ph',
        $or: [
          { statusConceptId: PHARM.PHARMACY_DRAFT },
          { statusConceptId: PHARM.PHARMACY_ACTIVE, publicProfileId: null },
        ],
      });
      expect(operating.publicProfileId).toBe('pub-1');
      expect(operating.statusConceptId).toBe(PHARM.PHARMACY_ACTIVE);
    });
  });

  describe('verify · laboratorio sin papeles no opera (P51)', () => {
    const actor = { id: 'user-plat', roles: ['SECURITY_ADMIN'] } as any;
    const labTenant = () => ({
      id: 'ten-lab',
      code: 'LAB-1',
      legalName: 'Laboratorio Sur SRL',
      statusConceptId: DIR.TENANT_PENDING,
      tenantTypeConceptId: CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
      createdAt: new Date(),
    });

    it('rechaza con 422 nombrando los papeles del laboratorio que faltan', async () => {
      const d = build();
      const tenant = labTenant();
      d.tenantsRepo.findById.mockResolvedValue(tenant);
      d.pharmacyRequirements.evaluate.mockResolvedValue({
        ready: false,
        missing: ['COMMERCE_REGISTRY_DOC', 'HEALTH_AUTHORITY_CERT_DOC'],
        documentIds: [],
      });

      const error = await d.service
        .verify('ten-lab', {} as any, actor)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as PreconditionFailedException).getResponse()).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('El laboratorio'),
          details: expect.objectContaining({
            missing: ['COMMERCE_REGISTRY_DOC', 'HEALTH_AUTHORITY_CERT_DOC'],
          }),
        }),
      );
      expect(d.pharmacyRequirements.evaluate).toHaveBeenCalledWith(
        d.tx,
        tenant,
        'LABORATORY',
      );
      expect(tenant.statusConceptId).toBe(DIR.TENANT_PENDING);
      expect(d.publicProfiles.projectOrganization).not.toHaveBeenCalled();
    });

    it('con los tres papeles, activa el tenant y los marca verificados', async () => {
      const d = build();
      const tenant = labTenant();
      d.tenantsRepo.findById.mockResolvedValue(tenant);

      await d.service.verify('ten-lab', {} as any, actor);

      expect(tenant.statusConceptId).toBe(CONCEPTS.TENANT_ACTIVE);
      expect(d.pharmacyRequirements.markDocumentsVerified).toHaveBeenCalledWith(
        d.tx,
        ['doc-1'],
        'user-plat',
      );
    });
  });
});
