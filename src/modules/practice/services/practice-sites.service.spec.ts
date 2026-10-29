import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeSitesService } from './practice-sites.service';
import { ForbiddenException } from '@nestjs/common';
import { PRAC } from '../practice.concepts';
import { AUD } from '../../audit/audit.concepts';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  buildPracticeAccess,
  type AssignmentRow,
} from '../../../../test/doubles/practice-access.double';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT = 'tenant-a';
const OTHER_TENANT = 'tenant-b';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build(assignments: AssignmentRow[] = []) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = {
    findByTenant: mockFn().mockResolvedValue([]),
    findActive: mockFn(),
    findById: mockFn(),
    findOwnOffice: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const sitesRepo = {
    findById: mockFn(),
    findByPractice: mockFn().mockResolvedValue([]),
    findByPracticeAndCode: mockFn(),
    create: mockFn(),
  };
  const unitsRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const spacesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const servicesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const rolesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const serviceCatalogRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const tenantAdmin = {
    assertCanAdminister: mockFn().mockResolvedValue(undefined),
  };
  const branchesRepo = { findById: mockFn().mockResolvedValue(null) };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };

  const service = new PracticeSitesService(
    em as any,
    practicesRepo,
    sitesRepo,
    unitsRepo as any,
    spacesRepo as any,
    servicesRepo as any,
    rolesRepo as any,
    serviceCatalogRepo as any,
    logger as any,
    buildPracticeAccess(assignments),
    tenantAdmin as any,
    branchesRepo as any,
    historyRepo as any,
  );
  return {
    service,
    tx,
    practicesRepo,
    sitesRepo,
    serviceCatalogRepo,
    unitsRepo,
    spacesRepo,
    servicesRepo,
    rolesRepo,
    tenantAdmin,
    branchesRepo,
    historyRepo,
  };
}

describe('PracticeSitesService', () => {
  describe('createPractice (bootstrap)', () => {
    it('creates and flushes the practice', async () => {
      const d = build();
      const created = {
        id: 'p1',
        code: 'P-1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
        createdAt: new Date(),
      };
      d.practicesRepo.create.mockReturnValue(created);

      const res = await d.service.createPractice(
        { tenantId: 't1', code: 'P-1', name: 'Acme' },
        actor,
      );

      expect(res).toEqual({
        id: 'p1',
        code: 'P-1',
        status: PRAC.PRACTICE_ACTIVE,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalled();
    });

    /**
     * FT-22-R01. Una práctica que nace con el catálogo vacío le abre a quien
     * atiende una pantalla sin nada, y la consulta es lo único que ofrecen
     * todas. Va en la misma transacción que el alta a propósito.
     */
    it('la práctica nace ofreciendo una cita médica en 0.00 Bs', async () => {
      const d = build();
      d.practicesRepo.create.mockReturnValue({
        id: 'p1',
        code: 'P-1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
        createdAt: new Date(),
      });

      await d.service.createPractice(
        { tenantId: 't1', code: 'P-1', name: 'Acme' },
        actor,
      );

      expect(d.serviceCatalogRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceId: 'p1',
          code: 'CITA_MEDICA',
          name: 'Cita médica',
          defaultPrice: '0.00',
          currencyConceptId: CONCEPTS.CURRENCY_BOB,
          isActive: true,
          actorUserId: actor.id,
        }),
      );
    });
  });

  describe('createSite (UC-14-01)', () => {
    it('rejects when the practice does not exist', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createSite(
          'p1',
          { code: 'S-1', name: 'Site' } as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the practice is not active', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: TENANT,
        statusConceptId: 'other',
      });
      await expect(
        d.service.createSite(
          'p1',
          { code: 'S-1', name: 'Site' } as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated site code', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: TENANT,
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      d.sitesRepo.findByPracticeAndCode.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.createSite(
          'p1',
          { code: 'S-1', name: 'Site' } as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a site with PLANNED operational status', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: TENANT,
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      d.sitesRepo.findByPracticeAndCode.mockResolvedValue(null);
      const created = {
        id: 's1',
        practiceId: 'p1',
        code: 'S-1',
        statusConceptId: PRAC.SITE_ACTIVE,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        createdAt: new Date(),
      };
      d.sitesRepo.create.mockReturnValue(created);

      const res = await d.service.createSite(
        'p1',
        { code: 'S-1', name: 'Site' },
        actor,
        TENANT,
      );

      expect(res.operationalStatus).toBe(PRAC.SITE_OP_PLANNED);
      expect(d.sitesRepo.create).toHaveBeenCalled();
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('decommissionSite (UC-14-12)', () => {
    it('throws when the site is not in the practice', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({ id: 's1', practiceId: 'other' });
      await expect(
        d.service.decommissionSite('p1', 's1', actor, TENANT),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('soft-deletes the site and cascades to children', async () => {
      const d = build();
      const site = {
        id: 's1',
        practiceId: 'p1',
        statusConceptId: PRAC.SITE_ACTIVE,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        updatedAt: new Date(),
      };
      d.sitesRepo.findById.mockResolvedValue(site);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: TENANT,
      });
      const unit = { statusConceptId: PRAC.UNIT_ACTIVE, updatedAt: new Date() };
      const space = {
        statusConceptId: PRAC.SPACE_ACTIVE,
        operationalStatusConceptId: PRAC.SPACE_OP_AVAILABLE,
        updatedAt: new Date(),
      };
      const svc = {
        statusConceptId: PRAC.SERVICE_ACTIVE,
        updatedAt: new Date(),
      };
      const role = {
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        validTo: undefined,
        updatedAt: new Date(),
      };
      d.unitsRepo.findBySite.mockResolvedValue([unit]);
      d.spacesRepo.findBySite.mockResolvedValue([space]);
      d.servicesRepo.findBySite.mockResolvedValue([svc]);
      d.rolesRepo.findBySite.mockResolvedValue([role]);

      const res = await d.service.decommissionSite('p1', 's1', actor, TENANT);

      expect(res).toEqual({ ok: true });
      expect(site.statusConceptId).toBe(PRAC.SITE_RETIRED);
      expect(site.operationalStatusConceptId).toBe(PRAC.SITE_OP_CLOSED);
      expect(unit.statusConceptId).toBe(PRAC.UNIT_RETIRED);
      expect(space.statusConceptId).toBe(PRAC.SPACE_RETIRED);
      expect(svc.statusConceptId).toBe(PRAC.SERVICE_SUSPENDED);
      expect(role.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_ENDED);
      expect(role.validTo).toBeInstanceOf(Date);
    });
  });

  describe('F0 · createSite aislado por tenant y regla de organización', () => {
    const activePractice = {
      id: 'p1',
      tenantId: TENANT,
      statusConceptId: PRAC.PRACTICE_ACTIVE,
    };
    const created = {
      id: 's1',
      practiceId: 'p1',
      code: 'S-1',
      statusConceptId: PRAC.SITE_ACTIVE,
      operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
      createdAt: new Date(),
    };

    it('práctica de otro tenant: 404, sin autorizar ni crear', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        ...activePractice,
        tenantId: OTHER_TENANT,
      });
      await expect(
        d.service.createSite(
          'p1',
          { code: 'S-1', name: 'S' } as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tenantAdmin.assertCanAdminister).not.toHaveBeenCalled();
      expect(d.sitesRepo.create).not.toHaveBeenCalled();
    });

    it('sin ser OWNER/ADMIN del tenant: 403 y no crea', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(activePractice);
      d.tenantAdmin.assertCanAdminister.mockRejectedValue(
        new ForbiddenException('no'),
      );
      await expect(
        d.service.createSite(
          'p1',
          { code: 'S-1', name: 'S' } as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.sitesRepo.create).not.toHaveBeenCalled();
    });

    it('branchId inexistente: 404 y no crea', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(activePractice);
      d.branchesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createSite(
          'p1',
          { code: 'S-1', name: 'S', branchId: 'b1' } as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.sitesRepo.create).not.toHaveBeenCalled();
    });

    it('branchId de otro tenant: 422 y no crea', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(activePractice);
      d.branchesRepo.findById.mockResolvedValue({
        id: 'b1',
        tenantId: OTHER_TENANT,
      });
      await expect(
        d.service.createSite(
          'p1',
          { code: 'S-1', name: 'S', branchId: 'b1' } as any,
          actor,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.sitesRepo.create).not.toHaveBeenCalled();
    });

    it('branchId del tenant y admin: crea, autoriza y versiona', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(activePractice);
      d.branchesRepo.findById.mockResolvedValue({ id: 'b1', tenantId: TENANT });
      d.sitesRepo.findByPracticeAndCode.mockResolvedValue(null);
      d.sitesRepo.create.mockReturnValue(created);
      await d.service.createSite(
        'p1',
        { code: 'S-1', name: 'S', branchId: 'b1' } as any,
        actor,
        TENANT,
      );
      expect(d.tenantAdmin.assertCanAdminister).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        actor,
      );
      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ branchId: 'b1' }),
      );
      expect(d.historyRepo.append).toHaveBeenCalledWith(
        d.tx,
        'practice_sites',
        's1',
        expect.objectContaining({
          operationConceptId: AUD.OPERATION_INSERT,
          changedByUserId: actor.id,
        }),
      );
    });
  });

  describe('F0 · decommissionSite aislado por tenant y regla de organización', () => {
    const site = () => ({
      id: 's1',
      practiceId: 'p1',
      statusConceptId: PRAC.SITE_ACTIVE,
      operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
    });

    it('práctica de otro tenant: 404 y no toca la sede', async () => {
      const d = build();
      const row = site();
      d.sitesRepo.findById.mockResolvedValue(row);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: OTHER_TENANT,
      });
      await expect(
        d.service.decommissionSite('p1', 's1', actor, TENANT),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(row.statusConceptId).toBe(PRAC.SITE_ACTIVE);
      expect(d.tenantAdmin.assertCanAdminister).not.toHaveBeenCalled();
    });

    it('sin ser OWNER/ADMIN del tenant: 403 y no toca la sede', async () => {
      const d = build();
      const row = site();
      d.sitesRepo.findById.mockResolvedValue(row);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: TENANT,
      });
      d.tenantAdmin.assertCanAdminister.mockRejectedValue(
        new ForbiddenException('no'),
      );
      await expect(
        d.service.decommissionSite('p1', 's1', actor, TENANT),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(row.statusConceptId).toBe(PRAC.SITE_ACTIVE);
    });

    it('versiona la sede, sus unidades y sus espacios', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(site());
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: TENANT,
      });
      d.unitsRepo.findBySite.mockResolvedValue([
        { id: 'u1', statusConceptId: PRAC.UNIT_ACTIVE },
      ]);
      d.spacesRepo.findBySite.mockResolvedValue([
        { id: 'c1', statusConceptId: PRAC.SPACE_ACTIVE },
      ]);
      await d.service.decommissionSite('p1', 's1', actor, TENANT);
      const appended = d.historyRepo.append.mock.calls.map(
        (call: any[]) => `${call[1]}:${call[2]}`,
      );
      expect(appended).toEqual([
        'practice_sites:s1',
        'clinical_units:u1',
        'care_spaces:c1',
      ]);
    });
  });
});

describe('PracticeSitesService.listPractices — acceso por vinculación', () => {
  const OWN = { id: 'prac-own', code: 'MIO', name: 'Mi consultorio' };
  const OTHER = { id: 'prac-other', code: 'AJENO', name: 'Consultorio ajeno' };
  const PENDING = { id: 'prac-pending', code: 'PEND', name: 'Pendiente' };
  const rows: AssignmentRow[] = [
    {
      practitionerProfileId: 'hp-doc',
      practiceId: OWN.id,
      statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
      validTo: null,
    },
    {
      practitionerProfileId: 'hp-doc',
      practiceId: PENDING.id,
      statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
      validTo: null,
    },
  ];
  const doctor = {
    id: 'user-doc',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'hp-doc',
  } as any;

  /**
   * Servicio con las tres prácticas activas en el tenant compartido.
   * @returns El servicio y sus dobles.
   */
  function withPractices() {
    const d = build(rows);
    d.practicesRepo.findByTenant.mockResolvedValue(
      [OWN, OTHER, PENDING].map((p) => ({
        ...p,
        tenantId: 'DEFAULT',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      })),
    );
    return d;
  }

  it('el médico con vinculación ACTIVE ve sólo esa práctica', async () => {
    const d = withPractices();

    const list = await d.service.listPractices('DEFAULT', doctor);

    expect(list.map((p) => p.id)).toEqual([OWN.id]);
    expect(list[0]).toEqual({
      id: OWN.id,
      code: OWN.code,
      name: OWN.name,
      status: PRAC.PRACTICE_ACTIVE,
    });
  });

  it('el médico con vinculación pendiente o sin vinculación no ve ninguna', async () => {
    const d = withPractices();
    const newcomer = { ...doctor, practitionerProfileId: 'hp-new' };

    expect(
      (await d.service.listPractices('DEFAULT', doctor)).map((p) => p.id),
    ).not.toContain(PENDING.id);
    await expect(d.service.listPractices('DEFAULT', newcomer)).resolves.toEqual(
      [],
    );
  });

  it('el administrador ve todas las prácticas del tenant', async () => {
    const d = withPractices();

    const list = await d.service.listPractices('DEFAULT', actor);

    expect(list.map((p) => p.id)).toEqual([OWN.id, OTHER.id, PENDING.id]);
  });
});
