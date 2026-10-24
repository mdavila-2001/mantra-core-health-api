import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextHospitalsService } from './orgext-hospitals.service';
import { ORGEXT } from '../organization_extensions.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { OrganizationExtensionsErrorReason } from '../organization_extensions.error-reasons';

const T1 = 't1';
const T2 = 't2';
const NOT_AVAILABLE =
  OrganizationExtensionsErrorReason.ORGEXT_RESOURCE_NOT_AVAILABLE;

/** Ejecuta `fn` con T1 como tenant activo del request. */
const inTenant = <T>(fn: () => Promise<T>, tenantId = T1): Promise<T> =>
  runWithTenant(tenantId, fn);

/** Captura el rechazo de una promesa para comparar su respuesta HTTP. */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('no rechazó');
}

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/** Hospital cargado, con el estado indicado, propiedad del tenant dado. */
const hospitalOf = (
  tenantId: string,
  status: string = ORGEXT.HOSPITAL_ACTIVE,
) => ({
  id: 'h1',
  tenantId,
  practiceId: 'p1',
  statusConceptId: status,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const hospitalsRepo = {
    findByIdInTenant: mockFn(),
    findByTenantOrPractice: mockFn(),
    create: mockFn(),
  };
  const serviceLinesRepo = { findByIdForHospital: mockFn(), create: mockFn() };
  const licensesRepo = { countVerifiedForTenant: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OrgextHospitalsService(
    em as any,
    hospitalsRepo,
    serviceLinesRepo,
    licensesRepo as any,
    logger as any,
  );
  return { service, tx, hospitalsRepo, serviceLinesRepo, licensesRepo };
}

describe('OrgextHospitalsService', () => {
  describe('specialize (UC-22-01)', () => {
    it('creates a draft hospital and flushes the parent', async () => {
      const d = build();
      d.hospitalsRepo.findByTenantOrPractice.mockResolvedValue(null);
      const created = {
        id: 'h1',
        tenantId: 't1',
        practiceId: 'p1',
        statusConceptId: ORGEXT.HOSPITAL_DRAFT,
        createdAt: new Date('2026-01-01'),
      };
      d.hospitalsRepo.create.mockReturnValue(created);

      const res = await inTenant(() =>
        d.service.specialize({ tenantId: 't1', practiceId: 'p1' }, actor),
      );

      expect(res).toEqual({
        id: 'h1',
        tenantId: 't1',
        practiceId: 'p1',
        status: ORGEXT.HOSPITAL_DRAFT,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.hospitalsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: ORGEXT.HOSPITAL_DRAFT }),
      );
    });

    it('rejects when tenant or practice is already specialized (conflict)', async () => {
      const d = build();
      d.hospitalsRepo.findByTenantOrPractice.mockResolvedValue({ id: 'h0' });

      await expect(
        inTenant(() =>
          d.service.specialize(
            { tenantId: 't1', practiceId: 'p1' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.hospitalsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('activate (UC-22-02)', () => {
    it('throws when the hospital does not exist', async () => {
      const d = build();
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        inTenant(() => d.service.activate('missing', {} as any, actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the hospital is not in draft state', async () => {
      const d = build();
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue({
        id: 'h1',
        tenantId: 't1',
        statusConceptId: ORGEXT.HOSPITAL_ACTIVE,
      });
      await expect(
        inTenant(() => d.service.activate('h1', {} as any, actor)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when there is no verified facility license', async () => {
      const d = build();
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue({
        id: 'h1',
        tenantId: 't1',
        statusConceptId: ORGEXT.HOSPITAL_DRAFT,
      });
      d.licensesRepo.countVerifiedForTenant.mockResolvedValue(0);
      await expect(
        inTenant(() => d.service.activate('h1', {} as any, actor)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('activates when a verified license exists', async () => {
      const d = build();
      const hospital = {
        id: 'h1',
        tenantId: 't1',
        practiceId: 'p1',
        statusConceptId: ORGEXT.HOSPITAL_DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue(hospital);
      d.licensesRepo.countVerifiedForTenant.mockResolvedValue(1);

      const res = await inTenant(() =>
        d.service.activate('h1', { publicProfileId: 'pp1' }, actor),
      );

      expect(res.status).toBe(ORGEXT.HOSPITAL_ACTIVE);
      expect(hospital.statusConceptId).toBe(ORGEXT.HOSPITAL_ACTIVE);
      expect((hospital as any).publicProfileId).toBe('pp1');
    });
  });

  describe('addServiceLine (UC-22-03)', () => {
    it('rejects when the hospital is not active', async () => {
      const d = build();
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue({
        id: 'h1',
        tenantId: T1,
        statusConceptId: ORGEXT.HOSPITAL_DRAFT,
      });
      await expect(
        inTenant(() => d.service.addServiceLine('h1', {} as any, actor)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates the service line for an active hospital', async () => {
      const d = build();
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue({
        id: 'h1',
        tenantId: T1,
        statusConceptId: ORGEXT.HOSPITAL_ACTIVE,
      });
      const line = {
        id: 'l1',
        hospitalId: 'h1',
        statusConceptId: ORGEXT.SERVICE_LINE_ACTIVE,
        createdAt: new Date(),
      };
      d.serviceLinesRepo.create.mockReturnValue(line);

      const res = await inTenant(() =>
        d.service.addServiceLine('h1', {}, actor),
      );

      expect(res).toEqual({
        id: 'l1',
        hospitalId: 'h1',
        status: ORGEXT.SERVICE_LINE_ACTIVE,
        createdAt: line.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('retireServiceLine (UC-22-04)', () => {
    it('throws when the line does not exist', async () => {
      const d = build();
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue(hospitalOf(T1));
      d.serviceLinesRepo.findByIdForHospital.mockResolvedValue(null);
      await expect(
        inTenant(() => d.service.retireServiceLine('h1', 'l1', actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('soft-deletes an active line', async () => {
      const d = build();
      const line = {
        id: 'l1',
        statusConceptId: ORGEXT.SERVICE_LINE_ACTIVE,
        updatedAt: new Date(),
      };
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue(hospitalOf(T1));
      d.serviceLinesRepo.findByIdForHospital.mockResolvedValue(line);

      const res = await inTenant(() =>
        d.service.retireServiceLine('h1', 'l1', actor),
      );

      expect(res).toEqual({ ok: true, status: ORGEXT.SERVICE_LINE_RETIRED });
      expect(line.statusConceptId).toBe(ORGEXT.SERVICE_LINE_RETIRED);
    });
  });

  describe('alcance de tenant (ORGEXT-01)', () => {
    it('specialize toma el tenant del contexto y rechaza el del cuerpo', async () => {
      const d = build();

      const error = await rejection(
        inTenant(() =>
          d.service.specialize({ tenantId: T2, practiceId: 'p1' }, actor),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(d.hospitalsRepo.findByTenantOrPractice).not.toHaveBeenCalled();
      expect(d.hospitalsRepo.create).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto ninguna operación llega a la base', async () => {
      const d = build();

      await expect(
        d.service.activate('h1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      await expect(
        d.service.addServiceLine('h1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.hospitalsRepo.findByIdInTenant).not.toHaveBeenCalled();
    });

    it('busca el hospital acotado al tenant activo', async () => {
      const d = build();
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue(
        hospitalOf(T1, ORGEXT.HOSPITAL_DRAFT),
      );
      d.licensesRepo.countVerifiedForTenant.mockResolvedValue(1);

      await inTenant(() => d.service.activate('h1', {}, actor));

      expect(d.hospitalsRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        'h1',
        T1,
      );
    });

    it('activate sobre un hospital de T2 responde igual que uno inexistente y no lo muta', async () => {
      const d = build();
      const foreign = hospitalOf(T2, ORGEXT.HOSPITAL_DRAFT);
      // Un repositorio que dejara pasar la fila ajena: el servicio la rechaza igual.
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue(foreign);
      const foreignError = await rejection(
        inTenant(() => d.service.activate('h2', {} as any, actor)),
      );
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue(null);
      const missingError = await rejection(
        inTenant(() => d.service.activate('h2', {} as any, actor)),
      );

      expect(foreignError).toBeInstanceOf(ResourceNotFoundException);
      expect(foreignError.getStatus()).toBe(404);
      expect(foreignError.reason).toBe(NOT_AVAILABLE);
      expect(foreignError.details).toBeUndefined();
      expect(foreignError.getResponse()).toEqual(missingError.getResponse());
      expect(foreign.statusConceptId).toBe(ORGEXT.HOSPITAL_DRAFT);
      expect(d.licensesRepo.countVerifiedForTenant).not.toHaveBeenCalled();
    });

    it('addServiceLine sobre un hospital de T2 responde 404 sin crear la línea', async () => {
      const d = build();
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue(hospitalOf(T2));

      const error = await rejection(
        inTenant(() => d.service.addServiceLine('h2', {}, actor)),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(d.serviceLinesRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('retireServiceLine con el hospital de T2 responde 404 sin tocar la línea', async () => {
      const d = build();
      d.hospitalsRepo.findByIdInTenant.mockResolvedValue(null);

      const error = await rejection(
        inTenant(() => d.service.retireServiceLine('h2', 'l1', actor)),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(d.serviceLinesRepo.findByIdForHospital).not.toHaveBeenCalled();
    });
  });
});
