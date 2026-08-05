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
} from '../../../common';
import { PHARM } from '../pharmacy.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const pharmaciesRepo = { findById: mockFn() };
  const sitesRepo = { findByPharmacyAndCode: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PharmacySitesService(
    em as any,
    pharmaciesRepo as any,
    sitesRepo as any,
    logger as any,
  );
  return { service, tx, pharmaciesRepo, sitesRepo };
}

const dto = { practiceSiteId: 'ps1', code: 'S-1', name: 'Main' } as any;

describe('PharmacySitesService (UC-24-02)', () => {
  it('throws when the pharmacy does not exist', async () => {
    const d = build();
    d.pharmaciesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.createSite('ph1', dto, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('rejects when the pharmacy is not active (precondition)', async () => {
    const d = build();
    d.pharmaciesRepo.findById.mockResolvedValue({
      id: 'ph1',
      statusConceptId: PHARM.PHARMACY_DRAFT,
    });
    await expect(
      d.service.createSite('ph1', dto, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rejects a duplicated site code', async () => {
    const d = build();
    d.pharmaciesRepo.findById.mockResolvedValue({
      id: 'ph1',
      statusConceptId: PHARM.PHARMACY_ACTIVE,
    });
    d.sitesRepo.findByPharmacyAndCode.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.createSite('ph1', dto, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates the site on an active pharmacy', async () => {
    const d = build();
    d.pharmaciesRepo.findById.mockResolvedValue({
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

    const res = await d.service.createSite('ph1', dto, actor);
    expect(res).toMatchObject({ id: 's1', status: PHARM.SITE_ACTIVE });
    expect(d.tx.flush).toHaveBeenCalled();
  });
});
