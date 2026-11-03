import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextFacilityLicensesService } from './orgext-facility-licenses.service';
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

/** Pertenencia de los UUID ajenos del cuerpo: por defecto todos son del tenant. */
function referencesDouble() {
  return {
    practiceInTenants: mockFn().mockResolvedValue(true),
    practiceSiteInTenants: mockFn().mockResolvedValue(true),
    healthcareServiceInTenants: mockFn().mockResolvedValue(true),
    clinicalUnitInTenants: mockFn().mockResolvedValue(true),
    publicProfileInTenants: mockFn().mockResolvedValue(true),
    fileInTenants: mockFn().mockResolvedValue(true),
    dataUseAgreementInTenants: mockFn().mockResolvedValue(true),
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const licensesRepo = {
    findByIdInTenant: mockFn(),
    findByNumber: mockFn(),
    create: mockFn(),
  };
  const references = referencesDouble();
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OrgextFacilityLicensesService(
    em as any,
    licensesRepo as any,
    references as any,
    logger as any,
  );
  return { service, tx, licensesRepo, references };
}

describe('OrgextFacilityLicensesService', () => {
  describe('register (UC-22-05)', () => {
    it('creates a pending license', async () => {
      const d = build();
      d.licensesRepo.findByNumber.mockResolvedValue(null);
      const license = {
        id: 'lic1',
        tenantId: 't1',
        licenseNumber: 'L-1',
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        createdAt: new Date(),
      };
      d.licensesRepo.create.mockReturnValue(license);

      const res = await inTenant(() =>
        d.service.register({ tenantId: 't1', licenseNumber: 'L-1' }, actor),
      );

      expect(res).toEqual({
        id: 'lic1',
        tenantId: 't1',
        licenseNumber: 'L-1',
        verificationStatus: ORGEXT.LICENSE_PENDING,
        createdAt: license.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('una sede o un archivo de evidencia de otro tenant responde 404 uniforme y no crea la licencia', async () => {
      for (const [field, check] of [
        ['practiceSiteId', 'practiceSiteInTenants'],
        ['evidenceFileId', 'fileInTenants'],
      ] as const) {
        const d = build();
        d.licensesRepo.findByNumber.mockResolvedValue(null);
        d.references[check].mockResolvedValue(false);

        const error = await rejection(
          inTenant(() =>
            d.service.register(
              { tenantId: T1, licenseNumber: 'L-1', [field]: 'x-t2' } as any,
              actor,
            ),
          ),
        );

        expect(error.reason).toBe(NOT_AVAILABLE);
        expect(error.details).toBeUndefined();
        expect(d.references[check]).toHaveBeenCalledWith(d.tx, 'x-t2', [T1]);
        expect(d.licensesRepo.create).not.toHaveBeenCalled();
      }
    });

    it('rejects a duplicate license number (conflict)', async () => {
      const d = build();
      d.licensesRepo.findByNumber.mockResolvedValue({ id: 'lic0' });
      await expect(
        inTenant(() =>
          d.service.register(
            { tenantId: 't1', licenseNumber: 'L-1' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.licensesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verify (UC-22-06)', () => {
    it('throws when the license does not exist', async () => {
      const d = build();
      d.licensesRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        inTenant(() =>
          d.service.verify('missing', { decision: 'VERIFY' } as any, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the license is not pending', async () => {
      const d = build();
      d.licensesRepo.findByIdInTenant.mockResolvedValue({
        id: 'lic1',
        tenantId: T1,
        verificationStatusConceptId: ORGEXT.LICENSE_VERIFIED,
      });
      await expect(
        inTenant(() =>
          d.service.verify('lic1', { decision: 'VERIFY' } as any, actor),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('verifies a pending license', async () => {
      const d = build();
      const license = {
        id: 'lic1',
        tenantId: T1,
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        updatedAt: new Date(),
      };
      d.licensesRepo.findByIdInTenant.mockResolvedValue(license);

      const res = await inTenant(() =>
        d.service.verify('lic1', { decision: 'VERIFY' } as any, actor),
      );

      expect(res).toEqual({ ok: true, status: ORGEXT.LICENSE_VERIFIED });
      expect(license.verificationStatusConceptId).toBe(ORGEXT.LICENSE_VERIFIED);
    });

    it('rejects a pending license when the decision is REJECT', async () => {
      const d = build();
      const license = {
        id: 'lic1',
        tenantId: T1,
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        updatedAt: new Date(),
      };
      d.licensesRepo.findByIdInTenant.mockResolvedValue(license);

      const res = await inTenant(() =>
        d.service.verify('lic1', { decision: 'REJECT' } as any, actor),
      );

      expect(res.status).toBe(ORGEXT.LICENSE_REJECTED);
    });
  });

  describe('alcance de tenant (ORGEXT-01)', () => {
    it('register toma el tenant del contexto y rechaza el del cuerpo', async () => {
      const d = build();

      const error = await rejection(
        inTenant(() =>
          d.service.register({ tenantId: T2, licenseNumber: 'L-1' }, actor),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(d.licensesRepo.findByNumber).not.toHaveBeenCalled();
      expect(d.licensesRepo.create).not.toHaveBeenCalled();
    });

    it('verify busca la licencia acotada al tenant activo', async () => {
      const d = build();
      d.licensesRepo.findByIdInTenant.mockResolvedValue({
        id: 'lic1',
        tenantId: T1,
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        updatedAt: new Date(),
      });

      await inTenant(() =>
        d.service.verify('lic1', { decision: 'VERIFY' } as any, actor),
      );

      expect(d.licensesRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        'lic1',
        T1,
      );
    });

    it('verify sobre una licencia de T2 responde igual que una inexistente y no la muta', async () => {
      const d = build();
      const foreign = {
        id: 'lic2',
        tenantId: T2,
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        updatedAt: new Date(),
      };
      d.licensesRepo.findByIdInTenant.mockResolvedValue(foreign);
      const foreignError = await rejection(
        inTenant(() =>
          d.service.verify('lic2', { decision: 'VERIFY' } as any, actor),
        ),
      );
      d.licensesRepo.findByIdInTenant.mockResolvedValue(null);
      const missingError = await rejection(
        inTenant(() =>
          d.service.verify('lic2', { decision: 'VERIFY' } as any, actor),
        ),
      );

      expect(foreignError).toBeInstanceOf(ResourceNotFoundException);
      expect(foreignError.getStatus()).toBe(404);
      expect(foreignError.reason).toBe(NOT_AVAILABLE);
      expect(foreignError.details).toBeUndefined();
      expect(foreignError.getResponse()).toEqual(missingError.getResponse());
      expect(foreign.verificationStatusConceptId).toBe(ORGEXT.LICENSE_PENDING);
    });

    it('sin tenant en el contexto verify no llega a la base', async () => {
      const d = build();

      await expect(
        d.service.verify('lic1', { decision: 'VERIFY' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.licensesRepo.findByIdInTenant).not.toHaveBeenCalled();
    });
  });
});
