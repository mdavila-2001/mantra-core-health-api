import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacySitesService } from './pharmacy-sites.service';
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
    findByIdInTenant: mockFn().mockResolvedValue(pharmacyOf(T1)),
  };
  const sitesRepo = { findByPharmacyAndCode: mockFn(), create: mockFn() };
  const referencesRepo = {
    practiceSiteBelongsToTenant: mockFn().mockResolvedValue(true),
    findPharmacySiteInPharmacy: mockFn().mockResolvedValue({
      id: 'site1',
      pharmacyId: 'ph1',
    }),
    isRegisteredInsurer: mockFn().mockResolvedValue(true),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacySitesService(
    em as any,
    pharmaciesRepo as any,
    sitesRepo as any,
    referencesRepo as any,
    logger as any,
  );
  return { service, tx, pharmaciesRepo, sitesRepo, referencesRepo };
}

const dto = { practiceSiteId: 'ps1', code: 'S-1', name: 'Main' } as any;

describe('PharmacySitesService (UC-24-02)', () => {
  it('throws when the pharmacy does not exist', async () => {
    const d = build();
    d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
    await expect(
      inTenant(() => d.service.createSite('ph1', dto, actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects when the pharmacy is not active (precondition)', async () => {
    const d = build();
    d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
      tenantId: T1,
      id: 'ph1',
      statusConceptId: PHARM.PHARMACY_DRAFT,
    });
    await expect(
      inTenant(() => d.service.createSite('ph1', dto, actor)),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rejects a duplicated site code', async () => {
    const d = build();
    d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
      tenantId: T1,
      id: 'ph1',
      statusConceptId: PHARM.PHARMACY_ACTIVE,
    });
    d.sitesRepo.findByPharmacyAndCode.mockResolvedValue({ id: 'existing' });
    await expect(
      inTenant(() => d.service.createSite('ph1', dto, actor)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates the site on an active pharmacy', async () => {
    const d = build();
    d.pharmaciesRepo.findByIdInTenant.mockResolvedValue({
      tenantId: T1,
      id: 'ph1',
      statusConceptId: PHARM.PHARMACY_ACTIVE,
    });
    d.sitesRepo.findByPharmacyAndCode.mockResolvedValue(null);
    d.sitesRepo.create.mockReturnValue({
      id: 's1',
      pharmacyId: 'ph1',
      code: 'S-1',
      name: 'Main',
      statusConceptId: PHARM.SITE_ACTIVE,
      createdAt: new Date(),
    });

    const res = await inTenant(() => d.service.createSite('ph1', dto, actor));
    expect(res).toMatchObject({ id: 's1', status: PHARM.SITE_ACTIVE });
    expect(d.tx.flush).toHaveBeenCalled();
  });

  describe('alcance de tenant y referencias (PHARM-01 / PHARM-02)', () => {
    it('createSite sobre una farmacia de T2 responde igual que una inexistente y no escribe', async () => {
      const d = build();
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(pharmacyOf(T2));
      const foreignError = await rejection(
        inTenant(() => d.service.createSite('ph2', dto, actor)),
      );
      d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
      const missingError = await rejection(
        inTenant(() => d.service.createSite('ph2', dto, actor)),
      );

      expect(foreignError).toBeInstanceOf(ResourceNotFoundException);
      expect(foreignError.getStatus()).toBe(404);
      expect(foreignError.reason).toBe(NOT_AVAILABLE);
      expect(foreignError.details).toBeUndefined();
      expect(foreignError.getResponse()).toEqual(missingError.getResponse());
      expect(d.sitesRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('busca la farmacia acotada al tenant activo', async () => {
      const d = build();
      d.sitesRepo.findByPharmacyAndCode.mockResolvedValue({ id: 'dup' });

      await rejection(inTenant(() => d.service.createSite('ph1', dto, actor)));

      expect(d.pharmaciesRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        'ph1',
        T1,
      );
    });

    it('valida la sede de práctica contra el tenant de la farmacia', async () => {
      const d = build();
      d.sitesRepo.findByPharmacyAndCode.mockResolvedValue(null);
      d.sitesRepo.create.mockReturnValue({
        id: 's1',
        pharmacyId: 'ph1',
        code: 'S-1',
        name: 'Main',
        statusConceptId: PHARM.SITE_ACTIVE,
        createdAt: new Date(),
      });

      await inTenant(() => d.service.createSite('ph1', dto, actor));

      expect(d.referencesRepo.practiceSiteBelongsToTenant).toHaveBeenCalledWith(
        d.tx,
        'ps1',
        T1,
      );
    });

    it('rechaza una sede de práctica de T2 con 404 y sin escribir', async () => {
      const d = build();
      d.referencesRepo.practiceSiteBelongsToTenant.mockResolvedValue(false);

      const error = await rejection(
        inTenant(() => d.service.createSite('ph1', dto, actor)),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(REFERENCE_NOT_AVAILABLE);
      expect(error.details).toBeUndefined();
      expect(d.sitesRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });
  });
});
