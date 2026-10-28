import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeSitesService } from './practice-sites.service';
import { PRAC } from '../practice.concepts';
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
        d.service.createSite('p1', { code: 'S-1', name: 'Site' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the practice is not active', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.createSite('p1', { code: 'S-1', name: 'Site' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated site code', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      d.sitesRepo.findByPracticeAndCode.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.createSite('p1', { code: 'S-1', name: 'Site' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a site with PLANNED operational status', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
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
        d.service.decommissionSite('p1', 's1', actor),
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

      const res = await d.service.decommissionSite('p1', 's1', actor);

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

  describe('consultorio propio (coherente con el alta del catálogo)', () => {
    const MY_OFFICE = {
      id: 'prac-office',
      code: 'OFFICE-user-doc',
      name: 'Consultorio propio',
      adminUserId: 'user-doc',
      typeConceptId: PRAC.PRACTICE_TYPE_OFFICE,
    };
    const OTHERS_OFFICE = {
      ...MY_OFFICE,
      id: 'prac-office-2',
      code: 'OFFICE-otro',
      adminUserId: 'user-otro',
    };
    const MY_CLINIC = {
      id: 'prac-clinic',
      code: 'CLI',
      name: 'Clínica que administro',
      adminUserId: 'user-doc',
      typeConceptId: PRAC.PRACTICE_TYPE_CLINIC,
    };

    /**
     * Servicio con consultorios y una clínica; el médico no tiene vinculación alguna.
     * @param assignments - Vinculaciones existentes.
     * @returns El servicio y sus dobles.
     */
    function withOffices(assignments: AssignmentRow[] = []) {
      const d = build(assignments);
      d.practicesRepo.findByTenant.mockResolvedValue(
        [OWN, OTHER, MY_OFFICE, OTHERS_OFFICE, MY_CLINIC].map((p) => ({
          ...p,
          tenantId: 'DEFAULT',
          statusConceptId: PRAC.PRACTICE_ACTIVE,
        })),
      );
      return d;
    }

    it('el médico sin ninguna vinculación ACTIVE ve igual su consultorio propio', async () => {
      const d = withOffices();
      const newcomer = { ...doctor, practitionerProfileId: 'hp-new' };

      const list = await d.service.listPractices('DEFAULT', newcomer);

      expect(list.map((p) => p.id)).toEqual([MY_OFFICE.id]);
    });

    it('el médico sin perfil profesional en el token ve igual su consultorio propio', async () => {
      const d = withOffices();
      const noProfile = { id: 'user-doc', roles: ['PRACTITIONER'] } as any;

      const list = await d.service.listPractices('DEFAULT', noProfile);

      expect(list.map((p) => p.id)).toEqual([MY_OFFICE.id]);
    });

    it('suma el consultorio propio a las prácticas donde está vinculado, sin duplicarlo', async () => {
      const d = withOffices([
        ...rows,
        {
          practitionerProfileId: 'hp-doc',
          practiceId: MY_OFFICE.id,
          statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
          validTo: null,
        },
      ]);

      const list = await d.service.listPractices('DEFAULT', doctor);

      expect(list.map((p) => p.id)).toEqual([OWN.id, MY_OFFICE.id]);
    });

    it('no abre el consultorio de otro ni una práctica que sólo administra y no es consultorio', async () => {
      const d = withOffices();

      const list = await d.service.listPractices('DEFAULT', doctor);

      expect(list.map((p) => p.id)).not.toContain(OTHERS_OFFICE.id);
      expect(list.map((p) => p.id)).not.toContain(MY_CLINIC.id);
    });
  });

  it('el administrador ve todas las prácticas del tenant', async () => {
    const d = withPractices();

    const list = await d.service.listPractices('DEFAULT', actor);

    expect(list.map((p) => p.id)).toEqual([OWN.id, OTHER.id, PENDING.id]);
  });
});
