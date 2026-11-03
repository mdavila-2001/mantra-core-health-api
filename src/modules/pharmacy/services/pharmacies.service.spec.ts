import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmaciesService } from './pharmacies.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import { PHARM } from '../pharmacy.concepts';

const T1 = 't1';
const T2 = 't2';
const NOT_AVAILABLE = PharmacyErrorReason.PHARMACY_NOT_AVAILABLE;
const REFERENCE_NOT_AVAILABLE =
  PharmacyErrorReason.PHARMACY_REFERENCE_NOT_AVAILABLE;

/** Administrador con membresía en T1, el tenant activo de los tests. */
const actor = {
  id: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [T1],
} as any;

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

/** Farmacia activa de un tenant, como la devuelve el repositorio. */
const pharmacyOf = (tenantId: string, extra: object = {}) => ({
  id: 'ph1',
  tenantId,
  statusConceptId: PHARM.PHARMACY_ACTIVE,
  ...extra,
});

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const pharmaciesRepo = {
    findByTenantAndCode: mockFn(),
    findByIdInTenant: mockFn(),
    create: mockFn(),
    // La vitrina publicada del tenant: por defecto, todavía ninguna.
    findTenantShowcaseId: mockFn().mockResolvedValue(null),
  };
  const licensesRepo = {
    create: mockFn(),
    findById: mockFn(),
    countUnverified: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PharmaciesService(
    em as any,
    pharmaciesRepo,
    licensesRepo,
    logger as any,
  );
  return { service, tx, em, pharmaciesRepo, licensesRepo };
}

describe('PharmaciesService', () => {
  describe('createPharmacy (UC-24-01)', () => {
    it('creates pharmacy, flushes parent before license, returns license id', async () => {
      const d = build();
      d.pharmaciesRepo.findByTenantAndCode.mockResolvedValue(null);
      d.pharmaciesRepo.create.mockReturnValue({
        id: 'ph1',
        code: 'PH-1',
        legalName: 'Acme Pharma',
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        createdAt: new Date('2026-01-01'),
      });
      d.licensesRepo.create.mockReturnValue({ id: 'lic1' });

      const res = await inTenant(() =>
        d.service.createPharmacy(
          {
            tenantId: 't1',
            code: 'PH-1',
            legalName: 'Acme Pharma',
            license: { licenseNumber: 'L-1' },
          },
          actor,
        ),
      );

      expect(res).toMatchObject({
        id: 'ph1',
        licenseId: 'lic1',
        status: PHARM.PHARMACY_DRAFT,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
      expect(d.licensesRepo.create).toHaveBeenCalled();
    });

    it('rejects a duplicated (tenant, code)', async () => {
      const d = build();
      d.pharmaciesRepo.findByTenantAndCode.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        inTenant(() =>
          d.service.createPharmacy(
            {
              tenantId: 't1',
              code: 'PH-1',
              legalName: 'x',
              license: { licenseNumber: 'L-1' },
            } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.pharmaciesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyLicense (UC-24-03)', () => {
    it('throws when the pharmacy does not exist', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        inTenant(() => d.service.verifyLicense('ph1', 'lic1', {}, actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects verifying a license that is not pending', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacyOf(T1));
      d.licensesRepo.findById.mockResolvedValue({
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_VERIFIED,
      });
      await expect(
        inTenant(() => d.service.verifyLicense('ph1', 'lic1', {}, actor)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('verifies the license and activates the pharmacy when none remain unverified', async () => {
      const d = build();
      const pharmacy = {
        id: 'ph1',
        tenantId: T1,
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      };
      const license = {
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      };
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacy);
      d.licensesRepo.findById.mockResolvedValue(license);
      d.licensesRepo.countUnverified.mockResolvedValue(0);

      const res = await inTenant(() =>
        d.service.verifyLicense('ph1', 'lic1', { approve: true }, actor),
      );

      expect(res).toEqual({ ok: true });
      expect(license.verificationStatusConceptId).toBe(
        PHARM.VERIFICATION_VERIFIED,
      );
      expect(pharmacy.statusConceptId).toBe(PHARM.PHARMACY_ACTIVE);
      expect(pharmacy.verificationStatusConceptId).toBe(
        PHARM.VERIFICATION_VERIFIED,
      );
    });

    it('links the approved pharmacy to the published showcase of its organization', async () => {
      const d = build();
      const pharmacy: Record<string, unknown> = {
        id: 'ph1',
        tenantId: T1,
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      };
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacy);
      d.licensesRepo.findById.mockResolvedValue({
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      });
      d.licensesRepo.countUnverified.mockResolvedValue(0);
      d.pharmaciesRepo.findTenantShowcaseId.mockResolvedValue('vitrina-t1');

      await inTenant(() =>
        d.service.verifyLicense('ph1', 'lic1', { approve: true }, actor),
      );

      expect(d.pharmaciesRepo.findTenantShowcaseId).toHaveBeenCalledWith(
        d.tx,
        T1,
      );
      expect(pharmacy.publicProfileId).toBe('vitrina-t1');
      expect(pharmacy.statusConceptId).toBe(PHARM.PHARMACY_ACTIVE);
    });

    it('keeps an existing showcase link, and leaves none when the organization has no showcase yet', async () => {
      const d = build();
      const linked: Record<string, unknown> = {
        id: 'ph1',
        tenantId: T1,
        publicProfileId: 'vitrina-propia',
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
      };
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(linked);
      d.licensesRepo.findById.mockResolvedValue({
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
      });
      d.licensesRepo.countUnverified.mockResolvedValue(0);
      d.pharmaciesRepo.findTenantShowcaseId.mockResolvedValue('vitrina-t1');

      await inTenant(() =>
        d.service.verifyLicense('ph1', 'lic1', { approve: true }, actor),
      );
      expect(linked.publicProfileId).toBe('vitrina-propia');

      const d2 = build();
      const unlinked: Record<string, unknown> = {
        id: 'ph1',
        tenantId: T1,
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
      };
      d2.pharmaciesRepo.findByIdInTenant.mockResolvedValue(unlinked);
      d2.licensesRepo.findById.mockResolvedValue({
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
      });
      d2.licensesRepo.countUnverified.mockResolvedValue(0);

      await inTenant(() =>
        d2.service.verifyLicense('ph1', 'lic1', { approve: true }, actor),
      );
      expect(unlinked.publicProfileId).toBeUndefined();
    });

    it('rejects (not verified) leaves the pharmacy untouched', async () => {
      const d = build();
      const pharmacy = {
        id: 'ph1',
        tenantId: T1,
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
      };
      const license = {
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      };
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacy);
      d.licensesRepo.findById.mockResolvedValue(license);

      const res = await inTenant(() =>
        d.service.verifyLicense('ph1', 'lic1', { approve: false }, actor),
      );

      expect(res).toEqual({ ok: true });
      expect(license.verificationStatusConceptId).toBe(
        PHARM.VERIFICATION_REJECTED,
      );
      expect(pharmacy.statusConceptId).toBe(PHARM.PHARMACY_DRAFT);
      expect(d.licensesRepo.countUnverified).not.toHaveBeenCalled();
    });
  });

  describe('alcance de tenant (PHARM-01)', () => {
    const body = {
      code: 'PH-1',
      legalName: 'Acme Pharma',
      license: { licenseNumber: 'L-1' },
    };

    it('createPharmacy persiste el tenant del contexto', async () => {
      const d = build();
      d.pharmaciesRepo.findByTenantAndCode.mockResolvedValue(null);
      d.pharmaciesRepo.create.mockReturnValue({
        id: 'ph1',
        code: 'PH-1',
        legalName: 'Acme Pharma',
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        createdAt: new Date(),
      });
      d.licensesRepo.create.mockReturnValue({ id: 'lic1' });

      await inTenant(() =>
        d.service.createPharmacy({ tenantId: T1, ...body }, actor),
      );

      expect(d.pharmaciesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: T1 }),
      );
    });

    it('createPharmacy rechaza un cuerpo que declara el tenant de otra organización', async () => {
      const d = build();

      const error = await rejection(
        inTenant(() =>
          d.service.createPharmacy({ tenantId: T2, ...body }, actor),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(error.details).toBeUndefined();
      expect(d.pharmaciesRepo.findByTenantAndCode).not.toHaveBeenCalled();
      expect(d.pharmaciesRepo.create).not.toHaveBeenCalled();
      expect(d.licensesRepo.create).not.toHaveBeenCalled();
    });

    it('createPharmacy rechaza a un actor sin membresía en el tenant activo', async () => {
      const d = build();
      const outsider = { ...actor, tenantIds: [T2] };

      const error = await rejection(
        inTenant(() =>
          d.service.createPharmacy({ tenantId: T1, ...body }, outsider),
        ),
      );

      expect(error.reason).toBe(NOT_AVAILABLE);
      expect(d.pharmaciesRepo.create).not.toHaveBeenCalled();
    });

    it('verifyLicense busca la farmacia acotada al tenant activo', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);

      await rejection(
        inTenant(() => d.service.verifyLicense('ph1', 'lic1', {}, actor)),
      );

      expect(d.pharmaciesRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        'ph1',
        T1,
      );
    });

    it('verifyLicense sobre una farmacia de T2 responde igual que una inexistente y no toca nada', async () => {
      const d = build();
      const foreign = {
        id: 'ph2',
        tenantId: T2,
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      };
      // Un repositorio que dejara pasar la fila ajena: el servicio la rechaza igual.
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(foreign);
      const foreignError = await rejection(
        inTenant(() => d.service.verifyLicense('ph2', 'lic1', {}, actor)),
      );
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
      const missingError = await rejection(
        inTenant(() => d.service.verifyLicense('ph2', 'lic1', {}, actor)),
      );

      expect(foreignError).toBeInstanceOf(ResourceNotFoundException);
      expect(foreignError.getStatus()).toBe(404);
      expect(foreignError.reason).toBe(NOT_AVAILABLE);
      expect(foreignError.details).toBeUndefined();
      expect(foreignError.getResponse()).toEqual(missingError.getResponse());
      expect(d.licensesRepo.findById).not.toHaveBeenCalled();
      expect(foreign.statusConceptId).toBe(PHARM.PHARMACY_DRAFT);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto ninguna operación llega a la base', async () => {
      const d = build();

      await expect(
        d.service.verifyLicense('ph1', 'lic1', {}, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.pharmaciesRepo.findByIdInTenant).not.toHaveBeenCalled();
    });

    it('un actor de plataforma opera sobre el tenant que elige', async () => {
      const d = build();
      const platform = { id: 'root', roles: ['SUPERADMIN'] } as any;
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
        id: 'ph1',
        tenantId: T1,
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      });
      d.licensesRepo.findById.mockResolvedValue({
        id: 'lic1',
        pharmacyId: 'ph1',
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        updatedAt: new Date(),
      });

      const res = await inTenant(() =>
        d.service.verifyLicense('ph1', 'lic1', { approve: false }, platform),
      );

      expect(res).toEqual({ ok: true });
    });
  });
});
