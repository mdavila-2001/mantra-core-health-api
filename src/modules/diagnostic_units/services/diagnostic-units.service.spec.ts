import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticUnitsService } from './diagnostic-units.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import { DiagnosticUnitsErrorReason } from '../diagnostic_units.error-reasons';
import { DiagnosticUnitScopeService } from './diagnostic-unit-scope.service';

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';

/**
 * Devuelve el servicio con cada método ejecutándose dentro del contexto de
 * `tenantId`, como lo deja el interceptor de tenant en una petición real.
 */
function inTenant<T extends object>(service: T, tenantId: string = T1): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    findOne: mockFn().mockResolvedValue(null),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => em),
  };
  const unitsRepo = {
    findById: mockFn(),
    findByCode: mockFn(),
    create: mockFn(),
  };
  const sitesRepo = {
    findById: mockFn(),
    countActiveForUnit: mockFn(),
    create: mockFn(),
  };
  const specialtiesRepo = {
    findOpenForUnit: mockFn().mockResolvedValue([]),
    findOpenByConcept: mockFn().mockResolvedValue(null),
    create: mockFn(),
    verifyOpenForUnit: mockFn().mockResolvedValue(0),
  };
  const accreditationsRepo = {
    findById: mockFn(),
    create: mockFn(),
    verifyOpenForUnit: mockFn().mockResolvedValue(0),
  };
  const assignmentsRepo = {
    findActiveOverlap: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const publicProfiles = {
    projectOrganization: mockFn().mockResolvedValue('public-profile-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const scope = new DiagnosticUnitScopeService(
    unitsRepo as any,
    sitesRepo as any,
    accreditationsRepo as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const raw = new DiagnosticUnitsService(
    em as any,
    unitsRepo,
    sitesRepo,
    specialtiesRepo,
    accreditationsRepo,
    assignmentsRepo as any,
    scope,
    publicProfiles as any,
    logger as any,
  );
  return {
    raw,
    service: inTenant(raw),
    serviceOfTenant: (tenantId: string) => inTenant(raw, tenantId),
    tx,
    em,
    unitsRepo,
    sitesRepo,
    specialtiesRepo,
    accreditationsRepo,
    assignmentsRepo,
    publicProfiles,
  };
}

/**
 * Ejecuta la operación active unit.
 * @returns Resultado de active unit.
 */
const activeUnit = () => ({
  id: 'u1',
  tenantId: T1,
  code: 'DU-1',
  name: 'Lab',
  statusConceptId: DUNIT.UNIT_ACTIVE,
  verificationStatusConceptId: DUNIT.VERIFICATION_PENDING,
  publicProfileId: undefined,
  updatedAt: new Date(),
});

describe('DiagnosticUnitsService', () => {
  describe('create (UC-23-01)', () => {
    it('creates the unit, flushes parent before children and returns counts', async () => {
      const d = build();
      d.unitsRepo.findByCode.mockResolvedValue(null);
      const unit = activeUnit();
      d.unitsRepo.create.mockReturnValue(unit);

      const res = await d.service.create(
        {
          tenantId: T1,
          code: 'DU-1',
          name: 'Lab',
          sites: [{ practiceSiteId: 'ps1' }],
          accreditations: [{ accreditationConceptId: 'acc1' }],
        },
        actor,
      );

      expect(res.id).toBe('u1');
      expect(res.siteCount).toBe(1);
      expect(res.accreditationCount).toBe(1);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.sitesRepo.create).toHaveBeenCalledTimes(1);
      expect(d.accreditationsRepo.create).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate code in the tenant (conflict)', async () => {
      const d = build();
      d.unitsRepo.findByCode.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.create(
          { tenantId: T1, code: 'DU-1', name: 'Lab' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.unitsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('addSite (UC-23-02)', () => {
    it('throws when the unit does not exist', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.addSite('missing', { practiceSiteId: 'ps1' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('creates a site for an active unit', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.sitesRepo.create.mockReturnValue({
        id: 's1',
        statusConceptId: DUNIT.SITE_ACTIVE,
      });
      const res = await d.service.addSite(
        'u1',
        { practiceSiteId: 'ps1' },
        actor,
      );
      expect(res).toEqual({
        id: 's1',
        diagnosticUnitId: 'u1',
        status: DUNIT.SITE_ACTIVE,
      });
    });
  });

  describe('verifyAndPublish (UC-23-03)', () => {
    it('rejects when the unit has no active site (precondition 422)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.sitesRepo.countActiveForUnit.mockResolvedValue(0);
      await expect(
        d.service.verifyAndPublish('u1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('verifies and assigns a public profile id', async () => {
      const d = build();
      const unit = activeUnit();
      d.unitsRepo.findById.mockResolvedValue(unit);
      d.sitesRepo.countActiveForUnit.mockResolvedValue(2);
      const res = await d.service.verifyAndPublish('u1', actor);
      expect(unit.verificationStatusConceptId).toBe(
        DUNIT.VERIFICATION_VERIFIED,
      );
      expect(res.publicProfileId).toBeDefined();
      expect(d.publicProfiles.projectOrganization).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ targetId: 'u1' }),
      );
      expect(d.specialtiesRepo.verifyOpenForUnit).toHaveBeenCalled();
      expect(d.accreditationsRepo.verifyOpenForUnit).toHaveBeenCalled();
    });
  });

  describe('verifyAndPublish · laboratorio sin organización verificada (P51)', () => {
    const labUnit = () => ({
      ...activeUnit(),
      diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
    });

    it('rechaza con 422 si la organización DIAGNOSTIC_CENTER no está verificada', async () => {
      const d = build();
      const unit = labUnit();
      d.unitsRepo.findById.mockResolvedValue(unit);
      d.sitesRepo.countActiveForUnit.mockResolvedValue(1);
      d.tx.findOne.mockResolvedValue({
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
        verificationStatusConceptId: CONCEPTS.TENANT_UNVERIFIED,
      });

      await expect(
        d.service.verifyAndPublish('u1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(unit.verificationStatusConceptId).toBe(DUNIT.VERIFICATION_PENDING);
      expect(d.publicProfiles.projectOrganization).not.toHaveBeenCalled();
    });

    it('con la organización verificada, publica', async () => {
      const d = build();
      const unit = labUnit();
      d.unitsRepo.findById.mockResolvedValue(unit);
      d.sitesRepo.countActiveForUnit.mockResolvedValue(1);
      d.tx.findOne.mockResolvedValue({
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
        verificationStatusConceptId: CONCEPTS.TENANT_VERIFIED,
      });

      await d.service.verifyAndPublish('u1', actor);

      expect(unit.verificationStatusConceptId).toBe(
        DUNIT.VERIFICATION_VERIFIED,
      );
    });

    it('una unidad de imágenes no consulta la organización', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue({
        ...activeUnit(),
        diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_IMAGING,
      });
      d.sitesRepo.countActiveForUnit.mockResolvedValue(1);

      await d.service.verifyAndPublish('u1', actor);

      expect(d.tx.findOne).not.toHaveBeenCalled();
    });
  });

  describe('setSpecialties (UC-23-04)', () => {
    it('rejects more than one primary specialty', async () => {
      const d = build();
      await expect(
        d.service.setSpecialties(
          'u1',
          {
            specialties: [
              { specialtyConceptId: 'a', isPrimary: true },
              { specialtyConceptId: 'b', isPrimary: true },
            ],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('closes removed specialties and creates new ones', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.specialtiesRepo.findOpenForUnit.mockResolvedValue([
        { specialtyConceptId: 'old', validTo: null, updatedAt: new Date() },
      ]);
      d.specialtiesRepo.findOpenByConcept.mockResolvedValue(null);

      const res = await d.service.setSpecialties(
        'u1',
        {
          specialties: [{ specialtyConceptId: 'new', isPrimary: true }],
        },
        actor,
      );
      expect(res).toEqual({ active: 1, closed: 1 });
      expect(d.specialtiesRepo.create).toHaveBeenCalled();
    });
  });

  describe('assignPractitioner (UC-23-10)', () => {
    it('rejects an overlapping active assignment (conflict)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.assignmentsRepo.findActiveOverlap.mockResolvedValue({ id: 'a1' });
      await expect(
        d.service.assignPractitioner(
          'u1',
          { practitionerRoleAssignmentId: 'pra1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the assignment and registers a new specialty', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.assignmentsRepo.create.mockReturnValue({
        id: 'a1',
        statusConceptId: DUNIT.ASSIGNMENT_ACTIVE,
      });
      d.specialtiesRepo.findOpenByConcept.mockResolvedValue(null);
      const res = await d.service.assignPractitioner(
        'u1',
        {
          practitionerRoleAssignmentId: 'pra1',
          specialtyConceptId: 'spec1',
        },
        actor,
      );
      expect(res).toEqual({ id: 'a1', status: DUNIT.ASSIGNMENT_ACTIVE });
      expect(d.specialtiesRepo.create).toHaveBeenCalled();
    });
  });

  describe('renewAccreditation (UC-23-11)', () => {
    it('throws when the accreditation does not exist', async () => {
      const d = build();
      d.accreditationsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.renewAccreditation('missing', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('closes the previous and creates a verified renewal', async () => {
      const d = build();
      const prev: any = {
        id: 'acc1',
        diagnosticUnitId: 'u1',
        accreditationConceptId: 'c1',
        updatedAt: new Date(),
      };
      d.accreditationsRepo.findById.mockResolvedValue(prev);
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      d.accreditationsRepo.create.mockReturnValue({
        id: 'acc2',
        verificationStatusConceptId: '',
      });
      const res = await d.service.renewAccreditation('acc1', {}, actor);
      expect(prev.validTo).toBeDefined();
      expect(res.verificationStatus).toBe(DUNIT.VERIFICATION_VERIFIED);
    });
  });

  describe('reproject (UC-23-12)', () => {
    it('reports projected=true only for a verified unit with a public profile', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue({
        id: 'u1',
        tenantId: T1,
        verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
        publicProfileId: 'pp1',
      });
      const res = await d.service.reproject('u1', actor);
      expect(res).toEqual({ diagnosticUnitId: 'u1', projected: true });
    });

    it('throws when the unit does not exist', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.reproject('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('alcance de tenant (DUNIT-01)', () => {
    /** Exige el 404 uniforme: mismo `reason`, sin `details`. */
    async function expectOutOfScope(promise: Promise<unknown>) {
      const error: any = await promise.then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(
        DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE,
      );
      expect(error.details).toBeUndefined();
      return error;
    }

    const foreignUnit = () => ({ ...activeUnit(), tenantId: T2 });

    it('crea la unidad en el tenant activo aunque el cuerpo omita tenantId', async () => {
      const d = build();
      d.unitsRepo.findByCode.mockResolvedValue(null);
      d.unitsRepo.create.mockReturnValue(activeUnit());
      await d.service.create({ code: 'DU-1', name: 'Lab' } as any, actor);
      expect(d.unitsRepo.findByCode).toHaveBeenCalledWith(d.tx, T1, 'DU-1');
      expect(d.unitsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: T1 }),
      );
    });

    it('rechaza un tenantId del cuerpo distinto del activo y no escribe', async () => {
      const d = build();
      await expectOutOfScope(
        d.service.create(
          { tenantId: T2, code: 'DU-1', name: 'Lab' } as any,
          actor,
        ),
      );
      expect(d.unitsRepo.create).not.toHaveBeenCalled();
      expect(d.unitsRepo.findByCode).not.toHaveBeenCalled();
    });

    it.each([
      [
        'addSite',
        (s: any) => s.addSite('u1', { practiceSiteId: 'ps1' } as any, actor),
      ],
      ['verifyAndPublish', (s: any) => s.verifyAndPublish('u1', actor)],
      [
        'setSpecialties',
        (s: any) =>
          s.setSpecialties(
            'u1',
            { specialties: [{ specialtyConceptId: 'a' }] } as any,
            actor,
          ),
      ],
      [
        'assignPractitioner',
        (s: any) =>
          s.assignPractitioner(
            'u1',
            { practitionerRoleAssignmentId: 'pra1' } as any,
            actor,
          ),
      ],
      [
        'addAccreditation',
        (s: any) =>
          s.addAccreditation(
            'u1',
            { accreditationConceptId: 'acc1' } as any,
            actor,
          ),
      ],
      ['reproject', (s: any) => s.reproject('u1', actor)],
    ])(
      '%s sobre una unidad de otro tenant responde 404 uniforme y no escribe',
      async (_name, call) => {
        const d = build();
        d.unitsRepo.findById.mockResolvedValue(foreignUnit());
        await expectOutOfScope(call(d.service));
        expect(d.sitesRepo.create).not.toHaveBeenCalled();
        expect(d.specialtiesRepo.create).not.toHaveBeenCalled();
        expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
        expect(d.accreditationsRepo.create).not.toHaveBeenCalled();
        expect(d.publicProfiles.projectOrganization).not.toHaveBeenCalled();
      },
    );

    it('una unidad ajena responde igual que una inexistente', async () => {
      const ajena = build();
      ajena.unitsRepo.findById.mockResolvedValue(foreignUnit());
      const inexistente = build();
      inexistente.unitsRepo.findById.mockResolvedValue(null);
      const a = await expectOutOfScope(
        ajena.service.verifyAndPublish('u1', actor),
      );
      const b = await expectOutOfScope(
        inexistente.service.verifyAndPublish('u1', actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('updateSite sobre un sitio cuya unidad es de otro tenant no lo modifica', async () => {
      const d = build();
      const site: any = {
        id: 's1',
        diagnosticUnitId: 'u1',
        accessionPrefix: 'A',
        updatedAt: new Date(),
      };
      d.sitesRepo.findById.mockResolvedValue(site);
      d.unitsRepo.findById.mockResolvedValue(foreignUnit());
      await expectOutOfScope(
        d.service.updateSite('s1', { accessionPrefix: 'HACK' } as any, actor),
      );
      expect(site.accessionPrefix).toBe('A');
    });

    it('renewAccreditation de otro tenant conserva la vigencia y no crea fila', async () => {
      const d = build();
      const prev: any = {
        id: 'acc1',
        diagnosticUnitId: 'u1',
        accreditationConceptId: 'c1',
        validTo: null,
        updatedAt: new Date(),
      };
      d.accreditationsRepo.findById.mockResolvedValue(prev);
      d.unitsRepo.findById.mockResolvedValue(foreignUnit());
      await expectOutOfScope(
        d.service.renewAccreditation('acc1', {} as any, actor),
      );
      expect(prev.validTo).toBeNull();
      expect(d.accreditationsRepo.create).not.toHaveBeenCalled();
    });

    it('el mismo recurso es accesible desde su propio tenant', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit());
      const res = await d.serviceOfTenant(T1).reproject('u1', actor);
      expect(res.diagnosticUnitId).toBe('u1');
    });

    it('rechaza un sitio del cuerpo que pertenece a otra unidad', async () => {
      const d = build();
      d.unitsRepo.findById.mockImplementation((_tx: any, id: string) =>
        Promise.resolve(id === 'u1' ? activeUnit() : { ...activeUnit(), id }),
      );
      d.sitesRepo.findById.mockResolvedValue({
        id: 's9',
        diagnosticUnitId: 'u-otra',
      });
      await expectOutOfScope(
        d.service.addAccreditation(
          'u1',
          { accreditationConceptId: 'acc1', diagnosticUnitSiteId: 's9' } as any,
          actor,
        ),
      );
      expect(d.accreditationsRepo.create).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto la operación falla antes de leer', async () => {
      const d = build();
      await expect(d.raw.reproject('u1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.unitsRepo.findById).not.toHaveBeenCalled();
    });
  });
});
