import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { FaqsService } from './faqs.service';
import { FormsErrorReason } from '../forms.error-reasons';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const doctor = {
  id: 'u-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;
const entry = (
  id: string,
  position: number,
  over: Record<string, unknown> = {},
) => ({
  id,
  question: `Q${position}`,
  answer: 'A',
  category: null,
  position,
  isPublished: true,
  updatedAt: new Date('2026-11-06T12:00:00.000Z'),
  ...over,
});

function build() {
  const tx = {};
  const em = { fork: () => tx, transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    listOwned: mockFn().mockResolvedValue([]),
    findOwned: mockFn().mockResolvedValue(entry('f-1', 1)),
    insertLast: mockFn().mockResolvedValue('f-1'),
    updateOwned: mockFn().mockResolvedValue(true),
    deleteOwned: mockFn().mockResolvedValue(true),
    lockOwnedIds: mockFn().mockResolvedValue(['f-1', 'f-2']),
    applyOrder: mockFn(),
    listPublishedBySlug: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new FaqsService(em as any, repo as any, logger as any);
  return { service, repo, tx };
}

describe('FaqsService', () => {
  it('creates after the last entry, unpublished by default', async () => {
    const { service, repo, tx } = build();
    const out = await service.create({ question: 'Q', answer: 'A' }, doctor);
    expect(repo.insertLast).toHaveBeenCalledWith(
      tx,
      'hp-1',
      {
        question: 'Q',
        answer: 'A',
        category: null,
        isPublished: false,
      },
      'u-1',
    );
    expect(out).toMatchObject({
      id: 'f-1',
      position: 1,
      updatedAt: '2026-11-06T12:00:00.000Z',
    });
  });

  it("another practitioner's entry is a 404 for PATCH and DELETE", async () => {
    const { service, repo } = build();
    repo.updateOwned.mockResolvedValue(false);
    repo.deleteOwned.mockResolvedValue(false);
    await expect(
      service.update('f-x', { answer: 'B' }, doctor),
    ).rejects.toMatchObject({
      constructor: ResourceNotFoundException,
      reason: FormsErrorReason.FAQ_ENTRY_OUT_OF_SCOPE,
    });
    await expect(service.remove('f-x', doctor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(repo.updateOwned).toHaveBeenCalledWith(
      expect.anything(),
      'f-x',
      'hp-1',
      expect.anything(),
      'u-1',
    );
    expect(repo.deleteOwned).toHaveBeenCalledWith(
      expect.anything(),
      'f-x',
      'hp-1',
    );
  });

  it.each([
    ['a missing id', ['f-1']],
    ['a foreign id', ['f-1', 'f-9']],
    ['an extra id', ['f-1', 'f-2', 'f-3']],
  ])('reorder with %s is a 422 and writes nothing', async (_l, ids) => {
    const { service, repo } = build();
    await expect(service.reorder({ ids }, doctor)).rejects.toMatchObject({
      constructor: PreconditionFailedException,
      reason: FormsErrorReason.FAQ_ORDER_MISMATCH,
    });
    expect(repo.applyOrder).not.toHaveBeenCalled();
  });

  it('reorder with exactly the own ids applies and returns the list', async () => {
    const { service, repo, tx } = build();
    repo.listOwned.mockResolvedValue([entry('f-2', 1), entry('f-1', 2)]);
    const out = await service.reorder({ ids: ['f-2', 'f-1'] }, doctor);
    expect(repo.applyOrder).toHaveBeenCalledWith(
      tx,
      'hp-1',
      ['f-2', 'f-1'],
      'u-1',
    );
    expect(out.items.map((i) => i.id)).toEqual(['f-2', 'f-1']);
  });

  it('public list projects only id, question, answer and category', async () => {
    const { service, repo } = build();
    repo.listPublishedBySlug.mockResolvedValue([entry('f-1', 1)]);
    const out = await service.listPublic('dra-perez');
    expect(out).toEqual({
      items: [{ id: 'f-1', question: 'Q1', answer: 'A', category: null }],
    });
  });

  it('public list of an unknown or hidden slug is a 404', async () => {
    const { service, repo } = build();
    repo.listPublishedBySlug.mockResolvedValue(null);
    await expect(service.listPublic('nadie')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });
});
