import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProcessingLegalBasesService } from './processing-legal-bases.service';
import { CONS } from '../consent.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const legalBasesRepo = { findCurrentVersion: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ProcessingLegalBasesService(
    em as any,
    legalBasesRepo as any,
    logger as any,
  );
  return { service, tx, legalBasesRepo };
}

describe('ProcessingLegalBasesService', () => {
  it('version (UC-07-06) inserts a new active version without a prior one', async () => {
    const d = build();
    d.legalBasesRepo.findCurrentVersion.mockResolvedValue(null);
    const created = {
      id: 'lb1',
      processingPurposeId: 'pp1',
      statusConceptId: CONS.LEGAL_BASIS_ACTIVE,
      createdAt: new Date(),
    };
    d.legalBasesRepo.create.mockReturnValue(created);

    const res = await d.service.version({ processingPurposeId: 'pp1' }, actor);

    expect(res.supersededId).toBeNull();
    expect(res.status).toBe(CONS.LEGAL_BASIS_ACTIVE);
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('version (UC-07-06) supersedes the current version', async () => {
    const d = build();
    const current = {
      id: 'lb0',
      statusConceptId: CONS.LEGAL_BASIS_ACTIVE,
      updatedAt: new Date(),
    };
    d.legalBasesRepo.findCurrentVersion.mockResolvedValue(current);
    d.legalBasesRepo.create.mockReturnValue({
      id: 'lb1',
      processingPurposeId: 'pp1',
      statusConceptId: CONS.LEGAL_BASIS_ACTIVE,
      createdAt: new Date(),
    });

    const res = await d.service.version({ processingPurposeId: 'pp1' }, actor);

    expect(res.supersededId).toBe('lb0');
    expect(current.statusConceptId).toBe(CONS.LEGAL_BASIS_SUPERSEDED);
    expect((current as any).validTo).toBeInstanceOf(Date);
  });
});
